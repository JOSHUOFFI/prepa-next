"use client";

import type {
  ExamAnswer,
  ExamConfiguration,
  ExamQuestion,
  ExamResult,
  ExamState,
  Question,
} from "@/types";
import { calculateExamResult } from "@/utils/grading";

const ACTIVE_EXAM_KEY = "prepa:exam:active";
const LAST_RESULT_KEY = "prepa:exam:last-result";
const RESULT_HISTORY_KEY = "prepa:exam:results";

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createStudent(configuration: ExamConfiguration) {
  const firstName = configuration.firstName.trim();
  const lastName = configuration.lastName.trim();
  return {
    id: `student-${Date.now()}`,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    classLevel: configuration.classLevel,
  };
}

function createState(
  configuration: ExamConfiguration,
  questions: ExamQuestion[],
): ExamState {
  const startedAt = new Date();
  const endsAt = new Date(
    startedAt.getTime() + configuration.durationMinutes * 60 * 1000,
  );

  return {
    id: `attempt-${Date.now()}`,
    student: createStudent(configuration),
    configuration,
    questions,
    currentQuestionIndex: 0,
    answers: {},
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    submitted: false,
  };
}

export const examStorage = {
  createExam(
    configuration: ExamConfiguration,
    questions: ExamQuestion[],
  ): ExamState {
    const state = createState(configuration, questions);
    this.saveActiveExam(state);
    return state;
  },

  getActiveExam(): ExamState | null {
    return readJson<ExamState | null>(ACTIVE_EXAM_KEY, null);
  },

  saveActiveExam(state: ExamState): void {
    writeJson(ACTIVE_EXAM_KEY, state);
  },

  clearActiveExam(): void {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACTIVE_EXAM_KEY);
  },

  updateAnswer(questionId: string, optionId: string): ExamState | null {
    const state = this.getActiveExam();
    if (!state || state.submitted) return state;
    const answer: ExamAnswer = {
      questionId,
      optionId,
      answeredAt: new Date().toISOString(),
    };
    const nextState = {
      ...state,
      answers: { ...state.answers, [questionId]: answer },
    };
    this.saveActiveExam(nextState);
    return nextState;
  },

  updateCurrentQuestion(index: number): ExamState | null {
    const state = this.getActiveExam();
    if (!state || state.submitted) return state;
    const nextIndex = Math.min(Math.max(index, 0), state.questions.length - 1);
    const nextState = { ...state, currentQuestionIndex: nextIndex };
    this.saveActiveExam(nextState);
    return nextState;
  },

  submitExam(): ExamResult | null {
    const state = this.getActiveExam();
    if (!state) return null;
    const submittedState = {
      ...state,
      submitted: true,
      submittedAt: new Date().toISOString(),
    };
    const result = calculateExamResult(submittedState);
    const history = readJson<ExamResult[]>(RESULT_HISTORY_KEY, []);
    writeJson(LAST_RESULT_KEY, result);
    writeJson(RESULT_HISTORY_KEY, [result, ...history]);
    this.clearActiveExam();
    return result;
  },

  getLastResult(): ExamResult | null {
    return readJson<ExamResult | null>(LAST_RESULT_KEY, null);
  },

  getResultHistory(): ExamResult[] {
    return readJson<ExamResult[]>(RESULT_HISTORY_KEY, []);
  },
};
