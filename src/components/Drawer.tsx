import { AnimatePresence, motion } from "framer-motion";
import { Download, Gauge, LogOut, MessageCircle, Settings, Store, Trophy, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";

export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout, me } = useStore();
  const items = [
    { to: "/app", label: "Dashboard", icon: Gauge },
    { to: "/app/downloads", label: "Downloads", icon: Download },
    { to: "/app/messages", label: "Messages", icon: MessageCircle },
    { to: "/app/groups", label: "Study Groups", icon: Users },
    { to: "/app/leaderboard", label: "Leaderboards", icon: Trophy },
    { to: "/app/market?publish=1", label: "Publish to Marketplace", icon: Store },
    { to: "/app/settings", label: "Settings", icon: Settings },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-ink/40"
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
            <div className="bg-ink text-off px-5 pt-10 pb-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-[11px] tracking-[0.22em] uppercase text-terra">NoteToExam</p>
                  <p className="font-display text-2xl font-bold mt-1">{me?.name}</p>
                  <p className="text-white/50 text-sm mt-1">{me?.email}</p>
                </div>
                <button type="button" className="press h-9 w-9 grid place-items-center rounded-full bg-white/10" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={onClose}
                  className="press flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-ink/5"
                >
                  <it.icon size={18} className="text-terra" />
                  <span className="font-display font-semibold">{it.label}</span>
                </Link>
              ))}
            </nav>
            <button
              type="button"
              className="press m-4 mb-8 flex items-center gap-3 px-3 py-3 rounded-2xl text-[#9b3b2c]"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              <LogOut size={18} />
              <span className="font-display font-semibold">Log Out</span>
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
