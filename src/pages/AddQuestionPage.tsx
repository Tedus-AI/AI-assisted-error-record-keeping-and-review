import { useEffect, useMemo, useState } from "react";
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
import { AIDebugPanel } from "../components/AIDebugPanel";
import { HandCard } from "../components/HandCard";
import {
  OptionEditor,
  emptyOptions,
  normalizeAnswerForType,
  optionsForAnswerType,
} from "../components/OptionEditor";
import { PageHeader } from "../components/PageHeader";
import {
  answerTypeForQuestionType,
  questionTypeOptions,
  subjectOptions,
} from "../data/options";
import { analyzeQuestion, getAIQuestionDebug } from "../services/aiService";
import { hasGoogleAISettings } from "../services/aiSettings";
import {
  fileToCompressedDataUrl,
  fileToCroppedDataUrl,
} from "../services/storageService";
import { useAppData } from "../hooks/useAppData";
import type {
  AIDebugSnapshot,
  CropMeta,
  QuestionOption,
  QuestionType,
} from "../types";

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
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [subject, setSubject] = useState(subjectOptions[1]);
  const [questionType, setQuestionType] = useState<QuestionType>("選擇題");
  const answerType = answerTypeForQuestionType(questionType);
  const [convertedQuestion, setConvertedQuestion] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>(emptyOptions(answerType));
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [aiText, setAiText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [cropPreview, setCropPreview] = useState("");
  const [crop, setCrop] = useState<CropMeta>(initialCrop);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [debugSnapshot, setDebugSnapshot] = useState<AIDebugSnapshot | null>(null);

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

  const updateQuestionType = (nextQuestionType: QuestionType) => {
    const nextAnswerType = answerTypeForQuestionType(nextQuestionType);
    setQuestionType(nextQuestionType);
    setOptions((current) => optionsForAnswerType(nextAnswerType, current));
    setCorrectAnswer((current) => normalizeAnswerForType(current, nextAnswerType));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setImageFile(file);
    setCrop(initialCrop);
    setCropPreview("");
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  useEffect(() => {
    if (!imagePreview.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (!imageFile) {
      setCropPreview("");
      return;
    }

    let isCanceled = false;
    const timeoutId = window.setTimeout(() => {
      void fileToCroppedDataUrl(imageFile, crop, 720, 0.86)
        .then((preview) => {
          if (!isCanceled) setCropPreview(preview);
        })
        .catch(() => {
          if (!isCanceled) setCropPreview("");
        });
    }, 180);

    return () => {
      isCanceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [crop, imageFile]);

  const saveManual = async () => {
    setError("");
    setMessage("");
    if (!selectedChild) {
      setError("請先選擇小朋友。");
      return;
    }
    if (!convertedQuestion.trim()) {
      setError("請輸入題目內容。");
      return;
    }

    setIsSaving(true);
    try {
      const normalizedOptions = optionsForAnswerType(answerType, filteredOptions);
      const normalizedAnswer = normalizeAnswerForType(correctAnswer, answerType);
      await addQuestion({
        childId: selectedChild.id,
        subject,
        questionType,
        answerType,
        convertedQuestion: convertedQuestion.trim(),
        options: normalizedOptions,
        correctAnswer: normalizedAnswer,
        confirmedAnswer: normalizedAnswer,
        explanation,
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
        tags: [subject, questionType],
      });
      setMessage("題目已儲存到題庫。");
      setConvertedQuestion("");
      setExplanation("");
      setOptions(emptyOptions(answerType));
      setCorrectAnswer("A");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗。");
    } finally {
      setIsSaving(false);
    }
  };

  const analyzeWithAi = async () => {
    setError("");
    setMessage("");
    setDebugSnapshot(null);
    if (!selectedChild || !user) {
      setError("請先登入並選擇小朋友。");
      return;
    }
    if (!canUseAi) {
      setError("AI 解析今日額度已用完，請改用手動新增。");
      setMode("manual");
      return;
    }
    if (!imageFile && !aiText.trim()) {
      setError("請先拍照、選圖，或輸入補充文字。");
      return;
    }
    if (!user.isDemo && !hasGoogleAISettings()) {
      setError("尚未設定 Google AI Studio API Key，請先到設定頁填入 API Key 與模型。");
      return;
    }

    setIsSaving(true);
    try {
      const originalImageDataUrl = imageFile
        ? await fileToCompressedDataUrl(imageFile)
        : undefined;
      const croppedImageDataUrl = imageFile
        ? await fileToCroppedDataUrl(imageFile, crop)
        : undefined;
      const imageDataUrl = croppedImageDataUrl ?? originalImageDataUrl;
      setUploadProgress(imageDataUrl ? 100 : 0);
      const result = await analyzeQuestion({
        subject,
        questionType,
        imageUrl: imageDataUrl,
        imageDataUrl,
        text: aiText,
        useMock: user.isDemo,
      });
      const { debug, ...reviewResult } = result;
      setDebugSnapshot(debug ?? null);
      savePendingAIReview({
        imageUrl: originalImageDataUrl,
        croppedImageUrl: croppedImageDataUrl,
        cropMeta: crop,
        debug,
        result: reviewResult,
      });
      refreshAIUsage();
      navigate("/review-ai-result");
    } catch (err) {
      const debug = getAIQuestionDebug(err);
      if (debug) setDebugSnapshot(debug);
      setError(err instanceof Error ? err.message : "AI 解析失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  const commonSelectors = (
    <div className="grid gap-4 sm:grid-cols-2">
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
        <span className="mb-2 block font-bold">題目類型</span>
        <select
          className="sketch-input"
          value={questionType}
          onChange={(event) => updateQuestionType(event.target.value as QuestionType)}
        >
          {questionTypeOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="新增錯題"
        eyebrow="先選科目與題型，再拍照、上傳或手動輸入。"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <button
          className={`sketch-button flex items-center justify-center gap-3 px-5 text-xl font-bold ${
            mode === "manual" ? "sketch-button-primary" : ""
          }`}
          onClick={() => setMode("manual")}
        >
          <Pencil size={26} />
          手動新增
        </button>
        <button
          className={`sketch-button flex items-center justify-center gap-3 px-5 text-xl font-bold ${
            mode === "ai" ? "sketch-button-primary" : ""
          }`}
          onClick={() => setMode("ai")}
        >
          <Bot size={26} />
          AI 解析新增
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
          {commonSelectors}

          <label className="mt-5 block">
            <span className="mb-2 block font-bold">題目</span>
            <textarea
              className="sketch-input min-h-[150px]"
              value={convertedQuestion}
              onChange={(event) => setConvertedQuestion(event.target.value)}
              placeholder="請輸入要讓小朋友複習的題目"
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
                  {optionsForAnswerType(answerType, options).map((option) => (
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

          <label className="mt-5 block">
            <span className="mb-2 block font-bold">解題說明</span>
            <textarea
              className="sketch-input min-h-[140px]"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder="寫下解題步驟或提醒"
            />
          </label>

          <button
            className="sketch-button sketch-button-primary mt-6 flex w-full items-center justify-center gap-3 text-xl font-bold"
            onClick={() => void saveManual()}
            disabled={isSaving}
          >
            <Save size={26} />
            {isSaving ? "儲存中..." : "儲存到題庫"}
          </button>
        </HandCard>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <HandCard className="p-5" tone="blue" tape>
            {commonSelectors}

            <div className="mb-4 mt-5 flex flex-wrap gap-3">
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
                選擇圖片
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
              </label>
            </div>

            {imagePreview ? (
              <div className="space-y-4">
                <CropSelector imageUrl={imagePreview} crop={crop} onChange={setCrop} />
                {cropPreview && (
                  <div className="rounded-[18px] border-2 border-crayon-blue bg-blue-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-bold text-crayon-blue">AI 送出裁切預覽</span>
                      <span className="text-xs font-bold text-slate-500">
                        這張圖會送給模型
                      </span>
                    </div>
                    <img
                      src={cropPreview}
                      alt="AI 送出裁切預覽"
                      className="max-h-64 w-full rounded-[12px] border-2 border-white object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border-4 border-dashed border-crayon-blue bg-blue-50/50 p-8 text-center">
                <Upload className="mb-4 text-crayon-blue" size={54} />
                <h2 className="crayon-title text-3xl">上傳錯題圖片</h2>
                <p className="mt-2 max-w-md font-semibold text-slate-600">
                  拍照或選圖後，用藍框圈出單一題目，AI 只會看到裁切預覽中的內容。
                </p>
              </div>
            )}

            <label className="mt-5 block">
              <span className="mb-2 block font-bold">補充文字</span>
              <textarea
                className="sketch-input min-h-[110px]"
                value={aiText}
                onChange={(event) => setAiText(event.target.value)}
                placeholder="可選，例如：這題老師判錯的是第 2 題"
              />
            </label>
          </HandCard>

          <HandCard className="p-5" tone="orange">
            <h2 className="crayon-title mb-4 text-3xl">解析設定</h2>
            <div className="space-y-3">
              {[
                ["科目", subject],
                ["題型", questionType],
                ["答案形式", answerType === "true_false" ? "對 / 錯" : "A-D 選擇題"],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[18px] border-2 border-slate-300 bg-white/60 p-4"
                >
                  <div className="flex items-center gap-3">
                    <CircleCheck className="text-crayon-blue" />
                    <div>
                      <p className="font-bold">{title}</p>
                      <p className="text-sm font-semibold text-slate-500">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-bold text-crayon-blue">
              今日 AI 解析 {aiUsage.dailyAiCallCount}/{aiDailyLimit}
            </p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="mt-3 text-sm font-bold text-crayon-blue">
                圖片處理進度 {uploadProgress}%
              </p>
            )}

            <button
              className="sketch-button sketch-button-primary mt-5 flex w-full items-center justify-center gap-3 text-xl font-bold"
              onClick={() => void analyzeWithAi()}
              disabled={isSaving || !canUseAi}
            >
              {isSaving ? <Loader2 className="animate-spin" size={26} /> : <Sparkles size={26} />}
              {isSaving ? "解析中..." : "開始 AI 解析"}
            </button>
            <button
              className="sketch-button mt-3 w-full text-lg font-bold text-slate-700"
              onClick={() => setMode("manual")}
            >
              改用手動新增
            </button>
          </HandCard>

          {debugSnapshot && (
            <div className="xl:col-span-2">
              <AIDebugPanel debug={debugSnapshot} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
