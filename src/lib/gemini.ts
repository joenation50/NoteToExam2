import { parseModelQuestions, summarizeLocally } from "./questions";
import type { Question } from "./types";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

function apiKey() {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() || "";
}

async function callModel(prompt: string): Promise<string> {
  const key = apiKey();
  if (!key) throw new Error("offline-engine");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Gemini API Error:", errorData);
      throw new Error("tutor-unavailable");
    }
    
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

export async function generatePack(noteText: string, title: string): Promise<{
  summary: string;
  questions: Question[];
  engine: "cloud" | "local";
}> {
  const localSummary = summarizeLocally(noteText, title);
  try {
    const raw = await callModel(
      `You are an exam-prep tutor. Use ONLY the student's notes. Produce a JSON object with keys summary (string) and questions (array of 60). Each question: kind (direct|rephrased|connection), format (mcq|theory), prompt, options (4 strings if mcq), answer, explanation (cite page), page (number), topic. Exactly 20 direct, 20 rephrased, 20 connection. Mix mcq and theory. Notes titled "${title}":\n${noteText.slice(0, 14000)}`,
    );
    let summary = localSummary;
    let blob = raw;
    try {
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      if (s >= 0 && e > s) {
        const obj = JSON.parse(raw.slice(s, e + 1)) as { summary?: string; questions?: unknown };
        if (obj.summary) summary = String(obj.summary);
        if (obj.questions) blob = JSON.stringify(obj.questions);
      }
    } catch {
      /* use raw */
    }
    return { summary, questions: parseModelQuestions(blob, noteText, title), engine: "cloud" };
  } catch (err) {
    console.error("AI Pack Generation Failed, using local engine:", err);
    return {
      summary: localSummary,
      questions: parseModelQuestions("", noteText, title),
      engine: "local",
    };
  }
}

export async function tutorReply(opts: {
  notes: string;
  history: { role: "user" | "tutor"; text: string }[];
  question: string;
  eli5: boolean;
}): Promise<{ text: string; citations: { page: number | null; external: boolean }[] }> {
  const style = opts.eli5
    ? "Explain like the student is 5, with simple analogies and Nigerian Pidgin mixed in naturally."
    : "Be precise, exam-ready, and concise.";

  try {
    const raw = await callModel(
      `${style}\nAnswer using the notes. If a claim is not in the notes, prefix that sentence with [External Knowledge]. Cite evidence as [Evidence: Note p.N] when the notes include [Page N] markers.\nNOTES:\n${opts.notes.slice(0, 12000)}\n\nQUESTION:\n${opts.question}`,
    );
    return decorate(raw, opts.notes);
  } catch (err) {
    console.error("AI Tutor Failed, using local engine:", err);
    const localResult = localTutor(opts);
    return decorate(`(⚠️ AI offline. Local search result:)\n\n${localResult}`, opts.notes);
  }
}

function localTutor(opts: {
  notes: string;
  question: string;
  eli5: boolean;
}) {
  const qWords = opts.question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const blocks = opts.notes.split(/\[Page\s+(\d+)\]/i);
  let best = { page: 1, text: "", score: 0 };
  if (blocks.length === 1) {
    best = { page: 1, text: blocks[0].slice(0, 400), score: 1 };
  } else {
    for (let i = 1; i < blocks.length; i += 2) {
      const page = parseInt(blocks[i], 10) || 1;
      const text = blocks[i + 1] || "";
      const low = text.toLowerCase();
      const score = qWords.reduce((a, w) => a + (low.includes(w) ? 1 : 0), 0);
      if (score > best.score) best = { page, text, score };
    }
  }
  const snippet = best.text.replace(/\s+/g, " ").trim().slice(0, 420);
  if (!snippet || best.score === 0) {
    const extra = opts.eli5 ? "I no see this one inside your note." : "This is not stated in the uploaded notes.";
    return `${extra} [External Knowledge] I can still walk through the question generally, but treat it as outside the note.`;
  }
  if (opts.eli5) {
    return `Abeg, look am like this [Evidence: Note p.${best.page}]: ${snippet} — na the part of your note wey match your question.`;
  }
  return `From your notes [Evidence: Note p.${best.page}]: ${snippet}`;
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

export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\[External Knowledge\]/gi, "Outside the notes."));
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition
      || (window as unknown as { SpeechRecognition?: new () => SpeechRec }).SpeechRecognition;
    if (!SR) {
      reject(new Error("Voice is not available in this browser."));
      return;
    }
    const rec = new SR();
    rec.lang = "en-NG";
    rec.interimResults = false;
    rec.onresult = (e: { results: { 0: { 0: { transcript: string } } } }) => {
      resolve(e.results[0][0].transcript);
    };
    rec.onerror = () => reject(new Error("Could not hear that. Try again."));
    rec.start();
  });
}

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
