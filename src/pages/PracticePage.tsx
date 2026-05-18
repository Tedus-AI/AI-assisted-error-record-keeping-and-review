import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Clock,
  Home,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { HandCard } from "../components/HandCard";
import { optionsForAnswerType } from "../components/OptionEditor";
import { useAppData } from "../hooks/useAppData";
import type { PracticeConfig, Question } from "../types";

const PRACTICE_SESSION_KEY = "active-practice-session";

interface StoredPracticeSession {
  startedAt: string;
  config: PracticeConfig;
  questionIds: string[];
  currentIndex?: number;
  selectedAnswer?: string;
  questionStartedAt?: number;
  elapsedBeforePauseSeconds?: number;
  result?: {
    isCorrect: boolean;
    question: Question;
    seconds: number;
  } | null;
}

export function PracticePage() {
  const { questions, recordAnswer } = useAppData();
  const navigate = useNavigate();
  const [session, setSession] = useState<StoredPracticeSession | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [result, setResult] = useState<{
    isCorrect: boolean;
    question: Question;
    seconds: number;
  } | null>(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [elapsedBeforePauseSeconds, setElapsedBeforePauseSeconds] = useState(0);
  const [tick, setTick] = useState(0);
  const [isPageHidden, setIsPageHidden] = useState(document.hidden);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(PRACTICE_SESSION_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as StoredPracticeSession;
      setSession(parsed);
      setIndex(parsed.currentIndex ?? 0);
      setSelectedAnswer(parsed.selectedAnswer ?? "");
      setStartedAt(parsed.questionStartedAt ?? Date.now());
      setElapsedBeforePauseSeconds(parsed.elapsedBeforePauseSeconds ?? 0);
      setResult(parsed.result ?? null);
    } catch {
      sessionStorage.removeItem(PRACTICE_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    try {
      sessionStorage.setItem(
        PRACTICE_SESSION_KEY,
        JSON.stringify({
          ...session,
          currentIndex: index,
          selectedAnswer,
          questionStartedAt: startedAt,
          elapsedBeforePauseSeconds,
          result,
        })
      );
    } catch {
      // If sessionStorage is unavailable, keep the in-memory practice flow alive.
    }
  }, [elapsedBeforePauseSeconds, index, result, selectedAnswer, session, startedAt]);

  useEffect(() => {
    if (result || isPageHidden) return;
    const intervalId = window.setInterval(() => setTick((current) => current + 1), 1000);
    return () => window.clearInterval(intervalId);
  }, [isPageHidden, result]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!result) {
          setElapsedBeforePauseSeconds(
            (current) =>
              current + Math.max(0, Math.round((Date.now() - startedAt) / 1000))
          );
        }
        setStartedAt(Date.now());
        setIsPageHidden(true);
        return;
      }

      setStartedAt(Date.now());
      setIsPageHidden(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [result, startedAt]);

  const sessionQuestions = useMemo(() => {
    if (!session) return [];
    return session.questionIds
      .map((id) => questions.find((question) => question.id === id))
      .filter(Boolean) as Question[];
  }, [questions, session]);

  const currentQuestion = sessionQuestions[index];
  const answerOptions = currentQuestion
    ? optionsForAnswerType(currentQuestion.answerType, currentQuestion.options)
    : [];
  const elapsedSeconds = useMemo(() => {
    const activeSeconds =
      result || isPageHidden ? 0 : Math.round((Date.now() - startedAt) / 1000);
    return Math.max(1, elapsedBeforePauseSeconds + Math.max(0, activeSeconds));
  }, [elapsedBeforePauseSeconds, isPageHidden, result, startedAt, tick]);
  const progress = sessionQuestions.length
    ? Math.round(((index + 1) / sessionQuestions.length) * 100)
    : 0;

  const submit = async () => {
    if (!currentQuestion || !selectedAnswer || result || isSubmitting) return;
    const seconds = elapsedSeconds;
    setError("");
    setIsSubmitting(true);
    try {
      const response = await recordAnswer(currentQuestion, selectedAnswer, seconds);
      setElapsedBeforePauseSeconds(seconds);
      setStartedAt(Date.now());
      setResult({
        isCorrect: response.isCorrect,
        question: response.updatedQuestion,
        seconds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出答案失敗，請再試一次。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (index + 1 >= sessionQuestions.length) {
      sessionStorage.removeItem(PRACTICE_SESSION_KEY);
      navigate("/stats");
      return;
    }
    setIndex((current) => current + 1);
    setSelectedAnswer("");
    setResult(null);
    setError("");
    setElapsedBeforePauseSeconds(0);
    setStartedAt(Date.now());
  };

  if (!session || sessionQuestions.length === 0) {
    return (
      <EmptyState
        icon={BookMarked}
        title="尚未建立複習場次"
        description="請先到複習設定選擇科目、題數與出題條件。"
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-500">
            {currentQuestion.subject} | {currentQuestion.questionType}
          </p>
          <h1 className="crayon-title text-4xl sm:text-5xl">
            第 <span className="text-crayon-blue">{index + 1}</span> /{" "}
            {sessionQuestions.length} 題
          </h1>
        </div>
        <div className="sketch-card flex items-center gap-2 px-4 py-3 font-bold text-crayon-blue">
          <Clock size={22} />
          已用時間 {elapsedSeconds} 秒
        </div>
      </div>

      <div className="mb-5 h-4 overflow-hidden rounded-full border-2 border-slate-400 bg-white">
        <div className="h-full bg-crayon-blue" style={{ width: `${progress}%` }} />
      </div>

      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 font-bold text-crayon-red">
          {error}
        </p>
      )}

      {!result ? (
        <HandCard className="p-5 sm:p-7" tone="orange" tape>
          {currentQuestion.originalImageUrl && (
            <img
              src={currentQuestion.originalImageUrl}
              alt="題目圖片"
              className="mb-5 max-h-56 rounded-[18px] border-2 border-slate-300 object-contain"
            />
          )}
          <p className="crayon-title mb-6 text-3xl leading-relaxed sm:text-4xl">
            {currentQuestion.convertedQuestion}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {answerOptions.map((option) => (
              <button
                key={option.label}
                className={`sketch-button flex min-h-[86px] items-center gap-4 px-5 text-left text-2xl font-bold ${
                  selectedAnswer === option.label
                    ? "border-crayon-blue bg-crayon-light text-crayon-blue"
                    : "bg-white/65"
                }`}
                onClick={() => setSelectedAnswer(option.label)}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-current font-hand text-3xl">
                  {option.label}
                </span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <button
              className="sketch-button sketch-button-primary flex items-center justify-center gap-3 text-2xl font-bold"
              disabled={!selectedAnswer || isSubmitting}
              onClick={() => void submit()}
            >
              {isSubmitting ? "送出中..." : "送出答案"}
              <ArrowRight size={30} />
            </button>
            <button
              className="sketch-button bg-slate-100 text-2xl font-bold text-slate-400"
              disabled
            >
              下一題
            </button>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-center font-bold text-slate-600">
            <ShieldCheck size={22} />
            複習階段不使用 AI
          </p>
        </HandCard>
      ) : (
        <div className="space-y-5">
          <HandCard
            className="p-6"
            tone={result.isCorrect ? "green" : "orange"}
            tape
          >
            <div className="grid gap-5 lg:grid-cols-[230px_1fr] lg:items-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 bg-white text-7xl">
                {result.isCorrect ? (
                  <CheckCircle2 className="text-crayon-green" size={100} />
                ) : (
                  <XCircle className="text-crayon-red" size={100} />
                )}
              </div>
              <div>
                <h2
                  className={`crayon-title text-5xl ${
                    result.isCorrect ? "text-crayon-green" : "text-crayon-red"
                  }`}
                >
                  {result.isCorrect ? "答對了！" : "再練一次！"}
                </h2>
                <p className="mt-3 text-2xl font-bold">
                  正確答案：
                  <span className="text-crayon-green">
                    {currentQuestion.confirmedAnswer ?? currentQuestion.correctAnswer}
                  </span>
                </p>
              </div>
            </div>
          </HandCard>

          <HandCard className="p-5" tone="blue">
            <h2 className="crayon-title mb-3 text-3xl">解題說明</h2>
            <p className="text-xl font-semibold leading-9 text-slate-700">
              {currentQuestion.explanation || "此題尚未儲存解題說明。"}
            </p>
          </HandCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <HandCard className="p-4 text-center" tone="purple">
              <Clock className="mx-auto mb-2 text-crayon-purple" />
              <p className="text-sm font-bold text-slate-500">作答時間</p>
              <p className="crayon-title text-3xl">{result.seconds} 秒</p>
            </HandCard>
            <HandCard className="p-4 text-center" tone="green">
              <BookMarked className="mx-auto mb-2 text-crayon-green" />
              <p className="text-sm font-bold text-slate-500">本次已答對</p>
              <p className="crayon-title text-3xl">
                {index + (result.isCorrect ? 1 : 0)} 題
              </p>
            </HandCard>
            <HandCard className="p-4 text-center" tone="blue">
              <ShieldCheck className="mx-auto mb-2 text-crayon-blue" />
              <p className="text-sm font-bold text-slate-500">AI 呼叫</p>
              <p className="crayon-title text-3xl">0 次</p>
            </HandCard>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              className="sketch-button sketch-button-primary flex items-center justify-center gap-3 text-2xl font-bold"
              onClick={next}
            >
              {index + 1 >= sessionQuestions.length ? "完成並看統計" : "下一題"}
              <ArrowRight size={30} />
            </button>
            <Link
              to="/"
              className="sketch-button flex items-center justify-center gap-3 text-2xl font-bold text-crayon-blue"
            >
              結束複習
              <Home size={30} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
