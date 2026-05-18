export type QuestionStatus =
  | "pending_review"
  | "approved"
  | "needs_manual_edit"
  | "rejected"
  | "archived";

export type AnswerType = "multiple_choice" | "true_false";

export type QuestionType = "是非題" | "選擇題" | "改錯字" | "應用題";

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
  questionType: QuestionType;
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
  questionType?: QuestionType;
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
  questionType?: QuestionType;
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

export interface AIDebugSnapshot {
  createdAt: string;
  provider: "google_ai" | "mock";
  modelId: string;
  stage:
    | "mock"
    | "request_ready"
    | "raw_response"
    | "http_error"
    | "parse_error"
    | "normalized"
    | "timeout"
    | "unknown_error";
  subject: string;
  questionType: QuestionType;
  answerType: AnswerType;
  textInput?: string;
  endpoint?: string;
  httpStatus?: number;
  image: {
    hasImage: boolean;
    mimeType?: string;
    base64Chars?: number;
    estimatedBytes?: number;
  };
  prompt: string;
  requestBodyPreview: string;
  rawResponse?: string;
  extractedModelText?: string;
  parsedJson?: unknown;
  normalizedResult?: unknown;
  errorMessage?: string;
}

export interface PendingAIReview {
  imageUrl?: string;
  croppedImageUrl?: string;
  cropMeta?: CropMeta;
  debug?: AIDebugSnapshot;
  result: {
    subject: string;
    questionType: QuestionType;
    originalQuestionText: string;
    convertedQuestion: string;
    answerType: AnswerType;
    options: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    confidence: number;
    needsUserReview: boolean;
  };
}
