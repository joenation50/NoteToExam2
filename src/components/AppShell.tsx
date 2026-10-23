import { Menu, BarChart2, Search, Bell } from "lucide-react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { BrandFooter } from "./BrandFooter";
import { Drawer } from "./Drawer";
import { useStore } from "../lib/store";
import { useEffect, useMemo, useState } from "react";

const TABS = [
  { to: "/app", label: "Home", end: true, icon: HomeIcon },
  { to: "/app/tutor", label: "AI Tutor", icon: TutorIcon },
  { to: "/app/market", label: "Market", icon: MarketIcon },
  { to: "/app/library", label: "Library", icon: LibIcon },
  { to: "/app/profile", label: "Profile", icon: ProfIcon },
];

export function AppShell() {
  const { me, bumpStudy, db } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // Check if there are unread messages (just a simple check for this demo)
  const hasUnread = useMemo(() => {
    if (!me) return false;
    return (db.convos || []).some(c => 
      c.memberIds?.includes(me.id) && 
      c.messages?.length > 0 && 
      (c.lastRead?.[me.id] || 0) < c.messages[c.messages.length - 1].createdAt
    );
  }, [me, db.convos]);

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!me) return;
    const t = setInterval(() => bumpStudy(15), 15000);
    return () => clearInterval(t);
  }, [me, bumpStudy]);

  if (db.flags.maintenance && !loc.pathname.startsWith("/app/settings")) {
    return (
      <div className="min-h-dvh bg-ink text-off flex flex-col items-center justify-center px-8 text-center">
        <p className="font-display text-3xl font-bold">We’ll be right back.</p>
        <p className="mt-3 text-white/60 max-w-sm">
          NoteToExam is taking a short pause for care and polish. Your notes are safe.
        </p>
        <BrandFooter dark />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-off text-ink max-w-md mx-auto relative overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-ink/5">
        <div className="flex items-center gap-3 px-4 h-16">
          <button
            type="button"
            aria-label="Open menu"
            className="press h-10 w-10 rounded-2xl bg-ink/5 grid place-items-center hover:bg-ink/10 transition"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} className="text-ink" />
          </button>
          
          <div className="flex-1">
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-ink/40 font-bold mb-0.5">NoteToExam</p>
            <p className="font-display font-bold text-base leading-none truncate text-ink">
              {me?.name?.split(" ")[0] || "Student"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* SEARCH SHORTCUT */}
            <Link to="/app/market" className="press h-10 w-10 rounded-full bg-ink/5 text-ink grid place-items-center hover:bg-ink/10 transition">
              <Search size={18} />
            </Link>
            
            {/* INSIGHTS SHORTCUT */}
            <Link to="/app/insights" className="press h-10 w-10 rounded-full bg-sage/20 text-sage-deep grid place-items-center hover:bg-sage/30 transition">
              <BarChart2 size={18} />
            </Link>

            {/* CREDITS BADGE */}
            <div className="rounded-full bg-ink text-off px-3 py-1.5 font-display text-xs font-bold shadow-sm ml-1">
              {me?.credits ?? 0} cr
            </div>
          </div>
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} />

      {/* MAIN CONTENT */}
      <main className="pb-28 min-h-[calc(100dvh-64px)]">
        <Outlet />
        <BrandFooter />
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <div className="bg-white/80 backdrop-blur-xl border-t border-ink/5 mx-3 mb-[max(12px,env(safe-area-inset-bottom))] rounded-[28px] shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <ul className="grid grid-cols-5 px-2 py-2">
            {TABS.map((t) => (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `press flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all ${
                      isActive ? "text-terra scale-105" : "text-ink/40 hover:text-ink/60"
                    }`
                  }
                >
                  <div className="relative">
                    <t.icon />
                    {t.label === "Home" && hasUnread && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    )}
                  </div>
                  <span className={`font-display text-[10px] ${t.label === "Home" && hasUnread ? "font-bold" : "font-semibold"}`}>
                    {t.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function TutorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 1 8 8H6l-2 2v-4.2A8 8 0 0 1 4 12Z" />
    </svg>
  );
}
function MarketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16l-1 12H5L4 8Z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
function LibIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" />
      <path d="M8 20a3 3 0 0 1 3-3h9" />
    </svg>
  );
}
function ProfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
    </svg>
  );
}
