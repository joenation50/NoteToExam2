import { Camera, Pencil, MessageSquare, Users, BookOpen, Settings as SettingsIcon, Award, X, Sparkles, CheckCircle2, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { formatMoney, LECTURER_PLANS, MIN_WITHDRAWAL_NGN, periodLabel, STUDENT_PLANS } from "../lib/pricing";
import { useStore } from "../lib/store";
import { useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export function Profile() {
  const { me, currency, requestPayout, toast, updateMe } = useStore();
  const [amount, setAmount] = useState(String(MIN_WITHDRAWAL_NGN));
  const [editing, setEditing] = useState(false);
  const [showPlans, setShowPlans] = useState(false); // Controls the upgrade modal
  const [payingPlan, setPayingPlan] = useState<{ name: string; price: string } | null>(null);
  const picRef = useRef<HTMLInputElement>(null);

  if (!me) return <div className="px-5 pt-20 text-center font-display">Loading profile...</div>;

  const user = me;
  const invite = `${window.location.origin}/auth?ref=${user?.referralCode || "none"}`;
  const stageLabel = me?.learningStage === "primary" ? "Primary" : me?.learningStage === "secondary" ? "Secondary" : "University";

  function handleSelectPlan(planName: string, naira: number) {
    if (naira === 0) return toast("Free plan is already active.", "ok");
    setPayingPlan({ name: planName, price: formatMoney(naira, "NGN") });
  }

  // Animation variants
  const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="px-5 pt-5 pb-32"
    >
      <Seo title="Profile — NoteToExam" />
      
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        
        {/* HEADER CARD */}
        <motion.div variants={item} className="bg-white rounded-[32px] p-6 shadow-sm border border-ink/5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-terra/5 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-5 relative z-10">
            <button
              type="button"
              className="press relative h-24 w-24 rounded-full overflow-hidden bg-ink/5 shrink-0 ring-4 ring-off-white shadow-md group"
              onClick={() => picRef.current?.click()}
            >
              {me?.avatar ? (
                <img src={me.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-4xl font-bold text-terra grid place-items-center h-full bg-terra/10">
                  {(me?.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-0 inset-x-0 h-8 bg-ink/80 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} className="text-off" />
              </span>
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold leading-tight truncate">{me?.name || "Student"}</h1>
                {me?.role === "lecturer" && <span className="bg-sage text-ink text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Lecturer</span>}
              </div>
              <p className="text-ink/50 text-sm truncate">@{me?.username || "user"}</p>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="press mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink/5 text-ink font-display text-xs font-bold px-3 py-1.5 hover:bg-ink/10 transition-colors"
              >
                <Pencil size={12} /> Edit Profile
              </button>
            </div>
          </div>
          
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

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm pt-6 border-t border-ink/5 relative z-10">
            <Info label="School" value={me?.school || "—"} />
            <Info label="Level" value={me?.classLevel || stageLabel} />
            <Info label="Department" value={me?.department || me?.courseFocus || "—"} />
            <Info label="Matric No." value={me?.matric || "—"} />
          </dl>
        </motion.div>

        {/* STATS ROW */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-ink to-slate-800 rounded-[24px] p-4 text-off shadow-lg relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 opacity-20"><Sparkles size={40} /></div>
            <p className="text-[10px] uppercase tracking-widest text-terra font-bold">Credits</p>
            <p className="font-display font-bold text-2xl mt-1">{me?.credits || 0}</p>
          </div>
          <div className="bg-white rounded-[24px] p-4 border border-ink/5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Points</p>
            <p className="font-display font-bold text-2xl mt-1">{me?.knowledgePoints || 0}</p>
          </div>
          <div className="bg-white rounded-[24px] p-4 border border-ink/5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">Streak</p>
            <p className="font-display font-bold text-2xl mt-1 text-terra">{me?.streak || 0}🔥</p>
          </div>
        </motion.div>

        {/* UPGRADE BANNER */}
        <motion.div variants={item}>
          <button 
            onClick={() => setShowPlans(true)}
            className="press w-full bg-gradient-to-r from-terra to-orange-400 rounded-[24px] p-4 flex items-center justify-between text-ink shadow-lg shadow-terra/20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-full grid place-items-center backdrop-blur-sm">
                <Zap size={20} className="text-ink" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-lg leading-tight">Upgrade Plan</p>
                <p className="text-[11px] font-medium opacity-80">Unlock more credits & features</p>
              </div>
            </div>
            <ChevronRight size={20} className="opacity-50" />
          </button>
        </motion.div>

        {/* QUICK LINKS */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <Link to="/app/messages" className="press flex items-center gap-3 bg-white p-4 rounded-2xl border border-ink/5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-terra/10 grid place-items-center text-terra"><MessageSquare size={18} /></div>
            <span className="font-display font-bold text-sm">Messages</span>
          </Link>
          <Link to="/app/wall" className="press flex items-center gap-3 bg-white p-4 rounded-2xl border border-ink/5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-sage/20 grid place-items-center text-sage-deep"><Users size={18} /></div>
            <span className="font-display font-bold text-sm">Campus Wall</span>
          </Link>
          <Link to="/app/library" className="press flex items-center gap-3 bg-white p-4 rounded-2xl border border-ink/5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-blue-100 grid place-items-center text-blue-600"><BookOpen size={18} /></div>
            <span className="font-display font-bold text-sm">Library</span>
          </Link>
          <Link to="/app/settings" className="press flex items-center gap-3 bg-white p-4 rounded-2xl border border-ink/5 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-gray-100 grid place-items-center text-gray-600"><SettingsIcon size={18} /></div>
            <span className="font-display font-bold text-sm">Settings</span>
          </Link>
        </motion.div>

        {/* WITHDRAWALS */}
        {me?.role === "lecturer" && (
          <motion.section variants={item} className="bg-white rounded-[24px] p-5 border border-ink/5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-sage-deep" />
              <h2 className="font-display font-bold text-lg">Withdrawals</h2>
            </div>
            <p className="text-sm text-ink/55 mb-4">Balance: <span className="font-bold text-ink">{formatMoney(me?.lecturerNaira || 0, "NGN")}</span></p>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl bg-off px-4 py-3 font-display font-bold border border-ink/10 outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
              <button type="button" className="press rounded-xl bg-ink text-off font-display font-bold px-6" onClick={() => {
                  try { requestPayout(Number(amount)); toast("Payout queued.", "ok"); } 
                  catch (e) { toast(e instanceof Error ? e.message : "Error", "err"); }
                }}>Request</button>
            </div>
          </motion.section>
        )}

        {/* REFERRALS */}
        <motion.section variants={item} className="bg-ink text-off rounded-[24px] p-6 shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10"><Award size={120} /></div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-terra font-bold relative z-10">Referrals</p>
          <p className="font-display text-2xl font-bold mt-1 relative z-10">Earn 500 credits</p>
          <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center justify-between gap-3 relative z-10">
            <p className="text-sm text-white/80 font-mono truncate">{invite}</p>
            <button type="button" className="press shrink-0 rounded-lg bg-terra text-ink font-display text-xs font-bold px-4 py-2" onClick={() => { void navigator.clipboard.writeText(invite); toast("Copied!", "ok"); }}>Copy</button>
          </div>
        </motion.section>

      </motion.div>

      {/* ──────────────────────────────────────────────────── */}
      {/* UPGRADE PLANS MODAL */}
      {/* ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPlans && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end justify-center" 
            onClick={() => setShowPlans(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-off w-full max-w-md rounded-t-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-off z-10 pb-2">
                <h2 className="font-display text-2xl font-bold">Upgrade Plan</h2>
                <button onClick={() => setShowPlans(false)} className="p-2 bg-ink/5 rounded-full"><X size={20} /></button>
              </div>

              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-ink/40 mb-3">Student Plans</h3>
              <div className="space-y-3 mb-6">
                {(STUDENT_PLANS || []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p.name, p.naira)}
                    className={`press w-full text-left rounded-[24px] p-4 border shadow-sm transition-all flex justify-between items-center ${
                      me?.studentPlan === p.id ? "bg-ink text-off border-ink" : "bg-white border-ink/5 hover:border-terra/50"
                    }`}
                  >
                    <div>
                      <p className="font-display font-bold text-lg flex items-center gap-2">
                        {p.name} {me?.studentPlan === p.id && <CheckCircle2 size={16} className="text-sage" />}
                      </p>
                      <p className={`text-xs mt-1 ${me?.studentPlan === p.id ? "text-white/60" : "text-ink/55"}`}>{p.blurb}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-display font-bold text-lg">{formatMoney(p.naira, currency)}</p>
                      <p className={`text-[10px] uppercase tracking-widest ${me?.studentPlan === p.id ? "text-terra" : "text-ink/40"}`}>{periodLabel(p.period)}</p>
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-ink/40 mb-3">Lecturer Plans</h3>
              <div className="space-y-3 pb-8">
                {(LECTURER_PLANS || []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p.name, p.naira)}
                    className={`press w-full text-left rounded-[24px] p-4 border shadow-sm transition-all flex justify-between items-center ${
                      me?.lecturerPlan === p.id && me?.role === "lecturer" ? "bg-sage/20 text-ink border-sage" : "bg-white border-ink/5 hover:border-sage/50"
                    }`}
                  >
                    <div>
                      <p className="font-display font-bold text-lg flex items-center gap-2">
                        {p.name} {me?.lecturerPlan === p.id && <CheckCircle2 size={16} className="text-sage-deep" />}
                      </p>
                      <p className="text-xs text-ink/55 mt-1">{p.uploads} uploads allowed</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-display font-bold text-lg">{formatMoney(p.naira, currency)}</p>
                      <p className="text-[10px] uppercase tracking-widest text-ink/40">{periodLabel(p.period)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────── */}
      {/* EDIT PROFILE MODAL */}
      {/* ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end justify-center" 
            onClick={() => setEditing(false)}
          >
            <motion.form 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-6 space-y-3 shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateMe({ name: String(fd.get("name") || me?.name), age: String(fd.get("age") || ""), school: String(fd.get("school") || ""), classLevel: String(fd.get("classLevel") || ""), department: String(fd.get("department") || ""), matric: String(fd.get("matric") || me?.matric) });
                toast("Profile saved.", "ok");
                setEditing(false);
              }}
            >
              <h2 className="font-display text-2xl font-bold text-center mb-6">Edit Profile</h2>
              <input name="name" defaultValue={me?.name} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="Full Name" />
              <div className="grid grid-cols-2 gap-3">
                <input name="age" defaultValue={me?.age} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="Age" />
                <input name="classLevel" defaultValue={me?.classLevel} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="Level" />
              </div>
              <input name="school" defaultValue={me?.school} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="School" />
              <input name="department" defaultValue={me?.department} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="Department" />
              <input name="matric" defaultValue={me?.matric} className="w-full rounded-xl bg-off border border-ink/10 px-4 py-3 outline-none focus:border-terra" placeholder="Matric" />
              <button className="press w-full rounded-xl bg-ink text-off font-display font-bold py-4 mt-4">Save Changes</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────────────────────────────────────────── */}
      {/* MANUAL PAYMENT MODAL */}
      {/* ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {payingPlan && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm flex items-end justify-center" 
            onClick={() => setPayingPlan(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-6 shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-display text-2xl font-bold">Bank Transfer</h2>
                <button onClick={() => setPayingPlan(null)} className="p-2 bg-ink/5 rounded-full"><X size={20} /></button>
              </div>
              <p className="text-sm text-ink/50 mb-4">To upgrade to <b>{payingPlan.name}</b>, transfer exactly <b>{payingPlan.price}</b> to the account below. Send your receipt to WhatsApp to get credited instantly.</p>
              
              <div className="bg-off p-4 rounded-xl border border-ink/5 mb-6">
                <p className="text-xs text-ink/40 font-bold uppercase mb-1">Bank Name</p>
                <p className="font-display font-bold text-lg mb-3">Opay / Moniepoint</p>
                <p className="text-xs text-ink/40 font-bold uppercase mb-1">Account Number</p>
                <p className="font-display font-bold text-lg mb-3 tracking-wider">0123456789</p>
                <p className="text-xs text-ink/40 font-bold uppercase mb-1">Account Name</p>
                <p className="font-display font-bold text-lg">NoteToExam Ltd</p>
              </div>

              <a 
                href={`https://wa.me/2348012345678?text=Hello,%20I%20want%20to%20upgrade%20to%20${payingPlan.name}%20on%20NoteToExam.%20Here%20is%20my%20receipt.`} 
                target="_blank" 
                rel="noreferrer"
                className="press w-full bg-[#25D366] text-white font-display font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                Send Receipt on WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">{label}</dt>
      <dd className="font-display font-semibold mt-0.5 text-ink truncate">{value}</dd>
    </div>
  );
}
