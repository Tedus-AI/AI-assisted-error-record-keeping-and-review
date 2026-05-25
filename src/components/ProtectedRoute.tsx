import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAppData } from "../hooks/useAppData";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading, loadError, refreshData, logout } = useAppData();

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

  if (loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper p-6">
        <div className="sketch-card max-w-lg p-8 text-center">
          <p className="crayon-title text-3xl text-crayon-red">資料載入失敗</p>
          <p className="mt-3 break-words font-semibold leading-7 text-slate-600">
            {loadError}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              className="sketch-button sketch-button-primary px-5 font-bold"
              onClick={() => void refreshData()}
            >
              重新載入
            </button>
            <button
              className="sketch-button px-5 font-bold text-slate-700"
              onClick={() => void logout()}
            >
              登出
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
