"use client";

import { questionService } from "@/services/question-service";
import type {
  ClassLevel,
  ExamConfiguration,
  ExamQuestion,
  Term,
} from "@/types";

export const legacyExamDurationMinutes = questionService.examDurationMinutes;

export function loadLegacyExamQuestions(
  configuration: Pick<ExamConfiguration, "subject" | "classLevel" | "term">,
): ExamQuestion[] {
  return questionService.getQuestionsForExam(configuration);
}

export function getLegacySubjects() {
  return questionService.getSubjects();
}

export function getLegacyClasses(): { value: ClassLevel; label: string }[] {
  return questionService.getClasses();
}

export function getLegacyTerms(): Term[] {
  return questionService.getTerms();
}
