import { useState } from "react";
import { Search, Trophy, Medal, Crown, User as UserIcon } from "lucide-react";
import { Seo } from "../components/Seo";
import { EmptyState } from "../components/EmptyState";
import { useStore } from "../lib/store";

export function Leaderboard() {
  const { db } = useStore();
  const [search, setSearch] = useState("");

  // SAFETY FIX: Added (db.users || []) so it doesn't crash
  const allUsers = (db.users || []).filter((u) => !u.banned);

  // Filter for Search (matches name or username)
  const filteredUsers = allUsers.filter((u) => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Top 3 for the Podium
  const topThree = [...filteredUsers]
    .sort((a, b) => (b.knowledgePoints || 0) - (a.knowledgePoints || 0))
    .slice(0, 3);

  // Remaining users (4 to 50)
  const rest = [...filteredUsers]
    .sort((a, b) => (b.knowledgePoints || 0) - (a.knowledgePoints || 0))
    .slice(3, 50);

  return (
    <div className="px-5 pt-5 pb-24">
      <Seo title="Leaderboard — NoteToExam" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
          <p className="text-ink/50 mt-1 text-sm">Compete with students across Nigeria.</p>
        </div>
        <div className="h-12 w-12 bg-terra/20 rounded-full grid place-items-center text-terra">
          <Trophy size={24} />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-5 relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input 
          type="text"
          placeholder="Search by name or @username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full bg-white border border-ink/10 py-3 pl-11 pr-4 text-sm outline-none focus:border-terra transition-colors"
        />
      </div>

      {allUsers.length === 0 ? (
        <EmptyState
          image="/images/empty-exam.png"
          title="No scores yet"
          body="Sit a CBT. Points land here when answers are in."
        />
      ) : filteredUsers.length === 0 ? (
        <p className="text-center text-ink/50 mt-10">No students found matching "{search}"</p>
      ) : (
        <div className="mt-6">
          {/* Podium for Top 3 */}
          {!search && topThree.length > 0 && (
            <div className="flex items-end justify-center gap-2 mb-8 h-48">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 bg-gray-200 rounded-full grid place-items-center mb-2 border-4 border-white shadow-sm z-10">
                    <Medal size={24} className="text-gray-500" />
                  </div>
                  <div className="w-full bg-gray-100 rounded-t-2xl pt-4 pb-3 px-2 text-center h-24 flex flex-col justify-end">
                    <p className="font-display font-bold text-sm truncate">{topThree[1].name}</p>
                    <p className="text-[10px] text-ink/50 truncate">@{topThree[1].username}</p>
                    <p className="font-bold text-gray-500 mt-1">{topThree[1].knowledgePoints || 0} pts</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center flex-1">
                  <Crown size={28} className="text-yellow-500 mb-1 animate-bounce" />
                  <div className="w-16 h-16 bg-yellow-100 rounded-full grid place-items-center mb-2 border-4 border-yellow-400 shadow-md z-10 relative">
                    <Trophy size={28} className="text-yellow-600" />
                  </div>
                  <div className="w-full bg-yellow-50 border border-yellow-200 rounded-t-2xl pt-4 pb-3 px-2 text-center h-32 flex flex-col justify-end shadow-inner">
                    <p className="font-display font-bold text-sm truncate">{topThree[0].name}</p>
                    <p className="text-[10px] text-ink/50 truncate">@{topThree[0].username}</p>
                    <p className="font-bold text-yellow-700 mt-1">{topThree[0].knowledgePoints || 0} pts</p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-14 h-14 bg-amber-100 rounded-full grid place-items-center mb-2 border-4 border-white shadow-sm z-10">
                    <Medal size={24} className="text-amber-700" />
                  </div>
                  <div className="w-full bg-amber-50 rounded-t-2xl pt-4 pb-3 px-2 text-center h-20 flex flex-col justify-end">
                    <p className="font-display font-bold text-sm truncate">{topThree[2].name}</p>
                    <p className="text-[10px] text-ink/50 truncate">@{topThree[2].username}</p>
                    <p className="font-bold text-amber-700 mt-1">{topThree[2].knowledgePoints || 0} pts</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List for Everyone Else (or search results) */}
          <ol className="space-y-2">
            {(search ? filteredUsers : rest).map((u, i) => {
              const rank = search ? i + 1 : i + 4;
              return (
                <li key={u.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-ink/5 shadow-sm">
                  <span className="font-display font-bold text-ink/30 w-6 text-center">{rank}</span>
                  
                  {/* Avatar Placeholder */}
                  <div className="h-10 w-10 rounded-full bg-ink/5 grid place-items-center overflow-hidden shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon size={18} className="text-ink/30" />
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <p className="font-display font-bold truncate">{u.name}</p>
                    <p className="text-xs text-ink/45 truncate">@{u.username || "user"} · {u.school || "Campus"}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="font-display font-bold text-terra">{u.knowledgePoints || 0}</span>
                    <p className="text-[9px] uppercase tracking-widest text-ink/40 font-bold">Points</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
