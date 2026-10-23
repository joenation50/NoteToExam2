import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

function apiKey() {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || "";
}

async function callModel(prompt: string, temp = 0.7): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("offline-engine");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    let retries = 3;
    let res;

    while (retries > 0) {
      res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: temp, maxOutputTokens: 8192 },
        }),
        signal: controller.signal,
      });

      if (res.ok) break;

      if (res.status === 503 || res.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
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
    if (!text.trim()) throw new Error("empty");
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// 1. ELITE CBT & THEORY GENERATOR
// ────────────────────────────────────────────────────────────
export async function generatePack(noteText: string, title: string): Promise<{
  summary: string;
  questions: Question[];
  engine: "cloud" | "local";
}> {
  const localSummary = summarizeLocally(noteText, title);
  try {
    const raw = await callModel(
      `You are an elite Nigerian university professor and examiner. 
      Your task is to create the highest quality study materials from the provided notes.

      CRITICAL INSTRUCTIONS:
      1. SUMMARY: Create a comprehensive, easy-to-understand summary (max 200 words). Use clear bullet points.
      2. THEORY QUESTIONS: Generate exactly 30 theory questions. They must not be simple "what is X". They must challenge the student (e.g., "Analyze the impact of...", "Compare and contrast...", "Explain the mechanism behind...").
      3. MCQ QUESTIONS: Generate exactly 30 Multiple Choice Questions. 
         - Each must have 4 options (A, B, C, D).
         - The correct answer MUST be randomly distributed. Do NOT make "A" the answer every time.
         - The wrong options must be highly plausible but definitively incorrect (no obvious joke answers).
      4. STRICT FORMAT: Return EXACTLY a valid JSON object with keys "summary" (string) and "questions" (array). Do not include markdown formatting like \`\`\`json.

      Notes titled "${title}":
      ${noteText.slice(0, 15000)}`,
      0.4 
    );
    
    let summary = localSummary;
    let blob = raw;
    
    try {
      let cleanRaw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const s = cleanRaw.indexOf("{");
      const e = cleanRaw.lastIndexOf("}");
      if (s >= 0 && e > s) {
        const obj = JSON.parse(cleanRaw.slice(s, e + 1));
        if (obj.summary) summary = String(obj.summary);
        if (obj.questions) blob = JSON.stringify(obj.questions);
      }
    } catch (e) {
      console.error("Failed to parse AI JSON", e);
    }
    
    const parsedQuestions = parseModelQuestions(blob, noteText, title);

    if (!parsedQuestions || parsedQuestions.length === 0) {
      throw new Error("No questions generated.");
    }
    
    return { summary, questions: parsedQuestions, engine: "cloud" };
  } catch (err) {
    console.error("AI Pack Generation Failed, using local engine:", err);
    return {
      summary: localSummary,
      questions: parseModelQuestions("", noteText, title),
      engine: "local",
    };
  }
}

// ────────────────────────────────────────────────────────────
// 2. SAFE AI TUTOR (No Coding, No NSFW, Pure Education)
// ────────────────────────────────────────────────────────────
export async function tutorReply(opts: {
  notes: string;
  history: { role: "user" | "tutor"; text: string }[];
  question: string;
  eli5: boolean;
}): Promise<{ text: string; citations: { page: number | null; external: boolean }[] }> {
  
  const style = opts.eli5
    ? "Explain like the student is 5 years old. Use simple analogies."
    : "Be precise, exam-ready, and highly professional.";

  const systemPrompt = `You are NoteToExam AI, a strict but helpful academic tutor for students.
  
  🚨 STRICT SAFETY & CONTENT RULES 🚨
  - You must ONLY answer questions related to Education, Science, Arts, General Knowledge, and School Subjects.
  - DO NOT write code, debug code, or answer programming questions. If asked, say: "I am your academic tutor, I cannot help with coding."
  - DO NOT use profanity. DO NOT answer any questions about sex, drugs, violence, or NSFW topics. If asked, say: "This is an educational platform. I cannot answer that."
  - If the student asks a harmless general knowledge question (e.g., "Who is the president of Nigeria?"), answer it politely.

  ACADEMIC INSTRUCTIONS:
  ${style}
  If the answer is in the student's notes, cite it like this: [Evidence: Note p.X]. 
  If the answer is general knowledge and NOT in the notes, start with "[External Knowledge]".
  
  NOTES:
  ${opts.notes ? opts.notes.slice(0, 15000) : "No notes uploaded yet."}
  
  STUDENT QUESTION:
  ${opts.question}`;

  try {
    const raw = await callModel(systemPrompt, 0.5); // Lower temp for strict adherence
    return decorate(raw, opts.notes);
  } catch (err) {
    console.error("AI Tutor Failed, using local engine:", err);
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
// 3. PREMIUM LIVE VOICE & LISTENING
// ────────────────────────────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    
    window.speechSynthesis.cancel(); // Stop current speech
    
    const cleanText = text
      .replace(/\[External Knowledge\]/gi, "Outside the notes.")
      .replace(/\[Evidence:.*?\]/gi, "")
      .replace(/[*_#`]/g, "")
      .replace(/\n+/g, ". ");

    if (!cleanText.trim()) return resolve();

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find the most natural voice available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes("en-NG")) || 
                           voices.find(v => v.lang.includes("en-GB")) || 
                           voices.find(v => v.name.includes("Google UK English Female")) ||
                           voices[0];
                           
    if (preferredVoice) currentUtterance.voice = preferredVoice;
    
    currentUtterance.rate = 1.05;
    currentUtterance.pitch = 1.0;
    
    // Resolve the promise when the AI finishes speaking
    currentUtterance.onend = () => resolve();
    currentUtterance.onerror = () => resolve();
    
    window.speechSynthesis.speak(currentUtterance);
  });
}

export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return reject(new Error("Voice input is not supported on this browser."));
    
    const rec = new SR();
    rec.lang = "en-NG";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    
    window.speechSynthesis.cancel(); // Stop AI from talking while user talks

    rec.onresult = (e: any) => {
      resolve(e.results[0][0].transcript);
    };
    
    rec.onerror = (e: any) => {
      if (e.error === "no-speech") reject(new Error("I didn't hear anything. Try again."));
      else reject(new Error("Could not access microphone."));
    };
    
    rec.start();
  });
}

// ────────────────────────────────────────────────────────────
// 4. CONTINUOUS LIVE CALL LOOP
// ────────────────────────────────────────────────────────────
export async function startLiveCall(
  onUserSpeech: (text: string) => void,
  onAiReply: (text: string) => void,
  getReply: (userText: string) => Promise<{ text: string }>,
  setIsListening: (val: boolean) => void,
  setIsSpeaking: (val: boolean) => void,
  shouldStop: () => boolean
) {
  while (!shouldStop()) {
    try {
      // 1. Listen to user
      setIsListening(true);
      const userText = await listen();
      setIsListening(false);
      onUserSpeech(userText);

      // 2. AI Thinks
      setIsSpeaking(true);
      const reply = await getReply(userText);
      onAiReply(reply.text);

      // 3. AI Speaks
      await speak(reply.text);
      setIsSpeaking(false);
      
    } catch (err: any) {
      setIsListening(false);
      setIsSpeaking(false);
      if (err.message.includes("no-speech")) continue; // If they are silent, keep listening
      throw err; // If it's a real error, break the loop
    }
  }
}
