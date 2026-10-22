import { useState } from "react";

export function PwaBanner() {
  const [hidden, setHidden] = useState(() => localStorage.getItem("nte_pwa_dismissed") === "1");

  if (hidden) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-ink text-off p-4 rounded-2xl flex justify-between items-center z-40 shadow-xl border border-white/10">
      <div>
        <p className="font-display font-bold text-sm">Install NoteToExam</p>
        <p className="text-xs text-white/60">Get offline access and faster loading.</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => { 
            localStorage.setItem("nte_pwa_dismissed", "1"); 
            setHidden(true); 
          }} 
          className="text-xs font-bold text-white/50 px-2"
        >
          No thanks
        </button>
        <button className="bg-terra text-ink text-xs font-bold px-4 py-2 rounded-xl">
          Install
        </button>
      </div>
    </div>
  );
}