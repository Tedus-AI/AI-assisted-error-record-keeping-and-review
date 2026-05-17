import { useEffect, useState } from "react";
import { CheckCircle2, CirclePlus, Save, Trash2, Users } from "lucide-react";
import { HandCard } from "../components/HandCard";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { gradeOptions } from "../data/options";
import { useAppData } from "../hooks/useAppData";

export function ChildrenPage() {
  const {
    children,
    selectedChild,
    selectedChildId,
    selectChild,
    addChild,
    updateChild,
    deleteChild,
    questions,
  } = useAppData();
  const [name, setName] = useState(selectedChild?.name ?? "");
  const [grade, setGrade] = useState(selectedChild?.grade ?? "小學三年級");
  const [notes, setNotes] = useState(selectedChild?.notes ?? "");
  const [newName, setNewName] = useState("");
  const [newGrade, setNewGrade] = useState("小學三年級");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(selectedChild?.name ?? "");
    setGrade(selectedChild?.grade ?? "小學三年級");
    setNotes(selectedChild?.notes ?? "");
  }, [selectedChild]);

  const save = async () => {
    if (!selectedChild) return;
    await updateChild(selectedChild.id, { name, grade, notes });
    setMessage("已儲存小朋友資料。");
  };

  const add = async () => {
    if (!newName.trim()) return;
    await addChild({
      name: newName.trim(),
      grade: newGrade,
      notes: "",
      avatarColor: "#d9ecff",
    });
    setNewName("");
    setNewGrade("小學三年級");
    setMessage("已新增小朋友。");
  };

  const removeSelectedChild = async () => {
    if (!selectedChild) return;
    const confirmed = window.confirm(
      `確定要刪除 ${selectedChild.name} 嗎？這會移除這個小朋友的題目與作答紀錄。`
    );
    if (!confirmed) return;
    await deleteChild(selectedChild.id);
    setMessage("已刪除小朋友資料。");
  };

  const selectedQuestionCount = questions.filter(
    (question) => question.childId === selectedChild?.id
  ).length;
  const selectedApprovedCount = questions.filter(
    (question) =>
      question.childId === selectedChild?.id && question.reviewStatus === "approved"
  ).length;
  const selectedAccuracy =
    questions
      .filter((question) => question.childId === selectedChild?.id)
      .reduce(
        (acc, question) => {
          acc.correct += question.correctCount;
          acc.total += question.totalAttemptCount;
          return acc;
        },
        { correct: 0, total: 0 }
      );

  return (
    <div>
      <PageHeader
        title="小朋友資料管理"
        eyebrow="建立與管理孩子的學習檔案"
        actions={
          <button
            className="sketch-button sketch-button-primary flex items-center gap-2 px-5 text-lg font-bold"
            onClick={() => void add()}
          >
            <CirclePlus size={24} />
            新增小朋友
          </button>
        }
      />

      {message && (
        <div className="mb-4 rounded-[16px] border-2 border-crayon-green bg-green-50 p-3 font-bold text-crayon-green">
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          {selectedChild && (
            <HandCard className="p-5" tone="blue" tape>
              <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-center">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-crayon-blue bg-crayon-light text-5xl font-bold text-crayon-blue">
                  {selectedChild.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="crayon-title text-4xl">{selectedChild.name}</h2>
                  <p className="mt-1 text-lg font-bold text-crayon-blue">
                    {selectedChild.grade}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">總題目數</p>
                      <p className="crayon-title text-3xl">{selectedQuestionCount}</p>
                    </div>
                    <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">可複習</p>
                      <p className="crayon-title text-3xl text-crayon-green">
                        {selectedApprovedCount}
                      </p>
                    </div>
                    <div className="rounded-[16px] border-2 border-slate-300 bg-white/60 p-3 text-center">
                      <p className="text-xs font-bold text-slate-500">正確率</p>
                      <p className="crayon-title text-3xl text-crayon-orange">
                        {selectedAccuracy.total
                          ? Math.round(
                              (selectedAccuracy.correct / selectedAccuracy.total) * 100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </HandCard>
          )}

          <HandCard className="p-5" tone="green">
            <h2 className="crayon-title mb-4 text-3xl">小朋友列表</h2>
            {children.length === 0 ? (
              <EmptyState
                icon={Users}
                title="還沒有小朋友"
                description="新增第一位小朋友後，就可以建立專屬錯題題庫。"
              />
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={`flex w-full items-center gap-3 rounded-[18px] border-2 p-3 text-left transition ${
                      child.id === selectedChildId
                        ? "border-crayon-blue bg-crayon-light text-crayon-blue"
                        : "border-slate-300 bg-white/60 text-slate-700"
                    }`}
                    onClick={() => selectChild(child.id)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold">
                      {child.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{child.name}</p>
                      <p className="text-sm font-semibold text-slate-500">{child.grade}</p>
                    </div>
                    {child.id === selectedChildId && <CheckCircle2 />}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-[18px] border-2 border-dashed border-crayon-blue bg-blue-50/60 p-4">
              <h3 className="crayon-title mb-3 text-2xl">新增小朋友</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="sketch-input"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="姓名"
                />
                <select
                  className="sketch-input"
                  value={newGrade}
                  onChange={(event) => setNewGrade(event.target.value)}
                >
                  {gradeOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </HandCard>
        </div>

        <HandCard className="p-5" tone="purple" tape>
            <h2 className="crayon-title mb-5 text-3xl">編輯資料</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block font-bold">姓名</span>
                <input
                  className="sketch-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-bold">年級</span>
                <select
                  className="sketch-input"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                >
                  {gradeOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-bold">備註</span>
                <textarea
                  className="sketch-input min-h-[180px]"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={200}
                  placeholder="記錄孩子的學習偏好或需要加強的地方"
                />
                <span className="mt-1 block text-right text-sm font-bold text-slate-400">
                  {notes.length} / 200
                </span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className="sketch-button sketch-button-primary flex flex-1 items-center justify-center gap-2 px-5 text-lg font-bold"
                  onClick={() => void save()}
                >
                  <Save size={24} />
                  儲存變更
                </button>
                {children.length > 1 && selectedChild && (
                  <button
                    className="sketch-button sketch-button-danger flex items-center justify-center gap-2 px-5 text-lg font-bold"
                    onClick={() => void removeSelectedChild()}
                  >
                    <Trash2 size={24} />
                    刪除
                  </button>
                )}
              </div>
            </div>
        </HandCard>
      </div>
    </div>
  );
}
