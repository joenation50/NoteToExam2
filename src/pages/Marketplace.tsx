import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { formatMoney, LECTURER_PLANS, PUBLISH_COST } from "../lib/pricing";
import { startPaystack } from "../lib/paystack";
import { useStore } from "../lib/store";
import type { MarketItem } from "../lib/types";

const TAGS = ["Past Questions", "Summarized Notes", "Likely Questions", "Assignment Help", "Video Lectures"] as const;

export function Marketplace() {
  const { db, me, currency, publishItem, buyWithCredits, buyWithFiat, toast, rateItem } = useStore();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"browse" | "sell">("browse");
  const [buy, setBuy] = useState<MarketItem | null>(null);
  const [lecturerGate, setLecturerGate] = useState(false);

  useEffect(() => {
    if (params.get("publish") === "1") {
      if (me?.role === "lecturer") setTab("sell");
      else setLecturerGate(true);
    }
  }, [params, me?.role]);

  function requestPublish() {
    if (me?.role === "lecturer") setTab("sell");
    else setLecturerGate(true);
  }
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = db.purchases.filter((p) => p.t > hourAgo);

  const fomo = useMemo(() => {
    if (!recent.length) return [] as string[];
    const byCourse: Record<string, { n: number; school: string }> = {};
    for (const p of recent) {
      const course = p.course || p.itemTitle;
      if (!byCourse[course]) byCourse[course] = { n: 0, school: p.buyerSchool || "campus" };
      byCourse[course].n += 1;
    }
    return Object.entries(byCourse).map(
      ([course, v]) =>
        `${v.n} student${v.n === 1 ? "" : "s"} from ${v.school} just bought ‘${course}’ in the last hour.`,
    );
  }, [recent]);

  return (
    <div className="pt-2">
      <Seo title="Marketplace — NoteToExam" />
      <div className="px-5">
        <h1 className="font-display text-3xl font-bold">Marketplace</h1>
        <p className="text-ink/50 mt-1">Past questions, notes, lectures. Pay with credits or naira.</p>
        <div className="mt-4 flex bg-ink/5 rounded-full p-1">
          <button
            type="button"
            onClick={() => setTab("browse")}
            className={`press flex-1 py-2 rounded-full font-display text-sm font-semibold ${tab === "browse" ? "bg-ink text-off" : ""}`}
          >
            Browse
          </button>
          <button
            type="button"
            onClick={requestPublish}
            className={`press flex-1 py-2 rounded-full font-display text-sm font-semibold ${tab === "sell" ? "bg-ink text-off" : ""}`}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden bg-ink text-off py-2">
        <div className="marquee text-xs font-display tracking-wide">
          {fomo.length ? (
            [...fomo, ...fomo].map((t, i) => (
              <span key={i} className="mx-6 whitespace-nowrap">
                {t}
              </span>
            ))
          ) : (
            <span className="mx-6 text-white/50">The floor is quiet — be the first sale of the hour.</span>
          )}
        </div>
      </div>

      {tab === "browse" ? (
        <div className="px-5 mt-4">
          {db.market.length === 0 ? (
            <EmptyState
              image="/images/empty-market.png"
              title="No packs on the shelf"
              body="When lecturers publish past questions or notes, they land here. You can also list your own."
            />
          ) : (
            <ul className="space-y-3">
              {db.market
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((item) => (
                  <li key={item.id} className="bg-white rounded-[24px] p-4">
                    <p className="text-[11px] font-display uppercase tracking-widest text-terra">{item.tag}</p>
                    <h2 className="font-display text-xl font-bold mt-1">{item.title}</h2>
                    <p className="text-sm text-ink/55 mt-1">{item.sellerName} · {item.course}</p>
                    <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-ink/45">
                        {item.ratingCount
                          ? `${(item.ratingSum / item.ratingCount).toFixed(1)} · ${item.ratingCount} ratings`
                          : "No ratings yet"}
                      </p>
                      {me && item.buyers.includes(me.id) ? (
                        <div className="flex items-center gap-3">
                          <Link to={`/app/player/${item.id}`} className="press text-xs font-display font-bold text-ink">
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => rateItem(item.id, 5)}
                            className="press text-xs font-display font-bold text-sage-deep"
                          >
                            Rate 5
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setBuy(item)} className="press rounded-full bg-terra text-ink font-display font-bold text-sm px-4 py-2">
                          Buy
                        </button>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : me?.role === "lecturer" ? (
        <SellForm
          onPublish={(data) => {
            try {
              publishItem(data);
              toast("Listed. Credits charged for publishing.", "ok");
              setTab("browse");
            } catch (e) {
              toast(e instanceof Error ? e.message : "Could not publish.", "err");
            }
          }}
        />
      ) : null}

      {lecturerGate && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end justify-center" onClick={() => setLecturerGate(false)}>
          <div className="bg-off w-full max-w-md rounded-t-[32px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl font-bold">Lecturer access needed</h3>
            <p className="mt-2 text-ink/65 leading-relaxed">
              You must register as a Lecturer to upload materials. Upgrade your account here.
            </p>
            <Link
              to="/app/profile#lecturer"
              onClick={() => setLecturerGate(false)}
              className="press mt-5 block text-center rounded-full bg-ink text-off font-display font-bold py-3"
            >
              Upgrade your account here
            </Link>
            <button type="button" className="press mt-3 w-full text-sm text-ink/50" onClick={() => setLecturerGate(false)}>
              Not now
            </button>
          </div>
        </div>
      )}

      {buy && me && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end justify-center" onClick={() => setBuy(null)}>
          <div
            className="bg-off w-full max-w-md rounded-t-[32px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display text-xs uppercase tracking-widest text-ink/40">Dual checkout</p>
            <h3 className="font-display text-2xl font-bold mt-1">{buy.title}</h3>
            <p className="text-sm text-ink/55 mt-1">Pick credits from your pool, or pay fiat.</p>
            <button
              type="button"
              className="press mt-5 w-full rounded-[22px] bg-ink text-off p-4 text-left"
              onClick={() => {
                try {
                  buyWithCredits(buy.id);
                  toast("Unlocked with credits.", "ok");
                  setBuy(null);
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Could not buy.", "err");
                }
              }}
            >
              <p className="font-display text-sm text-terra">Option 1</p>
              <p className="font-display text-xl font-bold">Pay {buy.creditPrice} credits</p>
              <p className="text-white/50 text-sm">You have {me.credits} credits</p>
            </button>
            <button
              type="button"
              className="press mt-3 w-full rounded-[22px] bg-white p-4 text-left border border-ink/10"
              onClick={() => {
                startPaystack({
                  email: me.email,
                  amountNaira: buy.nairaPrice,
                  onSuccess: () => {
                    buyWithFiat(buy.id);
                    toast("Payment confirmed.", "ok");
                    setBuy(null);
                  },
                }).catch((e) => {
                  if (e instanceof Error && e.message === "closed") return;
                  if (e instanceof Error && e.message === "checkout-unconfigured") {
                    buyWithFiat(buy.id);
                    toast("Marked as paid on this device.", "ok");
                    setBuy(null);
                    return;
                  }
                  toast("Checkout did not finish.", "err");
                });
              }}
            >
              <p className="font-display text-sm text-sage-deep">Option 2</p>
              <p className="font-display text-xl font-bold">Pay {formatMoney(buy.nairaPrice, currency)} fiat</p>
              <p className="text-ink/45 text-sm">Opens checkout</p>
            </button>
            <button type="button" className="press mt-4 w-full text-sm text-ink/50" onClick={() => setBuy(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SellForm({
  onPublish,
}: {
  onPublish: (d: Omit<MarketItem, "id" | "createdAt" | "buyers" | "ratingSum" | "ratingCount" | "sellerId" | "sellerName">) => void;
}) {
  const { me } = useStore();
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<(typeof TAGS)[number]>("Past Questions");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"pdf" | "video">("pdf");
  const lec = LECTURER_PLANS.find((p) => p.id === (me?.lecturerPlan || "free"))!;

  return (
    <form
      className="px-5 mt-4 space-y-3 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        onPublish({
          title,
          tag,
          description,
          course,
          creditPrice: lec.studentPays,
          nairaPrice: 1500,
          kind,
          body,
        });
      }}
    >
      <p className="text-sm text-ink/55">
        Publishing costs {kind === "video" ? PUBLISH_COST.video : PUBLISH_COST.pdf} credits. Students pay {lec.studentPays}c · you keep {lec.lecturerGets}c.
      </p>
      <input required className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input required className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Course code" value={course} onChange={(e) => setCourse(e.target.value)} />
      <select className="w-full rounded-2xl bg-white px-4 py-3" value={tag} onChange={(e) => setTag(e.target.value as (typeof TAGS)[number])}>
        {TAGS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        {(["pdf", "video"] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => setKind(k)}
            className={`press rounded-2xl py-3 font-display font-semibold ${kind === k ? "bg-ink text-off" : "bg-white"}`}
          >
            {k === "pdf" ? "Notes / PQ" : "Video lecture"}
          </button>
        ))}
      </div>
      <textarea required className="w-full rounded-2xl bg-white px-4 py-3 min-h-24" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <textarea required className="w-full rounded-2xl bg-white px-4 py-3 min-h-32" placeholder="Pack content (kept for buyers)" value={body} onChange={(e) => setBody(e.target.value)} />
      <button className="press w-full rounded-full bg-terra text-ink font-display font-bold py-3">Publish</button>
    </form>
  );
}
