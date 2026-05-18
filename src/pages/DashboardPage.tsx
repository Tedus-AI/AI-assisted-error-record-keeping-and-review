import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  CheckCircle2,
  CirclePlus,
  ClipboardList,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { HandCard } from "../components/HandCard";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAppData } from "../hooks/useAppData";
import { accuracy, getWeeklyAttempts, groupBySubject } from "../utils/stats";

export function DashboardPage() {
  const { selectedChild, questions, attempts, hasParentPin, isParentMode } = useAppData();
  const parentAccessAllowed = !hasParentPin || isParentMode;
  const childQuestions = questions.filter(
    (question) => question.childId === selectedChild?.id
  );
  const childAttempts = attempts.filter((attempt) => attempt.childId === selectedChild?.id);
  const weeklyAttempts = getWeeklyAttempts(childAttempts);
  const approved = childQuestions.filter((question) => question.reviewStatus === "approved");
  const pending = childQuestions.filter(
    (question) => question.reviewStatus === "pending_review"
  );
  const totalCorrect = childQuestions.reduce(
    (sum, question) => sum + question.correctCount,
    0
  );
  const totalAttempts = childQuestions.reduce(
    (sum, question) => sum + question.totalAttemptCount,
    0
  );
  const subjectStats = groupBySubject(childQuestions);
  const weakSubject =
    subjectStats
      .filter((item) => item.count > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount || a.accuracy - b.accuracy)[0] ??
    null;
  const lowMastery = approved.filter((question) => question.masteryLevel <= 2);
  const recent = [...childQuestions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="首頁 Dashboard"
        eyebrow="掌握學習重點，精準複習"
        actions={
          <>
            <Link
              to="/practice-setup"
              className="sketch-button sketch-button-primary flex items-center gap-2 px-5 text-lg font-bold"
            >
              <BookOpenCheck size={25} />
              開始複習
            </Link>
            {parentAccessAllowed && (
              <Link
                to="/add-question"
                className="sketch-button sketch-button-green flex items-center gap-2 px-5 text-lg font-bold"
              >
                <CirclePlus size={25} />
                新增錯題
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarCheck}
          label="今日建議複習"
          value={`${lowMastery.length} 題`}
          helper={lowMastery.length ? "依低熟練度與錯題安排" : "目前沒有低熟練度題目"}
          tone="blue"
        />
        <MetricCard
          icon={ClipboardList}
          label="已建立題目數"
          value={`${childQuestions.length} 題`}
          helper={`${approved.length} 題可複習`}
          tone="green"
        />
        <MetricCard
          icon={BookOpenCheck}
          label="本週練習題數"
          value={`${weeklyAttempts.length} 題`}
          helper="最近 7 日作答"
          tone="purple"
        />
        <MetricCard
          icon={Target}
          label="總正確率"
          value={`${accuracy(totalCorrect, totalAttempts)}%`}
          helper={totalAttempts ? "依所有作答紀錄計算" : "尚未開始作答"}
          tone="orange"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <HandCard className="min-w-0 p-5" tone="orange" tape>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="crayon-title text-3xl">弱點洞察</h2>
              <p className="mt-1 font-semibold text-slate-500">從已儲存題庫與作答紀錄推算，不呼叫 AI。</p>
            </div>
            <Link className="font-bold text-crayon-blue" to="/stats">
              查看弱點分析 <ArrowRight className="inline" size={18} />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex shrink-0 items-center justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-crayon-red bg-red-50 text-crayon-red sm:h-32 sm:w-32">
                <Target size={78} strokeWidth={2.7} />
              </div>
            </div>
            <div className="min-w-[220px] flex-1">
              <div className="grid gap-2 text-lg font-bold sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <p className="break-words">
                  最弱科目：
                  <span className="text-crayon-blue">{weakSubject?.subject ?? "尚無資料"}</span>
                </p>
                <p>
                  低熟練度題目：
                  <span className="text-crayon-red">{lowMastery.length} 題</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-3">
                <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                  <p className="text-sm font-bold text-slate-500">待確認 AI 題</p>
                  <p className="crayon-title text-2xl text-crayon-orange sm:text-3xl">{pending.length}</p>
                </div>
                <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                  <p className="text-sm font-bold text-slate-500">低熟練度</p>
                  <p className="crayon-title text-2xl text-crayon-purple sm:text-3xl">{lowMastery.length}</p>
                </div>
                <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                  <p className="text-sm font-bold text-slate-500">本週正確率</p>
                  <p className="crayon-title text-2xl text-crayon-green sm:text-3xl">
                    {accuracy(
                      weeklyAttempts.filter((attempt) => attempt.isCorrect).length,
                      weeklyAttempts.length
                    )}
                    %
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                建議先安排「{weakSubject?.subject ?? "數學"}」與低熟練度題目，讓孩子考前複習更集中。
              </p>
            </div>
          </div>
        </HandCard>

        <HandCard className="min-w-0 p-5" tone="blue">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="crayon-title text-3xl">最近動態</h2>
            {parentAccessAllowed && (
              <Link className="font-bold text-crayon-blue" to="/question-bank">
                查看全部
              </Link>
            )}
          </div>
          <div className="space-y-3">
            {recent.map((question) => (
              <div
                key={question.id}
                className="flex items-center gap-3 rounded-[16px] border-2 border-slate-200 bg-white/55 p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-crayon-light text-crayon-blue">
                  {question.reviewStatus === "approved" ? (
                    <CheckCircle2 />
                  ) : (
                    <AlertTriangle />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{question.convertedQuestion}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {question.subject} / {question.questionType}
                  </p>
                </div>
                <StatusBadge status={question.reviewStatus} />
              </div>
            ))}
          </div>
        </HandCard>
      </div>
    </div>
  );
}
