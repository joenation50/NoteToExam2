import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { BrandFooter } from "../components/BrandFooter";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";
import type { Role } from "../lib/types";

export function Auth() {
  const { signup, login, googleContinue, toast, me } = useStore();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [school, setSchool] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [stage, setStage] = useState<"primary" | "secondary" | "university">("university");
  const [lecturerVerify, setLecturerVerify] = useState("");
  const [idFileName, setIdFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) localStorage.setItem("nte_ref", r);
  }, []);

  if (me) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") await login(email, password);
      else {
        if (role === "lecturer" && !lecturerVerify.trim() && !idFileName) {
          throw new Error("Add an institutional ID or a verification link.");
        }
        await signup({ email, password, name, matric, role, school, learningStage: stage, lecturerVerify: role === "lecturer" ? lecturerVerify.trim() || idFileName : "", referredBy: new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("nte_ref") });
      }
      toast(mode === "in" ? "Welcome back." : "Account ready. Let’s study.", "ok");
      nav("/app");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not continue.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setGoogleBusy(true);
    try {
      await googleContinue();
      toast("Redirecting...", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Google sign-in failed.", "err");
      setGoogleBusy(false); // Reset button if it fails
    }
  }

  return (
    <div className="min-h-dvh bg-cream text-forest">
      <Seo title="Join NoteToExam" description="Create an account or sign in to turn notes into exam questions." />
      <div className="grid lg:grid-cols-2 min-h-dvh">
        <aside className="relative hidden lg:block">
          <img src="/images/auth-side.png" alt="A student studying" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-forest/35" />
          <div className="relative z-10 p-10 flex flex-col h-full justify-end text-cream">
            <p className="font-display text-[11px] tracking-[0.28em] uppercase text-sage">NoteToExam</p>
            <h1 className="font-serif text-5xl font-bold mt-3 leading-[0.95]">
              Less cramming.
              <br />
              More understanding.
            </h1>
            <p className="mt-4 text-cream/75 max-w-sm">A new login on another phone signs the old one out. Your credits stay with you.</p>
          </div>
        </aside>
        <div className="px-5 py-10 flex flex-col max-w-md mx-auto w-full">
          <Link to="/" className="font-display font-bold text-forest-mid">← Home</Link>
          <h2 className="font-serif text-4xl font-bold mt-8">{mode === "up" ? "Create account" : "Welcome back"}</h2>
          <p className="text-forest/55 mt-2">A calm start. Google first, or email when you prefer.</p>
          
          <button
            type="button"
            onClick={google}
            disabled={googleBusy}
            className="press mt-6 w-full flex items-center justify-center gap-3 rounded-full bg-forest text-cream font-display font-bold py-3"
          >
            {googleBusy ? "Working..." : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-forest/35 font-display">
            <span className="flex-1 h-px bg-forest/15" />
            or email
            <span className="flex-1 h-px bg-forest/15" />
          </div>
          <div className="flex bg-forest/8 rounded-full p-1">
            {(["up", "in"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`press flex-1 py-2 rounded-full font-display text-sm font-semibold ${mode === m ? "bg-forest text-cream" : "text-forest/60"}`}>
                {m === "up" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "up" && (
              <>
                <Field label="Full name" value={name} onChange={setName} required />
                <Field label="Matric number" value={matric} onChange={setMatric} placeholder="Optional" />
                <Field label="School" value={school} onChange={setSchool} placeholder="Campus name" />
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-forest/40 font-display">Your learning stage</span>
                  <select className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="university">University</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-forest/40 font-display">I'm here as a…</span>
                  <select className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                </label>
                {role === "lecturer" && (
                  <div className="rounded-[22px] bg-white border border-forest/10 p-4 space-y-3">
                    <p className="text-xs uppercase tracking-widest text-forest/40 font-display">Lecturer verification</p>
                    <label className="press block rounded-2xl bg-cream px-4 py-3 text-sm cursor-pointer">
                      {idFileName ? `ID attached: ${idFileName}` : "Upload institutional ID"}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; setIdFileName(f ? f.name : ""); }} />
                    </label>
                    <Field label="Or verification link" value={lecturerVerify} onChange={setLecturerVerify} placeholder="https://…" />
                  </div>
                )}
              </>
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" required />
            <Field label="Password" value={password} onChange={setPassword} type="password" required />
            <button disabled={busy} className="press w-full rounded-full bg-forest-mid text-cream font-display font-bold py-3 mt-2">
              {busy ? "Working…" : mode === "up" ? "Create account" : "Log in"}
            </button>
          </form>
          <BrandFooter />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-forest/40 font-display">{label}</span>
      <input className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid" value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} placeholder={placeholder} />
    </label>
  );
}
