import { Seo } from "../components/Seo";
import { EmptyState } from "../components/EmptyState";
import { useStore } from "../lib/store";

export function Leaderboard() {
  const { db } = useStore();
  const top = [...db.users]
    .filter((u) => !u.banned)
    .sort((a, b) => b.knowledgePoints - a.knowledgePoints)
    .slice(0, 10);

  return (
    <div className="px-5 pt-5">
      <Seo title="Leaderboard — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
      <p className="text-ink/50 mt-1">Top 10 by knowledge points — also shown on the Campus Wall.</p>
      {top.length === 0 ? (
        <EmptyState
          image="/images/empty-exam.png"
          title="No scores yet"
          body="Sit a CBT. Points land here when answers are in."
        />
      ) : (
        <ol className="mt-5 space-y-2">
          {top.map((u, i) => (
            <li key={u.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="font-display font-bold text-terra w-6">{i + 1}</span>
              <div className="flex-1">
                <p className="font-display font-bold">{u.name}</p>
                <p className="text-xs text-ink/45">{u.school || "Campus"}</p>
              </div>
              <span className="font-display font-bold">{u.knowledgePoints}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
