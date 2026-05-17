import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getLocalState, setLocalState } from "./localStore";
import type { Question } from "../types";
import { removeUndefinedDeep } from "../utils/firestoreClean";
import { createId } from "../utils/id";

export type QuestionInput = Omit<Question, "id" | "createdAt" | "updatedAt">;

export async function createQuestion(userId: string, input: QuestionInput): Promise<Question> {
  const now = new Date().toISOString();
  const question = removeUndefinedDeep<Question>({
    ...input,
    id: createId("question"),
    createdAt: now,
    updatedAt: now,
  });

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const ref = doc(collection(db, "users", userId, "questions"));
    const saved = removeUndefinedDeep<Question>({ ...question, id: ref.id });
    await setDoc(ref, saved);
    return saved;
  }

  const state = getLocalState();
  state.questions = [question, ...state.questions];
  setLocalState(state);
  return question;
}

export async function getQuestions(userId: string): Promise<Question[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "questions"), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map((item) => item.data() as Question);
  }

  return getLocalState().questions;
}

export async function getApprovedQuestions(userId: string): Promise<Question[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(
        collection(db, "users", userId, "questions"),
        where("reviewStatus", "==", "approved")
      )
    );
    return snapshot.docs.map((item) => item.data() as Question);
  }

  return getLocalState().questions.filter(
    (question) => question.reviewStatus === "approved"
  );
}

export async function updateQuestion(
  userId: string,
  questionId: string,
  updates: Partial<Question>
): Promise<Question> {
  const payload = removeUndefinedDeep({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    await updateDoc(doc(db, "users", userId, "questions", questionId), payload);
    return { id: questionId, ...payload } as Question;
  }

  const state = getLocalState();
  const nextQuestions = state.questions.map((question) =>
    question.id === questionId ? { ...question, ...payload } : question
  );
  const updated = nextQuestions.find((question) => question.id === questionId);
  if (!updated) throw new Error("Question not found");
  setLocalState({ ...state, questions: nextQuestions });
  return updated;
}

export async function archiveQuestion(userId: string, questionId: string) {
  return updateQuestion(userId, questionId, { reviewStatus: "archived" });
}

export async function deleteQuestion(userId: string, questionId: string): Promise<void> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    await deleteDoc(doc(db, "users", userId, "questions", questionId));
    return;
  }

  const state = getLocalState();
  setLocalState({
    ...state,
    questions: state.questions.filter((question) => question.id !== questionId),
    attempts: state.attempts.filter((attempt) => attempt.questionId !== questionId),
  });
}

export async function resetQuestionReviewStatsByChild(
  userId: string,
  childId: string
): Promise<number> {
  const now = new Date().toISOString();
  const resetPayload = {
    correctCount: 0,
    wrongCount: 0,
    totalAttemptCount: 0,
    masteryLevel: 0,
    lastReviewedAt: null,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "questions"), where("childId", "==", childId))
    );
    const docs = snapshot.docs;

    for (let index = 0; index < docs.length; index += 450) {
      const batch = writeBatch(db);
      docs.slice(index, index + 450).forEach((item) => batch.update(item.ref, resetPayload));
      await batch.commit();
    }

    return docs.length;
  }

  const state = getLocalState();
  const nextQuestions = state.questions.map((question) =>
    question.childId === childId ? { ...question, ...resetPayload } : question
  );
  setLocalState({
    ...state,
    questions: nextQuestions,
  });
  return state.questions.filter((question) => question.childId === childId).length;
}
