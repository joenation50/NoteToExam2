import { useState } from "react";
import { useStore } from "../lib/store";
import { Seo } from "../components/Seo";

export function Admin() {
  const { isAdmin, adminLogin, adminLogout, db, adminBan, adminGrant, setFlags } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { setError(""); await adminLogin(email, password, otp); } 
    catch (err) { setError(err instanceof Error ? err.message : "Access denied."); }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-off p-6">
        <div className="text-center max-w-sm w-full bg-white p-8 rounded-3xl shadow-sm border border-ink/5">
          <h1 className="font-display text-4xl font-bold text-ink mb-2">404</h1>
          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm" />
            <input type="text" placeholder="2FA Code" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full p-3 rounded-xl bg-off border border-ink/10 outline-none text-sm" />
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            <button type="submit" className="w-full bg-ink text-off py-3 rounded-xl font-bold text-sm mt-2">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off pb-20">
      <header className="bg-white border-b border-ink/10 p-5 flex justify-between items-center sticky top-0 z-10">
        <div><h1 className="font-display font-bold text-2xl text-ink">Admin Command Center</h1></div>
        <button onClick={adminLogout} className="bg-red-50 text-red-600 font-bold text-xs px-4 py-2 rounded-lg">Log Out</button>
      </header>

      <main className="p-5 max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-5 rounded-2xl border border-ink/5"><p className="text-xs uppercase tracking-widest text-ink/40 font-bold mb-1">Total Users</p><p className="font-display text-3xl font-bold">{db.users?.length || 0}</p></div>
          <div className="bg-white p-5 rounded-2xl border border-ink/5"><p className="text-xs uppercase tracking-widest text-ink/40 font-bold mb-1">Notes</p><p className="font-display text-3xl font-bold">{db.notes?.length || 0}</p></div>
          <div className="bg-white p-5 rounded-2xl border border-ink/5"><p className="text-xs uppercase tracking-widest text-ink/40 font-bold mb-1">CBT Sittings</p><p className="font-display text-3xl font-bold">{db.attempts?.length || 0}</p></div>
          <div className="bg-white p-5 rounded-2xl border border-ink/5"><p className="text-xs uppercase tracking-widest text-ink/40 font-bold mb-1">Market Items</p><p className="font-display text-3xl font-bold">{db.market?.length || 0}</p></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ink/5">
          <h2 className="font-display font-bold mb-4">System Toggles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-4 bg-off rounded-xl">
              <div><p className="font-bold text-sm">Maintenance Mode</p></div>
              <input type="checkbox" className="w-6 h-6 accent-terra cursor-pointer" checked={db.flags?.maintenance} onChange={(e) => setFlags({ maintenance: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between p-4 bg-off rounded-xl">
              <div><p className="font-bold text-sm">Pause AI Engine</p></div>
              <input type="checkbox" className="w-6 h-6 accent-terra cursor-pointer" checked={db.flags?.pauseAi} onChange={(e) => setFlags({ pauseAi: e.target.checked })} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-ink/5">
          <h2 className="font-display font-bold mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead><tr className="border-b border-ink/10 text-ink/50"><th className="pb-3">Name/Email</th><th className="pb-3">Credits</th><th className="pb-3 text-right">Actions</th></tr></thead>
              <tbody>
                {(db.users || []).map((u) => (
                  <tr key={u.id} className="border-b border-ink/5 last:border-0 hover:bg-off/50 transition">
                    <td className="py-3"><p className="font-bold text-ink">{u.name}</p><p className="text-xs text-ink/50">{u.email}</p></td>
                    <td className="py-3 font-bold text-terra">{u.credits}</td>
                    <td className="py-3 text-right space-x-2">
                      <button onClick={() => { const a = prompt("Amount?"); if (a) adminGrant(u.id, parseInt(a)); }} className="bg-terra text-ink text-xs font-bold px-3 py-1.5 rounded-lg">Give Credits</button>
                      <button onClick={() => adminBan(u.id, !u.banned)} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${u.banned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.banned ? "Unban" : "Ban"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}