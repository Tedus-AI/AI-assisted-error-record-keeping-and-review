import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import { useAppData } from "../hooks/useAppData";

export function ParentRoute({ children }: { children: ReactElement }) {
  const { hasParentPin, isParentMode } = useAppData();

  if (!hasParentPin || isParentMode) return children;

  return <Navigate to="/" replace />;
}
