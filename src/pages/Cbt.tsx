import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toPng } from "html-to-image";
import { Seo } from "../components/Seo";
import { shuffle } from "../lib/id";
import { useStore } from "../lib/store";
import type { Question } from "../lib/types";

export function Cbt() {
  const { id } = useParams();
  const { db, me, saveAttempt, touchStreak } = useStore();
  const nav = useNavigate();
  
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustomTest = id === "new-test";
  const savedSet = db.sets.find((s) => s.id === id && s.ownerId === me?.id);
  
  const bank = useMemo(() => {
    if (isCustomTest) {
      return shuffle(customQuestions);
    }
    return savedSet ? shuffle(savedSet.questions.filter((q) => q.format === "mcq")) : [];
  }, [isCustomTest, customQuestions, savedSet?.id]);

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [done, setDone] = useState(false);
  const [opts, setOpts] = useState<string[]>([]);
  const [shareEl, setShareEl] = useState<HTMLDivElement | null>(null);
  
  const duration = isCustomTest ? 40 * 60 : (savedSet?.durationSec || 0);
  const remaining = duration ? Math.max(0, duration - secs) : secs;

  useEffect(() => {
    if (!isCustomTest) return;

    const generateTest = async () => {
      setLoading(true);
      setError("");
      try {
        const subjectsStr = sessionStorage.getItem("cbt_subjects");
        // FIX #7: No Subjects Crash
        if (!subjectsStr) throw new Error("No subjects selected. Go back and pick subjects.");
        const subjects: string[] = JSON.parse(subjectsStr);
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key missing. Check Netlify environment variables.");

        const questionsPerSubject = Math.floor(40 / subjects.length);
        const prompt = `Generate exactly ${questionsPerSubject} multiple-choice questions for EACH of the following subjects: ${subjects.join(', ')}. 
        Return the response ONLY as a valid JSON array.
        Each object: { "subject": "...", "prompt": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "...", "format": "mcq", "topic": "..." }`;

        // FIX #5: Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) throw new Error("Gemini returned an empty result.");

        let textResponse = data.candidates[0].content.parts[0].text;
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const startIdx = textResponse.indexOf('[');
        const endIdx = textResponse.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) textResponse = textResponse.substring(startIdx, endIdx + 1);

        // FIX #3: JSON Parse Crash & FIX #21: 0 Questions
        let parsed;
        try {
          parsed = JSON.parse(textResponse);
        } catch (parseErr) {
          throw new Error("The AI returned an invalid format. Please try again.");
        }
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("The AI failed to generate questions. Please try again.");

        setCustomQuestions(parsed.map((q: any, index: number) => ({ ...q, id: `q-${index}-${Date.now()}` })));
      } catch (err: any) {
        if (err.name === 'AbortError') setError("The AI took too long to respond. Check your internet.");
        else setError(err.message || "Failed to generate test.");
      } finally {
        setLoading(false);
      }
    };

    generateTest();
  }, [isCustomTest]);

  // FIX #1: Refresh State Wipe
  useEffect(() => {
    if (isCustomTest && !done && bank.length > 0) {
      localStorage.setItem(`cbt_progress_${id}`, JSON.stringify({ i, answers, secs }));
    }
  }, [i, answers, secs, isCustomTest, id, done, bank.length]);

  useEffect(() => {
    if (isCustomTest) {
      const saved = localStorage.getItem(`cbt_progress_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setI(parsed.i || 0);
        setAnswers(parsed.answers || {});
        setSecs(parsed.secs || 0);
      }
    }
  }, [id, isCustomTest]);

  useEffect(() => {
    if (loading || error || !bank.length || done) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading, error, bank.length, done]);

  useEffect(() => {
    if (duration && secs >= duration && !done && bank.length) finish();
  }, [secs, duration, done, bank.length]);

  const q: Question | undefined = bank[i];
  useEffect(() => {
    if (!q) return;
    setOpts(shuffle(q.options || []));
    setPicked(null);
  }, [q?.id]);

  if (loading) return <div className="px-5 pt-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra mb-4 mx-auto"></div><h2 className="font-display text-2xl font-bold">Generating test...</h2></div>;
  if (error) return <div className="px-5 pt-10 text-center pb-24"><p className="font-display text-lg text-red-600 font-bold mb-4 bg-red-50 p-4 rounded-xl">{error}</p><Link to="/app/cbt/setup" className="bg-ink text-off px-6 py-3 rounded-xl font-bold">Go Back</Link></div>;
  if (!bank.length) return <div className="px-5 pt-10"><p className="font-display text-2xl font-bold">No questions found.</p><Link to="/app/cbt/setup" className="text-terra font-bold">Try again</Link></div>;

  const score = bank.filter((x) => answers[x.id] === x.answer).length;

  function choose(opt: string) { if (!q || picked) return; setPicked(opt); setAnswers((a) => ({ ...a, [q.id]: opt })); }
  function next() { if (!q || !picked) return; if (i + 1 >= bank.length) finish(); else setI(i + 1); }
  
  function finish() {
    if (!me) return;
    if (savedSet) saveAttempt({ setId: savedSet.id, ownerId: me.id, score: bank.filter((x) => answers[x.id] === x.answer).length, total: bank.length, startedAt: Date.now() - secs * 1000, finishedAt: Date.now(), answers });
    if (isCustomTest) localStorage.removeItem(`cbt_progress_${id}`);
    touchStreak(); setDone(true);
  }

  async function share() {
    if (!shareEl) return;
    const dataUrl = await toPng(shareEl, { pixelRatio: 2 });
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "notetoexam-win.png", { type: "image/png" });
    const text = `I scored ${score}/${bank.length} on NoteToExam.`;
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, title: "NoteToExam" });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (done) {
    const pct = Math.round((score / bank.length) * 100);
    return (
      <div className="px-5 pt-6 pb-24">
        <Seo title="CBT result — NoteToExam" />
        <h1 className="font-display text-3xl font-bold">Sitting complete.</h1>
        <div ref={setShareEl} className="mt-5 rounded-[28px] overflow-hidden relative text-off p-6 bg-ink" style={{ backgroundImage: "url(/images/share-bg.png)", backgroundSize: "cover" }}>
          <p className="font-display text-[11px] tracking-[0.22em] uppercase text-terra">NoteToExam</p>
          <p className="font-display text-5xl font-bold mt-4">{pct}%</p>
          <p className="mt-2 text-white/70">{score} of {bank.length}</p>
        </div>
        <button type="button" onClick={() => void share()} className="press mt-4 w-full rounded-full bg-sage text-ink font-display font-bold py-3">Share your win</button>
        <button type="button" onClick={() => nav(`/app`)} className="press mt-2 w-full rounded-full bg-ink text-off font-display font-bold py-3">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-24">
      <Seo title="CBT Simulator — NoteToExam" />
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-ink/50">{i + 1} / {bank.length}</p>
        <p className="font-display font-bold tabular-nums">{fmtClock(duration ? remaining : secs)}</p>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full mt-3"><div className="h-full bg-terra rounded-full" style={{ width: `${((i + (picked ? 1 : 0)) / bank.length) * 100}%` }} /></div>
      <h1 className="font-display text-xl font-bold mt-6 leading-snug">{q.prompt}</h1>
      <div className="mt-5 space-y-2">
        {opts.map((o, idx) => {
          const state = !picked ? "" : o === q.answer ? "ring-2 ring-sage bg-sage/20" : o === picked ? "ring-2 ring-terra bg-terra/15" : "opacity-50";
          return <button key={o} type="button" onClick={() => choose(o)} className={`press w-full text-left rounded-2xl bg-white px-4 py-4 font-display font-semibold ${state}`}><span className="text-terra mr-2">{String.fromCharCode(65 + idx)}.</span>{o}</button>;
        })}
      </div>
      {picked && (
        <div className="mt-4 rounded-[24px] bg-ink text-off p-4 mb-8">
          <p className="font-display font-bold">{picked === q.answer ? "Correct" : "Not this one"}</p>
          <p className="text-sm text-white/70 mt-1">{q.explanation}</p>
          <button type="button" onClick={next} className="press mt-4 w-full rounded-full bg-terra text-ink font-display font-bold py-3">{i + 1 >= bank.length ? "See score" : "Next Question"}</button>
        </div>
      )}
    </div>
  );
}

function fmtClock(s: number) { const m = Math.floor(s / 60); const r = s % 60; return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`; }
