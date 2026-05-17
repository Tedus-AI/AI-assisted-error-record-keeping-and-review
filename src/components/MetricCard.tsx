import type { LucideIcon } from "lucide-react";

const toneClass = {
  blue: "text-crayon-blue bg-blue-50",
  green: "text-crayon-green bg-green-50",
  orange: "text-crayon-orange bg-orange-50",
  red: "text-crayon-red bg-red-50",
  purple: "text-crayon-purple bg-purple-50",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <div className="sketch-card flex min-h-[132px] items-center gap-4 p-4">
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${toneClass[tone]}`}>
        <Icon size={34} strokeWidth={2.6} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <p className="crayon-title mt-1 text-4xl">{value}</p>
        {helper && <p className="mt-1 text-sm font-semibold text-slate-500">{helper}</p>}
      </div>
    </div>
  );
}
