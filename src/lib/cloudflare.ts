import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

// Cloudflare Workers AI Endpoint
const getEndpoint = (accountId: string) => `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

// The Model (Llama 3 8B is free and very fast)
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

function getCredentials() {
  const accountId = (import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID as string | undefined)?.trim();
  const apiToken = (import.meta.env.VITE_CLOUDFLARE_API_TOKEN as string | undefined)?.trim();
  
  if (!accountId || !apiToken) {
    console.warn("🚨 Cloudflare credentials missing. Check environment variables.");
    return null;
  }
  return { accountId, apiToken };
}

// ────────────────────────────────────────────────────────────
// CORE API CALL (Cloudflare Workers AI)
// ────────────────────────────────────────────────────────────
async function callModel(prompt: string, temp = 0.5): Promise<string> {
  const creds = getCredentials();
  if (!creds) throw new Error("offline-engine");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(getEndpoint(creds.accountId), {
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

    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Cloudflare AI Error:", errData);
      throw new Error("tutor-unavailable");
    }

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
// 1. 40-QUESTION GENERATOR
// ────────────────────────────────────────────────────────────
export async function generatePack(noteText: string, title: string): Promise<{
  summary: string;
  questions: Question[];
  engine: "cloud" | "local";
}> {
  const localSummary = summarizeLocally(noteText, title);
  
  try {
    const raw = await callModel(
      `You are an elite university examiner. Analyze the following document text and create a 40-question test.
      
      RULES:
      1. NEVER copy raw text into the questions. Rewrite the concepts.
      2. NEVER put the answer inside the question text.
      3. Randomize correct answers (A, B, C, D).
      4. If the text is Sports Betting data, create questions about Statistics or Math.
      5. If unreadable, return exactly: {"error": "Unreadable text"}

      BREAKDOWN: 15 MCQ, 15 Theory, 10 Application.
      
      Return ONLY a raw JSON object:
      {
        "summary": "Brief summary.",
        "questions": [
          {
            "type": "mcq",
            "question": "...",
            "options": ["A", "B", "C", "D"],
            "answer": "...",
            "explanation": "..."
          },
          {
            "type": "theory",
            "question": "...",
            "answer": "...",
            "explanation": "..."
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
    throw new Error(err.message || "Please upload a clearer image.");
  }
}

// ────────────────────────────────────────────────────────────
// 2. NORMAL CHAT TUTOR (Hybrid)
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
// 3. VOICE ENGINE
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
