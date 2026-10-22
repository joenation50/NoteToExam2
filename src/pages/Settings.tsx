import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Settings() {
  const { me, updateMe, logout, toast } = useStore();
  if (!me) return null;
  return (
    <div className="px-5 pt-5">
      <Seo title="Settings — NoteToExam" />
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateMe({
            name: String(fd.get("name") || me.name),
            matric: String(fd.get("matric") || me.matric),
            school: String(fd.get("school") || me.school),
            courseFocus: String(fd.get("course") || me.courseFocus),
            learningStage: (String(fd.get("stage") || me.learningStage || "university") as typeof me.learningStage),
          });
          toast("Saved.", "ok");
        }}
      >
        <label className="block">
          <span className="text-xs font-display uppercase tracking-widest text-ink/40">Name</span>
          <input name="name" defaultValue={me.name} className="mt-1 w-full rounded-2xl bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="text-xs font-display uppercase tracking-widest text-ink/40">Matric</span>
          <input name="matric" defaultValue={me.matric} className="mt-1 w-full rounded-2xl bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="text-xs font-display uppercase tracking-widest text-ink/40">School</span>
          <input name="school" defaultValue={me.school} className="mt-1 w-full rounded-2xl bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="text-xs font-display uppercase tracking-widest text-ink/40">Focus course</span>
          <input name="course" defaultValue={me.courseFocus} className="mt-1 w-full rounded-2xl bg-white px-4 py-3" />
        </label>
        <label className="block">
          <span className="text-xs font-display uppercase tracking-widest text-ink/40">Learning stage</span>
          <select name="stage" defaultValue={me.learningStage || "university"} className="mt-1 w-full rounded-2xl bg-white px-4 py-3">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="university">University</option>
          </select>
        </label>
        <button className="press w-full rounded-full bg-terra text-ink font-display font-bold py-3">Save</button>
      </form>
      <div className="mt-6 bg-white rounded-[24px] p-4 text-sm text-ink/60 space-y-2">
        <p>Screenshot protection is on for chats.</p>
        <p>A new login signs this phone out.</p>
        <p>Plan: {me.studentPlan} · {me.devicesAllowed} device slot{me.devicesAllowed > 1 ? "s" : ""}</p>
      </div>
      <button type="button" onClick={logout} className="press mt-4 w-full rounded-full border border-ink/10 py-3 font-display font-bold">
        Log out
      </button>
    </div>
  );
}
