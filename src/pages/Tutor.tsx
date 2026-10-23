import { Mic, PhoneOff, X } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { listen, speak, tutorReply, startLiveCall } from "../lib/gemini";
import { uid } from "../lib/id";
import { processNoteFile } from "../lib/notes";
import { useStore } from "../lib/store";
import type { ChatMessage } from "../lib/types";

export function Tutor() {
  const { me, db, upsertThread, addTutorMessage, toast, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak } = useStore();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [params] = useSearchParams();
  const noteId = params.get("note");
  
  const notes = (db.notes || []).filter((n) => n.ownerId === me?.id);
  const note = notes.find((n) => n.id === noteId) || notes[0] || null;
  const set = (db.sets || []).find((s) => s.noteId === note?.id);
  const theory = set?.questions?.filter((q) => q.format === "theory") || [];

  const thread = useMemo(() => {
    if (!me) return null;
    return (db.threads || []).find((x) => x.ownerId === me.id && x.noteId === (note?.id ?? null)) ?? null;
  }, [me, note?.id, db.threads]);

  const [text, setText] = useState("");
  const [eli5, setEli5] = useState(false);
  const [busy, setBusy] = useState(false);

  // Voice Note & Live Call States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveCallActive, setLiveCallActive] = useState(false);
  const stopLiveCallRef = useRef(false);

  // Cleanup live call on unmount
  useEffect(() => {
    return () => {
      stopLiveCallRef.current = true;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  async function ask(q: string, isLive = false) {
    if (!me) return;
    if (me.chatCap >= 0 && me.chatsUsed >= me.chatCap) {
      if (isLive) return; // Ignore cap in live mode to prevent breaking the call loop
      return toast("AI chat cap reached.", "err");
    }
    if (db.flags.pauseAi) {
      if (isLive) return;
      return toast("Tutor is paused.", "err");
    }
    
    let t = thread;
    if (!t) {
      t = { id: uid("th"), ownerId: me.id, noteId: note?.id ?? null, title: note?.title || "General", messages: [], updatedAt: Date.now() };
      upsertThread(t);
    }
    addTutorMessage(t.id, { id: uid("cm"), role: "user", text: q, citations: [], createdAt: Date.now(), eli5 });
    setBusy(true);
    try {
      const res = await tutorReply({ notes: note?.text || "", history: t.messages.map((m) => ({ role: m.role, text: m.text })), question: q, eli5 });
      addTutorMessage(t.id, { id: uid("cm"), role: "tutor", text: res.text, citations: res.citations, createdAt: Date.now(), eli5 });
      return res;
    } catch {
      if (!isLive) toast("Tutor could not answer.", "err");
      return { text: "I encountered an error. Please try again.", citations: [] };
    } finally {
      setBusy(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // VOICE NOTE LOGIC
  // ────────────────────────────────────────────────────────────
  async function handleVoiceNote() {
    if (isRecording || liveCallActive) return;
    setIsRecording(true);
    setRecordingSeconds(0);
    
    const timer = setInterval(() => setRecordingSeconds(s => s + 1), 1000);

    try {
      const heard = await listen();
      setText(heard);
      await ask(heard);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Voice unavailable.", "err");
    } finally {
      clearInterval(timer);
      setIsRecording(false);
    }
  }

  // ────────────────────────────────────────────────────────────
  // LIVE CALL LOGIC
  // ────────────────────────────────────────────────────────────
  async function toggleLiveCall() {
    if (liveCallActive) {
      stopLiveCallRef.current = true;
      setLiveCallActive(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    setLiveCallActive(true);
    stopLiveCallRef.current = false;

    try {
      await startLiveCall(
        (userText) => {
          // When user speaks, add their message to the UI instantly
          if (!me) return;
          let t = thread || { id: uid("th"), ownerId: me.id, noteId: note?.id ?? null, title: note?.title || "General", messages: [], updatedAt: Date.now() };
          if (!thread) upsertThread(t);
          addTutorMessage(t.id, { id: uid("cm"), role: "user", text: userText, citations: [], createdAt: Date.now(), eli5 });
        },
        (aiText) => {
          // When AI replies, add it to the UI
          if (!me) return;
          let t = thread || { id: uid("th"), ownerId: me.id, noteId: note?.id ?? null, title: note?.title || "General", messages: [], updatedAt: Date.now() };
          addTutorMessage(t.id, { id: uid("cm"), role: "tutor", text: aiText, citations: [], createdAt: Date.now(), eli5 });
        },
        async (userText) => {
          // The actual API call
          const res = await ask(userText, true);
          return { text: res?.text || "I didn't catch that." };
        },
        () => {}, // onListening (optional UI updates)
        () => {}, // onSpeaking (optional UI updates)
        () => stopLiveCallRef.current // Check if we should stop
      );
    } catch (e: any) {
      toast(e.message || "Live call failed.", "err");
      setLiveCallActive(false);
    }
  }

  async function onFile(file: File) {
    if (!me) return;
    if (file.size === 0) return toast("File is empty.", "err");
    if (file.size > 20 * 1024 * 1024) return toast("File too large. Max 20MB.", "err");

    setUploading(true);
    try {
      const result = await processNoteFile(file, { 
        me, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak, onProgress: setProgress 
      });

      if (!result || !result.note || !result.set) {
        throw new Error("The AI failed to read this file. Please try a clearer image or PDF.");
      }

      toast(result.engine === "local" ? "Note ready (offline)." : "Note ready.", "ok");
      nav(`/app/tutor?note=${result.note.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not read file.", "err");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  const mcqCount = set?.questions?.filter((q) => q.format === "mcq").length || 0;

  return (
    <div className="px-5 pt-5 flex flex-col min-h-[70dvh]">
      <Seo title="AI Tutor — NoteToExam" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Tutor</h1>
          <p className="text-ink/50 text-sm mt-1">{note ? note.title : "No notes loaded"}</p>
        </div>
        <button type="button" onClick={() => setEli5((v) => !v)} className={`press rounded-full px-3 py-2 text-xs font-display font-bold ${eli5 ? "bg-terra text-ink" : "bg-ink/5"}`}>Explain Like I'm 5</button>
      </div>

      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="press mt-4 w-full rounded-[22px] bg-ink text-off px-4 py-4 text-left">
        <p className="font-display text-[11px] uppercase tracking-widest text-terra">Upload note</p>
        <p className="font-display font-bold mt-1">{uploading ? progress || "Working…" : "PDF or photo · max 20MB"}</p>
      </button>

      {!note ? (
        <EmptyState image="/images/empty-notes.png" title="Tutor needs a note" body="Upload a PDF or photo on Home, then come back." />
      ) : (
        <>
          {mcqCount > 0 && set && <Link to={`/app/cbt/${set.id}`} className="press mt-3 block rounded-2xl bg-terra text-ink px-4 py-3 font-display font-bold">Practice from note · {mcqCount} objective items</Link>}
          
          {theory.length > 0 && (
            <div className="mt-4 overflow-x-auto scrollbar-none -mx-5 px-5">
              <div className="flex gap-2 w-max">
                {theory.slice(0, 8).map((q) => (
                  <button key={q.id} type="button" onClick={() => void ask(q.prompt)} className="press max-w-[220px] text-left rounded-2xl bg-white px-3 py-2 text-xs">
                    {q.prompt.slice(0, 90)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex-1 space-y-3 pb-32">
            {thread?.messages.map((m) => (
              <div key={m.id} className={`rounded-[22px] px-4 py-3 ${m.role === "user" ? "bg-ink text-off ml-8" : "bg-white mr-6"}`}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.text}</p>
                {m.role === "tutor" && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.citations.map((c, idx) => <span key={idx} className="text-[10px] font-display uppercase tracking-widest rounded-full bg-ink/5 px-2 py-1">{c.external ? "External knowledge" : `[Evidence: Note p.${c.page}]`}</span>)}
                  </div>
                )}
              </div>
            ))}
            {busy && !liveCallActive && <div className="skeleton h-16 rounded-[22px]" />}
          </div>

          {/* STICKY BOTTOM CONTROLS */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-off/90 backdrop-blur-md pb-safe pt-3 px-5 border-t border-ink/5">
            
            {/* Live Call Overlay Bar */}
            {liveCallActive && (
              <div className="mb-3 flex items-center justify-between bg-sage/20 rounded-full p-2 pl-4 animate-pulse">
                <p className="text-xs font-bold text-sage-deep">Live call active... Speak now</p>
                <button onClick={toggleLiveCall} className="bg-red-500 text-white rounded-full p-2"><PhoneOff size={16} /></button>
              </div>
            )}

            <div className="flex gap-2 items-center pb-4">
              {/* Voice Note / Mic Button */}
              <button 
                type="button" 
                onClick={handleVoiceNote} 
                disabled={liveCallActive}
                className={`press h-12 w-12 rounded-full grid place-items-center transition-all ${
                  isRecording ? "bg-red-500 text-white animate-pulse w-24" : "bg-ink text-off"
                }`}
              >
                {isRecording ? (
                  <span className="text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {recordingSeconds}s
                  </span>
                ) : (
                  <Mic size={18} />
                )}
              </button>

              {/* Text Input */}
              <form className="flex-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = text.trim(); if (!q) return; setText(""); void ask(q); }}>
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  disabled={isRecording || liveCallActive}
                  placeholder={isRecording ? "Listening..." : "Ask anything..."} 
                  className="flex-1 rounded-full bg-white px-4 py-3 outline-none border border-ink/10 text-sm disabled:opacity-50" 
                />
                <button disabled={isRecording || liveCallActive} className="press rounded-full bg-terra text-ink font-display font-bold px-5 disabled:opacity-50">Send</button>
              </form>

              {/* Live Call Toggle Button */}
              {!isRecording && (
                <button 
                  type="button" 
                  onClick={toggleLiveCall} 
                  className={`press h-12 w-12 rounded-full grid place-items-center shrink-0 ${
                    liveCallActive ? "bg-red-500 text-white" : "bg-sage text-ink"
                  }`}
                >
                  {liveCallActive ? <X size={20} /> : <div className="w-4 h-4 rounded-full border-2 border-ink" />}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
