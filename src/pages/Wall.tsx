import { useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Wall() {
  const { db, addWallPost, addWallComment, me } = useStore();
  const [text, setText] = useState("");
  const [course, setCourse] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const top = [...db.users].sort((a, b) => b.knowledgePoints - a.knowledgePoints).slice(0, 3);

  return (
    <div className="px-5 pt-5">
      <Seo title="Campus Wall — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Campus Wall</h1>
      <p className="text-ink/50 mt-1">Ask the floor. Anyone can answer.</p>
      {top.length > 0 && (
        <p className="mt-3 text-xs font-display uppercase tracking-widest text-terra">
          Top points: {top.map((u) => u.name).join(" · ")}
        </p>
      )}
      <form
        className="mt-4 bg-white rounded-[24px] p-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addWallPost({ text: text.trim(), course: course.trim() || "General", imageData: image });
          setText("");
          setCourse("");
          setImage(null);
        }}
      >
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What’s the question?"
          className="w-full min-h-20 outline-none"
        />
        <div className="flex gap-2">
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course tag" className="flex-1 rounded-full bg-off px-3 py-2 text-sm" />
          <label className="press rounded-full bg-ink/5 px-3 py-2 text-xs font-display font-bold">
            Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                const r = new FileReader();
                r.onload = () => setImage(String(r.result));
                r.readAsDataURL(f);
              }}
            />
          </label>
          <button className="press rounded-full bg-terra text-ink font-display font-bold px-4 text-sm">Post</button>
        </div>
        {image && <img src={image} alt="" className="rounded-2xl max-h-40" />}
      </form>

      {db.wall.length === 0 ? (
        <EmptyState
          image="/images/empty-chat.png"
          title="The wall is quiet"
          body="Post a question with a course tag. Classmates can answer underneath."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {db.wall.map((p) => (
            <li key={p.id} className="bg-white rounded-[24px] p-4">
              <p className="text-[11px] font-display uppercase tracking-widest text-terra">{p.course}</p>
              <p className="font-display font-bold">{p.authorName}</p>
              <p className="mt-2 leading-relaxed">{p.text}</p>
              {p.imageData && <img src={p.imageData} alt="" className="mt-3 rounded-2xl" />}
              <ul className="mt-3 space-y-2">
                {p.comments.map((c) => (
                  <li key={c.id} className="bg-off rounded-2xl px-3 py-2 text-sm">
                    <span className="font-display font-semibold">{c.authorName}: </span>
                    {c.text}
                  </li>
                ))}
              </ul>
              {me && (
                <CommentBox onSend={(t) => addWallComment(p.id, t)} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentBox({ onSend }: { onSend: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex gap-2 mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.trim()) return;
        onSend(v.trim());
        setV("");
      }}
    >
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Answer" className="flex-1 rounded-full bg-off px-3 py-2 text-sm" />
      <button className="press text-xs font-display font-bold text-terra">Reply</button>
    </form>
  );
}
