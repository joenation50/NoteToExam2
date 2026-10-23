import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SecureText } from "../components/SecureText";
import { Seo } from "../components/Seo";
import { Watermark } from "../components/Watermark";
import { useStore } from "../lib/store";
import type { Conversation, DmMessage } from "../lib/types";
import { Image as ImageIcon, Mic, Send, ChevronLeft, Forward } from "lucide-react";

export function Messages() {
  const { me, db, openConvo, sendDm, forwardDm, toast, markConvoRead, postGroupMessage } = useStore();
  const others = db.users.filter((u) => u.id !== me?.id && !u.banned);
  const mine = db.convos.filter((c) => me && c.memberIds.includes(me.id)).sort((a, b) => b.updatedAt - a.updatedAt);
  const [active, setActive] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [forward, setForward] = useState<DmMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
    };
  }, []);

  const peer = useMemo(() => {
    if (!active || !me) return null;
    const id = active.memberIds.find((x) => x !== me.id);
    return db.users.find((u) => u.id === id) || null;
  }, [active, me, db.users]);

  if (!me) return null;

  return (
    <div className="px-5 pt-5 pb-24 protected-surface h-[100dvh] flex flex-col">
      <Seo title="Messages — NoteToExam" />
      
      {!active ? (
        <>
          <div>
            <h1 className="font-display text-3xl font-bold">Messages</h1>
            <p className="text-ink/50 text-sm mt-1">Forward stays inside the app. Copying is off.</p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a name or school"
              className="mt-4 w-full rounded-full bg-white px-4 py-3 border border-ink/10 outline-none focus:border-terra"
            />
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = others.filter(
                (u) =>
                  !q ||
                  u.name.toLowerCase().includes(q) ||
                  u.school.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q),
              );
              const inbox = mine.filter((c) => c.messages.length > 0);
              if (others.length === 0) {
                return (
                  <EmptyState
                    image="/images/empty-chat.png"
                    title="No one to message yet"
                    body="When other students join this device’s campus, they appear here."
                  />
                );
              }
              return (
                <>
                  {inbox.length > 0 && !q && (
                    <ul className="space-y-2">
                      {inbox.map((c) => {
                        const otherId = c.memberIds.find((id) => id !== me.id);
                        const other = db.users.find((u) => u.id === otherId);
                        const last = c.messages[c.messages.length - 1];
                        const unread = c.messages.filter((m) => m.fromId !== me.id && m.createdAt > (c.lastRead?.[me.id] || 0)).length;
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="press w-full text-left bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-ink/5 shadow-sm"
                              onClick={() => {
                                const opened = openConvo(otherId || "");
                                markConvoRead(opened.id);
                                setActive(opened);
                              }}
                            >
                              <div className="h-10 w-10 rounded-full bg-terra/20 text-terra font-bold grid place-items-center shrink-0">
                                {(other?.name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-display font-bold">{other?.name || "Chat"}</p>
                                <p className="text-xs text-ink/45 truncate">
                                  {last.kind === "text" ? last.text : last.kind === "image" ? "📷 Image" : "🎤 Voice note"}
                                </p>
                              </div>
                              {unread > 0 && (
                                <span className="min-w-6 h-6 px-1.5 rounded-full bg-terra text-ink text-xs font-display font-bold grid place-items-center">
                                  {unread}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  
                  <p className="mt-6 mb-2 text-[10px] font-display uppercase tracking-widest text-ink/40">Start a chat</p>
                  <ul className="space-y-2">
                    {filtered.map((u) => {
                      const existing = mine.find((c) => c.memberIds.includes(u.id));
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="press w-full text-left bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-ink/5 shadow-sm"
                            onClick={() => {
                              const opened = openConvo(u.id);
                              markConvoRead(opened.id);
                              setActive(opened);
                            }}
                          >
                            <div className="h-10 w-10 rounded-full bg-sage/20 text-sage-deep font-bold grid place-items-center shrink-0">
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold">{u.name}</p>
                              <p className="text-xs text-ink/45">
                                {u.school || "Campus"} · {existing ? `${existing.messages.length} messages` : "New"}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {filtered.length === 0 && (
                    <p className="text-sm text-ink/50 mt-3 text-center">No students match that search.</p>
                  )}
                </>
              );
            })()}
          </div>
        </>
      ) : (
        // --- CHAT VIEW ---
        <div className="relative flex flex-col h-full -mt-5 pt-5">
          <Watermark />
          
          {/* CHAT HEADER */}
          <div className="flex items-center gap-3 pb-3 border-b border-ink/10">
            <button type="button" className="press p-2 -ml-2 text-ink/60" onClick={() => setActive(null)}>
              <ChevronLeft size={24} />
            </button>
            <div className="h-10 w-10 rounded-full bg-terra/20 text-terra font-bold grid place-items-center">
              {(peer?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold leading-tight">{peer?.name}</p>
              <p className="text-[10px] font-bold text-green-500">Online</p>
            </div>
          </div>

          {/* MESSAGES LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {active.messages.map((m) => {
              const mineMsg = m.fromId === me.id;
              return (
                <div key={m.id} className={`flex ${mineMsg ? "justify-end" : "justify-start"}`}>
                  <div className={`relative max-w-[80%] rounded-[20px] p-3 ${mineMsg ? "bg-ink rounded-tr-sm" : "bg-white border border-ink/5 rounded-tl-sm shadow-sm"}`}>
                    
                    {m.kind === "text" ? (
                      <SecureText text={m.text} color={mineMsg ? "#F8F9FA" : "#0F172A"} align={mineMsg ? "right" : "left"} />
                    ) : m.kind === "image" && m.media ? (
                      <img src={m.media} alt="" className="rounded-xl max-h-48 mb-1" />
                    ) : m.kind === "voice" && m.media ? (
                      <audio controls src={m.media} className="w-48 h-10 mb-1" />
                    ) : m.kind === "image" && !m.media ? (
                      <p className={`text-sm italic ${mineMsg ? "text-white/50" : "text-ink/40"}`}>📷 Image expired</p>
                    ) : m.kind === "voice" && !m.media ? (
                      <p className={`text-sm italic ${mineMsg ? "text-white/50" : "text-ink/40"}`}>🎤 Voice note expired</p>
                    ) : null}

                    <button
                      type="button"
                      className={`text-[10px] font-display uppercase tracking-widest flex items-center gap-1 mt-1 ${mineMsg ? "text-terra/80" : "text-terra"}`}
                      onClick={() => setForward(m)}
                    >
                      <Forward size={10} /> Forward
                    </button>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <form
            className="flex items-center gap-2 mt-2 bg-white p-2 rounded-full border border-ink/10 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t) return;
              sendDm(active.id, { toId: peer?.id || null, kind: "text", text: t, media: null, forwardedFrom: null });
              setText("");
            }}
          >
            <label className="press h-10 w-10 rounded-full bg-off grid place-items-center text-ink/50 cursor-pointer hover:text-ink">
              <ImageIcon size={20} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    sendDm(active.id, { toId: peer?.id || null, kind: "image", text: "", media: String(r.result), forwardedFrom: null });
                  };
                  r.readAsDataURL(f);
                }}
              />
            </label>
            
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 bg-transparent px-2 py-2 outline-none text-sm"
              placeholder="Type a message..."
            />
            
            {text.trim() ? (
              <button className="press h-10 w-10 rounded-full bg-terra text-ink grid place-items-center">
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                className={`press h-10 w-10 rounded-full grid place-items-center transition ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-ink text-off"}`}
                onClick={async () => {
                  if (recRef.current) {
                    recRef.current.stop();
                    recRef.current = null;
                    setIsRecording(false);
                    return;
                  }
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const rec = new MediaRecorder(stream);
                    chunks.current = [];
                    rec.ondataavailable = (ev) => chunks.current.push(ev.data);
                    rec.onstop = () => {
                      const blob = new Blob(chunks.current, { type: "audio/webm" });
                      const r = new FileReader();
                      r.onload = () => {
                        sendDm(active.id, { toId: peer?.id || null, kind: "voice", text: "", media: String(r.result), forwardedFrom: null });
                      };
                      r.readAsDataURL(blob);
                      stream.getTracks().forEach((t) => t.stop());
                    };
                    recRef.current = rec;
                    rec.start();
                    setIsRecording(true);
                    toast("Recording... tap again to send.", "info");
                  } catch {
                    toast("Microphone blocked.", "err");
                  }
                }}
              >
                <Mic size={18} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* FORWARD MODAL */}
      {forward && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end justify-center" onClick={() => setForward(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-lg mb-4">Forward Message</h3>
            <ul className="space-y-2 max-h-60 overflow-auto">
              {others.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="press w-full text-left bg-off rounded-xl px-4 py-3 font-bold text-sm"
                    onClick={() => {
                      forwardDm(active?.id || "", forward, u.id);
                      toast("Forwarded.", "ok");
                      setForward(null);
                    }}
                  >
                    {u.name}
                  </button>
                </li>
              ))}
              {db.groups.filter((g) => me && g.memberIds.includes(me.id)).map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className="press w-full text-left bg-sage/10 text-sage-deep rounded-xl px-4 py-3 font-bold text-sm"
                    onClick={() => {
                      postGroupMessage(g.id, {
                        toId: null, kind: forward.kind, text: forward.text, media: forward.media, forwardedFrom: forward.fromId,
                      });
                      toast("Forwarded to group.", "ok");
                      setForward(null);
                    }}
                  >
                    Group · {g.name}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setForward(null)} className="mt-4 w-full bg-gray-100 text-ink/60 font-bold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
