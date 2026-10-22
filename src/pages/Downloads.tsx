import { useState } from "react";
import { jsPDF } from "jspdf";
import { EmptyState } from "../components/EmptyState";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Downloads() {
  const { me, db, toast } = useStore();
  const notes = db.notes.filter((n) => n.ownerId === me?.id);
  const [busy, setBusy] = useState(false);

  async function panic() {
    if (!notes.length) {
      toast("Nothing to compile.", "err");
      return;
    }
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      let y = 64;
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, w, 48, "F");
      doc.setTextColor(224, 122, 95);
      doc.setFontSize(14);
      doc.text("NoteToExam · Panic pack", 36, 30);
      doc.setTextColor(15, 23, 42);
      const stamp = `${me?.name || ""} · ${me?.matric || ""} · ${new Date().toLocaleString()}`;
      for (const n of notes) {
        if (y > h - 80) {
          doc.addPage();
          y = 48;
        }
        doc.setFontSize(16);
        doc.text(n.title, 36, y);
        y += 22;
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(`${n.summary}\n\n${n.text}`, w - 72);
        for (const line of lines) {
          if (y > h - 48) {
            doc.addPage();
            y = 48;
          }
          doc.text(String(line), 36, y);
          y += 14;
        }
        y += 18;
      }
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(160);
        doc.text(stamp, 36, h - 18);
        doc.text("Locked for offline study · Screenshot protected", w - 36, h - 18, { align: "right" });
      }
      doc.save("notetoexam-panic-pack.pdf");
      toast("Panic pack saved.", "ok");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-5">
      <Seo title="Downloads — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Downloads</h1>
      <p className="text-ink/50 mt-1">Offline copies live on this device. Panic Mode binds every note into one locked PDF.</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void panic()}
        className="press mt-5 w-full rounded-[24px] bg-ink text-off p-5 text-left"
      >
        <p className="font-display text-xs uppercase tracking-widest text-terra">Panic mode</p>
        <p className="font-display text-2xl font-bold mt-1">Compile locked PDF</p>
      </button>
      {notes.length === 0 ? (
        <EmptyState
          image="/images/empty-notes.png"
          title="Nothing cached"
          body="Upload notes on Home. They are stored on this phone for offline study."
        />
      ) : (
        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="bg-white rounded-2xl px-4 py-3">
              <p className="font-display font-bold">{n.title}</p>
              <p className="text-xs text-ink/45">Cached · {n.pages} pages</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
