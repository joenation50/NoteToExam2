import { useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { todayKey } from "../lib/id";
import { processNoteFile } from "../lib/notes";
import { useStore } from "../lib/store";
import { MAX_NOTE_CHARS } from "../lib/pricing";
import { PwaBanner } from "../components/PwaBanner";

export function Dashboard() {
  const { me, db, toast, uploadNote, saveSet, recordGeneration, refundCredits, canGenerate, touchStreak, addCredits } = useStore();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [examDate, setExamDate] = useState<string>(() => localStorage.getItem("nte_exam_date") || "");

  if (!me) return <div className="px-5 pt-20 text-center font-display">Loading your workspace...</div>;

  const myNotes = (db.notes || []).filter((n) => n.ownerId === me.id);
  const mySets = (db.sets || []).filter((s) => s.ownerId === me.id);
  const myAttempts = (db.attempts || []).filter((a) => a.ownerId === me.id);
  const todaySec = me.studySeconds?.[todayKey()] || 0;

  const weekSec = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      s += me.studySeconds?.[todayKey(d)] || 0;
    }
    return s;
  }, [me]);

  const trend = useMemo(() => {
    const last = myAttempts.slice(-8);
    if (!last.length) return [];
    return last.map((a, i) => ({ i: i + 1, pct: a.total ? Math.round((a.score / a.total) * 100) : 0 }));
  }, [myAttempts]);

  const cbtAvg = myAttempts.length ? Math.round((myAttempts.reduce((a, x) => a + x.score / Math.max(1, x.total), 0) / myAttempts.length) * 100) : null;

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const diff = new Date(examDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [examDate]);

  const latestMessages = useMemo(() => {
    const rows: { id: string; from: string; text: string; t: number; href: string }[] = [];
    (db.convos || []).forEach(c => {
      if (!c.memberIds?.includes(me.id) || !c.messages?.length) return;
      const last = c.messages[c.messages.length - 1];
      const other = (db.users || []).find((u) => u.id === c.memberIds.find((id) => id !== me.id));
      rows.push({ id: last.id, from: other?.name || "DM", text: last.kind === "text" ? last.text : "Media", t: last.createdAt, href: "/app/messages" });
    });
    (db.groups || []).forEach(g => {
      if (!g.memberIds?.includes(me.id) || !g.messages?.length) return;
      const last = g.messages[g.messages.length - 1];
      const author = (db.users || []).find((u) => u.id === last.fromId);
      rows.push({ id: last.id, from: `${author?.name || "Member"} · ${g.name}`, text: last.text || "Media", t: last.createdAt, href: "/app/groups" });
    });
    return rows.sort((a, b) => b.t - a.t).slice(0, 3);
  }, [me, db.convos, db.groups, db.users]);

  const weak = Object.entries(me.weakTopics || {}).sort((a, b) => b[1] - a[1])[0];
  const weeklyTip = weak ? `You missed ${weak[0]} ${weak[1]} times. Drill that topic.` : "Keep the streak alive!";

  async function onFile(file: File) {
    if (file.size === 0) return toast("File is empty.", "err");
    if (file.size > 20 * 1024 * 1024) return toast("File too large. Max 20MB.", "err");

    setBusy(true);
    try {
      const { set, engine } = await processNoteFile(file, {
        me: me!, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak, onProgress: setProgress,
      });
      // FIX #26: Success Toast
      toast(engine === "local" ? "Pack ready (offline mode)." : "Pack generated successfully!", "ok");
      nav(`/app/library/${set.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not read file.", "err");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="px-5 pt-5 pb-24">
      <Seo title="Dashboard — NoteToExam" />
      <div className="flex items-end justify-between">
        <div>
          <p className="text-ink/45 text-sm">Today</p>
          <h1 className="font-display text-3xl font-bold leading-tight">Ready when you are.</h1>
        </div>
        <div className="text-center">
          <img src="/images/streak-flame.png" alt="" className="h-12 w-12 mx-auto" />
          <p className="font-display font-bold text-terra">{me.streak || 0} day streak</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <Stat label="Total credits" value={String(me.credits ?? 0)} />
        <Stat label="Day streak" value={String(me.streak || 0)} />
        <Stat label="CBT average" value={cbtAvg == null ? "—" : `${cbtAvg}%`} />
      </div>

      {/* EXAM COUNTDOWN */}
      <div className="mt-4 rounded-[24px] bg-white p-4 border border-ink/5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold">Exam Countdown</h2>
          {daysLeft !== null && <span className="bg-terra text-ink text-xs font-bold px-3 py-1 rounded-full">{daysLeft === 0 ? "Exam is today!" : `${daysLeft} Days Left`}</span>}
        </div>
        {daysLeft === null ? (
          <input type="date" className="mt-2 w-full p-3 rounded-xl border border-ink/10 bg-off font-display text-sm" onChange={(e) => { setExamDate(e.target.value); localStorage.setItem("nte_exam_date", e.target.value); }} />
        ) : (
          <div className="mt-3 flex items-center justify-between">
            {/* FIX #23: Readable Date Format */}
            <p className="font-display font-bold text-lg">{new Date(examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <button onClick={() => { setExamDate(""); localStorage.removeItem("nte_exam_date"); }} className="text-xs text-red-500 font-bold p-2">Clear</button>
          </div>
        )}
      </div>

      <Link to="/app/settings" className="press mt-4 flex items-center justify-between bg-white rounded-[24px] px-4 py-4 border border-ink/5">
        <div>
          <p className="text-[11px] font-display uppercase tracking-widest text-ink/40">Profile</p>
          <p className="font-display font-bold text-lg leading-tight">{me.name}</p>
          <p className="text-sm text-ink/50">{me.school || "School not set"}</p>
        </div>
        <span className="h-10 w-10 rounded-full bg-ink/5 grid place-items-center"><Pencil size={16} /></span>
      </Link>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="press rounded-[22px] bg-ink text-off px-3 py-4 text-left">
          <p className="font-display text-[10px] uppercase tracking-widest text-terra">Quick</p>
          <p className="font-display font-bold text-sm mt-1">Upload Note</p>
        </button>
        <Link to="/app/cbt/setup" className="press rounded-[22px] bg-terra text-ink px-3 py-4">
          <p className="font-display text-[10px] uppercase tracking-widest">Quick</p>
          <p className="font-display font-bold text-sm mt-1">Start CBT</p>
        </Link>
        <Link to="/app/tutor" className="press rounded-[22px] bg-sage/40 text-ink px-3 py-4">
          <p className="font-display text-[10px] uppercase tracking-widest">Quick</p>
          <p className="font-display font-bold text-sm mt-1">Ask AI Tutor</p>
        </Link>
      </div>

      <Link to="/app/cbt/setup" className="press mt-3 w-full rounded-[24px] bg-ink text-off px-5 py-5 text-left block">
        <p className="font-display text-[11px] tracking-[0.2em] uppercase text-terra">Simulator</p>
        <p className="font-display text-2xl font-bold mt-1">Start CBT</p>
        <p className="text-white/55 mt-1 text-sm">Pick level, class, and 1–4 subjects. Forty questions.</p>
      </Link>

      <section className="mt-4 rounded-[24px] bg-white p-4 border border-ink/5">
        <div className="flex items-baseline justify-between"><h2 className="font-display font-bold">Recent messages</h2><Link to="/app/messages" className="text-xs font-display font-bold text-terra">View all</Link></div>
        {latestMessages.length === 0 ? <p className="text-sm text-ink/50 mt-2">No messages yet.</p> : (
          <ul className="mt-2 space-y-2">
            {latestMessages.map((m) => (
              <li key={m.id}><Link to={m.href} className="press block rounded-2xl bg-off px-3 py-2"><p className="font-display text-sm font-semibold truncate">{m.from}</p><p className="text-xs text-ink/50 truncate">{m.text}</p></Link></li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-[24px] bg-white p-4 border border-ink/5">
        <h2 className="font-display font-bold">Recent CBT activity</h2>
        {myAttempts.length === 0 ? <p className="text-sm text-ink/50 mt-2">No sittings yet.</p> : (
          <ul className="mt-2 space-y-2">
            {myAttempts.slice(-3).reverse().map((a) => {
              const pack = (db.sets || []).find((s) => s.id === a.setId);
              return (
                <li key={a.id}><Link to={pack ? `/app/cbt/${pack.id}` : "/app/cbt/setup"} className="press flex justify-between rounded-2xl bg-off px-3 py-2"><span className="font-display text-sm font-semibold truncate">{pack?.title || "CBT"}</span><span className="text-terra font-display text-sm font-bold">{a.total ? Math.round((a.score / a.total) * 100) : 0}%</span></Link></li>
              );
            })}
          </ul>
        )}
      </section>

      <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="press mt-5 w-full rounded-[28px] bg-ink text-off px-5 py-5 text-left">
        <p className="font-display text-[11px] tracking-[0.2em] uppercase text-terra">Upload</p>
        <p className="font-display text-2xl font-bold mt-1">Drop notes</p>
        <p className="text-white/55 mt-1 text-sm">PDF or photo · 1 credit per page · max 20MB</p>
        {busy && <p className="mt-3 text-sage text-sm">{progress}</p>}
      </button>
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat label="Today" value={fmtTime(todaySec)} />
        <Stat label="This week" value={fmtTime(weekSec)} />
        <Stat label="Uploads" value={String(myNotes.length)} />
        <Stat label="Study hours" value={(weekSec / 3600).toFixed(1)} />
      </div>

      <section className="mt-6 rounded-[28px] bg-white p-5 border border-ink/5">
        <div className="flex justify-between items-baseline"><h2 className="font-display font-bold text-lg">CBT score trend</h2></div>
        {trend.length ? (
          <div className="h-40 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E07A5F" stopOpacity={0.7} /><stop offset="100%" stopColor="#E07A5F" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="i" hide /><Tooltip formatter={(v) => [`${v}%`, "Score"]} contentStyle={{ borderRadius: 16, border: "none", fontFamily: "Space Grotesk" }} /><Area type="monotone" dataKey="pct" stroke="#E07A5F" fill="url(#g)" strokeWidth={2} /></AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-ink/50 mt-3 text-sm">Sit a CBT to start the graph.</p>}
      </section>

      <section className="mt-4 rounded-[28px] bg-sage/25 p-5">
        <p className="font-display text-[11px] tracking-[0.2em] uppercase text-sage-deep">Weekly tip</p>
        <p className="mt-2 text-[16px] leading-relaxed">{weeklyTip}</p>
      </section>

      {mySets.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display font-bold text-lg mb-3">Recent packs</h2>
          <div className="space-y-2">
            {mySets.slice(-5).reverse().map((s) => (
              <Link key={s.id} to={`/app/library/${s.id}`} className="press flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-ink/5">
                <div><p className="font-display font-semibold">{s.title}</p><p className="text-xs text-ink/45">{s.questions?.length || 0} questions</p></div>
                <span className="text-terra font-display text-sm font-bold">{s.lastScore != null ? `${s.lastScore}` : "Open"}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <PwaBanner />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] bg-white px-4 py-4 border border-ink/5"><p className="text-xs uppercase tracking-widest text-ink/40 font-display">{label}</p><p className="font-display text-2xl font-bold mt-1">{value}</p></div>;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}