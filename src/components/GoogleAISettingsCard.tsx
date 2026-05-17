import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { HandCard } from "./HandCard";
import {
  getGoogleAISettings,
  getModelUsage,
  GOOGLE_AI_MODELS,
  saveGoogleAISettings,
  testGoogleAIConnection,
  type GoogleAIModelId,
} from "../services/aiSettings";

export function GoogleAISettingsCard() {
  const initialSettings = useMemo(() => getGoogleAISettings(), []);
  const [apiKey, setApiKey] = useState(initialSettings.apiKey);
  const [modelId, setModelId] = useState<GoogleAIModelId>(initialSettings.modelId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [connectedAt, setConnectedAt] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setRefreshKey((current) => current + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const save = async () => {
    setMessage("");
    setError("");
    setConnectedAt("");
    const settings = {
      apiKey,
      modelId,
    };
    saveGoogleAISettings(settings);
    setIsTesting(true);
    try {
      const result = await testGoogleAIConnection(settings);
      setConnectedAt(result.checkedAt);
      setRefreshKey((current) => current + 1);
      setMessage(`已儲存，並成功連上模型 ${result.modelId}。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "模型連線測試失敗。");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <HandCard className="p-5" tone="orange" tape>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="crayon-title flex items-center gap-2 text-3xl">
            <Sparkles className="text-crayon-orange" />
            Google AI 模型
          </h2>
          <p className="mt-2 font-semibold leading-7 text-slate-600">
            使用 Google AI Studio 的 API（Gemma 系列）。BYOK 金鑰僅儲存在你的瀏覽器 localStorage，不會上傳。
          </p>
        </div>
        <span
          className={`mt-1 h-4 w-4 shrink-0 rounded-full ${
            apiKey.trim() ? "bg-crayon-green" : "bg-crayon-orange"
          }`}
          title={apiKey.trim() ? "API Key 已填入" : "尚未填入 API Key"}
        />
      </div>

      {message && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 text-sm font-bold text-crayon-green">
          <CheckCircle2 className="mr-2 inline" size={20} />
          {message}
          {connectedAt && (
            <span className="mt-1 block text-xs">
              測試時間：{new Date(connectedAt).toLocaleString("zh-TW")}
            </span>
          )}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 text-sm font-bold text-crayon-red">
          <AlertTriangle className="mr-2 inline" size={20} />
          {error}
        </p>
      )}

      <label className="block">
        <span className="mb-2 flex items-center gap-2 font-bold">
          <KeyRound size={20} />
          API Key
        </span>
        <input
          className="sketch-input"
          type="password"
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value);
            setMessage("");
          }}
          placeholder="貼上你的 Google AI Studio API Key"
          autoComplete="off"
        />
      </label>

      <a
        className="mt-3 inline-flex items-center gap-2 font-bold text-crayon-orange"
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noreferrer"
      >
        前往 Google AI Studio 取得免費金鑰
        <ExternalLink size={18} />
      </a>

      <label className="mt-5 block">
        <span className="mb-2 block font-bold">模型</span>
        <select
          className="sketch-input"
          value={modelId}
          onChange={(event) => {
            setModelId(event.target.value as GoogleAIModelId);
            setMessage("");
          }}
        >
          {GOOGLE_AI_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-3 text-sm font-bold text-slate-500">
        兩款模型都使用 Thinking 模式；目前解析逾時上限為 5 分鐘。
      </p>

      <div className="mt-5 rounded-[18px] border-2 border-slate-200 bg-white/55 p-4">
        <h3 className="mb-3 font-bold text-slate-700">免費版額度（今日）</h3>
        <div className="space-y-3">
          {GOOGLE_AI_MODELS.map((model) => {
            const usage = getModelUsage(model.id);
            const isSelected = model.id === modelId;
            return (
              <div key={`${model.id}-${refreshKey}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-bold">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        isSelected ? "bg-crayon-orange" : "bg-slate-300"
                      }`}
                    />
                    {model.id}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    RPM {usage.rpm}/15 ・ 今日 {usage.daily}/1500
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-crayon-orange"
                    style={{ width: `${Math.min(100, (usage.daily / 1500) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="sketch-button sketch-button-primary mt-5 flex w-full items-center justify-center gap-2 text-lg font-bold"
        onClick={() => void save()}
        disabled={isTesting}
      >
        {isTesting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
        {isTesting ? "正在連線測試..." : "儲存並測試連線"}
      </button>

      <p className="mt-4 flex items-center gap-2 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-bold text-crayon-blue">
        <CheckCircle2 size={20} />
        AI 只在新增錯題解析時呼叫；小朋友複習、答題與統計不會呼叫模型。
      </p>
    </HandCard>
  );
}
