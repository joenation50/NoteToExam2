import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";
import { DashboardSkeleton } from "./Skeleton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { me, ready } = useStore();
  const loc = useLocation();
  if (!ready) return <DashboardSkeleton />;
  if (!me) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
