import { getLocalState, setLocalState } from "./localStore";
import {
  getGoogleAISettings,
  hasGoogleAISettings,
  recordGoogleAIUsage,
} from "./aiSettings";

export interface AIQuestionAnalysisResult {
  subject: string;
  unit: string;
  topic: string;
  questionType: string;
  originalQuestionText: string;
  convertedQuestion: string;
  answerType: "multiple_choice" | "true_false";
  options: {
    label: string;
    text: string;
  }[];
  correctAnswer: string;
  explanation: string;
  errorReasonSuggestion: string;
  difficulty: "easy" | "medium" | "hard";
  confidence: number;
  needsUserReview: boolean;
}

export async function analyzeQuestion(input: {
  imageUrl?: string;
  imageDataUrl?: string;
  text?: string;
  useMock?: boolean;
}): Promise<AIQuestionAnalysisResult> {
  if (!input.useMock && hasGoogleAISettings()) {
    return analyzeQuestionWithGoogleAI(input);
  }

  if (!input.useMock && !hasGoogleAISettings()) {
    throw new Error("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key 與模型。");
  }

  const state = getLocalState();
  if (state.aiUsage.dailyAiCallCount >= 10) {
    throw new Error("AI 額度已用完，請改用手動輸入模式。");
  }

  setLocalState({
    ...state,
    aiUsage: {
      dailyAiCallCount: state.aiUsage.dailyAiCallCount + 1,
      monthlyAiCallCount: state.aiUsage.monthlyAiCallCount + 1,
      lastAiCallAt: new Date().toISOString(),
    },
  });

  await new Promise((resolve) => window.setTimeout(resolve, 900));

  const hasText = input.text?.trim();

  return {
    subject: "數學",
    unit: "分數",
    topic: "分數應用題",
    questionType: "應用題",
    originalQuestionText:
      hasText ||
      "一包糖果有 24 顆，姐姐吃了這包糖果的 1/3，弟弟吃了剩下糖果的 1/2，弟弟吃了幾顆糖果？",
    convertedQuestion:
      hasText ||
      "一包糖果有 24 顆，姐姐吃了 1/3，弟弟吃了剩下糖果的 1/2，弟弟吃了幾顆？",
    answerType: "multiple_choice",
    options: [
      { label: "A", text: "2 顆" },
      { label: "B", text: "3 顆" },
      { label: "C", text: "4 顆" },
      { label: "D", text: "8 顆" },
    ],
    correctAnswer: "D",
    explanation:
      "姐姐吃 24 ÷ 3 = 8 顆，剩下 24 - 8 = 16 顆；弟弟吃剩下的 1/2，所以是 16 ÷ 2 = 8 顆。",
    errorReasonSuggestion: "分數乘除概念混淆",
    difficulty: "hard",
    confidence: input.imageUrl ? 0.86 : 0.78,
    needsUserReview: true,
  };
}

export function getAIUsage() {
  return getLocalState().aiUsage;
}

function buildMistakeReviewPrompt(text?: string) {
  return `你是一個錯題整理助手，目標是協助家長將小朋友的錯題整理成可複習的題庫。

請分析使用者提供的題目圖片或題目文字，並完成以下任務：

1. 辨識題目內容。
2. 判斷科目，例如：數學、國語、英文、自然、社會。
3. 判斷單元與題型。
4. 如果原題不是選擇題，請轉換成選擇題或是非題。
5. 若轉換成選擇題，請產生 A/B/C/D 四個合理選項，選項不可過於明顯。
6. 建議正確答案。
7. 產生簡短解題說明。
8. 建議可能錯因。
9. 若你不確定，請將 confidence 設低，並將 needsUserReview 設為 true。
10. 僅回傳 JSON，不要輸出 Markdown，不要輸出額外文字。

請使用以下 JSON 格式：
{
  "subject": "",
  "unit": "",
  "topic": "",
  "questionType": "",
  "originalQuestionText": "",
  "convertedQuestion": "",
  "answerType": "multiple_choice",
  "options": [
    {"label": "A", "text": ""},
    {"label": "B", "text": ""},
    {"label": "C", "text": ""},
    {"label": "D", "text": ""}
  ],
  "correctAnswer": "A",
  "explanation": "",
  "errorReasonSuggestion": "",
  "difficulty": "easy",
  "confidence": 0.0,
  "needsUserReview": true
}

欄位限制：
- answerType 只能是 "multiple_choice" 或 "true_false"。
- difficulty 只能是 "easy"、"medium"、"hard"。
- correctAnswer 若為選擇題，只能是 "A"、"B"、"C"、"D"。
- confidence 請使用 0 到 1 的數字。

${text?.trim() ? `使用者提供的題目文字：\n${text.trim()}` : "使用者可能提供了題目圖片，請以圖片內容為主。"}`;
}

