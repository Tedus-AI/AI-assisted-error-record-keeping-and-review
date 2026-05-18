import type { Attempt, Question } from "../types";

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function accuracy(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getQuestionAccuracy(question: Question) {
  return accuracy(question.correctCount, question.totalAttemptCount);
}

export function groupBySubject(questions: Question[]) {
  return unique(questions.map((question) => question.subject)).map((subject) => {
    const related = questions.filter((question) => question.subject === subject);
    const totalAttempts = related.reduce(
      (sum, question) => sum + question.totalAttemptCount,
      0
    );
    const correct = related.reduce((sum, question) => sum + question.correctCount, 0);

    return {
      subject,
      count: related.length,
      wrongCount: related.reduce((sum, question) => sum + question.wrongCount, 0),
      accuracy: accuracy(correct, totalAttempts),
    };
  });
}

export function groupByQuestionType(questions: Question[]) {
  return unique(questions.map((question) => question.questionType)).map((questionType) => {
    const related = questions.filter((question) => question.questionType === questionType);
    const totalAttempts = related.reduce(
      (sum, question) => sum + question.totalAttemptCount,
      0
    );
    const correct = related.reduce((sum, question) => sum + question.correctCount, 0);

    return {
      questionType,
      count: related.length,
      wrongCount: related.reduce((sum, question) => sum + question.wrongCount, 0),
      accuracy: accuracy(correct, totalAttempts),
    };
  });
}

export function getWeeklyAttempts(attempts: Attempt[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return attempts.filter((attempt) => new Date(attempt.attemptedAt).getTime() >= weekAgo);
}
