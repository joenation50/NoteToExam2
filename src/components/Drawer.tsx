import { AnimatePresence, motion } from "framer-motion";
import { 
  Download, Gauge, LogOut, MessageCircle, Settings, Store, Trophy, 
  Users, X, BarChart2, ShieldAlert, Flame, Coins, ChevronRight, Sparkles
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";

export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout, me } = useStore();
  const location = useLocation();

  const mainItems = [
    { to: "/app", label: "Dashboard", icon: Gauge },
    { to: "/app/insights", label: "AI Insights", icon: BarChart2 },
    { to: "/app/downloads", label: "Downloads", icon: Download },
    { to: "/app/messages", label: "Messages", icon: MessageCircle },
    { to: "/app/groups", label: "Study Groups", icon: Users },
    { to: "/app/leaderboard", label: "Leaderboards", icon: Trophy },
  ];

  const businessItems = [
    { to: "/app/market?publish=1", label: "Publish to Market", icon: Store },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ];

  // Helper to check if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[86vw] max-w-[320px] bg-off shadow-2xl flex flex-col"
          >
            {/* PREMIUM HEADER */}
            <div className="bg-ink text-off px-5 pt-12 pb-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-5">
                <Gauge size={140} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-[11px] tracking-[0.22em] uppercase text-terra font-bold flex items-center gap-1">
                      <Sparkles size={12} /> NoteToExam
                    </p>
                    <p className="font-display text-2xl font-bold mt-1 truncate max-w-[180px]">
                      {me?.name || "Student"}
                    </p>
                    <p className="text-white/50 text-sm mt-1 truncate max-w-[180px]">
                      {me?.email}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="press h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 transition shrink-0" 
                    onClick={onClose}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* LIVE STATS ROW */}
                <div className="flex gap-2 mt-5">
                  <Link 
                    to="/app/settings" 
                    onClick={onClose}
                    className="flex-1 bg-white/10 rounded-xl p-2 flex items-center gap-2 hover:bg-white/20 transition"
                  >
                    <div className="h-7 w-7 rounded-full bg-terra/20 text-terra grid place-items-center">
                      <Coins size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Credits</p>
                      <p className="font-display font-bold text-sm leading-none">{me?.credits || 0}</p>
                    </div>
                  </Link>
                  <div className="flex-1 bg-white/10 rounded-xl p-2 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-orange-500/20 text-orange-400 grid place-items-center">
                      <Flame size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Streak</p>
                      <p className="font-display font-bold text-sm leading-none">{me?.streak || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MENU LINKS */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
              
              {/* Study Section */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">Study Hub</p>
                <div className="space-y-1">
                  {mainItems.map((it) => {
                    const active = isActive(it.to);
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        onClick={onClose}
                        className={`press flex items-center justify-between px-3 py-3 rounded-2xl transition ${
                          active ? "bg-terra/10 text-terra-deep" : "hover:bg-ink/5 text-ink/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <it.icon size={18} className={active ? "text-terra" : "text-ink/40"} />
                          <span className={`font-display ${active ? "font-bold" : "font-semibold"}`}>
                            {it.label}
                          </span>
                        </div>
                        {active && <div className="h-1.5 w-1.5 rounded-full bg-terra"></div>}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Account Section */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">Account</p>
                <div className="space-y-1">
                  {businessItems.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={onClose}
                      className="press flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-ink/5 text-ink/80 transition"
                    >
                      <it.icon size={18} className="text-ink/40" />
                      <span className="font-display font-semibold">{it.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin Section */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2">System</p>
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="press flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-red-50 text-red-600 transition"
                >
                  <ShieldAlert size={18} />
                  <span className="font-display font-semibold">Admin Control</span>
                </Link>
              </div>

            </nav>

            {/* FOOTER */}
            <div className="px-4 pb-6">
              <button
                type="button"
                className="press w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition mb-4"
                onClick={() => {
                  logout();
                  onClose();
                }}
              >
                <LogOut size={16} />
                <span className="font-display font-bold text-sm">Log Out</span>
              </button>
              
              <div className="text-center">
                <p className="text-[10px] text-ink/30 font-bold uppercase tracking-widest">Version 1.0.0</p>
                <p className="text-[10px] text-ink/40 mt-1">
                  Built by <a href="https://primewebdesigns.pages.dev" target="_blank" rel="noreferrer" className="font-bold text-terra hover:underline">PrimeWebDesigns</a>
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
