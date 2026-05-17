import { useMemo, useState } from "react";
import {
  Bot,
  Camera,
  CircleCheck,
  FileImage,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CropSelector } from "../components/CropSelector";
import { HandCard } from "../components/HandCard";
import {
  OptionEditor,
  emptyOptions,
  normalizeAnswerForType,
  optionsForAnswerType,
} from "../components/OptionEditor";
import { PageHeader } from "../components/PageHeader";
import { difficultyOptions, errorReasonOptions, subjectOptions } from "../data/options";
import { analyzeQuestion } from "../services/aiService";
import { hasGoogleAISettings } from "../services/aiSettings";
import { fileToCompressedDataUrl } from "../services/storageService";
import { useAppData } from "../hooks/useAppData";
import type { AnswerType, CropMeta, Difficulty, QuestionOption } from "../types";

const initialCrop: CropMeta = { x: 12, y: 20, width: 72, height: 34 };

export function AddQuestionPage() {
  const {
    user,
    selectedChild,
    addQuestion,
    savePendingAIReview,
    refreshAIUsage,
    aiUsage,
  } = useAppData();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [subject, setSubject] = useState("數學");
  const [unit, setUnit] = useState("分數應用題");
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState("應用題");
  const [answerType, setAnswerType] = useState<AnswerType>("multiple_choice");
  const [convertedQuestion, setConvertedQuestion] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>(emptyOptions());
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [errorReason, setErrorReason] = useState("題意理解錯");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [aiText, setAiText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [crop, setCrop] = useState<CropMeta>(initialCrop);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const aiDailyLimit = user?.isDemo ? 10 : 1500;
  const canUseAi = aiUsage.dailyAiCallCount < aiDailyLimit;
  const filteredOptions = useMemo(
    () =>
      optionsForAnswerType(answerType, options).map((option) => ({
        ...option,
        text: option.text.trim(),
      })),
    [answerType, options]
  );

  const handleAnswerTypeChange = (nextAnswerType: AnswerType) => {
    setAnswerType(nextAnswerType);
    setOptions((current) => optionsForAnswerType(nextAnswerType, current));
    setCorrectAnswer((current) => normalizeAnswerForType(current, nextAnswerType));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const saveManual = async () => {
    setError("");
    if (!selectedChild) {
      setError("請先建立或選擇小朋友。");
      return;
    }
    if (!convertedQuestion.trim()) {
      setError("請輸入題目內容。");
      return;
    }

    setIsSaving(true);
    try {
      await addQuestion({
        childId: selectedChild.id,
        subject,
        unit,
        topic,
        questionType,
        answerType,
        convertedQuestion: convertedQuestion.trim(),
        options: filteredOptions,
        correctAnswer,
        confirmedAnswer: correctAnswer,
        explanation,
        errorReason,
        difficulty,
        sourceType: "manual",
        aiProcessed: false,
        aiProcessCount: 0,
        isUserConfirmed: true,
        reviewStatus: "approved",
        correctCount: 0,
        wrongCount: 0,
        totalAttemptCount: 0,
        masteryLevel: 0,
        lastReviewedAt: null,
        tags: [subject, unit].filter(Boolean),
      });
      setMessage("手動錯題已儲存並可進入複習。");
      setConvertedQuestion("");
      setExplanation("");
      setOptions(emptyOptions(answerType));
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeWithAi = async () => {
    setError("");
    setMessage("");
    if (!selectedChild || !user) {
      setError("請先登入並選擇小朋友。");
      return;
    }
    if (!canUseAi) {
      setError("AI 額度已用完，請改用手動輸入模式。");
      setMode("manual");
      return;
    }
    if (!imageFile && !aiText.trim()) {
      setError("請上傳單題圖片，或輸入題目文字讓 AI 解析。");
      return;
    }
    if (!user.isDemo && !hasGoogleAISettings()) {
      setError("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key 與模型。");
      return;
    }

    setIsSaving(true);
    try {
      const imageDataUrl = imageFile ? await fileToCompressedDataUrl(imageFile) : undefined;
      setUploadProgress(imageDataUrl ? 100 : 0);
      const result = await analyzeQuestion({
        imageUrl: imageDataUrl,
        imageDataUrl,
        text: aiText,
        useMock: user.isDemo,
      });
      savePendingAIReview({ imageUrl: imageDataUrl, cropMeta: crop, result });
      refreshAIUsage();
      navigate("/review-ai-result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 解析失敗，請改用手動模式。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="新增錯題"
        eyebrow="拍照、上傳或手動輸入，快速建立題庫"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <button
          className={`sketch-button flex items-center justify-center gap-3 px-5 text-xl font-bold ${
            mode === "manual" ? "sketch-button-primary" : ""
          }`}
          onClick={() => setMode("manual")}
        >
          <Pencil size={26} />
          手動模式
        </button>
        <button
          className={`sketch-button flex items-center justify-center gap-3 px-5 text-xl font-bold ${
            mode === "ai" ? "sketch-button-primary" : ""
          }`}
          onClick={() => setMode("ai")}
        >
          <Bot size={26} />
          AI 輔助模式
        </button>
      </div>

      {message && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 font-bold text-crayon-green">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 font-bold text-crayon-red">
          {error}
        </p>
      )}

      {mode === "manual" ? (
        <HandCard className="p-5" tone="green" tape>
          <div className="grid gap-4 lg:grid-cols-3">
            <label>
              <span className="mb-2 block font-bold">科目</span>
              <select
                className="sketch-input"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                {subjectOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block font-bold">單元</span>
              <input
                className="sketch-input"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block font-bold">題型</span>
              <input
                className="sketch-input"
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block font-bold">主題</span>
              <input
                className="sketch-input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="可留空"
              />
            </label>
            <label>
              <span className="mb-2 block font-bold">答案型態</span>
              <select
                className="sketch-input"
                value={answerType}
                onChange={(event) =>
                  handleAnswerTypeChange(event.target.value as AnswerType)
                }
              >
                <option value="multiple_choice">選擇題</option>
                <option value="true_false">是非題</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block font-bold">難度</span>
              <select
                className="sketch-input"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                {difficultyOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block font-bold">題目</span>
            <textarea
              className="sketch-input min-h-[150px]"
              value={convertedQuestion}
              onChange={(event) => setConvertedQuestion(event.target.value)}
              placeholder="請輸入整理後的錯題題目"
            />
          </label>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="crayon-title text-2xl">選項內容</h2>
              <label className="flex items-center gap-2 font-bold">
                正確答案
                <select
                  className="sketch-input w-24"
                  value={correctAnswer}
                  onChange={(event) => setCorrectAnswer(event.target.value)}
                >
                  {filteredOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <OptionEditor
              answerType={answerType}
              options={options}
              onChange={setOptions}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block font-bold">解題說明</span>
              <textarea
                className="sketch-input min-h-[140px]"
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                placeholder="複習結果頁會直接顯示此說明，不會呼叫 AI"
              />
            </label>
            <label>
              <span className="mb-2 block font-bold">錯因</span>
              <select
                className="sketch-input"
                value={errorReason}
                onChange={(event) => setErrorReason(event.target.value)}
              >
                {errorReasonOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="sketch-button sketch-button-primary mt-6 flex w-full items-center justify-center gap-3 text-xl font-bold"
            onClick={() => void saveManual()}
            disabled={isSaving}
          >
            <Save size={26} />
            {isSaving ? "儲存中..." : "儲存並核准"}
          </button>
        </HandCard>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <HandCard className="p-5" tone="blue" tape>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="sketch-button flex cursor-pointer items-center gap-2 px-5 text-lg font-bold text-crayon-blue">
                <Camera size={24} />
                拍照
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </label>
              <label className="sketch-button flex cursor-pointer items-center gap-2 px-5 text-lg font-bold text-crayon-blue">
                <FileImage size={24} />
                從相簿上傳
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </label>
            </div>

            {imagePreview ? (
              <CropSelector imageUrl={imagePreview} crop={crop} onChange={setCrop} />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border-4 border-dashed border-crayon-blue bg-blue-50/50 p-8 text-center">
                <Upload className="mb-4 text-crayon-blue" size={54} />
                <h2 className="crayon-title text-3xl">上傳單題圖片</h2>
                <p className="mt-2 max-w-md font-semibold text-slate-600">
                  MVP 先支援單題圖片與簡化框選，避免整張考卷自動切題造成高錯誤率。
                </p>
              </div>
            )}

            <label className="mt-5 block">
              <span className="mb-2 block font-bold">或輸入題目文字給 AI 解析</span>
              <textarea
                className="sketch-input min-h-[110px]"
                value={aiText}
                onChange={(event) => setAiText(event.target.value)}
                placeholder="例如：一包糖果有 24 顆..."
              />
            </label>
          </HandCard>

          <HandCard className="p-5" tone="orange">
            <h2 className="crayon-title mb-4 text-3xl">建檔方式</h2>
            <div className="space-y-3">
              {[
                ["manual", "手動模式", "自行填寫題目與答案，不使用 AI 解析。"],
                ["lite", "省額度模式", "AI 只整理題目文字，不做複雜分析。"],
                ["standard", "標準模式", "AI 完整解析題目、選項、答案與詳解。"],
              ].map(([value, title, body]) => (
                <div
                  key={value}
                  className={`rounded-[18px] border-2 p-4 ${
                    value === "standard"
                      ? "border-crayon-blue bg-blue-50"
                      : "border-slate-300 bg-white/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CircleCheck
                      className={value === "standard" ? "text-crayon-blue" : "text-slate-400"}
                    />
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="text-sm font-semibold text-slate-500">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-[16px] border-2 border-crayon-orange bg-orange-50 p-3 text-sm font-bold text-crayon-orange">
              本功能會消耗一次 AI 分析額度。建議確認照片清楚後再送出。
            </p>
            <p className="mt-3 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-bold text-crayon-blue">
              今日 AI 解析 {aiUsage.dailyAiCallCount}/{aiDailyLimit}
            </p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="mt-3 text-sm font-bold text-crayon-blue">
                圖片上傳進度 {uploadProgress}%
              </p>
            )}

            <button
              className="sketch-button sketch-button-primary mt-5 flex w-full items-center justify-center gap-3 text-xl font-bold"
              onClick={() => void analyzeWithAi()}
              disabled={isSaving || !canUseAi}
            >
              {isSaving ? <Loader2 className="animate-spin" size={26} /> : <Sparkles size={26} />}
              {isSaving ? "解析中..." : "開始解析"}
            </button>
            <button
              className="sketch-button mt-3 w-full text-lg font-bold text-slate-700"
              onClick={() => setMode("manual")}
            >
              僅手動建檔
            </button>
          </HandCard>
        </div>
      )}
    </div>
  );
}
