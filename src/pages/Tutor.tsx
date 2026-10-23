import { Mic, Send, Sparkles, Phone, PhoneOff, Square, Bot, User as UserIcon, ChevronDown, Copy, Check } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { listen, speak, tutorReply, stopListening } from "../lib/gemini";
import { uid } from "../lib/id";
import { processNoteFile } from "../lib/notes";
import { useStore } from "../lib/store";
import { motion, AnimatePresence } from "framer-motion";

export function Tutor() {
  const { me, db, upsertThread, addTutorMessage, toast, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak } = useStore();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [params] = useSearchParams();
  const noteId = params.get("note");
  
  const notes = (db.notes || []).filter((n) => n.ownerId === me?.id);
  const note = notes.find((n) => n.id === noteId) || notes[0] || null;
  const set = (db.sets || []).find((s) => s.noteId === note?.id);

  const thread = useMemo(() => {
    if (!me) return null;
    return (db.threads || []).find((x) => x.ownerId === me.id && x.noteId === (note?.id ?? null)) ?? null;
  }, [me, note?.id, db.threads]);

  const [text, setText] = useState("");
  const [eli5, setEli5] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── VOICE & LIVE CALL STATES ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isLiveCall, setIsLiveCall] = useState(false);
  const timerRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length, busy]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  async function ask(q: string, isLive = false) {
    if (!me) return;
    if (me.chatCap >= 0 && me.chatsUsed >= me.chatCap) {
      if (!isLive) toast("AI chat cap reached.", "err");
      return;
    }
    if (db.flags.pauseAi) {
      if (!isLive) toast("Tutor is paused.", "err");
      return;
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
      
      // If in live call, speak the answer
      if (isLive) {
        await speak(res.text);
        // Loop back to listen
        if (isLiveCall) startLiveListening();
      }
    } catch {
      if (!isLive) toast("Tutor could not answer.", "err");
    } finally {
      setBusy(false);
    }
  }

  // ── VOICE NOTE RECORDER ──
  async function toggleRecording() {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      if (isLiveCall) setIsLiveCall(false);
      setIsRecording(true);
      setRecordSeconds(0);
      
      timerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);

      try {
        const heard = await listen();
        setText(heard); 
        await ask(heard); 
      } catch (e: any) {
        if (e.message !== "Recording stopped.") {
          toast(e.message, "err");
        }
      } finally {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  }

  // ── LIVE CALL MODE ──
  async function startLiveListening() {
    try {
      const heard = await listen();
      await ask(heard, true);
    } catch (e: any) {
      if (e.message === "Recording stopped.") return;
      if (isLiveCall) {
        setTimeout(() => { if (isLiveCall) startLiveListening(); }, 1000);
      }
    }
  }

  function toggleLiveCall() {
    if (isLiveCall) {
      setIsLiveCall(false);
      stopListening();
      window.speechSynthesis.cancel();
    } else {
      setIsLiveCall(true);
      startLiveListening();
    }
  }

  async function onFile(file: File) {
    if (!me) return;
    if (file.size === 0) return toast("File is empty.", "err");
    if (file.size > 20 * 1024 * 1024) return toast("File too large. Max 20MB.", "err");

    setUploading(true);
    try {
      const result = await processNoteFile(file, { me, canGenerate, addCredits, recordGeneration, refundCredits, uploadNote, saveSet, touchStreak, onProgress: setProgress });
      if (!result || !result.note || !result.set) throw new Error("The AI failed to read this file.");
      toast("Note ready.", "ok");
      nav(`/app/tutor?note=${result.note.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not read file.", "err");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Very basic Markdown parser for chat bubbles (Bold, Code blocks, newlines)
  function renderMessage(text: string) {
    // 1. Split by code blocks (```)
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
        return (
          <pre key={index} className="bg-ink/90 text-off p-3 rounded-xl mt-2 overflow-x-auto text-xs font-mono">
            <code>{code.trim()}</code>
          </pre>
        );
      } else {
        // Bold formatting
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <span key={index}>
            {boldParts.map((bp, i) => {
              if (bp.startsWith("**") && bp.endsWith("**")) {
                return <strong key={i} className="font-bold">{bp.slice(2, -2)}</strong>;
              }
              return bp;
            })}
          </span>
        );
      }
    });
  }

  return (
    <div className="px-5 pt-5 flex flex-col h-[calc(100dvh-80px)] relative bg-off">
      <Seo title="AI Tutor — NoteToExam" />
      
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 shrink-0 mb-2">
        <div>
          <h1 className="font-display text-3xl font-bold">AI Tutor</h1>
          <p className="text-ink/50 text-sm mt-1 truncate max-w-[200px]">{note ? note.title : "No notes loaded"}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEli5((v) => !v)} className={`press rounded-full px-3 py-2 text-xs font-display font-bold transition-colors ${eli5 ? "bg-terra text-ink" : "bg-white border border-ink/10"}`}>ELI5</button>
          <button type="button" onClick={toggleLiveCall} className={`press h-9 w-9 rounded-full grid place-items-center transition-colors ${isLiveCall ? "bg-red-500 text-white animate-pulse" : "bg-sage text-ink"}`}>
            {isLiveCall ? <PhoneOff size={16} /> : <Phone size={16} />}
          </button>
        </div>
      </div>

      {/* UPLOAD NOTE */}
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} />
      <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="press w-full shrink-0 rounded-2xl bg-white border border-ink/5 px-4 py-3 text-left mb-2 flex items-center justify-between shadow-sm">
        <div>
          <p className="font-display text-[10px] uppercase tracking-widest text-terra font-bold">Upload note</p>
          <p className="font-display font-bold text-sm mt-0.5">{uploading ? progress || "Working…" : "PDF or photo · max 20MB"}</p>
        </div>
        <div className="h-8 w-8 bg-ink/5 rounded-full grid place-items-center"><ChevronDown size={16} className="text-ink/40"/></div>
      </button>

      {!note ? (
        <EmptyState image="/images/empty-notes.png" title="Tutor needs a note" body="Upload a PDF or photo to start chatting." />
      ) : (
        <>
          {/* CHAT HISTORY */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-28 scrollbar-none">
            {(!thread?.messages || thread.messages.length === 0) && (
              <div className="text-center mt-10 text-ink/40">
                <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ask me anything about <b>{note.title}</b>.<br/>I remember our past chats!</p>
              </div>
            )}
            
            {thread?.messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                
                {/* Bubble */}
                <div className={`relative max-w-[85%] rounded-[20px] px-4 py-3 ${
                  m.role === "user" 
                    ? "bg-ink text-off rounded-tr-sm" 
                    : "bg-white text-ink border border-ink/5 shadow-sm rounded-tl-sm"
                }`}>
                  {m.role === "tutor" && (
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-sage-deep">
                      <Bot size={12} /> AI Tutor
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {renderMessage(m.text)}
                  </div>

                  {/* Citations */}
                  {m.role === "tutor" && m.citations?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.citations.map((c, idx) => (
                        <span key={idx} className="text-[9px] font-display uppercase tracking-widest rounded-full bg-ink/5 px-2 py-1 border border-ink/5">
                          {c.external ? "External knowledge" : `Note p.${c.page}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Copy Button for AI */}
                {m.role === "tutor" && (
                  <button onClick={() => copyToClipboard(m.id, m.text)} className="mt-1 ml-1 text-ink/30 hover:text-ink/60 transition-colors">
                    {copiedId === m.id ? <Check size={14} className="text-sage" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {busy && (
              <div className="flex items-start">
                <div className="bg-white border border-ink/5 shadow-sm rounded-[20px] rounded-tl-sm px-4 py-3 flex gap-1 items-center h-10">
                  <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div className="absolute bottom-0 left-0 right-0 bg-off pt-2 pb-4">
            <form className="flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); const q = text.trim(); if (!q) return; setText(""); void ask(q); }}>
              
              {/* VOICE NOTE BUTTON */}
              <button 
                type="button" 
                onClick={toggleRecording} 
                className={`press h-12 shrink-0 rounded-full grid place-items-center transition-all shadow-sm ${
                  isRecording ? "bg-red-500 text-white animate-pulse w-24 px-4" : "bg-ink text-off w-12"
                }`}
              >
                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <Square size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{recordSeconds}s</span>
                  </div>
                ) : (
                  <Mic size={18} />
                )}
              </button>

              {/* TEXT INPUT */}
              <div className="flex-1 bg-white rounded-3xl border border-ink/10 shadow-sm flex items-center min-h-[48px] px-4">
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  disabled={isRecording || isLiveCall}
                  placeholder={isRecording ? "Recording voice note..." : isLiveCall ? "Live call active..." : "Ask anything..."} 
                  className="w-full bg-transparent outline-none text-[15px] disabled:opacity-50" 
                />
              </div>
              
              {/* SEND BUTTON */}
              <button 
                disabled={isRecording || isLiveCall || !text.trim()} 
                className="press h-12 w-12 shrink-0 rounded-full bg-terra text-ink grid place-items-center shadow-md disabled:opacity-50 disabled:bg-ink/10 disabled:text-ink/30 transition-all"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
