import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function apiKey() {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || "";
}

// ────────────────────────────────────────────────────────────
// CORE API CALL (Hardened with Retries & Timeouts)
// ────────────────────────────────────────────────────────────
async function callModel(prompt: string, temp = 0.5, retriesAllowed = 3): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("offline-engine");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for 40 questions

  try {
    let retries = retriesAllowed;
    let res;

    while (retries > 0) {
      res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: temp, 
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        }),
        signal: controller.signal,
      });

      if (res.ok) break;

      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, 3000)); // Longer wait on rate limit
        retries--;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Gemini API Error:", errData);
        throw new Error("tutor-unavailable");
      }
    }

    clearTimeout(timeoutId);
    if (!res || !res.ok) throw new Error("tutor-unavailable");

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
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
      `You are an elite university examiner and data extractor. 
      Your task is to read the raw text/OCR data extracted from an uploaded document and create a 40-question professional academic test.

      🚨 ABSOLUTE RULES (FAILURE IS NOT AN OPTION) 🚨
      1. NEVER copy raw text from the document into the question or the options. REWRITE the concepts.
      2. NEVER put the answer inside the question text. 
      3. If the document is about Sports Betting (e.g., odds, teams), create questions about Statistics, Probability, Math, or Geography based on that data.
      4. If the document is normal academic notes, create questions directly from the concepts.
      5. NEVER use placeholder text like "Option A", "Option B". Create real, plausible distractors.
      6. Randomize the correct answer (A, B, C, or D). Do not always make it A.
      7. If the OCR text is completely unreadable, you MUST return exactly: {"error": "Unreadable text"}

      📚 THE 40 QUESTIONS BREAKDOWN:
      - 15 MCQ Questions (Multiple Choice)
      - 15 Theory Questions (Written explanation)
      - 10 Tricky/Application Questions (Real-world application)

      🛑 BAD EXAMPLE (DO NOT DO THIS):
      Question: "What does 1.79 X Alaves vs Malaga mean?"
      Options: ["Alaves", "Single", "System", "Multiple"]
      (This is bad because it's just copy-pasting raw text).

      ✅ GOOD EXAMPLE (DO THIS):
      Question: "Based on the provided document, what statistical concept is represented by the notation '1.79 X'?"
      Options: ["A. Decimal odds representing probability", "B. The final score of the match", "C. The number of players on the field", "D. The date of the match"]
      Correct Answer: "A. Decimal odds representing probability"
      Explanation: "The 'X' with a decimal number (1.79) in sports data represents the implied probability or decimal odds."

      Return ONLY a valid JSON object exactly like this structure:
      {
        "summary": "A brief 2-sentence summary.",
        "questions": [
          {
            "type": "mcq",
            "question": "The question text here...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The exact text of the correct option",
            "explanation": "Why this is the correct answer."
          },
          {
            "type": "theory",
            "question": "The theory question here...",
            "answer": "The ideal answer...",
            "explanation": "Key points the examiner is looking for."
          }
        ]
      }

      DOCUMENT TEXT TO ANALYZE:
      ${noteText.slice(0, 20000)}`, // Increased to 20k to capture more context
      0.25 // Lower temp for strict adherence to rules
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
      console.error("Failed to parse AI JSON", e);
      throw new Error(e.message || "The AI returned an invalid format. Please try again.");
    }
    
    const parsedQuestions = parseModelQuestions(blob, noteText, title);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      throw new Error("No valid questions could be generated. Please upload a clearer image.");
    }
    
    return { summary, questions: parsedQuestions, engine: "cloud" };
  } catch (err: any) {
    console.error("AI Pack Generation Failed:", err);
    if (err.message === "tutor-unavailable" || err.message === "offline-engine") {
       return {
        summary: localSummary,
        questions: parseModelQuestions("", noteText, title),
        engine: "local",
      };
    }
    throw new Error(err.message || "Please upload a clearer, text-based image or PDF.");
  }
}

// ────────────────────────────────────────────────────────────
// 2. SMART TUTOR (Context Aware + Safety Filters)
// ────────────────────────────────────────────────────────────
export async function tutorReply(opts: {
  notes: string;
  history: { role: "user" | "tutor"; text: string }[];
  question: string;
  eli5: boolean;
}): Promise<{ text: string; citations: { page: number | null; external: boolean }[] }> {
  
  const style = opts.eli5
    ? "Explain like the student is 5 years old. Use simple analogies."
    : "Be precise, exam-ready, and highly professional. Use Markdown formatting.";

  const systemPrompt = `You are NoteToExam AI, an academic tutor.
  
  🚨 STRICT RULES 🚨
  - You can ONLY answer questions about Education, Science, Arts, General Knowledge, and School Subjects.
  - DO NOT write code, debug code, or answer programming questions.
  - DO NOT answer NSFW, explicit, or inappropriate questions.
  - ${style}
  - If the answer is in the notes, cite it like this: [Evidence: Note p.X]. 
  - If the answer is general knowledge, start with "[External Knowledge]".
  
  NOTES:
  ${opts.notes ? opts.notes.slice(0, 15000) : "No notes uploaded yet."}
  
  STUDENT QUESTION:
  ${opts.question}`;

  try {
    const raw = await callModel(systemPrompt, 0.5);
    return decorate(raw, opts.notes);
  } catch (err) {
    console.error("AI Tutor Failed:", err);
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
  if (!snippet || best.score === 0) return `${opts.eli5 ? "I no see this one." : "Not in notes."} [External Knowledge] I cannot find this in your uploaded note. Please check your internet connection for the full AI.`;
  return opts.eli5 ? `Abeg, look am like this [Evidence: Note p.${best.page}]: ${snippet}` : `From your notes [Evidence: Note p.${best.page}]: ${snippet}`;
}

function decorate(text: string, notes: string) {
  const citations: { page: number | null; external: boolean }[] = [];
  const pageHits = [...text.matchAll(/(?:Evidence:\s*Note\s*)?p(?:age)?\.?\s*(\d+)/gi)];
  for (const m of pageHits) citations.push({ page: Number(m[1]), external: false });
  const external = /\[External Knowledge\]/i.test(text);
  if (external) citations.push({ page: null, external: true });
  if (!citations.length) {
    const has = /\[Page\s+\d+\]/i.test(notes);
    citations.push({ page: has ? 1 : null, external: !has });
  }
  return { text, citations };
}

// ────────────────────────────────────────────────────────────
// 3. VOICE ENGINE (Bulletproof)
// ────────────────────────────────────────────────────────────

let activeRecognition: any = null;
let isCurrentlySpeaking = false;

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    
    window.speechSynthesis.cancel();
    isCurrentlySpeaking = true;
    
    const cleanText = text
      .replace(/\[External Knowledge\]/gi, "Outside the notes.")
      .replace(/\[Evidence:.*?\]/gi, "")
      .replace(/[*_#`]/g, "")
      .replace(/\n+/g, ". ");

    if (!cleanText.trim()) {
      isCurrentlySpeaking = false;
      return resolve();
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("en-NG")) || 
                           voices.find(v => v.lang.includes("en-GB")) || 
                           voices.find(v => v.name.includes("Google UK English Female")) ||
                           voices[0];
                           
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      isCurrentlySpeaking = false;
      resolve();
    };
    utterance.onerror = () => {
      isCurrentlySpeaking = false;
      resolve();
    };
    
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
    rec.maxAlternatives = 1;
    
    if (isCurrentlySpeaking) {
      window.speechSynthesis.cancel();
      isCurrentlySpeaking = false;
    }

    rec.onresult = (e: any) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
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
