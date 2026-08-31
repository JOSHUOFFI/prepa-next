import {
  LEGACY_EXAM_DURATION_MINUTES,
  LEGACY_QUESTIONS_BY_SUBJECT,
} from "@/data/legacy-question-bank";
import { classes, terms, subjectGroups } from "@/lib/constants";
import type {
  Class,
  ClassLevel,
  ExamConfiguration,
  ExamQuestion,
  Question,
  QuestionBank,
  QuestionOption,
  Subject,
  Term,
} from "@/types";

const MAX_EXAM_QUESTIONS = 40;

type LegacyRecord = {
  id?: string;
  text?: string;
  questionText?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  subject?: string;
  classLevel?: string;
  term?: string;
};

export interface QuestionIssue {
  subject: string;
  index: number;
  id?: string;
  reasons: string[];
}

const normalizeClassLevel = (value?: string): ClassLevel | undefined =>
  classes.find((item) => item.value === value)?.value;

const normalizeTerm = (value?: string): Term | undefined =>
  terms.find((term) => term === value);

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function optionId(questionId: string, index: number): string {
  return `${questionId}-option-${index + 1}`;
}

function normalizeQuestion(
  record: LegacyRecord | null,
  subject: string,
  index: number,
): Question {
  const safeRecord = record || {};
  const id =
    safeRecord.id ||
    `${subject.replace(/\s+/g, "-").toLowerCase()}-${index + 1}`;
  const questionText = safeRecord.questionText || safeRecord.text || "";
  const answer = safeRecord.correctAnswer || safeRecord.answer || "";
  const optionTexts = Array.isArray(safeRecord.options)
    ? safeRecord.options
    : [];
  const options: QuestionOption[] = optionTexts.map((text, optionIndex) => ({
    id: optionId(id, optionIndex),
    text,
  }));
  const correctOption = options.find((option) => option.text === answer);
  const reasons: string[] = [];

  if (!safeRecord.id) reasons.push("Missing original id");
  if (!questionText) reasons.push("Missing question text");
  if (optionTexts.length === 0) reasons.push("Missing options");
  if (!answer) reasons.push("Missing correct answer");
  if (answer && !correctOption)
    reasons.push("Correct answer is not present in options");

  return {
    id,
    originalId: safeRecord.id,
    questionText,
    options,
    correctOptionId: correctOption?.id || options[0]?.id || "",
    correctAnswer: answer,
    explanation: safeRecord.explanation,
    points: typeof safeRecord.points === "number" ? safeRecord.points : 1,
    subject: safeRecord.subject || subject,
    classLevel: normalizeClassLevel(safeRecord.classLevel),
    term: normalizeTerm(safeRecord.term),
    source: "legacy",
    malformed: reasons.length > 0 || undefined,
    malformedReasons: reasons.length > 0 ? reasons : undefined,
  };
}

function buildBank(): QuestionBank {
  return Object.entries(
    LEGACY_QUESTIONS_BY_SUBJECT as Record<string, LegacyRecord[]>,
  ).reduce<QuestionBank>((bank, [subject, records]) => {
    bank[subject] = Array.isArray(records)
      ? records.map((record, index) =>
          normalizeQuestion(record, subject, index),
        )
      : [];
    return bank;
  }, {});
}

const questionBank = buildBank();

function shuffleOptions(question: Question, order: number): ExamQuestion {
  const options = shuffleArray(question.options);
  const correct = options.find(
    (option) => option.text === question.correctAnswer,
  );

  return {
    ...question,
    options,
    correctOptionId: correct?.id || question.correctOptionId,
    examQuestionId: `${question.id}-${order + 1}`,
    order,
  };
}

function subjectGroupFor(name: string): string {
  const match = subjectGroups.find((group) => group.subjects.includes(name));
  return match?.name || "General";
}

export const questionService = {
  examDurationMinutes: LEGACY_EXAM_DURATION_MINUTES,
  maxExamQuestions: MAX_EXAM_QUESTIONS,

  getClasses(): Class[] {
    return classes;
  },

  getTerms(): Term[] {
    return terms;
  },

  getSubjects(): Subject[] {
    return Object.keys(questionBank).map((name) => {
      const count = this.getQuestionCount(name);
      return {
        name,
        group: subjectGroupFor(name),
        hasQuestions: count > 0,
        questionCount: count,
      };
    });
  },

  getQuestions(subject?: string): Question[] {
    if (subject) return questionBank[subject] ?? [];
    return Object.values(questionBank).flat();
  },

  getQuestionsForSelection(
    configuration: Pick<ExamConfiguration, "subject" | "classLevel" | "term">,
  ): Question[] {
    const questions = this.getQuestions(configuration.subject);
    const exactMatches = questions.filter(
      (question) =>
        question.subject === configuration.subject &&
        question.classLevel === configuration.classLevel &&
        question.term === configuration.term,
    );

    return exactMatches.length > 0 ? exactMatches : questions;
  },

  getQuestionsForExam(
    configuration: Pick<ExamConfiguration, "subject" | "classLevel" | "term">,
    retryQuestions?: Question[],
  ): ExamQuestion[] {
    const sourceQuestions =
      retryQuestions && retryQuestions.length > 0
        ? retryQuestions
        : this.getQuestionsForSelection(configuration);

    return shuffleArray(sourceQuestions)
      .slice(0, MAX_EXAM_QUESTIONS)
      .map((question, index) =>
        retryQuestions
          ? {
              ...question,
              examQuestionId: `${question.id}-${index + 1}`,
              order: index,
            }
          : shuffleOptions(question, index),
      );
  },

  getQuestionCount(subject?: string): number {
    return this.getQuestions(subject).length;
  },

  getQuestionById(id: string): Question | undefined {
    return this.getQuestions().find((question) => question.id === id);
  },

  getIssues(): QuestionIssue[] {
    return Object.entries(questionBank).flatMap(([subject, questions]) =>
      questions.flatMap((question, index) =>
        question.malformed
          ? [
              {
                subject,
                index,
                id: question.originalId || question.id,
                reasons: question.malformedReasons || [],
              },
            ]
          : [],
      ),
    );
  },
};
