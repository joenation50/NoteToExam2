import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { Toasts } from "./components/Toasts";
import { StoreProvider } from "./lib/store";
import { Admin } from "./pages/Admin";
import { Auth } from "./pages/Auth";
import { Cbt } from "./pages/Cbt";
import { CBTSetup } from "./pages/CBTSetup"; 
import { Dashboard } from "./pages/Dashboard";
import { Downloads } from "./pages/Downloads";
import { Groups } from "./pages/Groups";
import { Landing } from "./pages/Landing";
import { Leaderboard } from "./pages/Leaderboard";
import { Insights } from "./pages/Insights"; // <-- ADDED IMPORT

import { Library } from "./pages/Library";
import { Marketplace } from "./pages/Marketplace";
import { Messages } from "./pages/Messages";
import { Pack } from "./pages/Pack";
import { Player } from "./pages/Player";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";
import { Tutor } from "./pages/Tutor";
import { Wall } from "./pages/Wall";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Toasts />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="insights" element={<Insights />} /> {/* <-- ADDED ROUTE */}
            <Route path="tutor" element={<Tutor />} />
            <Route path="market" element={<Marketplace />} />
            <Route path="library" element={<Library />} />
            <Route path="library/:id" element={<Pack />} />
            <Route path="cbt/setup" element={<CBTSetup />} />
            <Route path="cbt/:id" element={<Cbt />} />
            <Route path="profile" element={<Profile />} />
            <Route path="messages" element={<Messages />} />
            <Route path="wall" element={<Wall />} />
            <Route path="groups" element={<Groups />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="settings" element={<Settings />} />
            <Route path="player/:id" element={<Player />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
