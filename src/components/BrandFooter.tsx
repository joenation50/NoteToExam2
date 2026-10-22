export function BrandFooter({ dark = false }: { dark?: boolean }) {
  return (
    <footer
      className={`px-5 pt-10 pb-8 text-center ${dark ? "text-white/70" : "text-ink/60"}`}
    >
      <p className="font-display text-[11px] tracking-[0.18em] uppercase mb-3">
        NoteToExam
      </p>
      <p className={`text-[13.5px] leading-relaxed max-w-md mx-auto ${dark ? "text-white/55" : "text-ink/55"}`}>
        NoteToExam was built to solve the real struggles of African students—limited
        resources, tough syllabuses, and the pressure to pass. Built with love by PrimeWebDesigns.
      </p>
      <p className="mt-4 text-[12px]">
        © 2026 NoteToExam. All rights reserved.{" "}
        <span className="whitespace-nowrap">
          Made by{" "}
          <a
            href="https://primewebdesigns.pages.dev/"
            target="_blank"
            rel="noreferrer"
            className={`underline decoration-forest-mid/70 underline-offset-4 ${dark ? "text-sage" : "text-forest-mid"}`}
          >
            PrimeWebDesigns
          </a>
        </span>
      </p>
    </footer>
  );
}
