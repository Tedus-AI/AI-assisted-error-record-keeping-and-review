import { seedAttempts, seedChildren, seedQuestions } from "../data/seedData";
import type { AIUsage, AppUser, Attempt, Child, Question } from "../types";

const STORE_KEY = "ai-mistake-review-state-v1";
const USER_KEY = "ai-mistake-review-user-v1";

interface LocalState {
  children: Child[];
  questions: Question[];
  attempts: Attempt[];
  aiUsage: AIUsage;
}

const defaultState: LocalState = {
  children: seedChildren,
  questions: seedQuestions,
  attempts: seedAttempts,
  aiUsage: {
    dailyAiCallCount: 3,
    monthlyAiCallCount: 16,
    lastAiCallAt: new Date().toISOString(),
  },
};

export function getLocalState(): LocalState {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }

  try {
    return JSON.parse(raw) as LocalState;
  } catch {
    localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }
}

export function setLocalState(nextState: LocalState) {
  localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
}

export function getLocalUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

export function setLocalUser(user: AppUser | null) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function resetLocalDemoData() {
  localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
}
