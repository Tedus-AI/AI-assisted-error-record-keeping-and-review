import type { AnswerType, QuestionType } from "../types";

export const subjectOptions = ["國語", "數學", "英文", "自然", "社會"];

export const questionTypeOptions: QuestionType[] = [
  "是非題",
  "選擇題",
  "改錯字",
  "應用題",
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

export function answerTypeForQuestionType(questionType: QuestionType): AnswerType {
  return questionType === "是非題" ? "true_false" : "multiple_choice";
}

export function isQuestionType(value: string): value is QuestionType {
  return questionTypeOptions.includes(value as QuestionType);
}
