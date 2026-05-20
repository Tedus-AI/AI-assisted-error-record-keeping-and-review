import type { AnswerType, QuestionType } from "../types";

export const subjectOptions = ["國語", "數學", "英文", "自然", "社會"];

export const questionTypeOptions: QuestionType[] = [
  "是非題",
  "選擇題",
  "改錯字",
  "應用題",
  "比大小",
  "計算題",
];

export const gradeOptions = [
  "幼兒園",
  "小學一年級",
  "小學二年級",
  "小學三年級",
  "小學四年級",
  "小學五年級",
  "小學六年級",
  "國中一年級",
];

const elementaryGradeNumbers: Record<string, string> = {
  "小學一年級": "1",
  "小學二年級": "2",
  "小學三年級": "3",
  "小學四年級": "4",
  "小學五年級": "5",
  "小學六年級": "6",
};

const juniorHighGradeLabels: Record<string, string> = {
  "國中一年級": "國一",
};

export function gradeExamLabel(grade?: string) {
  if (!grade) return "3";
  return elementaryGradeNumbers[grade] ?? juniorHighGradeLabels[grade] ?? "3";
}

export function examScopeOptionsForGrade(grade?: string) {
  const label = gradeExamLabel(grade);
  return [
    `${label}上第一次段考`,
    `${label}上第二次段考`,
    `${label}下第一次段考`,
    `${label}下第二次段考`,
  ];
}

export function answerTypeForQuestionType(questionType: QuestionType): AnswerType {
  if (questionType === "比大小") return "comparison";
  return questionType === "是非題" ? "true_false" : "multiple_choice";
}

export function isQuestionType(value: string): value is QuestionType {
  return questionTypeOptions.includes(value as QuestionType);
}
