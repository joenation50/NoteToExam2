import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Player() {
  const { id } = useParams();
  const { me, db } = useStore();
  const item = db.market.find((m) => m.id === id);
  const owned = !!(me && item && item.buyers.includes(me.id));
  const video = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);

  if (!item || !owned) {
    return (
      <div className="px-5 pt-10">
        <p className="font-display text-2xl font-bold">This lecture is locked.</p>
        <Link to="/app/market" className="text-terra">Marketplace</Link>
      </div>
    );
  }

  const src = item.body.startsWith("data:") || item.body.startsWith("http") ? item.body : "";

  return (
    <div className="px-5 pt-5">
      <Seo title={`${item.title} — NoteToExam`} />
      <p className="text-[11px] font-display uppercase tracking-widest text-terra">{item.tag}</p>
      <h1 className="font-display text-3xl font-bold">{item.title}</h1>
      <p className="text-ink/50 text-sm mt-1">{item.sellerName}</p>
      {src ? (
        <div className="mt-4 rounded-[24px] overflow-hidden bg-ink">
          <video
            ref={video}
            src={src}
            className="w-full"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            controls={false}
            playsInline
          />
          <div className="flex items-center gap-2 px-4 py-3 text-off">
            <button
              type="button"
              className="press font-display font-bold"
              onClick={() => {
                const v = video.current;
                if (!v) return;
                if (v.paused) void v.play();
                else v.pause();
              }}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="press ml-auto text-sm"
              onClick={() => {
                const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
                setRate(next);
                if (video.current) video.current.playbackRate = next;
              }}
            >
              {rate}×
            </button>
          </div>
        </div>
      ) : (
        <article className="mt-4 bg-white rounded-[24px] p-5 whitespace-pre-wrap leading-relaxed">{item.body}</article>
      )}
    </div>
  );
}
