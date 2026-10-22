import { MAX_NOTE_CHARS } from "./pricing";

export interface ExtractResult {
  pages: number;
  text: string;
  charCount: number;
  truncated: boolean;
}

export async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages = doc.numPages;
  let text = "";
  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) text += `\n\n[Page ${i}]\n${line}`;
    if (text.length >= MAX_NOTE_CHARS) break;
  }
  const truncated = text.length > MAX_NOTE_CHARS;
  text = text.slice(0, MAX_NOTE_CHARS);
  return { pages, text: text.trim(), charCount: text.length, truncated };
}

export async function extractImage(file: File): Promise<ExtractResult> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const { data } = await worker.recognize(file);
  await worker.terminate();
  let text = (data.text || "").replace(/\s+/g, " ").trim();
  const truncated = text.length > MAX_NOTE_CHARS;
  text = text.slice(0, MAX_NOTE_CHARS);
  if (text) text = `[Page 1]\n${text}`;
  return { pages: 1, text, charCount: text.length, truncated };
}
