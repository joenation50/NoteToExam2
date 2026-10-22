import { Menu } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BrandFooter } from "./BrandFooter";
import { Drawer } from "./Drawer";
import { useStore } from "../lib/store";
import { useEffect, useState } from "react";

const TABS = [
  { to: "/app", label: "Home", end: true, icon: HomeIcon },
  { to: "/app/tutor", label: "AI Tutor", icon: TutorIcon },
  { to: "/app/market", label: "Marketplace", icon: MarketIcon },
  { to: "/app/library", label: "Library", icon: LibIcon },
  { to: "/app/profile", label: "Profile", icon: ProfIcon },
];

export function AppShell() {
  const { me, bumpStudy, db } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

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
    <div className="min-h-dvh bg-off text-ink max-w-md mx-auto relative">
      <header className="sticky top-0 z-40 glass border-b border-ink/5">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            type="button"
            aria-label="Open menu"
            className="press h-10 w-10 rounded-2xl bg-ink/5 grid place-items-center"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <p className="font-display text-[11px] tracking-[0.2em] uppercase text-ink/45">NoteToExam</p>
            <p className="font-display font-bold text-[15px] leading-none truncate">
              {me?.name?.split(" ")[0] || "Student"}
            </p>
          </div>
          <div className="rounded-full bg-ink text-off px-3 py-1 font-display text-xs font-semibold">
            {me?.credits ?? 0} cr
          </div>
        </div>
      </header>

      <Drawer open={open} onClose={() => setOpen(false)} />

      <main className="pb-28">
        <Outlet />
        <BrandFooter />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <div className="glass border-t border-ink/8 mx-3 mb-[max(10px,env(safe-area-inset-bottom))] rounded-[28px] shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          <ul className="grid grid-cols-5 px-1 py-2">
            {TABS.map((t) => (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `press flex flex-col items-center gap-1 py-1.5 rounded-2xl ${
                      isActive ? "text-terra" : "text-ink/40"
                    }`
                  }
                >
                  <t.icon />
                  <span className="font-display text-[10px] font-semibold tracking-wide">{t.label}</span>
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function TutorIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12a8 8 0 1 1 8 8H6l-2 2v-4.2A8 8 0 0 1 4 12Z" />
    </svg>
  );
}
function MarketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h16l-1 12H5L4 8Z" />
      <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
function LibIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" />
      <path d="M8 20a3 3 0 0 1 3-3h9" />
    </svg>
  );
}
function ProfIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19c1.4-3.2 3.8-4.8 7-4.8s5.6 1.6 7 4.8" />
    </svg>
  );
}
