import { getLocalState, setLocalState } from "./localStore";
import {
  getGoogleAISettings,
  hasGoogleAISettings,
  recordGoogleAIUsage,
} from "./aiSettings";
import { answerTypeForQuestionType } from "../data/options";
import type {
  AIDebugSnapshot,
  AnswerType,
  QuestionOption,
  QuestionType,
} from "../types";

export interface AIQuestionAnalysisResult {
  subject: string;
  questionType: QuestionType;
  originalQuestionText: string;
  convertedQuestion: string;
  answerType: AnswerType;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  confidence: number;
  needsUserReview: boolean;
  debug?: AIDebugSnapshot;
}

interface AnalyzeQuestionInput {
  subject: string;
  questionType: QuestionType;
  imageUrl?: string;
  imageDataUrl?: string;
  text?: string;
  useMock?: boolean;
}

const multipleChoiceLabels = ["A", "B", "C", "D"];
const trueFalseOptions: QuestionOption[] = [
  { label: "A", text: "對" },
  { label: "B", text: "錯" },
];

export class AIQuestionDebugError extends Error {
  debug: AIDebugSnapshot;

  constructor(message: string, debug: AIDebugSnapshot) {
    super(message);
    this.name = "AIQuestionDebugError";
    this.debug = debug;
  }
}

export function getAIQuestionDebug(error: unknown) {
  return error instanceof AIQuestionDebugError ? error.debug : null;
}

export async function analyzeQuestion(
  input: AnalyzeQuestionInput
): Promise<AIQuestionAnalysisResult> {
  if (!input.useMock && hasGoogleAISettings()) {
    return analyzeQuestionWithGoogleAI(input);
  }

  if (!input.useMock && !hasGoogleAISettings()) {
    throw new Error("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key 與模型。");
  }

  const state = getLocalState();
  if (state.aiUsage.dailyAiCallCount >= 10) {
    throw new Error("AI 解析今日額度已用完，請明天再試或改用手動新增。");
  }

  setLocalState({
    ...state,
    aiUsage: {
      dailyAiCallCount: state.aiUsage.dailyAiCallCount + 1,
      monthlyAiCallCount: state.aiUsage.monthlyAiCallCount + 1,
      lastAiCallAt: new Date().toISOString(),
    },
  });

  await new Promise((resolve) => window.setTimeout(resolve, 600));
  const prompt = buildPrompt(input);
  const mockJson = createMockResult(input);
  const result = normalizeAIResult(mockJson, input);
  const debug = createBaseDebugSnapshot({
    input,
    provider: "mock",
    modelId: "mock_gemma_free",
    prompt,
    requestBodyPreview: safeStringify({ mock: true, text: input.text ?? "", hasImage: Boolean(input.imageDataUrl) }),
  });
  debug.stage = "mock";
  debug.parsedJson = mockJson;
  debug.normalizedResult = resultForDebug(result);
  return { ...result, debug };
}

export function getAIUsage() {
  return getLocalState().aiUsage;
}

function createMockResult(input: AnalyzeQuestionInput): Partial<AIQuestionAnalysisResult> {
  const originalQuestionText =
    input.text?.trim() ||
    (input.questionType === "是非題"
      ? "下列動物中，狗是昆蟲。"
      : input.questionType === "改錯字"
        ? "請圈出錯字：小明把作業寫得很工正。"
        : "小明有 24 顆糖，先吃掉 1/3，剩下的再分給 2 個朋友，每人可分到幾顆？");

  if (input.questionType === "是非題") {
    return {
      originalQuestionText,
      convertedQuestion: originalQuestionText,
      options: trueFalseOptions,
      correctAnswer: "B",
      explanation: "狗是哺乳類動物，不是昆蟲，所以這句話是錯的。",
      confidence: input.imageUrl ? 0.82 : 0.75,
    };
  }

  if (input.questionType === "改錯字") {
    return {
      originalQuestionText,
      convertedQuestion: "「小明把作業寫得很工正」中的錯字應該怎麼改？",
      options: [
        { label: "A", text: "工正 → 公正" },
        { label: "B", text: "工正 → 工整" },
        { label: "C", text: "作業 → 做業" },
        { label: "D", text: "小明 → 小名" },
      ],
      correctAnswer: "B",
      explanation: "形容字寫得整齊應該用「工整」，不是「工正」。",
      confidence: input.imageUrl ? 0.84 : 0.78,
    };
  }

  return {
    originalQuestionText,
    convertedQuestion: originalQuestionText,
    options: [
      { label: "A", text: "2 顆" },
      { label: "B", text: "4 顆" },
      { label: "C", text: "6 顆" },
      { label: "D", text: "8 顆" },
    ],
    correctAnswer: input.questionType === "選擇題" ? "A" : "D",
    explanation:
      input.questionType === "選擇題"
        ? "請依照原題選項判斷，這裡是示範解析。"
        : "24 的 1/3 是 8，剩下 16，分給 2 個朋友，每人 8 顆。",
    confidence: input.imageUrl ? 0.86 : 0.78,
  };
}

