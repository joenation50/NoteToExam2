import { Mic, Copy } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { listen, speak, tutorReply } from "../lib/gemini";
import { uid } from "../lib/id";
import { processNoteFile } from "../lib/notes";
import { useStore } from "../lib/store";
import type { ChatMessage } from "../lib/types";

export function Tutor() {
  const { me, db, upsertThread, addTutorMessage, toast, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak } = useStore();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null); // FIX #24
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [params] = useSearchParams();
  const noteId = params.get("note");
  const notes = db.notes.filter((n) => n.ownerId === me?.id);
  const note = notes.find((n) => n.id === noteId) || notes[0] || null;
  const set = db.sets.find((s) => s.noteId === note?.id);
  const theory = set?.questions.filter((q) => q.format === "theory") || [];

  const thread = useMemo(() => {
    if (!me) return null;
    return db.threads.find((x) => x.ownerId === me.id && x.noteId === (note?.id ?? null)) ?? null;
  }, [me, note?.id, db.threads]);

  const [text, setText] = useState("");
  const [eli5, setEli5] = useState(false);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);

  // FIX #24: Scroll to bottom when messages change
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread?.messages, busy]);

  async function ask(q: string) {
    if (!me) return;
    if (me.chatCap >= 0 && me.chatsUsed >= me.chatCap) return toast("AI chat cap reached.", "err");
    if (db.flags.pauseAi) return toast("Tutor is paused.", "err");
    
    let t = thread;
    if (!t) {
      t = { id: uid("th"), ownerId: me.id, noteId: note?.id ?? null, title: note?.title || "General", messages: [], updatedAt: Date.now() };
      upsertThread(t);
    }
    addTutorMessage(t.id, { id: uid("cm"), role: "user", text: q, citations: [], createdAt: Date.now(), eli5 });
    setBusy(true);
    try {
      const res = await tutorReply({ notes: note?.text || "", history: t.messages.map((m) => ({ role: m.role, text: m.text })), question: q, eli5 });
      
      // FIX #16: Show warning if AI is offline
      if (res.text.includes("⚠️ AI offline")) toast("AI is offline. Using local search.", "err");

      addTutorMessage(t.id, { id: uid("cm"), role: "tutor", text: res.text, citations: res.citations, createdAt: Date.now(), eli5 });
      if (live) speak(res.text);
    } catch {
      toast("Tutor could not answer.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function voice() {
    try {
      setLive(true);
      const heard = await listen();
      setText(heard);
      await ask(heard);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Voice unavailable.", "err");
    }
  }

  async function onFile(file: File) {
    if (!me) return;
    if (file.size === 0) return toast("File is empty.", "err");
    if (file.size > 20 * 1024 * 1024) return toast("File too large. Max 20MB.", "err");

    setUploading(true);
    try {
      const { note: newNote, engine } = await processNoteFile(file, { me, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak, onProgress: setProgress });
      toast(engine === "local" ? "Note ready (offline)." : "Note ready.", "ok");
      nav(`/app/tutor?note=${newNote.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not read file.", "err");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  const mcqCount = set?.questions.filter((q) => q.format === "mcq").length || 0;

  return (
    <div className="px-5 pt-5 flex flex-col h-[100dvh]">
      <Seo title="AI Tutor — NoteToExam" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Tutor</h1>
          <p className="text-ink/50 text-sm mt-1">{note ? note.title : "No notes loaded"}</p>
        </div>
        <button type="button" onClick={() => setEli5((v) => !v)} className={`press rounded-full px-3 py-2 text-xs font-display font-bold ${eli5 ? "bg-terra text-ink" : "bg-ink/5"}`}>Explain Like I'm 5</button>
      </div>

      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="press mt-4 w-full rounded-[22px] bg-ink text-off px-4 py-4 text-left shrink-0">
        <p className="font-display text-[11px] uppercase tracking-widest text-terra">Upload note</p>
        <p className="font-display font-bold mt-1">{uploading ? progress || "Working…" : "PDF or photo · max 20MB"}</p>
      </button>

      {!note ? (
        <EmptyState image="/images/empty-notes.png" title="Tutor needs a note" body="Upload a PDF or photo on Home, then come back." />
      ) : (
        <>
          {mcqCount > 0 && set && <Link to={`/app/cbt/${set.id}`} className="press mt-3 block rounded-2xl bg-terra text-ink px-4 py-3 font-display font-bold shrink-0">Practice from note · {mcqCount} objective items</Link>}
          
          {/* FIX #24: Scrollable Chat Area */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pb-4">
            {thread?.messages.map((m) => (
              <div key={m.id} className={`rounded-[22px] px-4 py-3 ${m.role === "user" ? "bg-ink text-off ml-8" : "bg-white mr-6"}`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.text}</p>
                {m.role === "tutor" && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex gap-1">
                      {m.citations.map((c, idx) => <span key={idx} className="text-[10px] font-display uppercase tracking-widest rounded-full bg-ink/5 px-2 py-1">{c.external ? "External knowledge" : `[Evidence: Note p.${c.page}]`}</span>)}
                    </div>
                    {/* FIX #29: Copy Button */}
                    <button onClick={() => { navigator.clipboard.writeText(m.text); toast("Copied!", "ok"); }} className="text-ink/40 hover:text-ink/80 transition p-1">
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="skeleton h-16 rounded-[22px]" />}
            <div ref={chatEndRef} />
          </div>

          <div className="mt-2 bg-off pt-2 shrink-0 pb-20">
            <button type="button" onClick={() => void voice()} className={`press w-full mb-2 rounded-full font-display font-bold py-3 ${live ? "bg-sage text-ink" : "bg-ink text-off"}`}>Live voice call</button>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = text.trim(); if (!q) return; setText(""); void ask(q); }}>
              <button type="button" onClick={() => void voice()} className={`press h-12 w-12 rounded-full grid place-items-center ${live ? "bg-sage text-ink" : "bg-ink text-off"}`}><Mic size={18} /></button>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask from the notes…" className="flex-1 rounded-full bg-white px-4 py-3 outline-none border border-ink/10" />
              <button className="press rounded-full bg-terra text-ink font-display font-bold px-5">Send</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}