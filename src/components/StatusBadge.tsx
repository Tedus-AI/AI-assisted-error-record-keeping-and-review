import type { QuestionStatus } from "../types";

const statusMap: Record<QuestionStatus, { label: string; className: string }> = {
  pending_review: {
    label: "待確認",
    className: "border-crayon-orange bg-orange-50 text-crayon-orange",
  },
  approved: {
    label: "已核准",
    className: "border-crayon-green bg-green-50 text-crayon-green",
  },
  needs_manual_edit: {
    label: "需修正",
    className: "border-crayon-purple bg-purple-50 text-crayon-purple",
  },
  rejected: {
    label: "已捨棄",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
  archived: {
    label: "已封存",
    className: "border-slate-400 bg-slate-100 text-slate-600",
  },
};

export function StatusBadge({ status }: { status: QuestionStatus }) {
  const item = statusMap[status];
  return (
    <span className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-sm font-bold ${item.className}`}>
      {item.label}
    </span>
  );
}
