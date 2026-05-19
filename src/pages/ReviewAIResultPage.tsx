import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FolderPlus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AIDebugPanel } from "../components/AIDebugPanel";
import { EmptyState } from "../components/EmptyState";
import { HandCard } from "../components/HandCard";
import {
  OptionEditor,
  normalizeAnswerForType,
  optionsForAnswerType,
} from "../components/OptionEditor";
import { PageHeader } from "../components/PageHeader";
import {
  answerTypeForQuestionType,
  examScopeOptionsForGrade,
  questionTypeOptions,
  subjectOptions,
} from "../data/options";
import { useAppData } from "../hooks/useAppData";
import { getGoogleAISettings } from "../services/aiSettings";
import type { PendingAIReview, QuestionOption, QuestionType } from "../types";

export function ReviewAIResultPage() {
  const {
    user,
    selectedChild,
    addQuestion,
    getPendingAIReview,
    clearPendingAIReview,
  } = useAppData();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingAIReview | null>(null);
  const [subject, setSubject] = useState(subjectOptions[1]);
  const examScopeOptions = useMemo(
    () => examScopeOptionsForGrade(selectedChild?.grade),
    [selectedChild?.grade]
  );
  const [examScope, setExamScope] = useState(examScopeOptions[0]);
  const [questionType, setQuestionType] = useState<QuestionType>("選擇題");
  const answerType = answerTypeForQuestionType(questionType);
  const [originalQuestionText, setOriginalQuestionText] = useState("");
  const [convertedQuestion, setConvertedQuestion] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [keepCroppedImage, setKeepCroppedImage] = useState(false);

  useEffect(() => {
    const review = getPendingAIReview();
    setPending(review);
    if (!review) return;
    setSubject(review.result.subject);
    setExamScope(review.examScope ?? examScopeOptions[0]);
    setQuestionType(review.result.questionType);
    setOriginalQuestionText(review.result.originalQuestionText);
    setConvertedQuestion(review.result.convertedQuestion);
    setOptions(optionsForAnswerType(review.result.answerType, review.result.options));
    setCorrectAnswer(
      normalizeAnswerForType(review.result.correctAnswer, review.result.answerType)
    );
    setExplanation(review.result.explanation);
  }, [examScopeOptions, getPendingAIReview]);

  const handleQuestionTypeChange = (nextQuestionType: QuestionType) => {
    const nextAnswerType = answerTypeForQuestionType(nextQuestionType);
    setQuestionType(nextQuestionType);
    setOptions((current) => optionsForAnswerType(nextAnswerType, current));
    setCorrectAnswer((current) => normalizeAnswerForType(current, nextAnswerType));
  };

  const save = async (status: "approved" | "needs_manual_edit") => {
    if (!selectedChild || !pending) return;
    const keptCroppedImageUrl = keepCroppedImage ? pending.croppedImageUrl : undefined;
    const aiModel = user?.isDemo ? "mock_gemma_free" : getGoogleAISettings().modelId;
    const normalizedOptions = optionsForAnswerType(answerType, options);
    const normalizedAnswer = normalizeAnswerForType(correctAnswer, answerType);

    setMessage("");
    setError("");
    setIsSaving(true);
    try {
      await addQuestion({
        childId: selectedChild.id,
        subject,
        examScope,
        questionType,
        answerType,
        croppedImageUrl: keptCroppedImageUrl,
        cropMeta: keptCroppedImageUrl ? pending.cropMeta : undefined,
        originalQuestionText,
        convertedQuestion,
        options: normalizedOptions,
        correctAnswer: normalizedAnswer,
        aiSuggestedAnswer: pending.result.correctAnswer,
        confirmedAnswer: status === "approved" ? normalizedAnswer : undefined,
        explanation,
        sourceType: "photo",
        aiProcessed: true,
        aiProcessCount: 1,
        aiModel,
        aiConfidence: pending.result.confidence,
        isUserConfirmed: status === "approved",
        reviewStatus: status,
        correctCount: 0,
        wrongCount: 0,
        totalAttemptCount: 0,
        masteryLevel: 0,
        lastReviewedAt: null,
        tags: [subject, questionType, examScope],
      });
      clearPendingAIReview();
      navigate("/question-bank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗，請再試一次。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!pending) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="沒有待確認的 AI 結果"
        description="請回到新增錯題，拍照或選圖後重新解析。"
      />
    );
  }

  const lowConfidence = pending.result.confidence < 0.75;
  const reviewImageUrl = pending.croppedImageUrl ?? pending.imageUrl;
  const shouldShowCropOverlay = Boolean(!pending.croppedImageUrl && pending.cropMeta);

  return (
    <div>
      <PageHeader
        title="AI 解析確認"
        eyebrow="AI 結果必須由家長確認後才可進入複習。"
        actions={
          <Link
            to="/add-question"
            className="sketch-button flex items-center gap-2 px-5 text-lg font-bold text-crayon-blue"
          >
            <ArrowLeft size={23} />
            返回新增錯題
          </Link>
        }
      />

      {message && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-orange bg-orange-50 p-3 font-bold text-crayon-orange">
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 font-bold text-crayon-red">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <span className="rounded-[16px] border-2 border-crayon-orange bg-orange-50 px-4 py-2 font-bold text-crayon-orange">
          pending_review
        </span>
        <span className="rounded-[16px] border-2 border-crayon-blue bg-blue-50 px-4 py-2 font-bold text-crayon-blue">
          AI 信心分數 {pending.result.confidence.toFixed(2)}
        </span>
        {lowConfidence && (
          <span className="rounded-[16px] border-2 border-crayon-red bg-red-50 px-4 py-2 font-bold text-crayon-red">
            信心較低，請確認題目與答案。
          </span>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <HandCard className="p-4" tone="purple" tape>
            <h2 className="crayon-title mb-3 text-2xl">AI 看到的圖片</h2>
            {reviewImageUrl ? (
              <div className="relative overflow-hidden rounded-[18px] border-2 border-slate-500 bg-white">
                <img src={reviewImageUrl} alt="AI 解析裁切圖片" className="w-full" />
                {shouldShowCropOverlay && pending.cropMeta && (
                  <div
                    className="absolute border-4 border-crayon-blue"
                    style={{
                      left: `${pending.cropMeta.x}%`,
                      top: `${pending.cropMeta.y}%`,
                      width: `${pending.cropMeta.width}%`,
                      height: `${pending.cropMeta.height}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="rounded-[18px] border-2 border-dashed border-slate-400 p-8 text-center font-bold text-slate-500">
                使用文字解析，沒有圖片
              </div>
            )}
          </HandCard>

          <HandCard className="p-4" tone="green">
            <h2 className="crayon-title mb-3 text-2xl">送出圖片</h2>
            <div className="rounded-[18px] border-2 border-slate-400 bg-white/65 p-4 text-sm font-semibold leading-6 text-slate-600">
              AI 解析使用實際裁切圖；上方圖片就是送給模型的內容。
            </div>
          </HandCard>

          {pending.debug && <AIDebugPanel debug={pending.debug} />}
        </div>

        <HandCard className="p-5" tone="blue" tape>
          <h2 className="crayon-title mb-4 flex items-center gap-2 text-3xl">
            <Edit3 className="text-crayon-blue" />
            AI 解析結果
          </h2>

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
              <span className="mb-2 block font-bold">題目範圍</span>
              <select
                className="sketch-input"
                value={examScope}
                onChange={(event) => setExamScope(event.target.value)}
              >
                {examScopeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block font-bold">題目類型</span>
              <select
                className="sketch-input"
                value={questionType}
                onChange={(event) =>
                  handleQuestionTypeChange(event.target.value as QuestionType)
                }
              >
                {questionTypeOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block font-bold">AI 辨識題目</span>
            <textarea
              className="sketch-input min-h-[92px]"
              value={originalQuestionText}
              onChange={(event) => setOriginalQuestionText(event.target.value)}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block font-bold">複習題目</span>
            <textarea
              className="sketch-input min-h-[92px]"
              value={convertedQuestion}
              onChange={(event) => setConvertedQuestion(event.target.value)}
            />
          </label>

          <div className="mt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <span className="block font-bold">選項內容</span>
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

          <label className="mt-4 block">
            <span className="mb-2 block font-bold">解題說明</span>
            <textarea
              className="sketch-input min-h-[150px]"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </label>

          <label className="mt-4 flex items-start justify-between gap-4 rounded-[18px] border-2 border-crayon-purple bg-purple-50/70 p-4">
            <span>
              <span className="block font-bold text-crayon-purple">
                保留裁切照片到題庫
              </span>
              <span className="mt-1 block text-sm font-semibold text-slate-600">
                有小圖示或題目排版需要看原圖時再勾選；未勾選就不會把 base64 圖片寫進題目資料。
              </span>
            </span>
            <input
              type="checkbox"
              className="mt-1 h-8 w-8 shrink-0 accent-crayon-purple"
              checked={keepCroppedImage}
              disabled={!pending.croppedImageUrl}
              onChange={(event) => setKeepCroppedImage(event.target.checked)}
            />
          </label>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              className="sketch-button sketch-button-primary flex items-center justify-center gap-2 px-4 text-lg font-bold"
              onClick={() => void save("approved")}
              disabled={isSaving}
            >
              <FolderPlus size={24} />
              {isSaving ? "儲存中..." : "儲存進題庫"}
            </button>
            <button
              className="sketch-button flex items-center justify-center gap-2 px-4 text-lg font-bold text-crayon-orange"
              onClick={() => void save("needs_manual_edit")}
              disabled={isSaving}
            >
              <Edit3 size={24} />
              先存待修改
            </button>
            <button
              className="sketch-button sketch-button-danger flex items-center justify-center gap-2 px-4 text-lg font-bold"
              onClick={() => {
                clearPendingAIReview();
                navigate("/add-question");
              }}
            >
              <Trash2 size={24} />
              捨棄
            </button>
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 text-sm font-bold text-crayon-green">
            <CheckCircle2 size={20} />
            信心分數只供參考；請以家長確認後的題目與答案為準。
          </p>
        </HandCard>
      </div>
    </div>
  );
}
