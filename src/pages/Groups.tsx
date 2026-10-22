import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { SecureText } from "../components/SecureText";
import { Seo } from "../components/Seo";
import { Watermark } from "../components/Watermark";
import { useStore } from "../lib/store";
import type { StudyGroup } from "../lib/types";

export function Groups() {
  const { me, db, createGroup, joinGroup, postGroupMessage, toast } = useStore();
  const mine = db.groups.filter((g) => me && g.memberIds.includes(me.id));
  const [active, setActive] = useState<StudyGroup | null>(null);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");

  return (
    <div className="px-5 pt-5 protected-surface">
      <Seo title="Study Groups — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Study groups</h1>
      {!active ? (
        <>
          <form
            className="mt-4 bg-white rounded-[24px] p-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              const g = createGroup(name, course);
              setName("");
              setCourse("");
              setActive(g);
            }}
          >
            <p className="font-display font-bold">Create a room</p>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full rounded-2xl bg-off px-3 py-2" />
            <input required value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course" className="w-full rounded-2xl bg-off px-3 py-2" />
            <button className="press rounded-full bg-ink text-off font-display font-bold px-4 py-2 text-sm">Create</button>
          </form>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const g = joinGroup(code);
                setActive(g);
                setCode("");
              } catch (err) {
                toast(err instanceof Error ? err.message : "Could not join.", "err");
              }
            }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Invite code" className="flex-1 rounded-full bg-white px-4 py-3" />
            <button className="press rounded-full bg-terra text-ink font-display font-bold px-4">Join</button>
          </form>
          {mine.length === 0 ? (
            <EmptyState
              image="/images/empty-group.png"
              title="No rooms yet"
              body="Create a private course room and share the invite code. Chat stays inside the app."
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {mine.map((g) => (
                <li key={g.id}>
                  <button type="button" onClick={() => setActive(g)} className="press w-full text-left bg-white rounded-2xl px-4 py-3">
                    <p className="font-display font-bold">{g.name}</p>
                    <p className="text-xs text-ink/45">{g.course} · {g.memberIds.length} members · code {g.inviteCode}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="relative mt-3">
          <Watermark />
          <button type="button" className="text-terra font-display text-sm" onClick={() => setActive(null)}>← Rooms</button>
          <h2 className="font-display text-2xl font-bold">{active.name}</h2>
          <p className="text-sm text-ink/50">Invite {active.inviteCode}</p>
          <div className="mt-3 space-y-2 min-h-[40vh]">
            {active.messages.map((m) => {
              const author = db.users.find((u) => u.id === m.fromId);
              return (
                <div key={m.id} className="bg-white rounded-2xl px-2 py-2">
                  <p className="text-[11px] font-display px-2 text-terra">{author?.name}</p>
                  <SecureText text={m.text || (m.kind === "image" ? "Image" : "Voice")} />
                </div>
              );
            })}
          </div>
          <form
            className="flex gap-2 mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              postGroupMessage(active.id, { toId: null, kind: "text", text: text.trim(), media: null, forwardedFrom: null });
              setText("");
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-full bg-white px-4 py-3" placeholder="Message the room" />
            <button className="press rounded-full bg-terra text-ink font-display font-bold px-4">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