function buildPrompt(input: AnalyzeQuestionInput) {
  const sharedHeader = `你是小學錯題建檔助理。使用者已選擇：
科目：${input.subject}
題目類型：${input.questionType}

請只根據圖片中裁切出的題目內容進行解析。使用者選定的科目與題目類型是最終規則，不要自行改成別的題型。
若圖片文字不清楚，也要盡量回傳可辨識內容，不要讓欄位空白。
JSON 格式中的空字串只是欄位示意，不可以照抄空白範例；若真的看不清楚，請填「辨識不清」。
只回傳 JSON，不要 Markdown，不要額外說明。`;

  const extraText = input.text?.trim()
    ? `\n\n使用者補充文字：\n${input.text.trim()}`
    : "";

  if (input.questionType === "是非題") {
    return `${sharedHeader}

任務：
1. 完整抄寫圖片中的題目文字，不要改寫、不要補題、不要換題。
2. 題目若有括號、編號、符號、單位，請盡量照原樣保留。
3. 這是一題是非題，請不要轉成四選一選擇題。
4. options 固定只回兩個：A=對、B=錯。
5. 判斷正確答案是 A 或 B。
6. 提供適合小學生理解的解題說明。

JSON 格式：
{
  "originalQuestionText": "",
  "convertedQuestion": "",
  "options": [
    {"label": "A", "text": "對"},
    {"label": "B", "text": "錯"}
  ],
  "correctAnswer": "A",
  "explanation": "",
  "confidence": 0.0
}${extraText}`;
  }

  if (input.questionType === "選擇題") {
    return `${sharedHeader}

任務：
1. 完整抄寫圖片中的題目與原本選項，不要改成別題。
2. 若圖片選項是 ①②③④，請轉成 A/B/C/D，但選項文字必須照抄。
3. 不要自行新增不存在的題目條件。
4. 判斷正確答案。
5. 提供解題說明。
6. 若某個選項看不清楚，文字可標示「辨識不清」。

JSON 格式：
{
  "originalQuestionText": "",
  "convertedQuestion": "",
  "options": [
    {"label": "A", "text": ""},
    {"label": "B", "text": ""},
    {"label": "C", "text": ""},
    {"label": "D", "text": ""}
  ],
  "correctAnswer": "A",
  "explanation": "",
  "confidence": 0.0
}${extraText}`;
  }

  if (input.questionType === "改錯字") {
    return `${sharedHeader}

任務：
1. 完整抄寫原題文字，包含原句、錯字、題號與標點。
2. 找出需要改正的錯字或錯詞。
3. 將題目轉成選擇題，讓小朋友選出正確改法。
4. convertedQuestion 要清楚問：「哪一個改法正確？」或「句中哪個字應改成哪個字？」
5. options 提供 4 個選項，只有 1 個正確答案。
6. 干擾選項要合理，但不能太離譜。
7. explanation 說明錯在哪裡、正確字是什麼、為什麼。

JSON 格式：
{
  "originalQuestionText": "",
  "convertedQuestion": "",
  "options": [
    {"label": "A", "text": ""},
    {"label": "B", "text": ""},
    {"label": "C", "text": ""},
    {"label": "D", "text": ""}
  ],
  "correctAnswer": "A",
  "explanation": "",
  "confidence": 0.0
}${extraText}`;
  }

  return `${sharedHeader}

任務：
1. 完整抄寫圖片中的原始應用題，不要換題。
2. convertedQuestion 可保留原題，或在不改變題意的前提下整理成更清楚的小朋友複習題。
3. 將答案設計成四選一選擇題。
4. 若原題已有選項，優先保留原選項並轉成 A/B/C/D。
5. 若原題沒有選項，請產生 4 個合理選項，其中只有 1 個正確答案。
6. explanation 要列出主要解題步驟。

JSON 格式：
{
  "originalQuestionText": "",
  "convertedQuestion": "",
  "options": [
    {"label": "A", "text": ""},
    {"label": "B", "text": ""},
    {"label": "C", "text": ""},
    {"label": "D", "text": ""}
  ],
  "correctAnswer": "A",
  "explanation": "",
  "confidence": 0.0
}${extraText}`;
}

