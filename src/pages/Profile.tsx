import { Camera, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { formatMoney, LECTURER_PLANS, MIN_WITHDRAWAL_NGN, periodLabel, STUDENT_PLANS } from "../lib/pricing";
import { startPaystack } from "../lib/paystack";
import { useStore } from "../lib/store";
import { useRef, useState } from "react";

export function Profile() {
  const { me, currency, subscribePlan, subscribeLecturer, requestPayout, toast, updateMe } = useStore();
  const [amount, setAmount] = useState(String(MIN_WITHDRAWAL_NGN));
  const [editing, setEditing] = useState(false);
  const picRef = useRef<HTMLInputElement>(null);
  if (!me) return null;
  const user = me;
  const invite = `${window.location.origin}/auth?ref=${user.referralCode}`;
  const stageLabel =
    me.learningStage === "primary" ? "Primary" : me.learningStage === "secondary" ? "Secondary" : "University";

  function payPlan(naira: number, apply: () => void) {
    if (naira === 0) {
      apply();
      toast("Plan updated.", "ok");
      return;
    }
    startPaystack({
      email: user.email,
      amountNaira: naira,
      onSuccess: () => {
        apply();
        toast("Plan unlocked.", "ok");
      },
    }).catch((e) => {
      if (e instanceof Error && e.message === "closed") return;
      apply();
      toast("Plan applied on this device.", "ok");
    });
  }

  return (
    <div className="px-5 pt-5">
      <Seo title="Profile — NoteToExam" />
      <div className="bg-white rounded-[28px] p-5">
        <div className="flex items-start gap-4">
          <button
            type="button"
            className="press relative h-20 w-20 rounded-full overflow-hidden bg-ink/5 shrink-0 ring-2 ring-ink/10"
            onClick={() => picRef.current?.click()}
            aria-label="Upload profile picture"
          >
            {me.avatar ? (
              <img src={me.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-terra grid place-items-center h-full">
                {(me.name || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 inset-x-0 h-7 bg-ink/70 grid place-items-center">
              <Camera size={12} className="text-off" />
            </span>
          </button>
          <input
            ref={picRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                updateMe({ avatar: String(r.result) });
                toast("Photo updated.", "ok");
              };
              r.readAsDataURL(f);
            }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight">{me.name}</h1>
            <p className="text-ink/50 text-sm truncate">{me.email}</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="press mt-2 inline-flex items-center gap-1 rounded-full bg-ink text-off font-display text-xs font-bold px-3 py-1.5"
            >
              <Pencil size={12} /> Edit profile
            </button>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <Info label="Age" value={me.age || "—"} />
          <Info label="School / University" value={me.school || "—"} />
          <Info label="Class / Level" value={me.classLevel || stageLabel} />
          <Info label="Department" value={me.department || me.courseFocus || "—"} />
        </dl>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Chip label="Credits" value={String(me.credits)} />
        <Chip label="Points" value={String(me.knowledgePoints)} />
        <Chip label="Streak" value={String(me.streak)} />
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end justify-center" onClick={() => setEditing(false)}>
          <form
            className="bg-off w-full max-w-md rounded-t-[32px] p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateMe({
                name: String(fd.get("name") || me.name),
                age: String(fd.get("age") || ""),
                school: String(fd.get("school") || ""),
                classLevel: String(fd.get("classLevel") || ""),
                department: String(fd.get("department") || ""),
                matric: String(fd.get("matric") || me.matric),
              });
              toast("Profile saved.", "ok");
              setEditing(false);
            }}
          >
            <h2 className="font-display text-xl font-bold">Edit profile</h2>
            <input name="name" defaultValue={me.name} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Name" />
            <input name="age" defaultValue={me.age} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Age" />
            <input name="school" defaultValue={me.school} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="School / University" />
            <input name="classLevel" defaultValue={me.classLevel} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Class / Level (e.g. SS2, 200 Level)" />
            <input name="department" defaultValue={me.department} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Department" />
            <input name="matric" defaultValue={me.matric} className="w-full rounded-2xl bg-white px-4 py-3" placeholder="Matric" />
            <button className="press w-full rounded-full bg-ink text-off font-display font-bold py-3">Save</button>
            <button type="button" className="press w-full text-sm text-ink/50" onClick={() => setEditing(false)}>Cancel</button>
          </form>
        </div>
      )}

      <section className="mt-6">
        <h2 className="font-display font-bold text-lg">Student plans</h2>
        <div className="mt-3 space-y-2">
          {STUDENT_PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => payPlan(p.naira, () => subscribePlan(p.id))}
              className={`press w-full text-left rounded-[22px] p-4 ${me.studentPlan === p.id ? "bg-ink text-off" : "bg-white"}`}
            >
              <div className="flex justify-between">
                <p className="font-display font-bold">{p.name}</p>
                <p className="font-display font-bold">
                  {formatMoney(p.naira, currency)}
                  <span className="text-xs opacity-60">{periodLabel(p.period)}</span>
                </p>
              </div>
              <p className={`text-sm mt-1 ${me.studentPlan === p.id ? "text-white/60" : "text-ink/55"}`}>{p.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="lecturer" className="mt-8 scroll-mt-20">
        <h2 className="font-display font-bold text-lg">Lecturer plans</h2>
        <div className="mt-3 space-y-2">
          {LECTURER_PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => payPlan(p.naira, () => subscribeLecturer(p.id))}
              className={`press w-full text-left rounded-[22px] p-4 ${me.lecturerPlan === p.id && me.role === "lecturer" ? "bg-sage/30" : "bg-white"}`}
            >
              <div className="flex justify-between">
                <p className="font-display font-bold">{p.name}</p>
                <p className="font-display font-bold">
                  {formatMoney(p.naira, currency)}
                  <span className="text-xs opacity-60">{periodLabel(p.period)}</span>
                </p>
              </div>
              <p className="text-sm text-ink/55 mt-1">{p.uploads} uploads · student {p.studentPays}c · you {p.lecturerGets}c</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 bg-white rounded-[24px] p-4">
        <h2 className="font-display font-bold">Withdrawals</h2>
        <p className="text-sm text-ink/55 mt-1">
          Balance {formatMoney(me.lecturerNaira, "NGN")} · minimum {formatMoney(MIN_WITHDRAWAL_NGN, "NGN")}
        </p>
        <div className="flex gap-2 mt-3">
          <input
            className="flex-1 rounded-2xl bg-off px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={MIN_WITHDRAWAL_NGN}
          />
          <button
            type="button"
            className="press rounded-full bg-ink text-off font-display font-bold px-4"
            onClick={() => {
              try {
                requestPayout(Number(amount));
                toast("Payout queued.", "ok");
              } catch (e) {
                toast(e instanceof Error ? e.message : "Could not request.", "err");
              }
            }}
          >
            Request
          </button>
        </div>
      </section>

      <section className="mt-6 bg-ink text-off rounded-[24px] p-4">
        <p className="font-display text-xs uppercase tracking-widest text-terra">Referrals</p>
        <p className="font-display text-xl font-bold mt-1">500 credits on signup</p>
        <p className="text-sm text-white/60 mt-1 break-all">{invite}</p>
        <button
          type="button"
          className="press mt-3 rounded-full bg-terra text-ink font-display font-bold px-4 py-2 text-sm"
          onClick={() => {
            void navigator.clipboard.writeText(invite);
            toast("Invite copied.", "ok");
          }}
        >
          Copy invite
        </button>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Link to="/app/messages" className="press rounded-2xl bg-white p-4 font-display font-bold">Messages</Link>
        <Link to="/app/wall" className="press rounded-2xl bg-white p-4 font-display font-bold">Campus Wall</Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-ink/40 font-display">{label}</dt>
      <dd className="font-display font-semibold mt-0.5">{value}</dd>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-widest text-ink/40 font-display">{label}</p>
      <p className="font-display font-bold text-lg">{value}</p>
    </div>
  );
}
