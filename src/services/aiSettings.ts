import type { AIUsage } from "../types";

export type GoogleAIModelId = "gemma-4-26b-a4b-it" | "gemma-4-31b-it";

export interface GoogleAIModelOption {
  id: GoogleAIModelId;
  label: string;
  description: string;
}

export interface GoogleAISettings {
  apiKey: string;
  modelId: GoogleAIModelId;
}

interface ModelUsage {
  daily: number;
  minuteTimestamps: number[];
}

interface GoogleAIUsageStore {
  date: string;
  models: Partial<Record<GoogleAIModelId, ModelUsage>>;
}

export const GOOGLE_AI_MODELS: GoogleAIModelOption[] = [
  {
    id: "gemma-4-26b-a4b-it",
    label: "Gemma 4 26B A4B IT（推薦，MoE 架構速度快）",
    description: "適合一般錯題解析，速度較快。",
  },
  {
    id: "gemma-4-31b-it",
    label: "Gemma 4 31B IT",
    description: "適合較複雜題目，回應可能較慢。",
  },
];

const SETTINGS_KEY = "ai-mistake-review-google-ai-settings-v1";
const USAGE_KEY = "ai-mistake-review-google-ai-usage-v1";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyUsage(): GoogleAIUsageStore {
  return {
    date: todayKey(),
    models: {},
  };
}

export function getGoogleAISettings(): GoogleAISettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return {
      apiKey: "",
      modelId: "gemma-4-26b-a4b-it",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GoogleAISettings>;
    const isKnownModel = GOOGLE_AI_MODELS.some((model) => model.id === parsed.modelId);
    return {
      apiKey: parsed.apiKey ?? "",
      modelId: isKnownModel ? (parsed.modelId as GoogleAIModelId) : "gemma-4-26b-a4b-it",
    };
  } catch {
    return {
      apiKey: "",
      modelId: "gemma-4-26b-a4b-it",
    };
  }
}

export function saveGoogleAISettings(settings: GoogleAISettings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      apiKey: settings.apiKey.trim(),
      modelId: settings.modelId,
    })
  );
}

export function clearGoogleAISettings() {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(USAGE_KEY);
}

export function hasGoogleAISettings() {
  return Boolean(getGoogleAISettings().apiKey);
}

export function getGoogleAIUsage(): GoogleAIUsageStore {
  const raw = localStorage.getItem(USAGE_KEY);
  if (!raw) return createEmptyUsage();

  try {
    const parsed = JSON.parse(raw) as GoogleAIUsageStore;
    if (parsed.date !== todayKey()) return createEmptyUsage();
    return {
      date: parsed.date,
      models: parsed.models ?? {},
    };
  } catch {
    return createEmptyUsage();
  }
}

export function recordGoogleAIUsage(modelId: GoogleAIModelId) {
  const usage = getGoogleAIUsage();
  const now = Date.now();
  const current = usage.models[modelId] ?? {
    daily: 0,
    minuteTimestamps: [],
  };
  const next: GoogleAIUsageStore = {
    ...usage,
    models: {
      ...usage.models,
      [modelId]: {
        daily: current.daily + 1,
        minuteTimestamps: [...current.minuteTimestamps, now].filter(
          (timestamp) => now - timestamp < 60_000
        ),
      },
    },
  };
  localStorage.setItem(USAGE_KEY, JSON.stringify(next));
}

export function getGoogleAIUsageSummary(): AIUsage {
  const usage = getGoogleAIUsage();
  const dailyAiCallCount = Object.values(usage.models).reduce(
    (sum, item) => sum + (item?.daily ?? 0),
    0
  );

  return {
    dailyAiCallCount,
    monthlyAiCallCount: dailyAiCallCount,
  };
}

export function getModelUsage(modelId: GoogleAIModelId) {
  const usage = getGoogleAIUsage();
  const now = Date.now();
  const item = usage.models[modelId] ?? {
    daily: 0,
    minuteTimestamps: [],
  };
  return {
    daily: item.daily,
    rpm: item.minuteTimestamps.filter((timestamp) => now - timestamp < 60_000).length,
  };
}

export async function testGoogleAIConnection(settings: GoogleAISettings) {
  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    throw new Error("請先填入 Google AI Studio API Key。");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45_000);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelId}:streamGenerateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "請只回覆 JSON：{\"ok\":true}",
              },
            ],
          },
        ],
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(formatGoogleAISettingsError(rawText, response.status));
    }

    recordGoogleAIUsage(settings.modelId);
    return {
      modelId: settings.modelId,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("模型連線測試逾時，請確認網路或改用另一個模型。");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatGoogleAISettingsError(rawText: string, status: number) {
  try {
    const parsed = JSON.parse(rawText) as {
      error?: { message?: string };
    };
    return `模型連線失敗 (${status})：${parsed.error?.message ?? rawText}`;
  } catch {
    return `模型連線失敗 (${status})：${rawText || "沒有錯誤內容"}`;
  }
}
