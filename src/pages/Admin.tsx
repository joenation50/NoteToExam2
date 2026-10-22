import { useState, useEffect, useMemo } from "react";
import { useStore } from "../lib/store";
import { Seo } from "../components/Seo";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db as firestore } from "../lib/firebase"; 
import type { User } from "../lib/types";
import { Search, RefreshCcw, ShieldAlert, Award, FileText, Users as UsersIcon, Download, Trash2, GraduationCap, School } from "lucide-react";

export function Admin() {
  const { 
    isAdmin, adminLogin, adminLogout, 
    adminGrant, setFlags, db 
  } = useStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  
  const [cloudUsers, setCloudUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creditInput, setCreditInput] = useState<{ id: string; name: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState("100");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snapshot = await getDocs(collection(firestore, "profiles"));
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id } as User);
      });
      setCloudUsers(users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      await adminLogin(email, password, otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access denied.");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return cloudUsers;
    const lower = searchQuery.toLowerCase();
    return cloudUsers.filter(u => 
      (u.name?.toLowerCase() || "").includes(lower) || 
      (u.email?.toLowerCase() || "").includes(lower) ||
      (u.school?.toLowerCase() || "").includes(lower)
    );
  }, [cloudUsers, searchQuery]);

  const totalCredits = useMemo(() => cloudUsers.reduce((sum, u) => sum + (u.credits || 0), 0), [cloudUsers]);
  
  // Advanced Analytics
  const lecturerCount = cloudUsers.filter(u => u.role === "lecturer").length;
  const studentCount = cloudUsers.filter(u => u.role === "student" || !u.role).length;
  const bannedCount = cloudUsers.filter(u => u.banned).length;

  const handleGrantCredits = async () => {
    if (!creditInput) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount)) return;
    
    await adminGrant(creditInput.id, amount);
    setCloudUsers(prev => prev.map(u => u.id === creditInput.id ? { ...u, credits: (u.credits || 0) + amount } : u));
    setCreditInput(null);
  };

  const handleBanToggle = async (user: User) => {
    const newBanState = !user.banned;
    await updateDoc(doc(firestore, "profiles", user.id), { banned: newBanState });
    setCloudUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: newBanState } : u));
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete their profile permanently.")) return;
    await deleteDoc(doc(firestore, "profiles", id));
    setCloudUsers(prev => prev.filter(u => u.id !== id));
  };

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Role", "Credits", "School", "Level", "Banned"];
    const rows = cloudUsers.map(u => [
      u.name || "", 
      u.email || "", 
      u.role || "student", 
      u.credits || 0,
      u.school || "",
      u.classLevel || u.learningStage || "",
      u.banned ? "Yes" : "No"
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notetoexam_users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SECURITY GATE ---
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-off p-6">
        <Seo title="404 Not Found" />
        <div className="text-center max-w-sm w-full bg-white p-8 rounded-[32px] shadow-sm border border-ink/5">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full grid place-items-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-1">Restricted Access</h1>
          <p className="text-ink/50 mb-6 text-sm">Verify your credentials to continue.</p>
          
          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm focus:border-terra" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm focus:border-terra" />
            <input type="text" placeholder="2FA Code" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm focus:border-terra" />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-ink text-off py-3 rounded-xl font-bold text-sm mt-2 active:scale-95 transition">Unlock System</button>
          </form>
        </div>
      </div>
    );
  }

  // --- REAL ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-off pb-20">
      <Seo title="Admin Panel — NoteToExam" />
      
      <header className="bg-white border-b border-ink/10 p-5 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Admin Command Center</h1>
          <p className="text-xs text-ink/50">NoteToExam System Control</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="bg-sage/20 text-sage-deep font-bold text-xs px-4 py-2 rounded-lg active:scale-95 transition flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={adminLogout} className="bg-red-50 text-red-600 font-bold text-xs px-4 py-2 rounded-lg active:scale-95 transition">
            Log Out
          </button>
        </div>
      </header>

      <main className="p-5 max-w-5xl mx-auto space-y-4">
        
        {/* ANALYTICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs uppercase tracking-widest text-ink/40 font-bold">Total Users</p>
              <UsersIcon size={16} className="text-terra" />
            </div>
            <p className="font-display text-3xl font-bold">{loadingUsers ? "..." : cloudUsers.length}</p>
            <p className="text-[10px] text-ink/40 mt-1">{studentCount} Students · {lecturerCount} Lecturers</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs uppercase tracking-widest text-ink/40 font-bold">Credits in App</p>
              <Award size={16} className="text-sage-deep" />
            </div>
            <p className="font-display text-3xl font-bold">{loadingUsers ? "..." : totalCredits.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs uppercase tracking-widest text-ink/40 font-bold">Notes Uploaded</p>
              <FileText size={16} className="text-blue-500" />
            </div>
            <p className="font-display text-3xl font-bold">{db.notes?.length || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs uppercase tracking-widest text-ink/40 font-bold">Banned Users</p>
              <ShieldAlert size={16} className="text-red-500" />
            </div>
            <p className="font-display text-3xl font-bold text-red-500">{loadingUsers ? "..." : bannedCount}</p>
          </div>
        </div>

        {/* SYSTEM CONTROLS */}
        <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
          <h2 className="font-display font-bold mb-4">System Toggles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 bg-off rounded-xl">
              <div>
                <p className="font-bold text-sm">Maintenance Mode</p>
                <p className="text-xs text-ink/50">Block all users from accessing the app</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-terra cursor-pointer" checked={db.flags?.maintenance} onChange={(e) => setFlags({ maintenance: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-off rounded-xl">
              <div>
                <p className="font-bold text-sm">Pause AI Engine</p>
                <p className="text-xs text-ink/50">Stop Gemini API costs temporarily</p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-terra cursor-pointer" checked={db.flags?.pauseAi} onChange={(e) => setFlags({ pauseAi: e.target.checked })} />
            </div>
          </div>
        </div>

        {/* USER MANAGEMENT */}
        <div className="bg-white p-5 rounded-[24px] border border-ink/5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="font-display font-bold text-lg">User Management</h2>
            
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input 
                  type="text" 
                  placeholder="Search name, email, or school..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-off border border-ink/10 text-sm outline-none focus:border-terra"
                />
              </div>
              <button onClick={fetchUsers} disabled={loadingUsers} className="bg-ink text-off px-3 py-2 rounded-xl active:scale-95 transition">
                <RefreshCcw size={16} className={loadingUsers ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-ink/10 text-ink/50">
                  <th className="pb-3 font-semibold">User Info</th>
                  <th className="pb-3 font-semibold">Credits</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-off/50 transition cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                    <td className="py-3">
                      <p className="font-bold text-ink">{u.name || "No Name"} {u.banned && <span className="text-red-500 text-xs ml-1">(Banned)</span>}</p>
                      <p className="text-xs text-ink/50">{u.email}</p>
                      
                      {/* EXPANDED USER DETAILS */}
                      {expandedUser === u.id && (
                        <div className="mt-2 p-3 bg-off rounded-lg text-xs space-y-1 border border-ink/5">
                          <p className="flex items-center gap-2"><School size={12}/> <b>School:</b> {u.school || "N/A"}</p>
                          <p className="flex items-center gap-2"><GraduationCap size={12}/> <b>Level:</b> {u.classLevel || u.learningStage || "N/A"}</p>
                          <p><b>Role:</b> <span className="capitalize">{u.role || "student"}</span></p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-terra">{u.credits || 0}</td>
                    <td className="py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setCreditInput({ id: u.id, name: u.name }); setCreditAmount("100"); }} className="bg-sage/20 text-sage-deep text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-sage/30 transition">
                        + Credits
                      </button>
                      <button onClick={() => handleBanToggle(u)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${u.banned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.banned ? "Unban" : "Ban"}
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-xs font-bold px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loadingUsers && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-ink/40">
                      {searchQuery ? "No users match your search." : "No users found in the cloud."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* CUSTOM CREDIT MODAL */}
      {creditInput && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-[28px] w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="font-display font-bold text-lg mb-1">Grant Credits</h3>
            <p className="text-xs text-ink/50 mb-4">How many credits for <b>{creditInput.name}</b>?</p>
            
            <input 
              type="number" 
              value={creditAmount} 
              onChange={(e) => setCreditAmount(e.target.value)} 
              className="w-full p-4 rounded-xl bg-off border border-ink/10 text-2xl font-bold text-center outline-none focus:border-terra mb-4" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => setCreditInput(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold text-sm">Cancel</button>
              <button onClick={handleGrantCredits} className="flex-1 py-3 rounded-xl bg-ink text-off font-bold text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
