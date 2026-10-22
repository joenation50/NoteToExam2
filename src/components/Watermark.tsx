import { useEffect, useState } from "react";
import { useStore } from "../lib/store";

export function Watermark() {
  const { me } = useStore();
  const [pos, setPos] = useState({ x: 12, y: 40 });

  useEffect(() => {
    const t = setInterval(() => {
      setPos({
        x: 8 + Math.random() * 70,
        y: 10 + Math.random() * 70,
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  if (!me) return null;
  const label = `${me.name} · ${me.matric || "student"} · ${new Date().toLocaleDateString()}`;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <div
        className="absolute text-[11px] font-display tracking-wide uppercase text-ink/25 whitespace-nowrap"
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "rotate(-18deg)" }}
      >
        {label}
      </div>
    </div>
  );
}
