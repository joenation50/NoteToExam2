import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SecureText } from "../components/SecureText";
import { Seo } from "../components/Seo";
import { Watermark } from "../components/Watermark";
import { useStore } from "../lib/store";
import type { Conversation, DmMessage } from "../lib/types";

export function Messages() {
  const { me, db, openConvo, sendDm, forwardDm, toast, markConvoRead, postGroupMessage } = useStore();
  const others = db.users.filter((u) => u.id !== me?.id && !u.banned);
  const mine = db.convos.filter((c) => me && c.memberIds.includes(me.id)).sort((a, b) => b.updatedAt - a.updatedAt);
  const [active, setActive] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [forward, setForward] = useState<DmMessage | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

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
    <div className="px-5 pt-5 protected-surface">
      <Seo title="Messages — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Messages</h1>
      <p className="text-ink/50 text-sm mt-1">Forward stays inside the app. Copying is off.</p>

      {!active ? (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a name or school"
            className="mt-4 w-full rounded-full bg-white px-4 py-3 border border-ink/10"
          />
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
                  <ul className="mt-4 space-y-2">
                    {inbox.map((c) => {
                      const otherId = c.memberIds.find((id) => id !== me.id);
                      const other = db.users.find((u) => u.id === otherId);
                      const last = c.messages[c.messages.length - 1];
                      const unread = c.messages.filter((m) => m.fromId !== me.id && m.createdAt > (c.lastRead?.[me.id] || 0)).length;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="press w-full text-left bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                            onClick={() => {
                              const opened = openConvo(otherId || "");
                              markConvoRead(opened.id);
                              setActive(opened);
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold">{other?.name || "Chat"}</p>
                              <p className="text-xs text-ink/45 truncate">
                                {last.kind === "text" ? last.text : last.kind === "image" ? "Image" : "Voice note"}
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
                <p className="mt-5 text-xs font-display uppercase tracking-widest text-ink/40">Start a chat</p>
                <ul className="mt-2 space-y-2">
                  {filtered.map((u) => {
                    const existing = mine.find((c) => c.memberIds.includes(u.id));
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="press w-full text-left bg-white rounded-2xl px-4 py-3"
                          onClick={() => {
                            const opened = openConvo(u.id);
                            markConvoRead(opened.id);
                            setActive(opened);
                          }}
                        >
                          <p className="font-display font-bold">{u.name}</p>
                          <p className="text-xs text-ink/45">
                            {u.school || "Campus"} · {existing ? `${existing.messages.length} messages` : "New"}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {filtered.length === 0 && (
                  <p className="text-sm text-ink/50 mt-3">No students match that search.</p>
                )}
              </>
            );
          })()}
        </>
      ) : (
        <div className="relative mt-3">
          <Watermark />
          <button type="button" className="text-terra font-display text-sm" onClick={() => setActive(null)}>
            ← All chats
          </button>
          <p className="font-display font-bold text-lg">{peer?.name}</p>
          <div className="mt-3 space-y-2 min-h-[40vh]">
            {active.messages.map((m) => {
              const mineMsg = m.fromId === me.id;
              return (
                <div key={m.id} className={`relative rounded-2xl px-2 py-2 ${mineMsg ? "ml-10 bg-ink" : "mr-10 bg-white"}`}>
                  {m.kind === "text" ? (
                    <SecureText text={m.text} color={mineMsg ? "#F8F9FA" : "#0F172A"} align={mineMsg ? "right" : "left"} />
                  ) : m.kind === "image" && m.media ? (
                    <img src={m.media} alt="" className="rounded-xl max-h-48" />
                  ) : m.kind === "voice" && m.media ? (
                    <audio controls src={m.media} className="w-full" />
                  ) : null}
                  <button
                    type="button"
                    className="text-[10px] font-display uppercase tracking-widest text-terra px-2 pb-1"
                    onClick={() => setForward(m)}
                  >
                    Forward
                  </button>
                </div>
              );
            })}
          </div>
          <form
            className="flex gap-2 mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t) return;
              sendDm(active.id, { toId: peer?.id || null, kind: "text", text: t, media: null, forwardedFrom: null });
              setText("");
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-full bg-white px-4 py-3"
              placeholder="Message"
            />
            <label className="press rounded-full bg-sage/40 px-3 grid place-items-center font-display text-xs font-bold">
              Img
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
                    sendDm(active.id, {
                      toId: peer?.id || null,
                      kind: "image",
                      text: "",
                      media: String(r.result),
                      forwardedFrom: null,
                    });
                  };
                  r.readAsDataURL(f);
                }}
              />
            </label>
            <button
              type="button"
              className="press rounded-full bg-ink text-off px-3 font-display text-xs font-bold"
              onClick={async () => {
                if (recRef.current) {
                  recRef.current.stop();
                  recRef.current = null;
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
                      sendDm(active.id, {
                        toId: peer?.id || null,
                        kind: "voice",
                        text: "",
                        media: String(r.result),
                        forwardedFrom: null,
                      });
                    };
                    r.readAsDataURL(blob);
                    stream.getTracks().forEach((t) => t.stop());
                  };
                  recRef.current = rec;
                  rec.start();
                  toast("Recording… tap again to send.", "info");
                } catch {
                  toast("Microphone blocked.", "err");
                }
              }}
            >
              Voice
            </button>
            <button className="press rounded-full bg-terra text-ink font-display font-bold px-4">Send</button>
          </form>
        </div>
      )}

      {forward && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end" onClick={() => setForward(null)}>
          <div className="bg-off w-full rounded-t-[28px] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-display font-bold">Forward inside NoteToExam</p>
            <p className="text-sm text-ink/50 mt-1">Pick a friend or a study group. Copying stays off.</p>
            <ul className="mt-3 space-y-2 max-h-60 overflow-auto">
              {others.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="press w-full text-left bg-white rounded-2xl px-4 py-3"
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
                    className="press w-full text-left bg-white rounded-2xl px-4 py-3"
                    onClick={() => {
                      postGroupMessage(g.id, {
                        toId: null,
                        kind: forward.kind,
                        text: forward.text,
                        media: forward.media,
                        forwardedFrom: forward.fromId,
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
          </div>
        </div>
      )}
    </div>
  );
}
