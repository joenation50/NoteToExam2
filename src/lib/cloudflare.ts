import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

// ────────────────────────────────────────────────────────────
// CORE API CALL (Via Secure Backend Proxy)
// ────────────────────────────────────────────────────────────
async function callModel(prompt: string, temp = 0.7): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("tutor-unavailable");

    const json = await res.json();
    const text = json.result?.response || json.choices?.[0]?.message?.content || "";
    
    if (!text.trim()) throw new Error("empty-response");
    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// 1. NORMAL CHAT TUTOR (Hybrid: Normal Chat + Optional Notes)
// ────────────────────────────────────────────────────────────
export async function tutorReply(opts: {
  notes: string;
  history: { role: "user" | "tutor"; text: string }[];
  question: string;
  eli5: boolean;
}): Promise<{ text: string; citations: { page: number | null; external: boolean }[] }> {
  
  const style = opts.eli5 ? "Explain it super simply like I'm 5 years old." : "Be sharp, smart, and helpful. Use Markdown formatting.";

  const prompt = `You are a brilliant AI assistant. ${style}
  
  You can answer ANY question the user asks, whether it's coding, general knowledge, or life advice. 
  If the user asks about their uploaded notes, use the notes below to answer them. If the answer is NOT in the notes, or the notes are irrelevant, just use your own vast general knowledge to answer normally. Do not restrict yourself.
  
  NOTES (Context):
  ${opts.notes ? opts.notes.slice(0, 8000) : "None"}
  
  USER: ${opts.question}`;

  try {
    const raw = await callModel(prompt, 0.7);
    return { text: raw, citations: [] };
  } catch (err) {
    console.error("Tutor Failed:", err);
    return { text: "⚠️ AI is currently offline. Please check your internet connection.", citations: [] };
  }
}

// ────────────────────────────────────────────────────────────
// 2. 40-QUESTION GENERATOR (For Uploads)
// ────────────────────────────────────────────────────────────
export async function generatePack(noteText: string, title: string): Promise<{
  summary: string;
  questions: Question[];
  engine: "cloud" | "local";
}> {
  const localSummary = summarizeLocally(noteText, title);
  
  try {
    const raw = await callModel(
      `You are an elite examiner. Analyze the following document text and create a 40-question professional test.
      
      RULES:
      1. NEVER copy raw text into the questions. Rewrite the concepts into actual exam questions.
      2. NEVER put the answer inside the question text.
      3. Randomize correct answers (A, B, C, D).
      4. If unreadable, return exactly: {"error": "Unreadable text"}

      BREAKDOWN: 15 MCQ, 15 Theory, 10 Application.
      
      Return ONLY a raw JSON object (no markdown, no backticks):
      {
        "summary": "Brief summary.",
        "questions": [
          {
            "type": "mcq",
            "question": "...",
            "options": ["A", "B", "C", "D"],
            "answer": "...",
            "explanation": "..."
          }
        ]
      }

      TEXT:
      ${noteText.slice(0, 15000)}`,
      0.3 
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
      throw new Error("AI returned an invalid format. Please try again.");
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
// 3. AI INSIGHTS GENERATOR (For Analytics Page) - RESTORED
// ────────────────────────────────────────────────────────────
export async function generateInsight(statsString: string): Promise<string> {
  const prompt = `You are an elite academic advisor. A student has these CBT scores: ${statsString}. 
  
  Write a short, encouraging 3-sentence analysis of their performance. 
  Tell them exactly which 2 subjects they need to focus on based on the lowest scores, and give them one specific, actionable study tip. 
  Do not use markdown. Keep it under 80 words. Be direct and professional.`;

  return await callModel(prompt, 0.7);
}

// ────────────────────────────────────────────────────────────
// VOICE ENGINE
// ────────────────────────────────────────────────────────────
let activeRecognition: any = null;
let isCurrentlySpeaking = false;

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    isCurrentlySpeaking = true;
    const cleanText = text.replace(/[*_#`]/g, "").replace(/```[\s\S]*?```/g, "Code block.").replace(/\n+/g, ". ");
    if (!cleanText.trim()) { isCurrentlySpeaking = false; return resolve(); }

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
    if (!SR) return reject(new Error("Voice not supported."));
    if (activeRecognition) try { activeRecognition.abort(); } catch (e) {}
    
    const rec = new SR();
    activeRecognition = rec;
    rec.lang = "en-NG";
    rec.interimResults = true; 
    if (isCurrentlySpeaking) { window.speechSynthesis.cancel(); isCurrentlySpeaking = false; }

    rec.onresult = (e: any) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      }
      if (finalTranscript) { resolve(finalTranscript); try { rec.stop(); } catch(e){} }
    };
    rec.onerror = (e: any) => {
      if (e.error === "no-speech") reject(new Error("I didn't hear anything."));
      else if (e.error === "aborted") reject(new Error("Recording stopped."));
      else reject(new Error("Microphone denied."));
    };
    rec.start();
  });
}

export function stopListening() {
  if (activeRecognition) try { activeRecognition.abort(); } catch (e) {}
  if (isCurrentlySpeaking) { window.speechSynthesis.cancel(); isCurrentlySpeaking = false; }
}