function dataUrlToInlineData(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

const debugTextLimit = 30_000;

function clipText(text: string, limit = debugTextLimit) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n...（已截斷 ${text.length - limit} 個字元）`;
}

function safeStringify(value: unknown) {
  try {
    return clipText(JSON.stringify(value, null, 2));
  } catch {
    return "無法轉成 JSON 顯示";
  }
}

function getImageDebug(input: AnalyzeQuestionInput): AIDebugSnapshot["image"] {
  const inlineData = input.imageDataUrl ? dataUrlToInlineData(input.imageDataUrl) : null;
  if (!inlineData) {
    return { hasImage: false };
  }

  return {
    hasImage: true,
    mimeType: inlineData.mimeType,
    base64Chars: inlineData.data.length,
    estimatedBytes: Math.round((inlineData.data.length * 3) / 4),
  };
}

function redactRequestBody(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactRequestBody(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  if ("inlineData" in record) {
    const inlineData = record.inlineData as { mimeType?: string; data?: string } | undefined;
    return {
      inlineData: {
        mimeType: inlineData?.mimeType ?? "unknown",
        data: inlineData?.data
          ? `<base64 image omitted: ${inlineData.data.length} chars>`
          : "<no image data>",
      },
    };
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, redactRequestBody(item)])
  );
}

function createBaseDebugSnapshot(input: {
  input: AnalyzeQuestionInput;
  provider: AIDebugSnapshot["provider"];
  modelId: string;
  prompt: string;
  requestBodyPreview: string;
  endpoint?: string;
}): AIDebugSnapshot {
  return {
    createdAt: new Date().toISOString(),
    provider: input.provider,
    modelId: input.modelId,
    stage: "request_ready",
    subject: input.input.subject,
    questionType: input.input.questionType,
    answerType: answerTypeForQuestionType(input.input.questionType),
    textInput: input.input.text?.trim() || undefined,
    endpoint: input.endpoint,
    image: getImageDebug(input.input),
    prompt: input.prompt,
    requestBodyPreview: input.requestBodyPreview,
  };
}

function resultForDebug(result: AIQuestionAnalysisResult) {
  const { debug, ...resultWithoutDebug } = result;
  void debug;
  return resultWithoutDebug;
}

async function analyzeQuestionWithGoogleAI(
  input: AnalyzeQuestionInput
): Promise<AIQuestionAnalysisResult> {
  const settings = getGoogleAISettings();
  if (!settings.apiKey) {
    throw new Error("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key。");
  }

  const prompt = buildPrompt(input);
  const inlineData = input.imageDataUrl ? dataUrlToInlineData(input.imageDataUrl) : undefined;
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (inlineData) {
    parts.push({ inlineData });
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 300_000);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelId}:streamGenerateContent?key=${encodeURIComponent(settings.apiKey)}`;
  const endpointForDebug = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelId}:streamGenerateContent?key=REDACTED`;
  const requestBody = {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingLevel: "HIGH",
      },
    },
  };
  const debug = createBaseDebugSnapshot({
    input,
    provider: "google_ai",
    modelId: settings.modelId,
    prompt,
    endpoint: endpointForDebug,
    requestBodyPreview: safeStringify(redactRequestBody(requestBody)),
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    debug.httpStatus = response.status;
    debug.rawResponse = clipText(rawText);
    debug.stage = "raw_response";

    if (!response.ok) {
      const message = formatGoogleAIError(rawText, response.status);
      throw new AIQuestionDebugError(message, {
        ...debug,
        stage: "http_error",
        errorMessage: message,
      });
    }

    let parsed: ReturnType<typeof parseGoogleAITextForDebug>;
    try {
      parsed = parseGoogleAITextForDebug(rawText);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI 回傳格式不完整。";
      throw new AIQuestionDebugError(message, {
        ...debug,
        stage: "parse_error",
        errorMessage: message,
      });
    }

    debug.extractedModelText = clipText(parsed.extractedModelText);
    debug.parsedJson = parsed.parsedJson;
    const result = normalizeAIResult(parsed.parsedJson, input);
    debug.normalizedResult = resultForDebug(result);
    debug.stage = "normalized";

    recordGoogleAIUsage(settings.modelId);
    return { ...result, debug };
  } catch (error) {
    if (error instanceof AIQuestionDebugError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      const message = "Google AI 解析逾時，請稍後重試，或改用另一個模型。";
      throw new AIQuestionDebugError(message, {
        ...debug,
        stage: "timeout",
        errorMessage: message,
      });
    }
    const message = error instanceof Error ? error.message : "Google AI 解析失敗，請稍後再試。";
    throw new AIQuestionDebugError(message, {
      ...debug,
      stage: "unknown_error",
      errorMessage: message,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatGoogleAIError(rawText: string, status: number) {
  try {
    const parsed = JSON.parse(rawText) as {
      error?: { message?: string; status?: string };
    };
    const message = parsed.error?.message ?? rawText;
    return `Google AI 回應錯誤 (${status})：${message}`;
  } catch {
    return `Google AI 回應錯誤 (${status})：${rawText || "沒有錯誤內容"}`;
  }
}

function parseGoogleAITextForDebug(rawText: string): {
  extractedModelText: string;
  parsedJson: unknown;
} {
  let response: unknown;
  try {
    response = JSON.parse(rawText);
  } catch {
    return {
      extractedModelText: rawText,
      parsedJson: parseJSONFromModelText(rawText),
    };
  }

  const chunks = Array.isArray(response) ? response : [response];
  const text = chunks
    .flatMap((chunk) => {
      const candidates = (chunk as { candidates?: unknown[] }).candidates ?? [];
      return candidates.flatMap((candidate) => {
        const parts =
          (candidate as { content?: { parts?: Array<{ text?: string }> } }).content
            ?.parts ?? [];
        return parts.map((part) => part.text ?? "");
      });
    })
    .join("");

  return {
    extractedModelText: text || rawText,
    parsedJson: parseJSONFromModelText(text || rawText),
  };
}

function parseJSONFromModelText(text: string): unknown {
  const fencedBlocks = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map(
    (match) => match[1]
  );
  const sources = fencedBlocks.length ? [...fencedBlocks, text] : [text];

  for (const source of sources) {
    const parsed = parseFirstJSONValue(source);
    if (parsed !== null) return parsed;
  }

  throw new Error("AI 回傳格式不完整，請再試一次，或改用手動模式。");
}

function parseFirstJSONValue(source: string): unknown | null {
  const openingBrackets = new Set(["{", "["]);
  const closingByOpening: Record<string, string> = {
    "{": "}",
    "[": "]",
  };

  for (let start = 0; start < source.length; start += 1) {
    const firstChar = source[start];
    if (!openingBrackets.has(firstChar)) continue;

    const stack: string[] = [closingByOpening[firstChar]];
    let inString = false;
    let isEscaped = false;

    for (let index = start + 1; index < source.length; index += 1) {
      const char = source[index];

      if (inString) {
        if (isEscaped) {
          isEscaped = false;
          continue;
        }
        if (char === "\\") {
          isEscaped = true;
          continue;
        }
        if (char === "\"") {
          inString = false;
        }
        continue;
      }

      if (char === "\"") {
        inString = true;
        continue;
      }

      if (openingBrackets.has(char)) {
        stack.push(closingByOpening[char]);
        continue;
      }

      if (char === "}" || char === "]") {
        if (stack.pop() !== char) break;
        if (stack.length === 0) {
          try {
            return JSON.parse(source.slice(start, index + 1));
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
}

function normalizeAIResult(
  value: unknown,
  input: Pick<AnalyzeQuestionInput, "subject" | "questionType">
): AIQuestionAnalysisResult {
  const data = value as Partial<AIQuestionAnalysisResult>;
  const answerType = answerTypeForQuestionType(input.questionType);
  const labels = answerType === "true_false" ? ["A", "B"] : multipleChoiceLabels;
  const rawOptions = Array.isArray(data.options) ? data.options : [];
  const options =
    answerType === "true_false"
      ? trueFalseOptions
      : labels.map((label, index) => ({
          label,
          text: String(rawOptions.find((option) => option?.label === label)?.text ?? rawOptions[index]?.text ?? ""),
        }));

  const correctAnswer = String(data.correctAnswer ?? "A").trim().toUpperCase();
  const confidence = Number(data.confidence);
  const originalQuestionText = String(data.originalQuestionText ?? "").trim();
  const convertedQuestion = String(
    data.convertedQuestion ?? data.originalQuestionText ?? ""
  ).trim();

  return {
    subject: input.subject,
    questionType: input.questionType,
    originalQuestionText,
    convertedQuestion: convertedQuestion || originalQuestionText,
    answerType,
    options,
    correctAnswer: labels.includes(correctAnswer) ? correctAnswer : "A",
    explanation: String(data.explanation ?? "").trim(),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.65,
    needsUserReview: true,
  };
}