function appendCorrectionQuestionRule(prompt: string) {
  return `${prompt}

補充規則：若題目是改錯字、訂正錯字、圈錯字、找錯別字，請一律轉成 "multiple_choice"。
convertedQuestion 請保留原句，並寫成「請找出句子中的錯字，並選出正確的字：...」。
options 請提供 4 個可能的正確字或易混淆字，correctAnswer 指向真正應改成的字，explanation 說明為什麼要改成這個字。`;
}

function dataUrlToInlineData(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

async function analyzeQuestionWithGoogleAI(input: {
  imageUrl?: string;
  imageDataUrl?: string;
  text?: string;
}): Promise<AIQuestionAnalysisResult> {
  const settings = getGoogleAISettings();
  if (!settings.apiKey) {
    throw new Error("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key。");
  }

  const prompt = appendCorrectionQuestionRule(buildMistakeReviewPrompt(input.text));
  const inlineData =
    input.imageDataUrl ? dataUrlToInlineData(input.imageDataUrl) : undefined;
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (inlineData) {
    parts.push({ inlineData });
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 300_000);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelId}:streamGenerateContent?key=${encodeURIComponent(settings.apiKey)}`;

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
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: "HIGH",
          },
        },
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(formatGoogleAIError(rawText, response.status));
    }

    recordGoogleAIUsage(settings.modelId);
    return normalizeAIResult(parseGoogleAIText(rawText));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Google AI 解析逾時（5 分鐘），請稍後重試，或改用另一個模型。");
    }
    throw error;
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

function parseGoogleAIText(rawText: string): unknown {
  let response: unknown;
  try {
    response = JSON.parse(rawText);
  } catch {
    return parseJSONFromModelText(rawText);
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

  return parseJSONFromModelText(text || rawText);
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

function normalizeAIResult(value: unknown): AIQuestionAnalysisResult {
  const data = value as Partial<AIQuestionAnalysisResult>;
  const answerType =
    data.answerType === "true_false" || data.answerType === "multiple_choice"
      ? data.answerType
      : "multiple_choice";
  const labels = answerType === "true_false" ? ["A", "B"] : ["A", "B", "C", "D"];
  const options =
    answerType === "true_false"
      ? [
          { label: "A", text: "是" },
          { label: "B", text: "否" },
        ]
      : Array.isArray(data.options)
        ? data.options.slice(0, 4).map((option, index) => ({
            label: labels[index],
            text: String(option?.text ?? ""),
          }))
        : [];

  while (options.length < labels.length) {
    options.push({ label: labels[options.length], text: "" });
  }

  const difficulty =
    data.difficulty === "easy" ||
    data.difficulty === "medium" ||
    data.difficulty === "hard"
      ? data.difficulty
      : "medium";
  const correctAnswer = String(data.correctAnswer ?? "A").trim().toUpperCase();
  const confidence = Number(data.confidence);

  return {
    subject: String(data.subject ?? "未分類"),
    unit: String(data.unit ?? "未分類單元"),
    topic: String(data.topic ?? ""),
    questionType: String(data.questionType ?? "題目"),
    originalQuestionText: String(data.originalQuestionText ?? ""),
    convertedQuestion: String(data.convertedQuestion ?? data.originalQuestionText ?? ""),
    answerType,
    options,
    correctAnswer: labels.includes(correctAnswer) ? correctAnswer : "A",
    explanation: String(data.explanation ?? ""),
    errorReasonSuggestion: String(data.errorReasonSuggestion ?? "其他"),
    difficulty,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.65,
    needsUserReview: data.needsUserReview !== false,
  };
}
