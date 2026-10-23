import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, XCircle, Timer, Award, RefreshCw } from "lucide-react";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function Cbt() {
  const { id } = useParams();
  const nav = useNavigate();
  const { db, saveAttempt, me, toast } = useStore();
  
  const pack = (db.sets || []).find((s) => s.id === id);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Track when the test started for the database
  const startTimeRef = useRef<number>(Date.now());

  // Initialize timer (1 minute per question)
  useEffect(() => {
    if (pack && !showResult) {
      setTimeLeft(pack.questions.length * 60);
      startTimeRef.current = Date.now();
    }
  }, [pack, showResult]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !showResult && pack) {
      handleSubmit();
    }
  }, [timeLeft, showResult, pack]);

  if (!pack) return <div className="p-5 text-center font-display">Test not found. Please upload a new note.</div>;

  const questions = pack.questions || [];
  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  function handleSelect(optionText: string) {
    if (showResult) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionText }));
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleSubmit() {
    setShowResult(true);
    let score = 0;
    
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) score++;
    });

    if (me && pack) {
      // FIX: Added startedAt, finishedAt, and mapped the answers object correctly
      saveAttempt({
        ownerId: me.id,
        setId: pack.id,
        score,
        total: questions.length,
        startedAt: startTimeRef.current,
        finishedAt: Date.now(),
        answers: questions.reduce((acc, q) => {
          if (answers[q.id]) acc[q.id] = answers[q.id];
          return acc;
        }, {} as Record<string, string>)
      });
      toast("Test submitted successfully.", "ok");
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  // ────────────────────────────────────────────────────────────
  // RESULTS SCREEN
  // ────────────────────────────────────────────────────────────
  if (showResult) {
    const score = questions.filter((q) => answers[q.id] === q.answer).length;
    const percent = Math.round((score / questions.length) * 100);
    
    return (
      <div className="px-5 pt-5 pb-24 min-h-screen bg-off">
        <Seo title="CBT Result — NoteToExam" />
        
        <div className="text-center mt-10">
          <div className="inline-flex h-24 w-24 bg-terra/10 rounded-full items-center justify-center mb-4">
            <Award size={48} className="text-terra" />
          </div>
          <h1 className="font-display text-3xl font-bold">Test Complete!</h1>
          <p className="text-ink/50 mt-2">You scored {score} out of {questions.length}</p>
          
          <div className="mt-6 bg-white rounded-3xl p-6 border border-ink/5 shadow-sm max-w-sm mx-auto">
            <p className="text-5xl font-display font-bold text-sage">{percent}%</p>
            <p className="text-sm text-ink/40 uppercase tracking-widest font-bold mt-2">Accuracy</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="font-display font-bold text-lg">Review Answers</h2>
          {questions.map((q, i) => {
            const isCorrect = answers[q.id] === q.answer;
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="bg-white rounded-2xl p-5 border border-ink/5 shadow-sm">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    {isCorrect ? <CheckCircle2 size={20} className="text-sage" /> : <XCircle size={20} className="text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold leading-tight">Q{i + 1}: {q.prompt}</p>
                    <div className="mt-3 text-sm space-y-1">
                      <p className={isCorrect ? "text-sage font-bold" : "text-red-500 font-bold"}>
                        Your answer: {userAnswer || "Skipped"}
                      </p>
                      {!isCorrect && (
                        <p className="text-sage font-bold">
                          Correct answer: {q.answer}
                        </p>
                      )}
                      <p className="text-ink/50 mt-2 text-xs italic">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={() => { setShowResult(false); setCurrentIndex(0); setAnswers({}); startTimeRef.current = Date.now(); }} className="press flex-1 bg-white border border-ink/10 text-ink font-display font-bold py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2">
            <RefreshCw size={18} /> Retake
          </button>
          <button onClick={() => nav("/app/library")} className="press flex-1 bg-ink text-off font-display font-bold py-4 rounded-2xl shadow-lg">
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  // TEST SCREEN
  // ────────────────────────────────────────────────────────────
  return (
    <div className="px-5 pt-5 pb-24 min-h-screen bg-off flex flex-col">
      <Seo title="CBT Test — NoteToExam" />
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => nav(-1)} className="press h-10 w-10 bg-white rounded-full grid place-items-center shadow-sm border border-ink/5">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-ink/5 shadow-sm">
          <Timer size={16} className={timeLeft < 60 ? "text-red-500" : "text-terra"} />
          <span className={`font-display font-bold ${timeLeft < 60 ? "text-red-500" : "text-ink"}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold text-ink/40 mb-2 uppercase tracking-widest">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
          <div className="h-full bg-terra transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* QUESTION CARD */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1"
        >
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-ink/5 mb-6">
            <p className="text-[10px] uppercase tracking-widest font-bold text-terra mb-3">
              {currentQ.format === "theory" ? "Theory Question" : "Objective Question"}
            </p>
            <h2 className="font-display text-xl font-bold leading-snug">{currentQ.prompt}</h2>

            {currentQ.format === "mcq" && currentQ.options && (
              <div className="mt-6 space-y-3">
                {currentQ.options.map((opt, i) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                        isSelected 
                          ? "border-terra bg-terra/5 text-ink font-bold" 
                          : "border-ink/5 hover:border-ink/20 text-ink/70"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-full border-2 grid place-items-center text-xs ${
                        isSelected ? "border-terra text-terra" : "border-ink/20 text-transparent"
                      }`}>
                        {isSelected && <div className="h-3 w-3 bg-terra rounded-full" />}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.format === "theory" && (
              <textarea 
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleSelect(e.target.value)}
                placeholder="Type your answer here..."
                className="mt-6 w-full h-32 bg-off rounded-2xl p-4 border border-ink/10 outline-none focus:border-terra resize-none"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* FOOTER CONTROLS */}
      <div className="flex gap-3 mt-auto">
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className="press h-14 w-14 shrink-0 bg-white border border-ink/10 rounded-2xl grid place-items-center font-display font-bold disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        
        {currentIndex === questions.length - 1 ? (
          <button 
            onClick={handleSubmit} 
            className="press flex-1 bg-ink text-off font-display font-bold rounded-2xl shadow-lg shadow-ink/20"
          >
            Submit Test
          </button>
        ) : (
          <button 
            onClick={handleNext} 
            className="press flex-1 bg-terra text-ink font-display font-bold rounded-2xl shadow-lg shadow-terra/20"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}
