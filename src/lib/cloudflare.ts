import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

// ────────────────────────────────────────────────────────────
// CORE CONFIGURATION & SAFETY
// ────────────────────────────────────────────────────────────
const getEndpoint = (accountId: string) => `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

function getCredentials() {
  const accountId = (import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID as string | undefined)?.trim();
  const apiToken = (import.meta.env.VITE_CLOUDFLARE_API_TOKEN as string | undefined)?.trim();
  
  if (!accountId || !apiToken) {
    console.warn("🚨 Cloudflare credentials missing. Check VITE_CLOUDFLARE_ACCOUNT_ID and VITE_CLOUDFLARE_API_TOKEN.");
    return null;
  }
  return { accountId, apiToken };
}

// ────────────────────────────────────────────────────────────
// HARDENED API CALL
// ────────────────────────────────────────────────────────────
async function callModel(prompt: string, temp = 0.5, retriesAllowed = 3): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error("offline-engine");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for large generation

  try {
    let retries = retriesAllowed;
    let res;

    while (retries > 0) {
      res = await fetch(getEndpoint(creds.accountId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${creds.apiToken}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: temp,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      if (res.ok) break;

      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, 2500)); // Wait before retry
        retries--;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Cloudflare AI Error:", errData);
        throw new Error("tutor-unavailable");
      }
    }

    clearTimeout(timeoutId);
    if (!res || !res.ok) throw new Error("tutor-unavailable");

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content || "";
    
    if (!text.trim()) throw new Error("empty-response");
    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// 1. ULTIMATE 40-QUESTION GENERATOR
// ────────────────────────────────────────────────────────────
export async function generatePack(noteText: string, title: string): Promise<{
  summary: string;
  questions: Question[];
  engine: "cloud" | "local";
}> {
  const localSummary = summarizeLocally(noteText, title);
  
  try {
    const raw = await callModel(
      `You are an elite university examiner. Analyze the following document text and create a 40-question professional test.
      
      🚨 ABSOLUTE RULES 🚨
      1. NEVER copy raw text into the questions. Rewrite the concepts into actual exam questions.
      2. NEVER put the answer inside the question text.
      3. If the document is Sports Betting data, create questions about Statistics, Probability, or Math.
      4. Randomize correct answers (A, B, C, D). Do not always make it A.
      5. If unreadable, return exactly: {"error": "Unreadable text"}

      📚 BREAKDOWN:
      - 15 MCQ Questions (Multiple Choice)
      - 15 Theory Questions (Written explanation)
      - 10 Tricky/Application Questions

      Return ONLY a raw JSON object exactly like this structure (no markdown formatting):
      {
        "summary": "A brief 2-sentence summary.",
        "questions": [
          {
            "type": "mcq",
            "question": "The question text here...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The exact text of the correct option",
            "explanation": "Why this is correct."
          },
          {
            "type": "theory",
            "question": "The theory question here...",
            "answer": "The ideal answer...",
            "explanation": "Key points the examiner is looking for."
          }
        ]
      }

      TEXT:
      ${noteText.slice(0, 15000)}`,
      0.25 
    );
    
    let summary = localSummary;
    let blob = raw;
    
    try {
      let cleanRaw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const s = cleanRaw.indexOf("{");
      const e = cleanRaw.lastIndexOf("}");
      
      if (s >= 0 && e > s) {
        const obj = JSON.parse(cleanRaw.slice(s, e + 1));
        if (obj.error) throw new Error(obj.error);
        if (obj.summary) summary = String(obj.summary);
        if (obj.questions) blob = JSON.stringify(obj.questions);
      }
    } catch (e: any) {
      console.error("Parse Error:", e);
      throw new Error(e.message || "AI returned invalid format.");
    }
    
    const parsedQuestions = parseModelQuestions(blob, noteText, title);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      throw new Error("No valid questions generated.");
    }
    
    return { summary, questions: parsedQuestions, engine: "cloud" };
  } catch (err: any) {
    console.error("Generation Failed:", err);
    if (err.message === "tutor-unavailable" || err.message === "offline-engine") {
       return {
        summary: localSummary,
        questions: parseModelQuestions("", noteText, title),
        engine: "local",
      };
    }
    throw new Error(err.message || "Please upload a clearer image or PDF.");
  }
}

// ────────────────────────────────────────────────────────────
// 2. HYBRID CHAT TUTOR (Normal Chat + Note Context)
// ────────────────────────────────────────────────────────────
export async function tutorReply(opts: {
  notes: string;
  history: { role: "user" | "tutor"; text: string }[];
  question: string;
  eli5: boolean;
}): Promise<{ text: string; citations: { page: number | null; external: boolean }[] }> {
  
  const style = opts.eli5 ? "Explain like I'm 5 years old." : "Be helpful, intelligent, and conversational.";

  const prompt = `You are NoteToExam AI. ${style}
  
  You are chatting with a student. Answer ANY question they ask normally (general knowledge, coding, advice).
  If they ask about their notes, use the notes below and add [Evidence: Note p.X].
  
  NOTES:
  ${opts.notes ? opts.notes.slice(0, 8000) : "No notes uploaded."}
  
  STUDENT: ${opts.question}`;

  try {
    const raw = await callModel(prompt, 0.6);
    return decorate(raw, opts.notes);
  } catch (err) {
    console.error("Tutor Failed:", err);
    return decorate(`(⚠️ AI is currently offline. Local search result:)\n\n${localTutor(opts)}`, opts.notes);
  }
}

// ────────────────────────────────────────────────────────────
// 3. AI INSIGHTS GENERATOR (For Analytics Page)
// ────────────────────────────────────────────────────────────
export async function generateInsight(statsString: string): Promise<string> {
  const prompt = `You are an elite academic advisor. A student has these CBT scores: ${statsString}. 
  
  Write a short, encouraging 3-sentence analysis of their performance. 
  Tell them exactly which 2 subjects they need to focus on based on the lowest scores, and give them one specific, actionable study tip. 
  Do not use markdown. Keep it under 80 words. Be direct and professional.`;

  return await callModel(prompt, 0.7);
}

// ────────────────────────────────────────────────────────────
// FALLBACK & DECORATOR HELPERS
// ────────────────────────────────────────────────────────────
function localTutor(opts: { notes: string; question: string; eli5: boolean; }) {
  const qWords = opts.question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const blocks = opts.notes.split(/\[Page\s+(\d+)\]/i);
  let best = { page: 1, text: "", score: 0 };
  if (blocks.length === 1) best = { page: 1, text: blocks[0].slice(0, 400), score: 1 };
  else {
    for (let i = 1; i < blocks.length; i += 2) {
      const page = parseInt(blocks[i], 10) || 1;
      const text = blocks[i + 1] || "";
      const score = qWords.reduce((a, w) => a + (text.toLowerCase().includes(w) ? 1 : 0), 0);
      if (score > best.score) best = { page, text, score };
    }
  }
  const snippet = best.text.replace(/\s+/g, " ").trim().slice(0, 420);
  if (!snippet || best.score === 0) return `${opts.eli5 ? "I no see this one." : "Not in notes."} I cannot find this in your uploaded note.`;
  return `From your notes [Evidence: Note p.${best.page}]: ${snippet}`;
}

function decorate(text: string, notes: string) {
  const citations: { page: number | null; external: boolean }[] = [];
  const pageHits = [...text.matchAll(/(?:Evidence:\s*Note\s*)?p(?:age)?\.?\s*(\d+)/gi)];
  for (const m of pageHits) citations.push({ page: Number(m[1]), external: false });
  
  const external = /\[External Knowledge\]/i.test(text);
  if (external) citations.push({ page: null, external: true });
  
  if (!citations.length && notes) {
    const has = /\[Page\s+\d+\]/i.test(notes);
    if (!has) citations.push({ page: null, external: true });
  }
  return { text, citations };
}

// ────────────────────────────────────────────────────────────
// VOICE ENGINE (Bulletproof)
// ────────────────────────────────────────────────────────────
let activeRecognition: any = null;
let isCurrentlySpeaking = false;

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    
    window.speechSynthesis.cancel();
    isCurrentlySpeaking = true;
    
    const cleanText = text
      .replace(/\[External Knowledge\]/gi, "")
      .replace(/\[Evidence:.*?\]/gi, "")
      .replace(/[*_#`]/g, "")
      .replace(/\n+/g, ". ");

    if (!cleanText.trim()) {
      isCurrentlySpeaking = false;
      return resolve();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("en-NG")) || voices.find(v => v.lang.includes("en-GB")) || voices[0];
                           
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.05;
    
    utterance.onend = () => { isCurrentlySpeaking = false; resolve(); };
    utterance.onerror = () => { isCurrentlySpeaking = false; resolve(); };
    
    window.speechSynthesis.speak(utterance);
  });
}

export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return reject(new Error("Voice input is not supported on this browser."));
    
    if (activeRecognition) {
      try { activeRecognition.abort(); } catch (e) {}
    }

    const rec = new SR();
    activeRecognition = rec;
    rec.lang = "en-NG";
    rec.interimResults = true; 
    
    if (isCurrentlySpeaking) {
      window.speechSynthesis.cancel();
      isCurrentlySpeaking = false;
    }

    rec.onresult = (e: any) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      }
      if (finalTranscript) {
        resolve(finalTranscript);
        try { rec.stop(); } catch(e){}
      }
    };
    
    rec.onerror = (e: any) => {
      if (e.error === "no-speech") reject(new Error("I didn't hear anything. Please speak louder."));
      else if (e.error === "aborted") reject(new Error("Recording stopped."));
      else reject(new Error("Microphone access denied."));
    };
    
    rec.start();
  });
}

export function stopListening() {
  if (activeRecognition) {
    try { activeRecognition.abort(); } catch (e) {}
    activeRecognition = null;
  }
  if (isCurrentlySpeaking) {
    window.speechSynthesis.cancel();
    isCurrentlySpeaking = false;
  }
}
