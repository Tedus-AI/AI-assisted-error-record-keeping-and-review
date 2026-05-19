import type { AnswerType, QuestionOption } from "../types";

const labels = ["A", "B", "C", "D"];
export const trueFalseOptions: QuestionOption[] = [
  { label: "A", text: "對" },
  { label: "B", text: "錯" },
];
export const comparisonOptions: QuestionOption[] = [
  { label: "A", text: ">" },
  { label: "B", text: "<" },
  { label: "C", text: "=" },
];

export function emptyOptions(answerType: AnswerType = "multiple_choice"): QuestionOption[] {
  if (answerType === "true_false") return trueFalseOptions;
  if (answerType === "comparison") return comparisonOptions;
  return labels.map((label) => ({ label, text: "" }));
}

export function optionsForAnswerType(
  answerType: AnswerType,
  options: QuestionOption[]
): QuestionOption[] {
  if (answerType === "true_false") return trueFalseOptions;
  if (answerType === "comparison") return comparisonOptions;
  return labels.map(
    (label) => options.find((option) => option.label === label) ?? { label, text: "" }
  );
}

export function answerLabelsForType(answerType: AnswerType) {
  if (answerType === "comparison") return ["A", "B", "C"];
  return answerType === "true_false" ? ["A", "B"] : labels;
}

export function normalizeAnswerForType(answer: string, answerType: AnswerType) {
  const normalized = answer.toUpperCase();
  return answerLabelsForType(answerType).includes(normalized) ? normalized : "A";
}

export function OptionEditor({
  answerType = "multiple_choice",
  options,
  onChange,
}: {
  answerType?: AnswerType;
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}) {
  const normalized = optionsForAnswerType(answerType, options);
  const isLocked = answerType === "true_false" || answerType === "comparison";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {normalized.map((option, index) => (
        <label key={option.label} className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-crayon-blue bg-crayon-light font-hand text-xl font-bold text-crayon-blue">
            {option.label}
          </span>
          <input
            className="sketch-input"
            value={option.text}
            disabled={isLocked}
            onChange={(event) => {
              const next = [...normalized];
              next[index] = { ...option, text: event.target.value };
              onChange(next);
            }}
            placeholder={`${option.label} 選項`}
          />
        </label>
      ))}
    </div>
  );
}
