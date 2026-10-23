import { useMemo, useState, useEffect } from "react";
import { useStore } from "../lib/store";
import { Seo } from "../components/Seo";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Brain, Target, TrendingUp, AlertTriangle, Sparkles, ChevronRight, Award, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// Import the Cloudflare AI function (we will add this to cloudflare.ts)
import { generateInsight } from "../lib/cloudflare"; 

export function Insights() {
  const { me, db, toast } = useStore();
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  // 1. Gather all CBT attempts
  const myAttempts = useMemo(() => {
    if (!me) return [];
    return (db.attempts || []).filter(a => a.ownerId === me.id);
  }, [me, db.attempts]);

  // 2. Calculate subject averages (Deep Analysis)
  const subjectStats = useMemo(() => {
    const stats: Record<string, { correct: number; total: number }> = {};
    
    myAttempts.forEach(attempt => {
      const set = (db.sets || []).find(s => s.id === attempt.setId);
      if (!set) return;
      
      set.questions.forEach(q => {
        const subj = q.topic || (q as any).subject || "General Studies";
        if (!stats[subj]) stats[subj] = { correct: 0, total: 0 };
        stats[subj].total += 1;
        // Assuming attempt has answers mapping
        if (attempt.answers?.[q.id] === q.answer) {
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

  const averageScore = trendData.length 
    ? Math.round(trendData.reduce((acc, curr) => acc + curr.score, 0) / trendData.length) 
    : 0;

  // 4. Call Cloudflare AI for Analysis
  const generateAiAnalysis = async () => {
    if (subjectStats.length === 0) return toast("Take a few CBT tests first!", "err");
    
    setAnalyzing(true);
    try {
      const statsString = subjectStats.map(s => `${s.name}: ${s.score}%`).join(", ");
      
      // We call our new Cloudflare endpoint
      const text = await generateInsight(statsString);
      setAiAnalysis(text);
    } catch (e: any) {
      console.error(e);
      toast(e.message || "AI Analysis failed. Check connection.", "err");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!me) return null;

  // Animation variants
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300 } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="px-5 pt-5 pb-24 min-h-screen bg-off">
      <Seo title="AI Insights — NoteToExam" />
      
      {/* HEADER */}
      <motion.div variants={item} className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl font-bold">Performance</h1>
          <p className="text-ink/50 text-sm mt-1">Track your progress and find your weak spots.</p>
        </div>
        <div className="bg-white rounded-2xl px-4 py-2 border border-ink/5 shadow-sm text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold text-ink/40">Avg Score</p>
          <p className={`font-display font-bold text-xl ${averageScore >= 50 ? 'text-sage' : 'text-terra'}`}>{averageScore}%</p>
        </div>
      </motion.div>

      {/* AI ANALYSIS CARD */}
      <motion.div variants={item} className="bg-gradient-to-br from-ink to-slate-800 rounded-[28px] p-6 text-off shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Brain size={120} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-terra" size={20} />
            <h2 className="font-display font-bold">AI Tutor Analysis</h2>
          </div>
          
          <AnimatePresence mode="wait">
            {aiAnalysis ? (
              <motion.p 
                key="analysis"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm leading-relaxed text-white/90"
              >
                {aiAnalysis}
              </motion.p>
            ) : (
              <motion.div key="button" exit={{ opacity: 0, height: 0 }}>
                <p className="text-sm text-white/60 mb-4">Let the AI analyze your test history and tell you exactly what to study next.</p>
                <button 
                  onClick={generateAiAnalysis} 
                  disabled={analyzing}
                  className="bg-terra text-ink font-display font-bold px-6 py-3 rounded-xl active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {analyzing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                      Analyzing Data...
                    </>
                  ) : (
                    <><Brain size={18} /> Analyze My Performance</>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* CHARTS */}
      {myAttempts.length > 0 ? (
        <div className="space-y-6">
          
          {/* TREND CHART */}
          <motion.div variants={item} className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-sage-deep" size={18} />
                <h2 className="font-display font-bold">Score Trend</h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-sage bg-sage/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Flame size={12}/> {myAttempts.length} Tests
              </span>
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
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#111', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#81B29A" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* SUBJECT WEAKNESS CHART */}
          <motion.div variants={item} className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="text-terra" size={18} />
              <h2 className="font-display font-bold">Subject Weaknesses</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#333', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={24}>
                    {subjectStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score < 50 ? '#E07A5F' : '#81B29A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-ink/40 mt-2 text-center flex items-center justify-center gap-1">
              <AlertTriangle size={12} className="text-terra"/> Subjects at the top need the most attention.
            </p>
          </motion.div>

        </div>
      ) : (
        <motion.div variants={item} className="text-center py-12 bg-white rounded-[24px] border border-ink/5 shadow-sm">
          <Award className="mx-auto text-ink/20 mb-3" size={48} />
          <h2 className="font-display font-bold text-lg">No data yet</h2>
          <p className="text-sm text-ink/50 mt-1">Take a CBT test to unlock your AI insights.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
