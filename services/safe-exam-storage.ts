"use client";

import type {
  ExamAnswer,
  ExamConfiguration,
  SafeExamQuestion,
  SafeExamResult,
  SafeExamState,
  Student,
} from "@/types";

const SAFE_ACTIVE_EXAM_KEY = "prepa:exam:safe-active";
const pendingAnswerSaves = new Map<string, Promise<void>>();

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readState(): SafeExamState | null {
  if (!canUseStorage()) return null;
  try {
    const value = window.localStorage.getItem(SAFE_ACTIVE_EXAM_KEY);
    return value ? (JSON.parse(value) as SafeExamState) : null;
  } catch {
    return null;
  }
}

function writeState(state: SafeExamState): void {
  if (canUseStorage())
    window.localStorage.setItem(SAFE_ACTIVE_EXAM_KEY, JSON.stringify(state));
}

function createStudent(configuration: ExamConfiguration): Student {
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

export const safeExamStorage = {
  createExam(
    configuration: ExamConfiguration,
    questions: SafeExamQuestion[],
    attemptId: string,
    startedAt: string,
    endsAt: string,
  ): SafeExamState {
    const state: SafeExamState = {
      id: attemptId,
      student: createStudent(configuration),
      configuration,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      startedAt,
      endsAt,
      submitted: false,
    };
    writeState(state);
    return state;
  },

  getActiveExam(): SafeExamState | null {
    return readState();
  },

  async createRemoteAttempt(
    configuration: ExamConfiguration,
    questions: SafeExamQuestion[],
  ) {
    const response = await fetch("/api/exam/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: configuration.subject,
        classLevel: configuration.classLevel,
        term: configuration.term,
        questions: questions.map((question, order) => ({
          id: question.id,
          order,
        })),
      }),
    });
    if (!response.ok) throw new Error("Unable to create remote attempt");
    return (await response.json()) as {
      attemptId: string;
      startedAt: string;
      expiresAt: string;
    };
  },

  async saveRemoteAnswer(
    attemptId: string,
    questionId: string,
    selectedOptionId: string,
  ): Promise<void> {
    const save = fetch("/api/exam/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId }),
    }).then((response) => {
      if (!response.ok) throw new Error("Unable to save answer");
    });
    const key = `${attemptId}:${questionId}`;
    pendingAnswerSaves.set(key, save);
    try {
      await save;
    } finally {
      if (pendingAnswerSaves.get(key) === save) pendingAnswerSaves.delete(key);
    }
  },

  async submitRemoteExam(attemptId: string): Promise<SafeExamResult> {
    await Promise.all(
      [...pendingAnswerSaves.entries()]
        .filter(([key]) => key.startsWith(`${attemptId}:`))
        .map(([, save]) => save),
    );
    const response = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId }),
    });
    if (!response.ok) throw new Error("Unable to submit exam");
    const payload = (await response.json()) as { result: SafeExamResult };
    return payload.result;
  },

  async recoverRemoteExam(): Promise<SafeExamState | null> {
    const response = await fetch("/api/exam/attempts", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      attempt?: {
        attemptId: string;
        startedAt: string;
        expiresAt: string;
        subject: string;
        classLevel: string;
        term: string;
        questions: SafeExamQuestion[];
        answers: ExamAnswer[];
      } | null;
    };
    const attempt = payload.attempt;
    if (
      !attempt ||
      !attempt.subject ||
      !attempt.classLevel ||
      !attempt.term ||
      !attempt.questions.length
    )
      return null;
    const state: SafeExamState = {
      id: attempt.attemptId,
      student: {
        id: "authenticated-student",
        firstName: "",
        lastName: "",
        name: "Student",
      },
      configuration: {
        firstName: "",
        lastName: "",
        classLevel: attempt.classLevel as ExamConfiguration["classLevel"],
        term: attempt.term as ExamConfiguration["term"],
        subject: attempt.subject,
        durationMinutes: 30,
      },
      questions: attempt.questions,
      currentQuestionIndex: 0,
      answers: Object.fromEntries(
        attempt.answers.map((answer) => [answer.questionId, answer]),
      ),
      startedAt: attempt.startedAt,
      endsAt: attempt.expiresAt,
      submitted: false,
    };
    writeState(state);
    return state;
  },

  updateAnswer(questionId: string, optionId: string): SafeExamState | null {
    const state = readState();
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
    writeState(nextState);
    return nextState;
  },

  updateCurrentQuestion(index: number): SafeExamState | null {
    const state = readState();
    if (!state || state.submitted) return state;
    const nextState = {
      ...state,
      currentQuestionIndex: Math.min(
        Math.max(index, 0),
        state.questions.length - 1,
      ),
    };
    writeState(nextState);
    return nextState;
  },

  clearActiveExam(): void {
    if (canUseStorage()) window.localStorage.removeItem(SAFE_ACTIVE_EXAM_KEY);
  },
};
