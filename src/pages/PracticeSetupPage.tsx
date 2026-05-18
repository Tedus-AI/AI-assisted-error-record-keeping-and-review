import { useMemo, useState } from "react";
import { ArrowLeft, Play, ShieldCheck, Target } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { HandCard } from "../components/HandCard";
import { PageHeader } from "../components/PageHeader";
import { questionTypeOptions } from "../data/options";
import { useAppData } from "../hooks/useAppData";
import type { PracticeConfig, QuestionType } from "../types";
import { pickQuestions } from "../utils/questionPicker";

export function PracticeSetupPage() {
  const { selectedChild, questions, hasParentPin, isParentMode } = useAppData();
  const navigate = useNavigate();
  const parentAccessAllowed = !hasParentPin || isParentMode;
  const approved = questions.filter(
    (question) =>
      question.childId === selectedChild?.id && question.reviewStatus === "approved"
  );
  const subjects = Array.from(new Set(approved.map((question) => question.subject)));
  const [subject, setSubject] = useState("");
  const [questionType, setQuestionType] = useState<"" | QuestionType>("");
  const [questionCount, setQuestionCount] = useState(10);
  const [prioritizeWrong, setPrioritizeWrong] = useState(true);
  const [excludeMastered, setExcludeMastered] = useState(false);
  const [error, setError] = useState("");

  const config: PracticeConfig | null = selectedChild
    ? {
        childId: selectedChild.id,
        subject: subject || undefined,
        questionType: questionType || undefined,
        questionCount,
        prioritizeWrong,
        excludeMastered,
      }
    : null;

  const picked = useMemo(
    () => (config ? pickQuestions(questions, config) : []),
    [config, questions]
  );

  const lowMasteryCount = picked.filter((question) => question.masteryLevel <= 2).length;
  const highRiskCount = picked.filter((question) => question.wrongCount >= 2).length;

  const start = () => {
    setError("");
    if (!config || picked.length === 0) {
      setError("目前沒有符合條件的已確認題目，請先新增或調整篩選。");
      return;
    }

    const now = Date.now();
    sessionStorage.setItem(
      "active-practice-session",
      JSON.stringify({
        startedAt: new Date(now).toISOString(),
        config,
        questionIds: picked.map((question) => question.id),
        currentIndex: 0,
        selectedAnswer: "",
        questionStartedAt: now,
        elapsedBeforePauseSeconds: 0,
        result: null,
      })
    );
    navigate("/practice");
  };

  return (
    <div>
      <PageHeader
        title="複習設定"
        eyebrow="依科目、題型與熟練度安排練習，不會重新呼叫 AI。"
      />

      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 font-bold text-crayon-red">
          {error}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <HandCard className="p-5" tone="orange" tape>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block font-bold">科目</span>
              <select
                className="sketch-input"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                <option value="">全部科目</option>
                {subjects.map((item) => (
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
                onChange={(event) => setQuestionType(event.target.value as "" | QuestionType)}
              >
                <option value="">全部題型</option>
                {questionTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">題數</span>
              <span className="crayon-title text-2xl text-crayon-blue">
                {questionCount} 題
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={5}
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
              className="w-full accent-crayon-blue"
            />
            <div className="mt-2 flex justify-between text-sm font-bold text-slate-500">
              <span>5 題</span>
              <span>10 題</span>
              <span>15 題</span>
              <span>20 題</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-[18px] border-2 border-slate-300 bg-white/60 p-4">
              <span className="flex items-center gap-3">
                <Target className="text-crayon-blue" size={32} />
                <span>
                  <span className="block font-bold">優先複習錯過的題目</span>
                  <span className="text-sm font-semibold text-slate-500">
                    依答錯次數與熟練度排序
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                className="h-8 w-8 accent-crayon-blue"
                checked={prioritizeWrong}
                onChange={(event) => setPrioritizeWrong(event.target.checked)}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-[18px] border-2 border-slate-300 bg-white/60 p-4">
              <span className="flex items-center gap-3">
                <ShieldCheck className="text-crayon-green" size={32} />
                <span>
                  <span className="block font-bold">排除已熟練題目</span>
                  <span className="text-sm font-semibold text-slate-500">
                    排除 masteryLevel = 5 的題目
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                className="h-8 w-8 accent-crayon-green"
                checked={excludeMastered}
                onChange={(event) => setExcludeMastered(event.target.checked)}
              />
            </label>
          </div>
        </HandCard>

        <HandCard className="p-5" tone="green" tape>
          <h2 className="crayon-title mb-4 text-3xl">本次複習</h2>
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-crayon-blue bg-crayon-light text-3xl font-bold text-crayon-blue">
              {selectedChild?.name.slice(0, 1) ?? "小"}
            </div>
            <div>
              <p className="crayon-title text-3xl">{selectedChild?.name ?? "小朋友"}</p>
              <p className="font-bold text-slate-500">{selectedChild?.grade}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-[16px] border-2 border-slate-300 bg-white/60 p-3">
              <span className="font-bold">可用題目</span>
              <span className="crayon-title text-3xl">{approved.length} 題</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] border-2 border-slate-300 bg-white/60 p-3">
              <span className="font-bold">本次題目</span>
              <span className="crayon-title text-3xl text-crayon-blue">
                {picked.length} 題
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[16px] border-2 border-crayon-purple bg-purple-50 p-3 text-center">
                <p className="text-sm font-bold text-crayon-purple">低熟練</p>
                <p className="crayon-title text-3xl">{lowMasteryCount}</p>
              </div>
              <div className="rounded-[16px] border-2 border-crayon-orange bg-orange-50 p-3 text-center">
                <p className="text-sm font-bold text-crayon-orange">常錯</p>
                <p className="crayon-title text-3xl">{highRiskCount}</p>
              </div>
              <div className="rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 text-center">
                <p className="text-sm font-bold text-crayon-green">新題</p>
                <p className="crayon-title text-3xl">
                  {picked.filter((question) => question.totalAttemptCount === 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {parentAccessAllowed && (
              <Link
                to="/question-bank"
                className="sketch-button flex items-center justify-center gap-2 px-5 text-lg font-bold text-crayon-blue"
              >
                <ArrowLeft size={24} />
                返回題庫
              </Link>
            )}
            <button
              className="sketch-button sketch-button-primary flex items-center justify-center gap-2 px-5 text-xl font-bold"
              onClick={start}
            >
              <Play size={26} />
              開始複習
            </button>
          </div>
          <p className="mt-4 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-bold text-crayon-blue">
            複習只使用已確認題庫，不會消耗 AI 額度。
          </p>
        </HandCard>
      </div>
    </div>
  );
}
