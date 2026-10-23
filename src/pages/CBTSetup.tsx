import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { curriculum } from "../data/curriculum";
import { Seo } from "../components/Seo";

export function CBTSetup() {
  const nav = useNavigate();
  const [level, setLevel] = useState<'secondary' | 'university'>('secondary');
  const [examType, setExamType] = useState<'jamb' | 'waec'>('jamb'); // NEW
  const [department, setDepartment] = useState('science');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [error, setError] = useState('');

  const availableSubjects = (curriculum[level] as any)?.[department] || [];

  const toggleSubject = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects([...selectedSubjects, subject]);
      } else {
        setError("You can only select a maximum of 4 subjects.");
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleStart = () => {
    if (selectedSubjects.length === 0) {
      setError("Please select at least 1 subject.");
      return;
    }
    sessionStorage.setItem("cbt_subjects", JSON.stringify(selectedSubjects));
    sessionStorage.setItem("cbt_exam_type", level === 'secondary' ? examType : 'university');
    nav("/app/cbt/new-test");
  };

  return (
    <div className="px-5 pt-5 pb-24">
      <Seo title="Setup CBT — NoteToExam" />
      
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-[28px] shadow-sm border border-ink/5">
        <h2 className="font-display text-2xl font-bold mb-2 text-ink">Setup Your CBT Test</h2>
        <p className="text-ink/50 text-sm mb-6">Select your exam type and up to 4 subjects.</p>
        
        {error && <div className="bg-terra/10 text-terra-deep p-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}

        {/* Level Selection */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-ink/70 mb-2">Education Level</label>
          <select 
            className="w-full p-4 border border-ink/10 rounded-xl bg-off font-display text-ink focus:ring-2 focus:ring-terra outline-none transition"
            value={level} 
            onChange={(e) => { 
              const newLevel = e.target.value as 'secondary' | 'university';
              setLevel(newLevel); 
              setSelectedSubjects([]); 
              setDepartment(newLevel === 'secondary' ? 'science' : 'engineering'); 
            }}
          >
            <option value="secondary">Secondary School</option>
            <option value="university">University</option>
          </select>
        </div>

        {/* NEW: Exam Type (JAMB / WAEC) */}
        {level === 'secondary' && (
          <div className="mb-5">
            <label className="block text-sm font-bold text-ink/70 mb-2">Exam Type</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setExamType('jamb')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${examType === 'jamb' ? 'bg-ink text-off' : 'bg-off text-ink/60'}`}
              >
                JAMB (180 Questions)
              </button>
              <button 
                onClick={() => setExamType('waec')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${examType === 'waec' ? 'bg-ink text-off' : 'bg-off text-ink/60'}`}
              >
                WAEC (40 Questions)
              </button>
            </div>
          </div>
        )}

        {/* Department Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-ink/70 mb-2">Department / Course</label>
          <select 
            className="w-full p-4 border border-ink/10 rounded-xl bg-off font-display text-ink focus:ring-2 focus:ring-terra outline-none transition"
            value={department} 
            onChange={(e) => { setDepartment(e.target.value); setSelectedSubjects([]); }}
          >
            {level === 'secondary' ? (
              <>
                <option value="science">Science</option>
                <option value="commercial">Commercial</option>
                <option value="arts">Arts</option>
              </>
            ) : (
              <>
                <option value="engineering">Engineering</option>
                <option value="law">Law</option>
                <option value="medicine">Medicine</option>
                <option value="social_sciences">Social Sciences</option>
              </>
            )}
          </select>
        </div>

        {/* Subjects Selection */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-ink/70">Select Subjects (Max 4)</label>
            <span className="text-xs font-bold text-ink/40">{selectedSubjects.length}/4 Selected</span>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
            {availableSubjects.map((sub: string) => (
              <button 
                key={sub}
                type="button"
                onClick={() => toggleSubject(sub)}
                className={`px-4 py-3 rounded-xl text-sm font-display font-semibold transition-all ${
                  selectedSubjects.includes(sub) 
                    ? 'bg-ink text-off shadow-md transform scale-105' 
                    : 'bg-off text-ink/70 hover:bg-ink/10'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="button"
          onClick={handleStart}
          className="press w-full bg-terra text-ink font-display font-bold py-4 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all shadow-lg"
        >
          Generate Questions
        </button>
      </div>
    </div>
  );
}
