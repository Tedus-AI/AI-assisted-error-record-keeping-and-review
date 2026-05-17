import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getLocalState, setLocalState } from "./localStore";
import type { Child } from "../types";
import { removeUndefinedDeep } from "../utils/firestoreClean";
import { createId } from "../utils/id";

export type ChildInput = Omit<Child, "id" | "createdAt" | "updatedAt">;

export async function createChild(userId: string, input: ChildInput): Promise<Child> {
  const now = new Date().toISOString();
  const child = removeUndefinedDeep<Child>({
    ...input,
    id: createId("child"),
    createdAt: now,
    updatedAt: now,
  });

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const ref = doc(collection(db, "users", userId, "children"));
    const saved = removeUndefinedDeep<Child>({ ...child, id: ref.id });
    await setDoc(ref, saved);
    return saved;
  }

  const state = getLocalState();
  state.children = [...state.children, child];
  setLocalState(state);
  return child;
}

export async function getChildren(userId: string): Promise<Child[]> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    const snapshot = await getDocs(
      query(collection(db, "users", userId, "children"), orderBy("createdAt", "asc"))
    );
    return snapshot.docs.map((item) => item.data() as Child);
  }

  return getLocalState().children;
}

export async function updateChild(
  userId: string,
  childId: string,
  updates: Partial<Child>
): Promise<Child> {
  const payload = removeUndefinedDeep({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  if (isFirebaseConfigured && db && userId !== "demo_user") {
    await updateDoc(doc(db, "users", userId, "children", childId), payload);
    return { id: childId, ...payload } as Child;
  }

  const state = getLocalState();
  const nextChildren = state.children.map((child) =>
    child.id === childId ? { ...child, ...payload } : child
  );
  const updated = nextChildren.find((child) => child.id === childId);
  if (!updated) throw new Error("Child not found");
  setLocalState({ ...state, children: nextChildren });
  return updated;
}

export async function deleteChild(userId: string, childId: string): Promise<void> {
  if (isFirebaseConfigured && db && userId !== "demo_user") {
    await deleteDoc(doc(db, "users", userId, "children", childId));
    return;
  }

  const state = getLocalState();
  setLocalState({
    ...state,
    children: state.children.filter((child) => child.id !== childId),
    questions: state.questions.filter((question) => question.childId !== childId),
    attempts: state.attempts.filter((attempt) => attempt.childId !== childId),
  });
}
