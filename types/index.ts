export type ClassLevel = "JSS1" | "JSS2" | "JSS3" | "SS1" | "SS2";

export type Term = "First Term" | "Second Term" | "Third Term";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  classLevel?: ClassLevel;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  classId: string | null;
  avatarUrl: string | null;
}

export interface Class {
  value: ClassLevel;
  label: string;
}

export interface Subject {
  name: string;
  group: string;
  hasQuestions: boolean;
  questionCount: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface SafeExamQuestion {
  id: string;
  text: string;
  points: number;
  options: { id: string; label: string; text: string }[];
}

export interface SafeExamState {
  id: string;
  student: Student;
  configuration: ExamConfiguration;
  questions: SafeExamQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, ExamAnswer>;
  startedAt: string;
  endsAt: string;
  submittedAt?: string;
  submitted: boolean;
}

export interface SafeExamResult {
  attemptId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  passed: boolean;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers?: number;
  status: "submitted" | "expired";
  startedAt: string;
  expiresAt: string;
  submittedAt: string;
  performanceMessage: string;
}

export interface Question {
  id: string;
  originalId?: string;
  questionText: string;
  options: QuestionOption[];
  correctOptionId: string;
  correctAnswer: string;
  explanation?: string;
  points: number;
  subject: string;
  classLevel?: ClassLevel;
  term?: Term;
  source: "legacy" | "custom" | "uploaded";
  malformed?: boolean;
  malformedReasons?: string[];
}

export type QuestionBank = Record<string, Question[]>;

export interface ExamConfiguration {
  firstName: string;
  lastName: string;
  classLevel: ClassLevel;
  term: Term;
  subject: string;
  durationMinutes: number;
  isRetry?: boolean;
}

export interface ExamQuestion extends Question {
  examQuestionId: string;
  order: number;
}

export interface ExamAnswer {
  questionId: string;
  optionId: string;
  answeredAt: string;
}

export interface ExamState {
  id: string;
  student: Student;
  configuration: ExamConfiguration;
  questions: ExamQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, ExamAnswer>;
  startedAt: string;
  endsAt: string;
  submittedAt?: string;
  submitted: boolean;
}

export interface QuestionReview {
  question: ExamQuestion;
  selectedOptionId?: string;
  selectedAnswer?: string;
  correctOptionId: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsAvailable: number;
  explanation?: string;
}

export interface ExamResult {
  id: string;
  attemptId: string;
  student: Student;
  configuration: ExamConfiguration;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
  performanceMessage: string;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  reviews: QuestionReview[];
  completedAt: string;
}

export interface AIClassroomSession {
  id: string;
  topic: string;
  prompt: string;
  response: string;
  createdAt: string;
}
