import { useMemo, useState } from "react";
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Edit3,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { HandCard } from "../components/HandCard";
import { MasteryDots } from "../components/MasteryDots";
import {
  OptionEditor,
  normalizeAnswerForType,
  optionsForAnswerType,
} from "../components/OptionEditor";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import {
  answerTypeForQuestionType,
  questionTypeOptions,
  subjectOptions,
} from "../data/options";
import { useAppData } from "../hooks/useAppData";
import type { Question, QuestionOption, QuestionStatus, QuestionType } from "../types";
import { masteryLabel } from "../utils/mastery";

const statusOptions: { value: "all" | QuestionStatus; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "approved", label: "已確認" },
  { value: "pending_review", label: "待確認" },
  { value: "needs_manual_edit", label: "待修改" },
  { value: "archived", label: "已封存" },
];

function EditQuestionPanel({
  question,
  onClose,
}: {
  question: Question;
  onClose: () => void;
}) {
  const { updateQuestion } = useAppData();
  const [subject, setSubject] = useState(question.subject);
  const [questionType, setQuestionType] = useState<QuestionType>(question.questionType);
  const answerType = answerTypeForQuestionType(questionType);
  const [convertedQuestion, setConvertedQuestion] = useState(question.convertedQuestion);
  const [options, setOptions] = useState<QuestionOption[]>(
    optionsForAnswerType(question.answerType, question.options)
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    normalizeAnswerForType(
      question.confirmedAnswer ?? question.correctAnswer,
      question.answerType
    )
  );
  const [explanation, setExplanation] = useState(question.explanation ?? "");

  const handleQuestionTypeChange = (nextQuestionType: QuestionType) => {
    const nextAnswerType = answerTypeForQuestionType(nextQuestionType);
    setQuestionType(nextQuestionType);
    setOptions((current) => optionsForAnswerType(nextAnswerType, current));
    setCorrectAnswer((current) => normalizeAnswerForType(current, nextAnswerType));
  };

  const save = async () => {
    const normalizedOptions = optionsForAnswerType(answerType, options);
    const normalizedAnswer = normalizeAnswerForType(correctAnswer, answerType);
    await updateQuestion(question.id, {
      subject,
      questionType,
      convertedQuestion,
      answerType,
      options: normalizedOptions,
      correctAnswer: normalizedAnswer,
      confirmedAnswer: normalizedAnswer,
      explanation,
      isUserConfirmed: true,
      reviewStatus: "approved",
      tags: [subject, questionType],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-3 backdrop-blur-sm">
      <div className="mx-auto my-5 max-w-5xl">
        <HandCard className="p-5" tone="blue" tape>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="crayon-title text-3xl">編輯題目</h2>
            <button
              className="touch-target rounded-full border-2 border-slate-400 bg-white"
              onClick={onClose}
            >
              <X className="m-auto" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
            <span className="mb-2 block font-bold">題目</span>
            <textarea
              className="sketch-input min-h-[130px]"
              value={convertedQuestion}
              onChange={(event) => setConvertedQuestion(event.target.value)}
            />
          </label>
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-bold">選項</span>
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
              className="sketch-input min-h-[140px]"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </label>
          <button
            className="sketch-button sketch-button-primary mt-5 flex w-full items-center justify-center gap-2 text-xl font-bold"
            onClick={() => void save()}
          >
            <CheckCircle2 size={25} />
            儲存題目
          </button>
        </HandCard>
      </div>
    </div>
  );
}

export function QuestionBankPage() {
  const {
    selectedChild,
    questions,
    updateQuestion,
    archiveQuestion,
    deleteQuestion,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<"all" | QuestionType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | QuestionStatus>("all");
  const [masteryFilter, setMasteryFilter] = useState("all");
  const [editing, setEditing] = useState<Question | null>(null);

  const childQuestions = questions.filter(
    (question) => question.childId === selectedChild?.id
  );
  const filtered = useMemo(() => {
    return childQuestions.filter((question) => {
      const haystack = `${question.convertedQuestion} ${question.subject} ${question.questionType}`;
      if (search && !haystack.toLowerCase().includes(search.toLowerCase())) return false;
      if (subjectFilter !== "all" && question.subject !== subjectFilter) return false;
      if (questionTypeFilter !== "all" && question.questionType !== questionTypeFilter) {
        return false;
      }
      if (statusFilter !== "all" && question.reviewStatus !== statusFilter) return false;
      if (masteryFilter === "low" && question.masteryLevel > 2) return false;
      if (masteryFilter === "mastered" && question.masteryLevel < 5) return false;
      return true;
    });
  }, [childQuestions, masteryFilter, questionTypeFilter, search, statusFilter, subjectFilter]);

  const counts = {
    total: childQuestions.length,
    approved: childQuestions.filter((item) => item.reviewStatus === "approved").length,
    pending: childQuestions.filter((item) => item.reviewStatus === "pending_review").length,
    needsEdit: childQuestions.filter((item) => item.reviewStatus === "needs_manual_edit").length,
    archived: childQuestions.filter((item) => item.reviewStatus === "archived").length,
  };

  const approve = async (question: Question) => {
    await updateQuestion(question.id, {
      reviewStatus: "approved",
      isUserConfirmed: true,
      confirmedAnswer: question.correctAnswer,
    });
  };

  const removeQuestion = async (question: Question) => {
    const confirmed = window.confirm(
      `確定要刪除這題嗎？\n\n${question.convertedQuestion.slice(0, 80)}`
    );
    if (!confirmed) return;
    await deleteQuestion(question.id);
  };

  return (
    <div>
      <PageHeader
        title="題庫管理"
        eyebrow="管理已確認與待確認的錯題，複習時不再呼叫 AI。"
        actions={
          <Link
            to="/add-question"
            className="sketch-button sketch-button-primary flex items-center gap-2 px-5 text-lg font-bold"
          >
            新增錯題
          </Link>
        }
      />

      <HandCard className="mb-5 p-4" tone="blue">
        <div className="grid gap-3 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="sketch-input pl-11"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜尋題目、科目或題型"
            />
          </label>
          <select
            className="sketch-input"
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
          >
            <option value="all">科目：全部</option>
            {subjectOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="sketch-input"
            value={questionTypeFilter}
            onChange={(event) =>
              setQuestionTypeFilter(event.target.value as "all" | QuestionType)
            }
          >
            <option value="all">題型：全部</option>
            {questionTypeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="sketch-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | QuestionStatus)}
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                狀態：{item.label}
              </option>
            ))}
          </select>
          <select
            className="sketch-input"
            value={masteryFilter}
            onChange={(event) => setMasteryFilter(event.target.value)}
          >
            <option value="all">熟練度：全部</option>
            <option value="low">低熟練</option>
            <option value="mastered">已熟練</option>
          </select>
        </div>
      </HandCard>

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {[
          ["全部題目", counts.total, "text-crayon-blue"],
          ["已確認", counts.approved, "text-crayon-green"],
          ["待確認", counts.pending, "text-crayon-orange"],
          ["待修改", counts.needsEdit, "text-crayon-purple"],
          ["已封存", counts.archived, "text-slate-500"],
        ].map(([label, value, tone]) => (
          <HandCard key={label as string} className="p-3 text-center">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className={`crayon-title text-3xl ${tone}`}>{value}</p>
          </HandCard>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="沒有符合條件的題目"
          description="可以調整篩選條件，或新增一題錯題。"
        />
      ) : (
        <HandCard className="overflow-hidden p-0" tone="blue">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-blue-50 text-sm font-bold text-crayon-blue">
                <tr>
                  <th className="p-4">題目</th>
                  <th className="p-4">科目</th>
                  <th className="p-4">題型</th>
                  <th className="p-4">狀態</th>
                  <th className="p-4">熟練度</th>
                  <th className="p-4">正確/錯誤</th>
                  <th className="p-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((question) => (
                  <tr key={question.id} className="border-t-2 border-blue-100 bg-white/45">
                    <td className="max-w-[360px] p-4">
                      <p className="line-clamp-2 font-bold">{question.convertedQuestion}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {question.explanation || "尚未填寫解析"}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full border-2 border-crayon-blue bg-blue-50 px-3 py-1 font-bold text-crayon-blue">
                        {question.subject}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{question.questionType}</td>
                    <td className="p-4">
                      <StatusBadge status={question.reviewStatus} />
                    </td>
                    <td className="p-4">
                      <MasteryDots level={question.masteryLevel} />
                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {masteryLabel(question.masteryLevel)}
                      </p>
                    </td>
                    <td className="p-4 font-hand text-xl font-bold">
                      <span className="text-crayon-green">{question.correctCount}</span>
                      <span className="mx-1 text-slate-400">/</span>
                      <span className="text-crayon-red">{question.wrongCount}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="sketch-button flex items-center gap-1 px-3 text-sm font-bold text-crayon-blue"
                          onClick={() => setEditing(question)}
                        >
                          <Edit3 size={18} />
                          編輯
                        </button>
                        {question.reviewStatus !== "approved" && (
                          <button
                            className="sketch-button flex items-center gap-1 px-3 text-sm font-bold text-crayon-green"
                            onClick={() => void approve(question)}
                          >
                            <CheckCircle2 size={18} />
                            確認
                          </button>
                        )}
                        {question.reviewStatus !== "archived" && (
                          <button
                            className="sketch-button flex items-center gap-1 px-3 text-sm font-bold text-crayon-orange"
                            onClick={() => void archiveQuestion(question.id)}
                          >
                            <Archive size={18} />
                            封存
                          </button>
                        )}
                        <button
                          className="sketch-button sketch-button-danger flex items-center gap-1 px-3 text-sm font-bold"
                          onClick={() => void removeQuestion(question)}
                        >
                          <Trash2 size={18} />
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HandCard>
      )}

      {editing && (
        <EditQuestionPanel question={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
