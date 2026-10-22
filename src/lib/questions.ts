import type { Question, QuestionFormat, QuestionKind } from "./types";
import { uid } from "./id";

const KINDS: QuestionKind[] = [
  ...Array(20).fill("direct"),
  ...Array(20).fill("rephrased"),
  ...Array(20).fill("connection"),
] as QuestionKind[];

function sentencesFrom(text: string) {
  const pages = new Map<number, string[]>();
  const blocks = text.split(/\[Page\s+(\d+)\]/i);
  if (blocks.length === 1) {
    pages.set(1, splitSentences(blocks[0]));
    return pages;
  }
  for (let i = 1; i < blocks.length; i += 2) {
    const n = parseInt(blocks[i], 10) || 1;
    pages.set(n, splitSentences(blocks[i + 1] || ""));
  }
  return pages;
}

function splitSentences(s: string) {
  return s
    .replace(/\s+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 28 && x.split(" ").length >= 6);
}

function nouns(sentence: string) {
  return sentence
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP.has(w.toLowerCase()));
}

const STOP = new Set(
  "about above after again against because before being between both could during each either every from have having into just like more most much only other over same should some such than that their there these they this those through under until very were what when where which while with would your yours the and for are was not you but his her its our".split(
    " ",
  ),
);

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function distractors(pool: string[], avoid: string, n: number) {
  const out: string[] = [];
  for (const w of pool) {
    if (w.toLowerCase() === avoid.toLowerCase()) continue;
    if (!out.some((x) => x.toLowerCase() === w.toLowerCase())) out.push(w);
    if (out.length >= n) break;
  }
  while (out.length < n) out.push(`Option ${out.length + 1} (not in stem)`);
  return out;
}

function topicOf(sentence: string) {
  const n = nouns(sentence);
  return n.slice(0, 3).join(" ") || "General";
}

export function buildQuestionsFromNotes(text: string, title: string): Question[] {
  const byPage = sentencesFrom(text);
  const flat: { page: number; sentence: string }[] = [];
  for (const [page, ss] of byPage) {
    for (const sentence of ss) flat.push({ page, sentence });
  }
  if (flat.length === 0) {
    const fallback = text.replace(/\[Page\s+\d+\]/gi, " ").replace(/\s+/g, " ").trim();
    if (fallback.length > 12) flat.push({ page: 1, sentence: fallback.slice(0, 280) });
  }
  if (flat.length === 0) return [];

  const wordPool = [...new Set(flat.flatMap((f) => nouns(f.sentence)))];
  const qs: Question[] = [];

  for (let i = 0; i < 60; i++) {
    const src = pick(flat, i);
    const kind = KINDS[i];
    const words = nouns(src.sentence);
    const key = words[0] || title || "the concept";
    const topic = topicOf(src.sentence);
    const format: QuestionFormat = i % 3 === 2 ? "theory" : "mcq";
    const page = src.page;
    const stem = src.sentence.replace(/\s+/g, " ").slice(0, 220);

    if (format === "theory") {
      const prompt =
        kind === "connection"
          ? `Connect this idea from ${title} to another part of the notes: “${stem}” How does it depend on earlier points?`
          : kind === "rephrased"
            ? `In your own words, explain: “${stem}”`
            : `From the notes, discuss: “${stem}”`;
      qs.push({
        id: uid("q"),
        kind,
        format,
        prompt,
        answer: stem,
        explanation: `Drawn from page ${page} of your notes.`,
        page,
        topic,
      });
      continue;
    }

    const optionsCore = [key, ...distractors(wordPool.length ? wordPool : [title, "definition", "process", "result"], key, 3)];
    const options = optionsCore.slice(0, 4);
    const prompt =
      kind === "rephrased"
        ? `Which term best matches this restated idea from your notes: “${stem}”?`
        : kind === "connection"
          ? `Which concept from the notes is most tightly linked to: “${stem}”?`
          : `According to your notes (page ${page}), which option is grounded in: “${stem}”?`;

    qs.push({
      id: uid("q"),
      kind,
      format: "mcq",
      prompt,
      options,
      answer: key,
      explanation: `Evidence on page ${page}: “${stem}”`,
      page,
      topic,
    });
  }
  return qs;
}

export function parseModelQuestions(raw: string, fallbackText: string, title: string): Question[] {
  try {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start < 0 || end < 0) throw new Error("no json");
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Array<Partial<Question>>;
    const cleaned: Question[] = parsed
      .map((q, i) => {
        const format: QuestionFormat = q.format === "theory" ? "theory" : "mcq";
        const kind: QuestionKind =
          q.kind === "rephrased" || q.kind === "connection" || q.kind === "direct" ? q.kind : KINDS[i] || "direct";
        return {
          id: uid("q"),
          kind,
          format,
          prompt: String(q.prompt || "").trim(),
          options: format === "mcq" ? (q.options || []).map(String).slice(0, 4) : undefined,
          answer: String(q.answer || "").trim(),
          explanation: String(q.explanation || "").trim(),
          page: Number(q.page) || 1,
          topic: String(q.topic || "General"),
        };
      })
      .filter((q) => q.prompt.length > 8);
    if (cleaned.length >= 20) {
      while (cleaned.length < 60) {
        const extra = buildQuestionsFromNotes(fallbackText, title);
        cleaned.push(...extra.slice(0, 60 - cleaned.length));
      }
      return cleaned.slice(0, 60);
    }
  } catch {
    /* fall through */
  }
  return buildQuestionsFromNotes(fallbackText, title);
}

export function summarizeLocally(text: string, title: string) {
  const byPage = sentencesFrom(text);
  const lines: string[] = [];
  for (const [page, ss] of byPage) {
    if (!ss.length) continue;
    lines.push(`Page ${page}: ${ss.slice(0, 2).join(" ")}`);
  }
  if (!lines.length) {
    const t = text.replace(/\[Page\s+\d+\]/gi, " ").replace(/\s+/g, " ").trim();
    return t ? `${title}: ${t.slice(0, 600)}` : `No extractable sentences in ${title}.`;
  }
  return lines.slice(0, 12).join("\n");
}
