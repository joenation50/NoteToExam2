import { Navigate } from "react-router-dom";
import { useStore } from "../lib/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { me, ready } = useStore();

  // 1. Wait for Firebase to finish checking the session
  if (!ready) {
    return (
      <div className="min-h-screen bg-off grid place-items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ink"></div>
      </div>
    );
  }

  // 2. If Firebase is done and there is no user, redirect to login
  if (!me) {
    return <Navigate to="/auth" replace />;
  }

  // 3. User is logged in, show the app
  return <>{children}</>;
}
