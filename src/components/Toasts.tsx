import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../lib/store";

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] w-[min(92vw,400px)] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismissToast(t.id)}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className={`press w-full text-left rounded-2xl px-4 py-3 shadow-lg font-display text-sm ${
              t.tone === "err"
                ? "bg-[#3b1d18] text-[#ffd2c6]"
                : t.tone === "ok"
                  ? "bg-[#1c3229] text-[#d7f3e6]"
                  : "bg-ink text-off"
            }`}
          >
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
