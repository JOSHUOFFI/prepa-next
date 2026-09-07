/**
 * Topic management utilities for PrePa curriculum
 */

export function normalizeTopic(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isTopicEqual(a: string, b: string): boolean {
  return normalizeTopic(a) === normalizeTopic(b);
}

export type TopicFilter = {
  subjectId?: string;
  classId?: string;
  termId?: string;
  isActive?: boolean;
};
