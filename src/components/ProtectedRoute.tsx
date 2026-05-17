import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAppData } from "../hooks/useAppData";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper p-6">
        <div className="sketch-card p-8 text-center">
          <p className="crayon-title text-3xl text-crayon-blue">AI 錯題寶</p>
          <p className="mt-2 font-semibold text-slate-600">正在打開題庫筆記本...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
