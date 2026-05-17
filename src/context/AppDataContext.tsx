import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AIUsage,
  AppUser,
  Attempt,
  Child,
  ParentSecurityProfile,
  PendingAIReview,
  Question,
} from "../types";
import {
  createChild as createChildRecord,
  deleteChild as deleteChildRecord,
  getChildren,
  updateChild as updateChildRecord,
  type ChildInput,
} from "../services/childService";
import {
  archiveQuestion as archiveQuestionRecord,
  createQuestion as createQuestionRecord,
  deleteQuestion as deleteQuestionRecord,
  getQuestions,
  resetQuestionReviewStatsByChild as resetQuestionReviewStatsByChildRecord,
  updateQuestion as updateQuestionRecord,
  type QuestionInput,
} from "../services/questionService";
import {
  deleteAttemptsByChild as deleteAttemptsByChildRecord,
  getAttempts,
  recordQuestionAnswer,
} from "../services/attemptService";
import {
  getCurrentUser,
  getDemoUser,
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
} from "../services/authService";
import { getAIUsage } from "../services/aiService";
import {
  clearGoogleAISettings,
  getGoogleAIUsageSummary,
} from "../services/aiSettings";
import {
  getParentSecurityProfile,
  saveParentPin,
  verifyParentPin,
} from "../services/parentSecurityService";

const SELECTED_CHILD_KEY = "ai-mistake-review-selected-child-v1";
const PENDING_AI_KEY = "ai-mistake-review-pending-ai-v1";
const PARENT_UNLOCK_KEY = "ai-mistake-review-parent-unlock-v1";
const PARENT_UNLOCK_MS = 15 * 60 * 1000;
const emptyAIUsage: AIUsage = {
  dailyAiCallCount: 0,
  monthlyAiCallCount: 0,
};

function stripPendingReviewForStorage(review: PendingAIReview): PendingAIReview {
  if (!review.imageUrl?.startsWith("data:")) return review;
  const { imageUrl, ...storableReview } = review;
  return storableReview;
}

function parentUnlockKey(userId: string) {
  return `${PARENT_UNLOCK_KEY}:${userId}`;
}

