import { ArrowRight, BookOpen, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandFooter } from "../components/BrandFooter";
import { Notebook3D } from "../components/Notebook3D";
import { Seo } from "../components/Seo";
import { chatsLabel, formatMoney, LECTURER_PLANS, periodLabel, STUDENT_PLANS } from "../lib/pricing";
import { useStore } from "../lib/store";

export function Landing() {
  const { currency, me } = useStore();
  const start = me ? "/app" : "/auth";

  return (
    <div className="bg-cream text-forest relative overflow-hidden">
      <Seo
        title="NoteToExam — Less cramming. More understanding."
        description="Drop in a PDF or photo of your notes. Get a sharp summary and 60 exam questions in seconds. Then talk to an AI tutor like a phone call — Pidgin mode included."
      />
      <div className="organic-blob bg-forest/8 w-[420px] h-[420px] -top-32 -left-24" />
      <div className="organic-blob bg-sage/25 w-[340px] h-[340px] top-[28%] -right-20" />
      <div className="organic-blob bg-forest/6 w-[280px] h-[280px] bottom-40 left-[18%]" />

      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,760px)]">
        <nav className="glass rounded-full px-4 h-14 flex items-center justify-between border border-forest/10 text-forest">
          <Link to="/" className="font-display font-bold tracking-tight flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-lg" />
            NoteToExam
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-sm text-forest/70">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <Link to={start} className="press rounded-full bg-forest text-cream font-display text-sm font-bold px-4 py-2">
            Get Started
          </Link>
        </nav>
      </header>

      <section className="pt-28 pb-10">
        <div className="max-w-5xl mx-auto px-5 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-forest/15 bg-white/50 px-3 py-1 font-display text-[11px] tracking-[0.22em] uppercase text-forest-mid">
              Big dreams. Smarter studying.
            </p>
            <h1 className="font-serif font-bold leading-[0.95] text-[clamp(2.7rem,8vw,4.8rem)] mt-6 text-forest">
              Less cramming.
              <br />
              More understanding.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-forest/70 max-w-md leading-relaxed">
              Drop in a PDF or photo of your notes. Get a sharp summary and 60 exam questions in seconds. Then talk to an AI tutor like a phone call — Pidgin mode included.
            </p>
            <p className="mt-3 font-display text-sm tracking-[0.16em] uppercase text-forest-mid">
              Notes in. A’s out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={start} className="press inline-flex items-center gap-2 rounded-full bg-forest text-cream font-display font-bold px-6 py-3">
                Get Started <ArrowRight size={16} />
              </Link>
              <a href="#how" className="press inline-flex items-center gap-2 rounded-full border border-forest/20 px-6 py-3 font-display font-semibold text-forest/80">
                See the flow
              </a>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-forest/45">
              <span>Screenshot protected</span>
              <span>AI Tutor</span>
              <span>Offline panic pack</span>
            </div>
          </div>
          <div className="relative h-[340px] md:h-[440px]">
            <div className="absolute inset-10 rounded-full bg-sage/30 blur-3xl" />
            <Notebook3D />
          </div>
        </div>
      </section>

      <section className="relative px-5">
        <div className="max-w-5xl mx-auto overflow-hidden rounded-[32px]">
          <img src="/images/handwritten-notes.png" alt="Lecture notes" className="w-full h-48 object-cover" />
        </div>
      </section>

      <section id="how" className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-serif text-4xl md:text-5xl font-bold">How it works</h2>
        <p className="mt-3 text-lg text-forest/60 max-w-xl">Three quiet beats from messy notes to a scored sitting.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Drop the notes", d: "PDF or a photo of a handwritten page. We count pages and charge one credit per page." },
            { n: "02", t: "Sixty questions", d: "Twenty direct, twenty rephrased, twenty connection. Objective items land in the CBT. Theory goes to the tutor." },
            { n: "03", t: "Talk it through", d: "Ask like a voice call. Answers cite the page. Toggle Explain Like I’m 5 with Pidgin." },
          ].map((s) => (
            <article key={s.n} className="rounded-[28px] bg-white/70 border border-forest/8 p-6">
              <p className="font-display text-forest-mid font-bold tracking-widest">{s.n}</p>
              <h3 className="font-serif text-2xl font-bold mt-3">{s.t}</h3>
              <p className="mt-2 text-forest/60 leading-relaxed">{s.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-4xl md:text-5xl font-bold">Built like a campus tool, not a toy.</h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              { icon: BookOpen, t: "CBT simulator", d: "Timer, four options, shuffled attempts, score plus the page that proves it." },
              { icon: Mic, t: "Live voice call", d: "Talk to the tutor with your microphone. It answers out loud." },
              { icon: ShieldCheck, t: "Screenshot protected", d: "Chat draws on canvas. Right-click is off. A moving watermark follows you." },
              { icon: Sparkles, t: "Marketplace dual-pay", d: "Buy a pack with credits or fiat. Lecturers withdraw through Paystack." },
            ].map((f) => (
              <div key={f.t} className="rounded-[28px] bg-white/70 border border-forest/10 p-6">
                <f.icon className="text-forest-mid" />
                <h3 className="font-serif text-xl font-bold mt-4">{f.t}</h3>
                <p className="mt-2 text-forest/60">{f.d}</p>
              </div>
            ))}
          </div>
          <img src="/images/students-study.png" alt="Students studying" className="mt-10 w-full h-56 object-cover rounded-[32px]" />
        </div>
      </section>

      <section id="pricing" className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="font-serif text-4xl md:text-5xl font-bold">Big possibilities. Small price.</h2>
        <p className="mt-3 text-forest/60">
          Shown in {currency === "NGN" ? "naira" : "US dollars"} based on where you are.
        </p>
        <h3 className="font-display text-xl font-bold mt-10 mb-4">Student plans</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STUDENT_PLANS.map((p) => (
            <article key={p.id} className={`rounded-[28px] p-5 border ${p.id === "duo" ? "bg-forest text-cream border-forest" : "bg-white/80 border-forest/8"}`}>
              <p className={`font-display text-sm uppercase tracking-widest ${p.id === "duo" ? "text-sage" : "text-forest-mid"}`}>{p.name}</p>
              <p className="font-display text-3xl font-bold mt-2">
                {formatMoney(p.naira, currency)}
                <span className="text-base font-medium opacity-60">{periodLabel(p.period)}</span>
              </p>
              <p className={`mt-2 text-sm ${p.id === "duo" ? "text-cream/70" : "text-forest/60"}`}>{p.blurb}</p>
              <ul className={`mt-4 space-y-1 text-sm ${p.id === "duo" ? "text-cream/85" : "text-forest/80"}`}>
                <li>{p.credits.toLocaleString()} credits</li>
                <li>{p.devices} device{p.devices > 1 ? "s" : ""}</li>
                <li>{chatsLabel(p.chats)}</li>
                {p.extra && <li>{p.extra}</li>}
              </ul>
            </article>
          ))}
        </div>
        <h3 className="font-display text-xl font-bold mt-12 mb-4">Lecturer plans</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {LECTURER_PLANS.map((p) => (
            <article key={p.id} className="rounded-[28px] bg-white/80 border border-forest/8 p-5">
              <p className="font-display text-sm uppercase tracking-widest text-forest-mid">{p.name}</p>
              <p className="font-display text-3xl font-bold mt-2">
                {formatMoney(p.naira, currency)}
                <span className="text-base font-medium opacity-60">{periodLabel(p.period)}</span>
              </p>
              <p className="mt-2 text-sm text-forest/60">{p.blurb}</p>
              <ul className="mt-4 space-y-1 text-sm">
                <li>{p.uploads.toLocaleString()} uploads</li>
                <li>Student pays {p.studentPays}c</li>
                <li>You keep {p.lecturerGets}c</li>
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-forest/50">
          Publishing to the marketplace costs 5 credits for a PDF pack or 20 credits for video, so the shelf stays clean.
          Withdrawals run through Paystack with a minimum balance.
        </p>
        <div className="mt-8">
          <Link to={start} className="press inline-flex rounded-full bg-forest text-cream font-display font-bold px-6 py-3">
            Get Started
          </Link>
        </div>
      </section>

      <section className="px-5 pb-4">
        <div className="max-w-5xl mx-auto overflow-hidden rounded-[32px]">
          <img src="/images/lecture-hall.png" alt="Lecture hall" className="w-full h-52 object-cover" />
        </div>
      </section>
      <BrandFooter />
    </div>
  );
}
