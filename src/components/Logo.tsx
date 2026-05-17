import { Bot } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border-4 border-crayon-blue bg-crayon-light text-crayon-blue shadow-sketch">
        <Bot size={compact ? 28 : 34} strokeWidth={2.8} />
      </div>
      {!compact && (
        <div>
          <div className="crayon-title text-3xl text-crayon-blue">AI 錯題寶</div>
          <div className="text-sm font-semibold text-slate-500">建檔一次，複習很多次</div>
        </div>
      )}
    </div>
  );
}
