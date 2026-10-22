import { useEffect, useRef } from "react";

export function SecureText({
  text,
  color = "#0F172A",
  fontSize = 16,
  italic = false,
  align = "left",
  maxWidth,
}: {
  text: string;
  color?: string;
  fontSize?: number;
  italic?: boolean;
  align?: "left" | "right";
  maxWidth?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = maxWidth || canvas.parentElement?.clientWidth || 280;
    const font = `${italic ? "italic " : "500 "}${fontSize}px Newsreader, Georgia, serif`;
    ctx.font = font;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    const pad = 4;
    const max = cssWidth - pad * 2;
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (ctx.measureText(trial).width > max && line) {
        lines.push(line);
        line = w;
      } else line = trial;
    }
    if (line) lines.push(line);
    const lineH = Math.round(fontSize * 1.45);
    const cssHeight = Math.max(lineH + 8, lines.length * lineH + 8);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    ctx.textAlign = align === "right" ? "right" : "left";
    const x = align === "right" ? cssWidth - pad : pad;
    lines.forEach((ln, i) => ctx.fillText(ln, x, 4 + i * lineH));
  }, [text, color, fontSize, italic, align, maxWidth]);

  return (
    <canvas
      ref={ref}
      className="block w-full select-none"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
