import { useMemo, useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { Seo } from "../components/Seo";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Brain, Target, TrendingUp, AlertTriangle } from "lucide-react";

export function Insights() {
  const { me, db, toast } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  // 1. Gather all CBT attempts for this user
  const myAttempts = useMemo(() => {
    if (!me) return [];
    return (db.attempts || []).filter(a => a.ownerId === me.id);
  }, [me, db.attempts]);

  // 2. Calculate subject averages
  const subjectStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    
    myAttempts.forEach(attempt => {
      const set = db.sets.find(s => s.id === attempt.setId);
      if (!set) return;
      
      set.questions.forEach(q => {
        const subj = q.topic || (q as any).subject || "General";
        if (!stats[subj]) stats[subj] = { correct: 0, total: 0 };
        stats[subj].total += 1;
        if (attempt.answers[q.id] === q.answer) {
          stats[subj].correct += 1;
        }
      });
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      score: Math.round((data.correct / data.total) * 100),
    })).sort((a, b) => a.score - b.score); // Lowest first
  }, [myAttempts, db.sets]);

  // 3. Chart data for recent scores
  const trendData = useMemo(() => {
    return myAttempts.slice(-8).map((a, i) => ({
      name: `Test ${i + 1}`,
      score: a.total ? Math.round((a.score / a.total) * 100) : 0,
    }));
  }, [myAttempts]);

  // 4. Call Gemini for AI Analysis
  const generateAiAnalysis = async () => {
    if (subjectStats.length === 0) return toast("Take a few CBT tests first!", "err");
    
    setAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const statsString = subjectStats.map(s => `${s.name}: ${s.score}%`).join(", ");
      
      const prompt = `You are an academic advisor. A student has these CBT scores: ${statsString}. 
      Write a short, encouraging 3-sentence analysis of their performance. 
      Tell them exactly which 2 subjects they need to focus on, and give them one specific study tip. 
      Do not use markdown. Keep it under 80 words.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiAnalysis(text || "Could not generate analysis right now.");
    } catch (e) {
      toast("AI Analysis failed.", "err");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!me) return null;

  return (
    <div className="px-5 pt-5 pb-24">
      <Seo title="AI Insights — NoteToExam" />
      
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Performance Insights</h1>
        <p className="text-ink/50 text-sm mt-1">Track your progress and find your weak spots.</p>
      </div>

      {/* AI ANALYSIS CARD */}
      <div className="bg-ink rounded-[28px] p-6 text-off shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Brain size={120} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="text-terra" size={20} />
            <h2 className="font-display font-bold">AI Tutor Analysis</h2>
          </div>
          
          {aiAnalysis ? (
            <p className="text-sm leading-relaxed text-white/90">{aiAnalysis}</p>
          ) : (
            <div>
              <p className="text-sm text-white/60 mb-4">Let Gemini analyze your test history and tell you exactly what to study next.</p>
              <button 
                onClick={generateAiAnalysis} 
                disabled={analyzing}
                className="bg-terra text-ink font-display font-bold px-6 py-3 rounded-xl active:scale-95 transition disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Analyze My Performance"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHARTS */}
      {myAttempts.length > 0 ? (
        <div className="space-y-6">
          
          {/* TREND CHART */}
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-sage-deep" size={18} />
              <h2 className="font-display font-bold">Score Trend</h2>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#81B29A" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#81B29A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#81B29A" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SUBJECT WEAKNESS CHART */}
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-terra" size={18} />
              <h2 className="font-display font-bold">Subject Strengths & Weaknesses</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#E07A5F" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-ink/40 mt-2 text-center">Subjects at the top need the most attention.</p>
          </div>

        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-[24px] border border-ink/5">
          <AlertTriangle className="mx-auto text-terra mb-3" size={32} />
          <h2 className="font-display font-bold text-lg">No data yet</h2>
          <p className="text-sm text-ink/50 mt-1">Take a CBT test to unlock your AI insights.</p>
        </div>
      )}
    </div>
  );
}
