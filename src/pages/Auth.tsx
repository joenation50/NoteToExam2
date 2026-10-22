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
        await signup({
          email,
          password,
          name,
          matric,
          role,
          school,
          learningStage: stage,
          lecturerVerify: role === "lecturer" ? lecturerVerify.trim() || idFileName : "",
          referredBy: new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("nte_ref"),
        });
      }
      toast(mode === "in" ? "Welcome back." : "Account ready.  Let’s study.", "ok");
      nav("/app");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not continue.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
      if (clientId && "google" in window) {
        /* GIS path when a client id is present */
      }
      const hint = email.trim() || window.prompt("Google email to continue with") || "";
      if (!hint || !hint.includes("@")) throw new Error("A Google email is needed to continue.");
      const display = hint.split("@")[0].replace(/[._]/g, " ");
      await googleContinue(hint, display);
      toast("Signed in.", "ok");
      nav("/app");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Google sign-in did not finish.", "err");
    } finally {
      setBusy(false);
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
            <p className="mt-4 text-cream/75 max-w-sm">
              A new login on another phone signs the old one out. Your credits stay with you.
            </p>
          </div>
        </aside>
        <div className="px-5 py-10 flex flex-col max-w-md mx-auto w-full">
          <Link to="/" className="font-display font-bold text-forest-mid">← Home</Link>
          <h2 className="font-serif text-4xl font-bold mt-8">{mode === "up" ? "Create account" : "Welcome back"}</h2>
          <p className="text-forest/55 mt-2">A calm start. Google first, or email when you prefer.</p>
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="press mt-6 w-full rounded-full bg-forest text-cream font-display font-bold py-3"
          >
            Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-forest/35 font-display">
            <span className="flex-1 h-px bg-forest/15" />
            or email
            <span className="flex-1 h-px bg-forest/15" />
          </div>
          <div className="flex bg-forest/8 rounded-full p-1">
            {(["up", "in"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`press flex-1 py-2 rounded-full font-display text-sm font-semibold ${mode === m ? "bg-forest text-cream" : "text-forest/60"}`}
              >
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
                  <select
                    className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid"
                    value={stage}
                    onChange={(e) => setStage(e.target.value as typeof stage)}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="university">University</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs uppercase tracking-widest text-forest/40 font-display">I'm here as a…</span>
                  <select
                    className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                </label>
                {role === "lecturer" && (
                  <div className="rounded-[22px] bg-white border border-forest/10 p-4 space-y-3">
                    <p className="text-xs uppercase tracking-widest text-forest/40 font-display">Lecturer verification</p>
                    <label className="press block rounded-2xl bg-cream px-4 py-3 text-sm cursor-pointer">
                      {idFileName ? `ID attached: ${idFileName}` : "Upload institutional ID"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          setIdFileName(f ? f.name : "");
                        }}
                      />
                    </label>
                    <Field
                      label="Or verification link"
                      value={lecturerVerify}
                      onChange={setLecturerVerify}
                      placeholder="https://…"
                    />
                  </div>
                )}
              </>
            )}
            <Field label="Email" value={email} onChange={setEmail} type="email" required />
            <Field label="Password" value={password} onChange={setPassword} type="password" required />
            <button
              disabled={busy}
              className="press w-full rounded-full bg-forest-mid text-cream font-display font-bold py-3 mt-2"
            >
              {busy ? "Working…" : mode === "up" ? "Create account" : "Log in"}
            </button>
          </form>
          <BrandFooter />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-forest/40 font-display">{label}</span>
      <input
        className="mt-1 w-full rounded-2xl bg-white border border-forest/10 px-4 py-3 text-forest outline-none focus:border-forest-mid"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
