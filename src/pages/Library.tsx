import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Library() {
  const { me, db } = useStore();
  const notes = db.notes.filter((n) => n.ownerId === me?.id).sort((a, b) => b.createdAt - a.createdAt);
  const sets = db.sets.filter((s) => s.ownerId === me?.id);
  const owned = db.market.filter((m) => me && m.buyers.includes(me.id));
  const curriculum = sets.filter((s) => s.kind === "curriculum");

  return (
    <div className="px-5 pt-5">
      <Seo title="Library — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Library</h1>
      <p className="text-ink/50 mt-1">Notes, summaries, and exam packs on this device.</p>
      {notes.length === 0 ? (
        <EmptyState
          image="/images/empty-notes.png"
          title="Nothing saved yet"
          body="Uploads live here, including summaries you can open offline."
        />
      ) : (
        <ul className="mt-5 space-y-3">
          {notes.map((n) => {
            const set = sets.find((s) => s.noteId === n.id);
            return (
              <li key={n.id} className="bg-white rounded-[24px] p-4">
                <p className="font-display font-bold">{n.title}</p>
                <p className="text-xs text-ink/45 mt-1">
                  {n.pages} page{n.pages === 1 ? "" : "s"} · {n.sourceKind.toUpperCase()}
                </p>
                <p className="mt-3 text-sm text-ink/70 line-clamp-3 whitespace-pre-wrap">{n.summary}</p>
                <div className="mt-3 flex gap-2">
                  {set && (
                    <>
                      <Link to={`/app/library/${set.id}`} className="press rounded-full bg-ink text-off text-xs font-display font-bold px-3 py-2">
                        Open pack
                      </Link>
                      <Link to={`/app/cbt/${set.id}`} className="press rounded-full bg-terra text-ink text-xs font-display font-bold px-3 py-2">
                        CBT
                      </Link>
                      <Link to={`/app/tutor?note=${n.id}`} className="press rounded-full bg-sage/40 text-ink text-xs font-display font-bold px-3 py-2">
                        Tutor
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {curriculum.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display font-bold text-lg">CBT sittings</h2>
          <ul className="mt-3 space-y-2">
            {curriculum.map((s) => (
              <li key={s.id}>
                <Link to={`/app/cbt/${s.id}`} className="press flex justify-between bg-white rounded-2xl px-4 py-3">
                  <span className="font-display font-bold">{s.title}</span>
                  <span className="text-xs text-ink/45">{s.questions.length} items</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {owned.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display font-bold text-lg">Purchased</h2>
          <ul className="mt-3 space-y-2">
            {owned.map((m) => (
              <li key={m.id}>
                <Link to={`/app/player/${m.id}`} className="press flex justify-between bg-white rounded-2xl px-4 py-3">
                  <span className="font-display font-bold">{m.title}</span>
                  <span className="text-xs text-ink/45">{m.tag}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
