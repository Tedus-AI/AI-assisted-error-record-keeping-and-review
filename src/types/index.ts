export type QuestionStatus =
  | "pending_review"
  | "approved"
  | "needs_manual_edit"
  | "rejected"
  | "archived";

export type AnswerType = "multiple_choice" | "true_false";

export type Difficulty = "easy" | "medium" | "hard";

export type SourceType = "manual" | "photo" | "ai";

export interface Child {
  id: string;
  name: string;
  grade?: string;
  notes?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  childId: string;
  subject: string;
  unit: string;
  topic?: string;
  questionType: string;
  answerType: AnswerType;
  originalImageUrl?: string;
  croppedImageUrl?: string;
  cropMeta?: CropMeta;
  originalQuestionText?: string;
  convertedQuestion: string;
  options: QuestionOption[];
  correctAnswer: string;
  aiSuggestedAnswer?: string;
  confirmedAnswer?: string;
  explanation?: string;
  errorReason?: string;
  difficulty: Difficulty;
  sourceType: SourceType;
  aiProcessed: boolean;
  aiProcessCount: number;
  aiModel?: string;
  aiConfidence?: number;
  isUserConfirmed: boolean;
  reviewStatus: QuestionStatus;
  correctCount: number;
  wrongCount: number;
  totalAttemptCount: number;
  masteryLevel: number;
  lastReviewedAt?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  childId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptedAt: string;
  reviewSessionId?: string;
}

export interface ReviewSession {
  id: string;
  childId: string;
  subject?: string;
  unit?: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  startedAt: string;
  endedAt?: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  isDemo?: boolean;
}

export interface AIUsage {
  dailyAiCallCount: number;
  monthlyAiCallCount: number;
  lastAiCallAt?: string;
}

export interface ParentSecurityProfile {
  pinHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeConfig {
  childId: string;
  subject?: string;
  unit?: string;
  questionCount: number;
  prioritizeWrong: boolean;
  excludeMastered: boolean;
}

export interface CropMeta {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PendingAIReview {
  imageUrl?: string;
  croppedImageUrl?: string;
  cropMeta?: CropMeta;
  result: {
    subject: string;
    unit: string;
    topic: string;
    questionType: string;
    originalQuestionText: string;
    convertedQuestion: string;
    answerType: AnswerType;
    options: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    errorReasonSuggestion: string;
    difficulty: Difficulty;
    confidence: number;
    needsUserReview: boolean;
  };
}
