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
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const isCustomTest = id === "new-test";
  const savedSet = db.sets.find((s) => s.id === id && s.ownerId === me?.id);
  
  const bank = useMemo(() => {
    if (isCustomTest) return shuffle(customQuestions);
    return savedSet ? shuffle(savedSet.questions.filter((q) => q.format === "mcq")) : [];
  }, [isCustomTest, customQuestions, savedSet?.id]);

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const [done, setDone] = useState(false);
  const [opts, setOpts] = useState<string[]>([]);
  const [shareEl, setShareEl] = useState<HTMLDivElement | null>(null);
  
  // Duration: JAMB is 2 hours (120 mins), others are 40 mins
  const examType = sessionStorage.getItem("cbt_exam_type") || "university";
  const duration = isCustomTest ? (examType === "jamb" ? 120 * 60 : 40 * 60) : (savedSet?.durationSec || 0);
  const remaining = duration ? Math.max(0, duration - secs) : secs;

  useEffect(() => {
    if (!isCustomTest) return;
    
    const generateTest = async () => {
      setLoading(true);
      setError("");
      try {
        const subjectsStr = sessionStorage.getItem("cbt_subjects");
        if (!subjectsStr) throw new Error("No subjects selected.");
        const subjects: string[] = JSON.parse(subjectsStr);
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key missing.");

        // 1. Calculate Total Questions
        const totalQuestions = examType === "jamb" ? 180 : 40;
        
        // 2. Distribute Questions
        const distribution: Record<string, number> = {};
        if (examType === "jamb" && subjects.includes("English Language")) {
          // JAMB Logic: English gets 60, others share the rest
          distribution["English Language"] = 60;
          const remainingQ = totalQuestions - 60;
          const otherSubjects = subjects.filter(s => s !== "English Language");
          const perSubject = Math.floor(remainingQ / otherSubjects.length);
          otherSubjects.forEach(s => distribution[s] = perSubject);
        } else {
          // Normal Logic: Equal distribution
          const perSubject = Math.floor(totalQuestions / subjects.length);
          subjects.forEach(s => distribution[s] = perSubject);
        }

        setProgress(`Generating ${totalQuestions} questions for ${subjects.length} subjects...`);

        // 3. Fetch from AI in Parallel
        const requests = subjects.map(async (subject) => {
          const qCount = distribution[subject];
          const prompt = `You are a strict Nigerian university professor. Generate exactly ${qCount} multiple-choice questions for the subject "${subject}".
          Return ONLY a JSON array. Do not include markdown or introductory text.
          Each object must have: { "subject": "${subject}", "prompt": "Question text?", "options": ["A","B","C","D"], "answer": "B", "explanation": "Why?", "format": "mcq", "topic": "General" }`;

          let response;
          let retries = 3;
          while (retries > 0) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } })
            });
            if (response.ok) break;
            if (response.status === 503 || response.status === 429) {
              await new Promise(res => setTimeout(res, 2000));
              retries--;
            } else {
              throw new Error(`Gemini failed for ${subject}`);
            }
          }

          if (!response || !response.ok) throw new Error("Gemini is busy.");
          const data = await response.json();
          let textResponse = data.candidates[0].content.parts[0].text;
          textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const startIdx = textResponse.indexOf('[');
          const endIdx = textResponse.lastIndexOf(']');
          if (startIdx !== -1 && endIdx !== -1) textResponse = textResponse.substring(startIdx, endIdx + 1);

          return JSON.parse(textResponse);
        });

        // 4. Wait for all subjects to finish and combine
        const results = await Promise.all(requests);
        const combinedQuestions = results.flat();
        
        if (!Array.isArray(combinedQuestions) || combinedQuestions.length === 0) {
          throw new Error("No questions generated.");
        }

        setCustomQuestions(combinedQuestions.map((q: any, index: number) => ({ ...q, id: `q-${index}-${Date.now()}` })));
      } catch (err: any) {
        setError(err.message || "Failed to generate test.");
      } finally {
        setLoading(false);
        setProgress("");
      }
    };
    
    generateTest();
  }, [isCustomTest, examType]);

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

  if (loading) {
    return (
      <div className="px-5 pt-20 text-center flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terra mb-4"></div>
        <h2 className="font-display text-2xl font-bold">Building your exam...</h2>
        <p className="text-ink/50 mt-2">{progress}</p>
      </div>
    );
  }

  if (error) return <div className="px-5 pt-10 text-center pb-24"><p className="font-display text-lg text-red-600 font-bold mb-4 bg-red-50 p-4 rounded-xl">{error}</p><Link to="/app/cbt/setup" className="bg-ink text-off px-6 py-3 rounded-xl font-bold">Go Back</Link></div>;
  if (!bank.length) return <div className="px-5 pt-10"><p className="font-display text-2xl font-bold">No questions found.</p><Link to="/app/cbt/setup" className="text-terra font-bold">Try again</Link></div>;

  const score = bank.filter((x) => answers[x.id] === x.answer).length;

  function choose(opt: string) { if (!q || picked) return; setPicked(opt); setAnswers((a) => ({ ...a, [q.id]: opt })); }
  function next() { if (!q || !picked) return; if (i + 1 >= bank.length) finish(); else setI(i + 1); }
  
  function finish() {
    if (!me) return;
    if (savedSet) saveAttempt({ setId: savedSet.id, ownerId: me.id, score: bank.filter((x) => answers[x.id] === x.answer).length, total: bank.length, startedAt: Date.now() - secs * 1000, finishedAt: Date.now(), answers });
    touchStreak(); setDone(true);
  }

  async function share() {
    if (!shareEl) return;
    try {
      const dataUrl = await toPng(shareEl, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "notetoexam-result.png", { type: "image/png" });
      const text = `I scored ${score}/${bank.length} on NoteToExam! Built by PrimeWebDesigns.`;
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "NoteToExam Result" });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "notetoexam-result.png";
        link.click();
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  }

  if (done) {
    const pct = Math.round((score / bank.length) * 100);
    return (
      <div className="px-5 pt-6 pb-24">
        <Seo title="CBT result — NoteToExam" />
        <h1 className="font-display text-3xl font-bold">Sitting complete.</h1>
        <p className="text-ink/50 mt-1">Time taken: {fmtClock(secs)}</p>
        
        <div ref={setShareEl} className="mt-5 rounded-[28px] overflow-hidden relative text-off p-6 bg-ink flex flex-col items-center justify-center text-center shadow-2xl">
          <p className="font-display text-[11px] tracking-[0.22em] uppercase text-terra mb-2">NoteToExam</p>
          <p className="font-display text-6xl font-bold mb-2">{pct}%</p>
          <p className="text-white/60">Score: {score} / {bank.length}</p>
          <p className="text-white/60">Time: {fmtClock(secs)}</p>
          
          <div className="mt-6 pt-4 border-t border-white/10 w-full flex flex-col items-center">
            <p className="font-display font-bold text-lg">{me?.name || "Student"}</p>
            <p className="text-xs text-terra mt-1">Built by PrimeWebDesigns</p>
          </div>
        </div>
        
        <button type="button" onClick={() => void share()} className="press mt-4 w-full rounded-full bg-sage text-ink font-display font-bold py-3">Share Result</button>
        <button type="button" onClick={() => nav(`/app`)} className="press mt-2 w-full rounded-full bg-ink text-off font-display font-bold py-3">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-24">
      <Seo title="CBT Simulator — NoteToExam" />
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-ink/50">{i + 1} / {bank.length}</p>
        <p className="font-display font-bold tabular-nums text-terra">{fmtClock(duration ? remaining : secs)}</p>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full mt-3"><div className="h-full bg-terra rounded-full" style={{ width: `${((i + (picked ? 1 : 0)) / bank.length) * 100}%` }} /></div>
      
      <h1 className="font-display text-xl font-bold mt-6 leading-snug">{q.prompt}</h1>
      <div className="mt-5 space-y-2">
        {opts.map((o, idx) => {
          const state = !picked ? "" : o === q.answer ? "ring-2 ring-sage bg-sage/20" : o === picked ? "ring-2 ring-terra bg-terra/15" : "opacity-50";
          return <button key={o} type="button" onClick={() => choose(o)} className={`press w-full text-left rounded-2xl bg-white px-4 py-4 font-display font-semibold ${state}`}><span className="text-terra mr-2">{String.fromCharCode(65 + idx)}.</span>{o}</button>;
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={finish} className="press w-full rounded-xl bg-gray-200 text-ink/70 font-display font-bold py-3 text-sm">
          Submit Test Early
        </button>
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
