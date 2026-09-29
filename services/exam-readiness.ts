export const MIN_PLAYABLE_EXAM_QUESTIONS = 40;

export function isPlayableExamQuestionCount(eligibleQuestionCount: number): boolean {
  return Number.isFinite(eligibleQuestionCount) && eligibleQuestionCount >= MIN_PLAYABLE_EXAM_QUESTIONS;
}