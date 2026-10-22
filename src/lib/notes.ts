import { extractImage, extractPdf } from "./pdf";
import { generatePack } from "./gemini";
import { MAX_NOTE_CHARS } from "./pricing";
import type { NoteDoc, QuestionSet, User } from "./types";

function cleanExtractedText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.length < 15) return false;
      const letters = trimmed.replace(/[^a-zA-Z]/g, '');
      if (letters.length < trimmed.length * 0.5) return false;
      return true;
    })
    .join('\n')
    .trim();
}

export async function processNoteFile(
  file: File,
  ctx: {
    me: User;
    canGenerate: () => { ok: boolean; reason?: string };
    addCredits: (userId: string, delta: number) => void;
    recordGeneration: () => { ok: boolean; reason?: string };
    refundCredits: (n: number) => void;
    uploadNote: (note: Omit<NoteDoc, "id" | "createdAt" | "ownerId">) => NoteDoc;
    saveSet: (set: Omit<QuestionSet, "id" | "createdAt" | "ownerId" | "attempts" | "lastScore">) => QuestionSet;
    touchStreak: () => void;
    onProgress: (s: string) => void;
  },
): Promise<{ note: NoteDoc; set: QuestionSet; engine: "cloud" | "local" }> {
  const gate = ctx.canGenerate();
  if (!gate.ok) throw new Error(gate.reason || "Not now.");
  
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImg = file.type.startsWith("image/");
  if (!isPdf && !isImg) throw new Error("Use a PDF or a photo of your notes.");
  
  ctx.onProgress(isPdf ? "Counting pages…" : "Reading the photo…");
  
  let extracted;
  try {
    extracted = isPdf ? await extractPdf(file) : await extractImage(file);
  } catch (err) {
    throw new Error("Could not read this file. Please try a different PDF or photo.");
  }

  const cleanedText = cleanExtractedText(extracted.text);
  
  const cost = Math.max(1, extracted.pages);
  if (ctx.me.credits < cost) throw new Error(`This file needs ${cost} credit${cost > 1 ? "s" : ""}.`);
  
  if (!cleanedText || cleanedText.length < 50) {
    throw new Error("No readable academic text found in that file. Please upload a clearer image or a text-based PDF.");
  }
  
  ctx.addCredits(ctx.me.id, -cost);
  const rec = ctx.recordGeneration();
  if (!rec.ok) {
    ctx.addCredits(ctx.me.id, cost);
    throw new Error(rec.reason || "Could not start.");
  }
  
  ctx.onProgress("Writing the summary and sixty questions…");
  
  let pack;
  try {
    pack = await generatePack(cleanedText, file.name.replace(/\.[^.]+$/, ""));
  } catch {
    ctx.refundCredits(cost);
    throw new Error("Generation failed. Credits returned.");
  }
  
  if (!pack || !pack.questions || !Array.isArray(pack.questions) || pack.questions.length === 0) {
    ctx.refundCredits(cost);
    throw new Error("The AI could not generate questions from this text. Credits returned.");
  }
  
  const note = ctx.uploadNote({
    title: file.name.replace(/\.[^.]+$/, "") || "Untitled notes",
    pages: extracted.pages,
    charCount: Math.min(extracted.charCount, MAX_NOTE_CHARS),
    text: cleanedText,
    summary: pack.summary,
    sourceKind: isPdf ? "pdf" : "image",
    fileName: file.name,
  });
  
  const set = ctx.saveSet({
    noteId: note.id,
    title: note.title,
    questions: pack.questions,
    kind: "note",
  });
  
  ctx.touchStreak();
  return { note, set, engine: pack.engine };
}
