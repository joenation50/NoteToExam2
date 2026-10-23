import { useState, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { 
  User, School, BookOpen, GraduationCap, 
  CheckCircle2, LogOut, Shield, 
  Smartphone, Calendar, Sparkles, Camera
} from "lucide-react";
import { Seo } from "../components/Seo";
import { useStore } from "../lib/store";

export function Settings() {
  const { me, updateMe, logout, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(me?.username || "");
  const [isSaving, setIsSaving] = useState(false);

  // Handle Image Upload using Base64 (Same as Profile page!)
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // Reset input
    if (!file || !me) return;

    // Safety check: Compress/limit size to avoid Firestore 1MB limit
    if (file.size > 800 * 1024) {
      return toast("Image must be smaller than 800KB to save to the database.", "err");
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateMe({ avatar: String(reader.result) });
        toast("Profile picture updated!", "ok");
      } catch (err) {
        toast("Failed to save image.", "err");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!me) return;
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const cleanUsername = username.trim().toLowerCase();

    try {
      await updateMe({
        username: cleanUsername !== me.username ? cleanUsername : undefined,
        name: String(fd.get("name") || me.name),
        matric: String(fd.get("matric") || me.matric),
        school: String(fd.get("school") || me.school),
        courseFocus: String(fd.get("course") || me.courseFocus),
        learningStage: (String(fd.get("stage") || me.learningStage || "university") as typeof me.learningStage),
      });
      toast("Profile updated successfully.", "ok");
    } catch (err: any) {
      toast(err.message || "Failed to update profile.", "err");
    } finally {
      setIsSaving(false);
    }
  }

  // Animation variants
  const container: Variants = { 
    hidden: { opacity: 0 }, 
    show: { opacity: 1, transition: { staggerChildren: 0.05 } } 
  };
  
  const item: Variants = { 
    hidden: { opacity: 0, y: 15 }, 
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } 
  };

  if (!me) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pt-5 pb-32 min-h-screen bg-off"
    >
      <Seo title="Settings — NoteToExam" />
      
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl font-bold">Settings</h1>
      </div>

      {/* PROFILE PICTURE UPLOAD */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center mb-6">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        
        <button 
          type="button"
          onClick={() => fileRef.current?.click()}
          className="press relative h-28 w-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden group"
        >
          {me.avatar ? (
            <img src={me.avatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-terra/10 grid place-items-center text-4xl text-terra/50">
              <User size={40} />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={24} className="text-white" />
          </div>
        </button>
        <p className="text-[10px] uppercase font-bold text-ink/40 tracking-widest mt-3">
          Tap to change picture
        </p>
      </motion.div>

      <form onSubmit={handleSave}>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          
          <motion.label variants={item} className="block bg-gradient-to-r from-sage/20 to-sage/5 border border-sage/30 p-4 rounded-3xl shadow-sm relative overflow-hidden">
            <span className="text-xs font-display uppercase tracking-widest text-sage-deep font-bold flex items-center gap-1">
              <CheckCircle2 size={12} /> Unique Username
            </span>
            <div className="mt-2 flex items-center bg-white rounded-xl px-3 border border-ink/10 focus-within:border-sage shadow-inner transition-colors">
              <span className="text-ink/40 font-bold">@</span>
              <input 
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                className="flex-1 bg-transparent px-2 py-3 outline-none font-display font-bold relative z-10" 
              />
            </div>
          </motion.label>

          <motion.label variants={item} className="block">
            <span className="text-xs font-display uppercase tracking-widest text-ink/40 ml-1">Full Name</span>
            <div className="relative mt-1">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input name="name" defaultValue={me.name} className="w-full rounded-2xl bg-white pl-12 pr-4 py-3.5 outline-none border border-ink/5 focus:border-terra shadow-sm transition-all" />
            </div>
          </motion.label>

          <motion.label variants={item} className="block">
            <span className="text-xs font-display uppercase tracking-widest text-ink/40 ml-1">Matric Number</span>
            <div className="relative mt-1">
              <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input name="matric" defaultValue={me.matric} className="w-full rounded-2xl bg-white pl-12 pr-4 py-3.5 outline-none border border-ink/5 focus:border-terra shadow-sm transition-all" />
            </div>
          </motion.label>

          <motion.label variants={item} className="block">
            <span className="text-xs font-display uppercase tracking-widest text-ink/40 ml-1">School</span>
            <div className="relative mt-1">
              <School size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
              <input name="school" defaultValue={me.school} className="w-full rounded-2xl bg-white pl-12 pr-4 py-3.5 outline-none border border-ink/5 focus:border-terra shadow-sm transition-all" />
            </div>
          </motion.label>

          <motion.div variants={item} className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-display uppercase tracking-widest text-ink/40 ml-1">Course</span>
              <div className="relative mt-1">
                <BookOpen size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                <input name="course" defaultValue={me.courseFocus} className="w-full rounded-2xl bg-white pl-10 pr-3 py-3.5 outline-none border border-ink/5 focus:border-terra shadow-sm" />
              </div>
            </label>
            
            <label className="block">
              <span className="text-xs font-display uppercase tracking-widest text-ink/40 ml-1">Level</span>
              <select name="stage" defaultValue={me.learningStage || "university"} className="mt-1 w-full rounded-2xl bg-white px-4 py-3.5 outline-none border border-ink/5 focus:border-terra shadow-sm appearance-none">
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="university">University</option>
              </select>
            </label>
          </motion.div>

          <motion.button 
            variants={item}
            whileTap={{ scale: 0.95 }}
            type="submit" 
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-ink text-off font-display font-bold py-4 mt-6 shadow-lg shadow-ink/20 disabled:opacity-70 transition-all"
          >
            {isSaving ? "Saving..." : <><CheckCircle2 size={18} /> Save Profile</>}
          </motion.button>
        </motion.div>
      </form>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 bg-gradient-to-br from-ink to-gray-800 rounded-3xl p-5 text-off shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Shield size={100} /></div>
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Shield size={18} className="text-sage" /> Account Status</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-white/60 flex items-center gap-2"><Sparkles size={14}/> Plan</span>
            <span className="font-bold text-sage uppercase">{me.studentPlan} Student</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="text-white/60 flex items-center gap-2"><Smartphone size={14}/> Devices</span>
            <span className="font-bold">{me.devicesAllowed} Slot{me.devicesAllowed > 1 ? 's' : ''}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60 flex items-center gap-2"><Calendar size={14}/> Joined</span>
            <span className="font-bold">{new Date(me.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>
      
      <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={logout} className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-red-500/20 text-red-500 py-4 font-display font-bold hover:bg-red-50 transition-colors">
        <LogOut size={18} /> Log out securely
      </motion.button>
    </motion.div>
  );
}
