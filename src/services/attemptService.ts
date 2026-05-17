import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getLocalState, setLocalState } from "./localStore";
import type { Attempt, Question } from "../types";
import { removeUndefinedDeep } from "../utils/firestoreClean";
import { createId } from "../utils/id";
import { calculateNextMasteryLevel } from "../utils/mastery";

export type AttemptInput = Omit<Attempt, "id" | "attemptedAt">;

function buildAnswerResult(input: {
  question: Question;
  selectedAnswer: string;
  seconds: number;
  attemptId: string;
  attemptedAt: string;
}) {
  const correctAnswer = input.question.confirmedAnswer ?? input.question.correctAnswer;
  const isCorrect = input.selectedAnswer === correctAnswer;
  const attempt = removeUndefinedDeep<Attempt>({
    id: input.attemptId,
    childId: input.question.childId,
    questionId: input.question.id,
    selectedAnswer: input.selectedAnswer,
    correctAnswer,
    isCorrect,
    timeSpentSeconds: input.seconds,
    attemptedAt: input.attemptedAt,
  });
  const updatedQuestion: Question = {
    ...input.question,
    correctCount: input.question.correctCount + (isCorrect ? 1 : 0),
    wrongCount: input.question.wrongCount + (isCorrect ? 0 : 1),
    totalAttemptCount: input.question.totalAttemptCount + 1,
    masteryLevel: calculateNextMasteryLevel(input.question.masteryLevel, isCorrect),
    lastReviewedAt: input.attemptedAt,
    updatedAt: input.attemptedAt,
  };

  return { isCorrect, attempt, updatedQuestion };
}

export async function createAttempt(userId: string, input: AttemptInput): Promise<Attempt> {
  const attempt = removeUndefinedDeep<Attempt>({
    ...input,
    id: createId("attempt"),
    attemptedAt: new Date().toISOString(),
  });

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const ref = doc(collection(db, "users", userId, "attempts"));
    const saved = removeUndefinedDeep<Attempt>({ ...attempt, id: ref.id });
    await setDoc(ref, saved);
    return saved;
  }

  const state = getLocalState();
  state.attempts = [attempt, ...state.attempts];
  setLocalState(state);
  return attempt;
}

export async function recordQuestionAnswer(
  userId: string,
  question: Question,
  selectedAnswer: string,
  seconds: number
): Promise<{ isCorrect: boolean; attempt: Attempt; updatedQuestion: Question }> {
  const attemptedAt = new Date().toISOString();

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const questionRef = doc(db, "users", userId, "questions", question.id);
    const attemptRef = doc(collection(db, "users", userId, "attempts"));

    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(questionRef);
      if (!snapshot.exists()) throw new Error("Question not found");

      const latestQuestion = {
        ...question,
        ...(snapshot.data() as Question),
      };
      const result = buildAnswerResult({
        question: latestQuestion,
        selectedAnswer,
        seconds,
        attemptId: attemptRef.id,
        attemptedAt,
      });

      transaction.set(attemptRef, result.attempt);
      transaction.update(
        questionRef,
        removeUndefinedDeep({
          correctCount: result.updatedQuestion.correctCount,
          wrongCount: result.updatedQuestion.wrongCount,
          totalAttemptCount: result.updatedQuestion.totalAttemptCount,
          masteryLevel: result.updatedQuestion.masteryLevel,
          lastReviewedAt: result.updatedQuestion.lastReviewedAt,
          updatedAt: result.updatedQuestion.updatedAt,
        })
      );

      return result;
    });
  }

  const state = getLocalState();
  const latestQuestion = state.questions.find((item) => item.id === question.id);
  if (!latestQuestion) throw new Error("Question not found");

  const result = buildAnswerResult({
    question: latestQuestion,
    selectedAnswer,
    seconds,
    attemptId: createId("attempt"),
    attemptedAt,
  });

  setLocalState({
    ...state,
    attempts: [result.attempt, ...state.attempts],
    questions: state.questions.map((item) =>
      item.id === question.id ? result.updatedQuestion : item
    ),
  });

  return result;
}

export async function getAttempts(userId: string): Promise<Attempt[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "attempts"), orderBy("attemptedAt", "desc"))
    );
    return snapshot.docs.map((item) => item.data() as Attempt);
  }

  return getLocalState().attempts;
}

export async function getAttemptsByChild(
  userId: string,
  childId: string
): Promise<Attempt[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "attempts"), where("childId", "==", childId))
    );
    return snapshot.docs.map((item) => item.data() as Attempt);
  }

  return getLocalState().attempts.filter((attempt) => attempt.childId === childId);
}

export async function getAttemptsByQuestion(
  userId: string,
  questionId: string
): Promise<Attempt[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(
        collection(db, "users", userId, "attempts"),
        where("questionId", "==", questionId)
      )
    );
    return snapshot.docs.map((item) => item.data() as Attempt);
  }

  return getLocalState().attempts.filter(
    (attempt) => attempt.questionId === questionId
  );
}

export async function deleteAttemptsByChild(
  userId: string,
  childId: string
): Promise<number> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "attempts"), where("childId", "==", childId))
    );
    const docs = snapshot.docs;

    for (let index = 0; index < docs.length; index += 450) {
      const batch = writeBatch(db);
      docs.slice(index, index + 450).forEach((item) => batch.delete(item.ref));
      await batch.commit();
    }

    return docs.length;
  }

  const state = getLocalState();
  const nextAttempts = state.attempts.filter((attempt) => attempt.childId !== childId);
  const deletedCount = state.attempts.length - nextAttempts.length;
  setLocalState({
    ...state,
    attempts: nextAttempts,
  });
  return deletedCount;
}