interface AppDataValue {
  user: AppUser | null;
  isLoading: boolean;
  children: Child[];
  questions: Question[];
  attempts: Attempt[];
  selectedChildId: string | null;
  selectedChild: Child | null;
  aiUsage: AIUsage;
  hasParentPin: boolean;
  isParentMode: boolean;
  parentModeExpiresAt: number | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  selectChild: (childId: string) => void;
  addChild: (input: ChildInput) => Promise<Child>;
  updateChild: (childId: string, updates: Partial<Child>) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  addQuestion: (input: QuestionInput) => Promise<Question>;
  updateQuestion: (questionId: string, updates: Partial<Question>) => Promise<void>;
  archiveQuestion: (questionId: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  recordAnswer: (
    question: Question,
    selectedAnswer: string,
    seconds: number
  ) => Promise<{ isCorrect: boolean; attempt: Attempt; updatedQuestion: Question }>;
  clearReviewRecords: (childId: string) => Promise<void>;
  setParentPin: (pin: string) => Promise<void>;
  unlockParentMode: (pin: string) => Promise<void>;
  lockParentMode: () => void;
  refreshAIUsage: () => void;
  savePendingAIReview: (review: PendingAIReview) => void;
  getPendingAIReview: () => PendingAIReview | null;
  clearPendingAIReview: () => void;
}

export const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children: appChildren }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const pendingAIReviewRef = useRef<PendingAIReview | null>(null);
  const [parentSecurityProfile, setParentSecurityProfile] =
    useState<ParentSecurityProfile | null>(null);
  const [isParentMode, setIsParentMode] = useState(false);
  const [parentModeExpiresAt, setParentModeExpiresAt] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    localStorage.getItem(SELECTED_CHILD_KEY)
  );
  const [aiUsage, setAiUsage] = useState<AIUsage>(emptyAIUsage);

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? children[0] ?? null,
    [children, selectedChildId]
  );
  const hasParentPin = Boolean(parentSecurityProfile);

  const loadData = useCallback(async (activeUser: AppUser | null) => {
    if (!activeUser) {
      setChildren([]);
      setQuestions([]);
      setAttempts([]);
      setParentSecurityProfile(null);
      setIsParentMode(false);
      setParentModeExpiresAt(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [nextChildren, nextQuestions, nextAttempts, securityProfile] = await Promise.all([
      getChildren(activeUser.id),
      getQuestions(activeUser.id),
      getAttempts(activeUser.id),
      getParentSecurityProfile(activeUser.id),
    ]);

    setChildren(nextChildren);
    setQuestions(nextQuestions);
    setAttempts(nextAttempts);
    setParentSecurityProfile(securityProfile);

    const unlockUntil = Number(sessionStorage.getItem(parentUnlockKey(activeUser.id)) ?? 0);
    const isUnlocked = Boolean(securityProfile && unlockUntil > Date.now());
    if (securityProfile && !isUnlocked) {
      sessionStorage.removeItem(parentUnlockKey(activeUser.id));
    }
    setIsParentMode(!securityProfile || isUnlocked);
    setParentModeExpiresAt(isUnlocked ? unlockUntil : null);

    const savedChildId = localStorage.getItem(SELECTED_CHILD_KEY);
    const nextSelected =
      nextChildren.find((child) => child.id === savedChildId)?.id ??
      nextChildren[0]?.id ??
      null;
    setSelectedChildId(nextSelected);
    if (nextSelected) localStorage.setItem(SELECTED_CHILD_KEY, nextSelected);
    setAiUsage(activeUser.isDemo ? getAIUsage() : getGoogleAIUsageSummary());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void getCurrentUser().then((activeUser) => {
      setUser(activeUser);
      void loadData(activeUser);
    });
  }, [loadData]);

  useEffect(() => {
    if (!user || !parentSecurityProfile || !parentModeExpiresAt) return;
    const delay = parentModeExpiresAt - Date.now();

    if (delay <= 0) {
      sessionStorage.removeItem(parentUnlockKey(user.id));
      setIsParentMode(false);
      setParentModeExpiresAt(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      sessionStorage.removeItem(parentUnlockKey(user.id));
      setIsParentMode(false);
      setParentModeExpiresAt(null);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [parentModeExpiresAt, parentSecurityProfile, user]);

  const requireUser = useCallback(() => {
    if (!user) throw new Error("請先登入");
    return user;
  }, [user]);

  const login = useCallback(
    async (email: string, password: string) => {
      const activeUser = await signIn(email, password);
      setUser(activeUser);
      await loadData(activeUser);
    },
    [loadData]
  );

  const loginGoogle = useCallback(async () => {
    const activeUser = await signInWithGoogle();
    setUser(activeUser);
    await loadData(activeUser);
  }, [loadData]);

  const register = useCallback(
    async (email: string, password: string) => {
      const activeUser = await signUp(email, password);
      setUser(activeUser);
      await loadData(activeUser);
    },
    [loadData]
  );

  const loginDemo = useCallback(async () => {
    const activeUser = getDemoUser();
    setUser(activeUser);
    await loadData(activeUser);
  }, [loadData]);

  const logout = useCallback(async () => {
    await signOut();
    pendingAIReviewRef.current = null;
    if (user) sessionStorage.removeItem(parentUnlockKey(user.id));
    localStorage.removeItem(SELECTED_CHILD_KEY);
    localStorage.removeItem(PENDING_AI_KEY);
    sessionStorage.removeItem("active-practice-session");
    clearGoogleAISettings();
    setUser(null);
    setSelectedChildId(null);
    setAiUsage(emptyAIUsage);
    await loadData(null);
  }, [loadData, user]);

  const refreshData = useCallback(async () => {
    await loadData(user);
  }, [loadData, user]);

  const selectChild = useCallback((childId: string) => {
    setSelectedChildId(childId);
    localStorage.setItem(SELECTED_CHILD_KEY, childId);
  }, []);

  const addChild = useCallback(
    async (input: ChildInput) => {
      const activeUser = requireUser();
      const child = await createChildRecord(activeUser.id, input);
      setChildren((current) => [...current, child]);
      selectChild(child.id);
      return child;
    },
    [requireUser, selectChild]
  );

  const updateChild = useCallback(
    async (childId: string, updates: Partial<Child>) => {
      const activeUser = requireUser();
      await updateChildRecord(activeUser.id, childId, updates);
      setChildren((current) =>
        current.map((child) =>
          child.id === childId
            ? { ...child, ...updates, updatedAt: new Date().toISOString() }
            : child
        )
      );
    },
    [requireUser]
  );

  const deleteChild = useCallback(
    async (childId: string) => {
      const activeUser = requireUser();
      await deleteChildRecord(activeUser.id, childId);
      setChildren((current) => current.filter((child) => child.id !== childId));
      setQuestions((current) =>
        current.filter((question) => question.childId !== childId)
      );
      setAttempts((current) => current.filter((attempt) => attempt.childId !== childId));
    },
    [requireUser]
  );

  const addQuestion = useCallback(
    async (input: QuestionInput) => {
      const activeUser = requireUser();
      const question = await createQuestionRecord(activeUser.id, input);
      setQuestions((current) => [question, ...current]);
      return question;
    },
    [requireUser]
  );

  const updateQuestion = useCallback(
    async (questionId: string, updates: Partial<Question>) => {
      const activeUser = requireUser();
      await updateQuestionRecord(activeUser.id, questionId, updates);
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? { ...question, ...updates, updatedAt: new Date().toISOString() }
            : question
        )
      );
    },
    [requireUser]
  );

  const archiveQuestion = useCallback(
    async (questionId: string) => {
      const activeUser = requireUser();
      await archiveQuestionRecord(activeUser.id, questionId);
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? {
                ...question,
                reviewStatus: "archived",
                updatedAt: new Date().toISOString(),
              }
            : question
        )
      );
    },
    [requireUser]
  );

  const deleteQuestion = useCallback(
    async (questionId: string) => {
      const activeUser = requireUser();
      await deleteQuestionRecord(activeUser.id, questionId);
      setQuestions((current) => current.filter((question) => question.id !== questionId));
      setAttempts((current) =>
        current.filter((attempt) => attempt.questionId !== questionId)
      );
    },
    [requireUser]
  );

  const recordAnswer = useCallback(
    async (question: Question, selectedAnswer: string, seconds: number) => {
      const activeUser = requireUser();
      const result = await recordQuestionAnswer(
        activeUser.id,
        question,
        selectedAnswer,
        seconds
      );

      setAttempts((current) => [result.attempt, ...current]);
      setQuestions((current) =>
        current.map((item) =>
          item.id === question.id ? result.updatedQuestion : item
        )
      );

      return result;
    },
    [requireUser]
  );

  const clearReviewRecords = useCallback(
    async (childId: string) => {
      const activeUser = requireUser();
      await Promise.all([
        deleteAttemptsByChildRecord(activeUser.id, childId),
        resetQuestionReviewStatsByChildRecord(activeUser.id, childId),
      ]);

      const now = new Date().toISOString();
      setAttempts((current) => current.filter((attempt) => attempt.childId !== childId));
      setQuestions((current) =>
        current.map((question) =>
          question.childId === childId
            ? {
                ...question,
                correctCount: 0,
                wrongCount: 0,
                totalAttemptCount: 0,
                masteryLevel: 0,
                lastReviewedAt: null,
                updatedAt: now,
              }
            : question
        )
      );
    },
    [requireUser]
  );

  const unlockForParent = useCallback((activeUser: AppUser) => {
    const expiresAt = Date.now() + PARENT_UNLOCK_MS;
    sessionStorage.setItem(parentUnlockKey(activeUser.id), String(expiresAt));
    setIsParentMode(true);
    setParentModeExpiresAt(expiresAt);
  }, []);

  const setParentPin = useCallback(
    async (pin: string) => {
      const activeUser = requireUser();
      const profile = await saveParentPin(activeUser.id, pin);
      setParentSecurityProfile(profile);
      unlockForParent(activeUser);
    },
    [requireUser, unlockForParent]
  );

  const unlockParentMode = useCallback(
    async (pin: string) => {
      const activeUser = requireUser();
      if (!parentSecurityProfile) {
        setIsParentMode(true);
        setParentModeExpiresAt(null);
        return;
      }

      const isValid = await verifyParentPin(parentSecurityProfile, pin);
      if (!isValid) throw new Error("PIN 碼不正確");
      unlockForParent(activeUser);
    },
    [parentSecurityProfile, requireUser, unlockForParent]
  );

  const lockParentMode = useCallback(() => {
    if (user) sessionStorage.removeItem(parentUnlockKey(user.id));
    setIsParentMode(!parentSecurityProfile);
    setParentModeExpiresAt(null);
  }, [parentSecurityProfile, user]);

  const refreshAIUsage = useCallback(() => {
    setAiUsage((current) => {
      if (user?.isDemo) return getAIUsage();
      return getGoogleAIUsageSummary();
    });
  }, [user?.isDemo]);

  const savePendingAIReview = useCallback((review: PendingAIReview) => {
    pendingAIReviewRef.current = review;
    try {
      localStorage.setItem(
        PENDING_AI_KEY,
        JSON.stringify(stripPendingReviewForStorage(review))
      );
    } catch {
      localStorage.removeItem(PENDING_AI_KEY);
    }
  }, []);

  const getPendingAIReview = useCallback((): PendingAIReview | null => {
    if (pendingAIReviewRef.current) return pendingAIReviewRef.current;
    const raw = localStorage.getItem(PENDING_AI_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PendingAIReview;
      const storableReview = stripPendingReviewForStorage(parsed);
      if (storableReview !== parsed) {
        localStorage.setItem(PENDING_AI_KEY, JSON.stringify(storableReview));
      }
      return storableReview;
    } catch {
      return null;
    }
  }, []);

  const clearPendingAIReview = useCallback(() => {
    pendingAIReviewRef.current = null;
    localStorage.removeItem(PENDING_AI_KEY);
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({
      user,
      isLoading,
      children,
      questions,
      attempts,
      selectedChildId: selectedChild?.id ?? selectedChildId,
      selectedChild,
      aiUsage,
      hasParentPin,
      isParentMode,
      parentModeExpiresAt,
      login,
      register,
      loginGoogle,
      loginDemo,
      logout,
      refreshData,
      selectChild,
      addChild,
      updateChild,
      deleteChild,
      addQuestion,
      updateQuestion,
      archiveQuestion,
      deleteQuestion,
      recordAnswer,
      clearReviewRecords,
      setParentPin,
      unlockParentMode,
      lockParentMode,
      refreshAIUsage,
      savePendingAIReview,
      getPendingAIReview,
      clearPendingAIReview,
    }),
    [
      user,
      isLoading,
      children,
      questions,
      attempts,
      selectedChild,
      selectedChildId,
      aiUsage,
      hasParentPin,
      isParentMode,
      parentModeExpiresAt,
      login,
      register,
      loginGoogle,
      loginDemo,
      logout,
      refreshData,
      selectChild,
      addChild,
      updateChild,
      deleteChild,
      addQuestion,
      updateQuestion,
      archiveQuestion,
      deleteQuestion,
      recordAnswer,
      clearReviewRecords,
      setParentPin,
      unlockParentMode,
      lockParentMode,
      refreshAIUsage,
      savePendingAIReview,
      getPendingAIReview,
      clearPendingAIReview,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{appChildren}</AppDataContext.Provider>
  );
}
