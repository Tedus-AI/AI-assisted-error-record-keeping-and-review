import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  Loader2,
  Trash2,
} from "lucide-react";
import { HandCard } from "../components/HandCard";
import { MasteryDots } from "../components/MasteryDots";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { useAppData } from "../hooks/useAppData";
import { accuracy, getWeeklyAttempts, groupBySubject } from "../utils/stats";

export function StatsPage() {
  const { selectedChild, questions, attempts, clearReviewRecords } = useAppData();
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const childQuestions = questions.filter(
    (question) => question.childId === selectedChild?.id
  );
  const childAttempts = attempts.filter((attempt) => attempt.childId === selectedChild?.id);
  const weeklyAttempts = getWeeklyAttempts(childAttempts);
  const weeklyCorrect = weeklyAttempts.filter((attempt) => attempt.isCorrect).length;
  const hasReviewStats = childQuestions.some(
    (question) =>
      question.totalAttemptCount > 0 ||
      question.correctCount > 0 ||
      question.wrongCount > 0 ||
      question.masteryLevel > 0 ||
      Boolean(question.lastReviewedAt)
  );
  const canClearReviewRecords = childAttempts.length > 0 || hasReviewStats;
  const subjectStats = groupBySubject(childQuestions);
  const lowMastery = [...childQuestions]
    .filter((question) => question.reviewStatus === "approved" && question.masteryLevel <= 2)
    .sort((a, b) => a.masteryLevel - b.masteryLevel || b.wrongCount - a.wrongCount)
    .slice(0, 6);
  const unitWrong = Array.from(new Set(childQuestions.map((item) => item.unit)))
    .map((unit) => ({
      unit,
      wrong: childQuestions
        .filter((question) => question.unit === unit)
        .reduce((sum, question) => sum + question.wrongCount, 0),
    }))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 5);

  const clearRecords = async () => {
    if (!selectedChild || !canClearReviewRecords) return;

    const confirmed = window.confirm(
      `確定要清空「${selectedChild.name}」的複習紀錄嗎？這會刪除作答紀錄，並重置題目的答對答錯、熟練度與最後複習時間；題庫題目本身不會刪除。`
    );
    if (!confirmed) return;

    setIsClearing(true);
    setMessage("");
    setError("");
    try {
      await clearReviewRecords(selectedChild.id);
      setMessage("已清空複習紀錄，題庫題目仍保留。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空複習紀錄失敗，請稍後重試。");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="弱點統計"
        eyebrow="追蹤各科表現、錯題分布與低熟練度題目"
      />

      {message && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 text-sm font-bold text-crayon-green">
          <CheckCircle2 className="mr-2 inline" size={20} />
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-[16px] border-2 border-crayon-red bg-red-50 p-3 text-sm font-bold text-crayon-red">
          <AlertTriangle className="mr-2 inline" size={20} />
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ListChecks}
          label="各科題目數"
          value={`${childQuestions.length} 題`}
          helper="本週總題數"
          tone="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="本週正確率"
          value={`${accuracy(weeklyCorrect, weeklyAttempts.length)}%`}
          helper="最近 7 日作答"
          tone="orange"
        />
        <MetricCard
          icon={AlertTriangle}
          label="低熟練度題目"
          value={`${lowMastery.length} 題`}
          helper="熟練度 0-2"
          tone="purple"
        />
        <MetricCard
          icon={CalendarDays}
          label="最近練習次數"
          value={`${weeklyAttempts.length} 次`}
          helper="最近 7 日作答"
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <HandCard className="min-w-0 p-5" tone="orange" tape>
          <h2 className="crayon-title mb-5 text-3xl">各科題目數 / 正確率</h2>
          <div className="space-y-4">
            {subjectStats.map((item) => (
              <div key={item.subject}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 font-bold">
                  <span className="min-w-0 break-words">{item.subject}</span>
                  <span className="shrink-0">
                    {item.count} 題 / {item.accuracy}%
                  </span>
                </div>
                <div className="grid h-12 grid-cols-[minmax(0,1fr)_76px] overflow-hidden rounded-[16px] border-2 border-slate-300 bg-white sm:grid-cols-[minmax(0,1fr)_90px]">
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-crayon-blue"
                      style={{ width: `${Math.max(8, (item.count / Math.max(1, childQuestions.length)) * 100)}%` }}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white">
                      題目數
                    </span>
                  </div>
                  <div className="flex items-center justify-center border-l-2 border-slate-300 bg-green-50 font-hand text-xl font-bold text-crayon-green">
                    {item.accuracy}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </HandCard>

        <HandCard className="min-w-0 p-5" tone="blue">
          <h2 className="crayon-title mb-5 text-3xl">各單元錯題數</h2>
          <div className="space-y-4">
            {unitWrong.map((item) => (
              <div key={item.unit}>
                <div className="mb-2 flex flex-wrap justify-between gap-2 font-bold">
                  <span className="min-w-0 break-words">{item.unit}</span>
                  <span className="shrink-0">{item.wrong}</span>
                </div>
                <div className="h-8 rounded-full border-2 border-slate-300 bg-white">
                  <div
                    className="h-full rounded-full bg-crayon-red"
                    style={{
                      width: `${Math.max(6, (item.wrong / Math.max(1, unitWrong[0]?.wrong ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </HandCard>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <HandCard className="min-w-0 p-5" tone="purple" tape>
          <h2 className="crayon-title mb-4 text-3xl">低熟練度題目清單</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="text-sm font-bold text-slate-500">
                <tr>
                  <th className="border-b-2 border-slate-200 p-3">題目</th>
                  <th className="border-b-2 border-slate-200 p-3">科目</th>
                  <th className="border-b-2 border-slate-200 p-3">熟練度</th>
                </tr>
              </thead>
              <tbody>
                {lowMastery.map((question, index) => (
                  <tr key={question.id} className="border-b border-slate-200">
                    <td className="p-3 font-bold">
                      {index + 1}. {question.convertedQuestion}
                    </td>
                    <td className="p-3">{question.subject}</td>
                    <td className="p-3">
                      <MasteryDots level={question.masteryLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HandCard>

        <HandCard className="min-w-0 p-5" tone="green">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="crayon-title text-3xl">最近練習紀錄</h2>
            <button
              className="sketch-button sketch-button-danger flex items-center gap-2 px-4 text-sm font-bold"
              onClick={() => void clearRecords()}
              disabled={!canClearReviewRecords || isClearing}
              title="清空目前小朋友的複習作答紀錄與熟練度統計"
            >
              {isClearing ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
              {isClearing ? "清空中..." : "清空複習紀錄"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="text-sm font-bold text-slate-500">
                <tr>
                  <th className="border-b-2 border-slate-200 p-3">日期時間</th>
                  <th className="border-b-2 border-slate-200 p-3">科目</th>
                  <th className="border-b-2 border-slate-200 p-3">對錯</th>
                  <th className="border-b-2 border-slate-200 p-3">用時</th>
                </tr>
              </thead>
              <tbody>
                {childAttempts.slice(0, 8).map((attempt) => {
                  const question = childQuestions.find(
                    (item) => item.id === attempt.questionId
                  );
                  return (
                    <tr key={attempt.id} className="border-b border-slate-200">
                      <td className="p-3 font-semibold">
                        {new Date(attempt.attemptedAt).toLocaleString("zh-TW", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3">{question?.subject ?? "-"}</td>
                      <td className="p-3">
                        {attempt.isCorrect ? (
                          <CheckCircle2 className="text-crayon-green" />
                        ) : (
                          <AlertTriangle className="text-crayon-red" />
                        )}
                      </td>
                      <td className="p-3">{attempt.timeSpentSeconds} 秒</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex items-center gap-2 rounded-[16px] border-2 border-crayon-blue bg-blue-50 p-3 text-sm font-bold text-crayon-blue">
            <BarChart3 size={20} />
            統計全部由題庫與作答紀錄計算，不使用 AI。
          </p>
        </HandCard>
      </div>
    </div>
  );
}
