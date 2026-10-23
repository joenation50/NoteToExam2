import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SecureText } from "../components/SecureText";
import { Seo } from "../components/Seo";
import { Watermark } from "../components/Watermark";
import { useStore } from "../lib/store";
import type { Conversation, DmMessage, User } from "../lib/types";
import { Image as ImageIcon, Mic, Send, ChevronLeft, Forward, Search } from "lucide-react";
import { db as firestore } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export function Messages() {
  const { me, db, openConvo, sendDm, forwardDm, toast, markConvoRead, postGroupMessage } = useStore();
  
  const [active, setActive] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [queryStr, setQueryStr] = useState("");
  const [forward, setForward] = useState<DmMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cloud Search State
  const [cloudUsers, setCloudUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch users from Firebase when the page loads
  useEffect(() => {
    if (!me) return;
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(firestore, "profiles"));
        const users: User[] = [];
        snapshot.forEach((doc) => {
          if (doc.id !== me.id) users.push({ ...doc.data(), id: doc.id } as User);
        });
        setCloudUsers(users);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, [me]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  const peer = useMemo(() => {
    if (!active || !me) return null;
    const id = active.memberIds.find((x) => x !== me.id);
    return db.users.find((u) => u.id === id) || cloudUsers.find((u) => u.id === id) || null;
  }, [active, me, db.users, cloudUsers]);

  if (!me) return null;

  return (
    <div className="px-5 pt-5 pb-24 protected-surface h-[100dvh] flex flex-col">
      <Seo title="Messages — NoteToExam" />
      
      {!active ? (
        <>
          <div>
            <h1 className="font-display text-3xl font-bold">Messages</h1>
            <p className="text-ink/50 text-sm mt-1">Search by username (e.g. @johndoe) or full name.</p>
            
            <div className="relative mt-4">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                value={queryStr}
                onChange={(e) => setQueryStr(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-full bg-white pl-11 pr-4 py-3 border border-ink/10 outline-none focus:border-terra"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            {(() => {
              const q = queryStr.trim().toLowerCase().replace('@', '');
              
              // Filter cloud users by username or name
              const filtered = cloudUsers.filter(u => {
                if (!q) return true;
                const uname = (u.username || "").toLowerCase();
                const name = (u.name || "").toLowerCase();
                return uname.includes(q) || name.includes(q);
              });

              return (
                <>
                  <p className="mb-2 text-[10px] font-display uppercase tracking-widest text-ink/40">Find Users</p>
                  <ul className="space-y-2">
                    {filtered.map((u) => (
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
                            <p className="font-display font-bold">@{u.username || u.name.split(' ')[0].toLowerCase()}</p>
                            <p className="text-xs text-ink/45 truncate">{u.name} · {u.school || "Student"}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-sm text-ink/50 mt-3 text-center">No users found. Try searching by name.</p>
                    )}
                  </ul>
                </>
              );
            })()}
          </div>
        </>
      ) : (
        // --- CHAT VIEW (Same as before) ---
        <div className="relative flex flex-col h-full -mt-5 pt-5">
          <Watermark />
          
          <div className="flex items-center gap-3 pb-3 border-b border-ink/10">
            <button type="button" className="press p-2 -ml-2 text-ink/60" onClick={() => setActive(null)}>
              <ChevronLeft size={24} />
            </button>
            <div className="h-10 w-10 rounded-full bg-terra/20 text-terra font-bold grid place-items-center">
              {(peer?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-display font-bold leading-tight">@{peer?.username || peer?.name}</p>
              <p className="text-[10px] text-ink/50">{peer?.name}</p>
            </div>
          </div>

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
              placeholder="Message..."
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
    </div>
  );
}
