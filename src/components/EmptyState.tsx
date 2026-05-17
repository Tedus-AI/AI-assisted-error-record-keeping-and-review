import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="sketch-card flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-crayon-light text-crayon-blue">
        <Icon size={34} />
      </div>
      <h2 className="crayon-title text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-slate-600">{description}</p>
    </div>
  );
}
