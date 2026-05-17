import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  actions,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-bold text-slate-500">{eyebrow}</p>}
        <h1 className="crayon-title text-4xl leading-tight sm:text-5xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
