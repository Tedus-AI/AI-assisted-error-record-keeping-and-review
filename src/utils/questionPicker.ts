import type { PracticeConfig, Question } from "../types";

function daysSince(date?: string | null) {
  if (!date) return 30;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, diff / (24 * 60 * 60 * 1000));
}

export function questionPriorityScore(question: Question) {
  return (
    (5 - question.masteryLevel) * 3 +
    question.wrongCount * 2 +
    daysSince(question.lastReviewedAt) * 0.2
  );
}

export function pickQuestions(questions: Question[], config: PracticeConfig) {
  const eligible = questions.filter((question) => {
    if (question.reviewStatus !== "approved") return false;
    if (question.childId !== config.childId) return false;
    if (config.subject && question.subject !== config.subject) return false;
    if (config.questionType && question.questionType !== config.questionType) return false;
    if (config.excludeMastered && question.masteryLevel >= 5) return false;
    return true;
  });

  const ranked = eligible
    .map((question) => ({
      question,
      score: config.prioritizeWrong
        ? questionPriorityScore(question)
        : Math.random() + questionPriorityScore(question) * 0.1,
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.question);

  return ranked.slice(0, config.questionCount);
}
