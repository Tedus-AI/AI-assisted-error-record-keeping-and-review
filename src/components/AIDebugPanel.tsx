import { useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Code2 } from "lucide-react";
import type { AIDebugSnapshot } from "../types";

interface AIDebugPanelProps {
  debug: AIDebugSnapshot;
}

const stageLabel: Record<AIDebugSnapshot["stage"], string> = {
  mock: "Demo 模擬結果",
  request_ready: "已準備送出",
  raw_response: "已收到原始回應",
  http_error: "模型 HTTP 錯誤",
  parse_error: "JSON 解析失敗",
  normalized: "已完成正規化",
  timeout: "模型逾時",
  unknown_error: "未知錯誤",
};

function formatBytes(bytes?: number) {
  if (!bytes) return "未提供";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function stringifyValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function answerTypeLabel(answerType: AIDebugSnapshot["answerType"]) {
  if (answerType === "true_false") return "對 / 錯";
  if (answerType === "comparison") return "> / < / =";
  return "A-D 選擇題";
}

function DebugBlock({
  title,
  value,
  defaultOpen = false,
}: {
  title: string;
  value?: unknown;
  defaultOpen?: boolean;
}) {
  const text = stringifyValue(value);
  if (!text) return null;

  return (
    <details
      className="rounded-[16px] border-2 border-slate-300 bg-white/70 p-3"
      open={defaultOpen}
    >
      <summary className="cursor-pointer select-none font-bold text-slate-700">
        {title}
      </summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[12px] bg-slate-950 p-3 text-xs leading-5 text-slate-50">
        {text}
      </pre>
    </details>
  );
}

export function AIDebugPanel({ debug }: AIDebugPanelProps) {
  const [copied, setCopied] = useState(false);
  const debugJson = useMemo(() => JSON.stringify(debug, null, 2), [debug]);
  const imageText = debug.image.hasImage
    ? `${debug.image.mimeType ?? "unknown"} / ${formatBytes(debug.image.estimatedBytes)} / base64 ${debug.image.base64Chars ?? 0} 字元`
    : "沒有圖片，只送文字";

  const copyDebug = async () => {
    try {
      await navigator.clipboard.writeText(debugJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="sketch-card sketch-card-purple p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="text-crayon-blue" size={24} />
          <h2 className="crayon-title text-2xl">AI 解析除錯資料</h2>
        </div>
        <button
          className="sketch-button flex items-center gap-2 px-4 text-sm font-bold text-crayon-blue"
          type="button"
          onClick={() => void copyDebug()}
        >
          {copied ? <CheckCircle2 size={18} /> : <Clipboard size={18} />}
          {copied ? "已複製" : "複製全部"}
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["階段", stageLabel[debug.stage]],
          ["模型", `${debug.provider} / ${debug.modelId}`],
          ["科目題型", `${debug.subject} / ${debug.questionType}`],
          ["送出圖片", imageText],
          ["HTTP", debug.httpStatus ? String(debug.httpStatus) : "尚未回應"],
          ["答案形式", answerTypeLabel(debug.answerType)],
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-[14px] border-2 border-slate-300 bg-white/65 p-3"
          >
            <p className="text-xs font-bold text-slate-500">{title}</p>
            <p className="mt-1 break-words text-sm font-bold text-slate-800">{body}</p>
          </div>
        ))}
      </div>

      {debug.errorMessage && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 text-sm font-bold text-crayon-red">
          {debug.errorMessage}
        </p>
      )}

      <div className="space-y-3">
        <DebugBlock title="1. 實際送給模型的 Prompt" value={debug.prompt} defaultOpen />
        <DebugBlock
          title="2. API 請求 JSON（圖片 base64 已遮蔽）"
          value={debug.requestBodyPreview}
        />
        <DebugBlock title="3. 模型原始回應 rawResponse" value={debug.rawResponse} />
        <DebugBlock
          title="4. 從回應擷取出的模型文字"
          value={debug.extractedModelText}
        />
        <DebugBlock title="5. JSON 解析後內容" value={debug.parsedJson} />
        <DebugBlock title="6. 程式正規化後結果" value={debug.normalizedResult} />
      </div>
    </section>
  );
}
