import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Pack() {
  const { id } = useParams();
  const { db, me } = useStore();
  const set = db.sets.find((s) => s.id === id && s.ownerId === me?.id);
  const note = set ? db.notes.find((n) => n.id === set.noteId) : null;
  if (!set) {
    return (
      <div className="px-5 pt-10">
        <p className="font-display text-2xl font-bold">Pack not found.</p>
        <Link to="/app/library" className="text-terra">Back to library</Link>
      </div>
    );
  }
  const mcq = set.questions.filter((q) => q.format === "mcq").length;
  const theory = set.questions.filter((q) => q.format === "theory").length;

  return (
    <div className="px-5 pt-5">
      <Seo title={`${set.title} — NoteToExam`} />
      <p className="text-xs uppercase tracking-widest text-ink/40 font-display">Exam pack</p>
      <h1 className="font-display text-3xl font-bold mt-1">{set.title}</h1>
      <p className="text-ink/55 mt-2">{set.questions.length} questions · {mcq} CBT · {theory} tutor</p>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Link to={`/app/cbt/${set.id}`} className="press rounded-[24px] bg-ink text-off p-5">
          <p className="font-display text-xs uppercase tracking-widest text-terra">Simulator</p>
          <p className="font-display text-xl font-bold mt-1">Sit CBT</p>
        </Link>
        <Link to={`/app/tutor?note=${set.noteId}`} className="press rounded-[24px] bg-terra text-ink p-5">
          <p className="font-display text-xs uppercase tracking-widest">Theory</p>
          <p className="font-display text-xl font-bold mt-1">Ask tutor</p>
        </Link>
      </div>
      {note && (
        <section className="mt-6 bg-white rounded-[24px] p-5">
          <h2 className="font-display font-bold">Summary</h2>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/75">{note.summary}</p>
        </section>
      )}
      <section className="mt-4">
        <h2 className="font-display font-bold mb-2">Split</h2>
        <p className="text-sm text-ink/55 mb-3">Objective items go to the CBT. Theory items stay with the tutor.</p>
        <ul className="space-y-2">
          {set.questions.slice(0, 8).map((q) => (
            <li key={q.id} className="bg-white rounded-2xl px-4 py-3">
              <p className="text-[11px] font-display uppercase tracking-widest text-terra">
                {q.format} · {q.kind} · p.{q.page}
              </p>
              <p className="mt-1 text-sm line-clamp-2">{q.prompt}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
