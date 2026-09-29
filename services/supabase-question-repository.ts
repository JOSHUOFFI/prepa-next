import type { SafeExamQuestion } from "@/types";
import { isPlayableExamQuestionCount } from "@/services/exam-readiness";

const QUESTION_PAGE_SIZE = 200;
const OPTION_PAGE_SIZE = 400;
export const DEFAULT_EXAM_QUESTION_COUNT = 40;

type QuestionRow = {
  id: string;
  subject_id: string;
  question_text: string;
  points: number | string;
  class_id?: string | null;
  term_id?: string | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  option_label: string;
  option_text: string;
  is_correct?: boolean | null;
};

/** A question shape that is safe to send to an active exam browser. */
export type SafeExamQuestionRequest = {
  /** Matches public.subjects.name exactly. */
  subject: string;
  subjectId?: string;
  classLevel?: string;
  term?: string;
  /** The final exam size is capped at 40 and limited by the valid pool size. */
  questionCount?: number;
};

export function calculateExamQuestionLimit(eligibleQuestionCount: number): number {
  if (!Number.isFinite(eligibleQuestionCount)) return 0;
  const normalizedCount = Math.max(0, Math.floor(eligibleQuestionCount));
  return Math.min(normalizedCount, DEFAULT_EXAM_QUESTION_COUNT);
}

export function isEligibleQuestionOptionSet(
  options: Array<{ option_text?: string | null; is_correct?: boolean | null }> = [],
): boolean {
  if (!Array.isArray(options) || options.length !== 4) return false;

  const usableOptions = options.filter(
    (option) =>
      typeof option?.option_text === "string" &&
      option.option_text.trim().length > 0,
  );
  if (usableOptions.length !== 4) return false;

  const correctAnswerCount = usableOptions.filter(
    (option) => option.is_correct === true,
  ).length;

  return correctAnswerCount === 1;
}

export function normalizeExamQuestionText(questionText: string): string {
  return questionText.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function toPoints(value: number | string): number {
  const points = typeof value === "number" ? value : Number(value);
  return Number.isFinite(points) ? points : 1;
}

async function getSupabaseAdminClient() {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  return createSupabaseAdminClient();
}

async function getSubjectId(subject: string, subjectId?: string): Promise<string | null> {
  const supabase = await getSupabaseAdminClient();
  let query = supabase.from("subjects").select("id").eq("is_active", true);
  query = subjectId ? query.eq("id", subjectId) : query.eq("name", subject);
  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(`Unable to load subject: ${error.message}`);
  return data?.id ?? null;
}

async function getQuestionRows(
  subjectIds: string[],
): Promise<{ activeQuestionCounts: Record<string, number>; serveableQuestionRows: QuestionRow[] }> {
  if (subjectIds.length === 0) return { activeQuestionCounts: {}, serveableQuestionRows: [] };
  const supabase = await getSupabaseAdminClient();
  const activeQuestionCounts: Record<string, number> = {};
  const serveableQuestionRows: QuestionRow[] = [];
  for (let from = 0; ; from += QUESTION_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, subject_id, question_text, points, class_id, term_id")
      .in("subject_id", subjectIds)
      .eq("is_active", true)
      .order("id")
      .range(from, from + QUESTION_PAGE_SIZE - 1);

    if (error) throw new Error(`Unable to load questions: ${error.message}`);
    const page = (data ?? []) as QuestionRow[];
    for (const question of page) {
      activeQuestionCounts[question.subject_id] = (activeQuestionCounts[question.subject_id] ?? 0) + 1;
      if (question.class_id === null && question.term_id === null) serveableQuestionRows.push(question);
    }
    if (page.length < QUESTION_PAGE_SIZE) break;
  }
  return { activeQuestionCounts, serveableQuestionRows };
}

async function getOptionRows(questionIds: string[]): Promise<OptionRow[]> {
  if (questionIds.length === 0) return [];

  const supabase = await getSupabaseAdminClient();
  const options: OptionRow[] = [];

  for (let index = 0; index < questionIds.length; index += 100) {
    const ids = questionIds.slice(index, index + 100);
    for (let from = 0; ; from += OPTION_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("question_options")
        .select("id, question_id, option_label, option_text, is_correct")
        .in("question_id", ids)
        .order("question_id")
        .order("option_label")
        .range(from, from + OPTION_PAGE_SIZE - 1);

      if (error)
        throw new Error(`Unable to load question options: ${error.message}`);
      const page = (data ?? []) as OptionRow[];
      options.push(...page);
      if (page.length < OPTION_PAGE_SIZE) break;
    }
  }

  return options;
}

async function loadEligibleQuestionInventory(subjectIds: string[]) {
  const { activeQuestionCounts, serveableQuestionRows } = await getQuestionRows(subjectIds);
  const optionRows = await getOptionRows(serveableQuestionRows.map(({ id }) => id));
  const optionsByQuestionId = new Map<string, OptionRow[]>();

  for (const option of optionRows) {
    const options = optionsByQuestionId.get(option.question_id) ?? [];
    options.push(option);
    optionsByQuestionId.set(option.question_id, options);
  }

  const eligibleQuestionsBySubjectId = new Map<string, Array<{ question: QuestionRow; options: OptionRow[] }>>();
  const seenQuestionTextsBySubjectId = new Map<string, Set<string>>();
  for (const question of serveableQuestionRows) {
    const normalizedText = normalizeExamQuestionText(question.question_text);
    if (!normalizedText) continue;
    const options = optionsByQuestionId.get(question.id) ?? [];
    if (!isEligibleQuestionOptionSet(options)) continue;
    const seenTexts = seenQuestionTextsBySubjectId.get(question.subject_id) ?? new Set<string>();
    if (seenTexts.has(normalizedText)) continue;
    seenTexts.add(normalizedText);
    seenQuestionTextsBySubjectId.set(question.subject_id, seenTexts);
    const eligible = eligibleQuestionsBySubjectId.get(question.subject_id) ?? [];
    eligible.push({ question, options });
    eligibleQuestionsBySubjectId.set(question.subject_id, eligible);
  }
  return { activeQuestionCounts, eligibleQuestionsBySubjectId };
}

export async function loadExamSubjectReadiness(subjectIds: string[]) {
  const readiness = new Map<string, { activeQuestionCount: number; eligibleQuestionCount: number }>();
  for (const subjectId of subjectIds) readiness.set(subjectId, { activeQuestionCount: 0, eligibleQuestionCount: 0 });
  if (subjectIds.length === 0) return readiness;

  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id")
    .in("id", subjectIds)
    .eq("is_active", true);
  if (error) throw new Error(`Unable to validate exam subjects: ${error.message}`);

  const activeSubjectIds = (data ?? []).map((subject) => subject.id);
  const inventory = await loadEligibleQuestionInventory(activeSubjectIds);
  for (const subjectId of activeSubjectIds) {
    readiness.set(subjectId, {
      activeQuestionCount: inventory.activeQuestionCounts[subjectId] ?? 0,
      eligibleQuestionCount: inventory.eligibleQuestionsBySubjectId.get(subjectId)?.length ?? 0,
    });
  }
  return readiness;
}

export async function isValidPlayableExamQuestionSet(subjectId: string, questionIds: string[]) {
  if (questionIds.length !== DEFAULT_EXAM_QUESTION_COUNT || new Set(questionIds).size !== questionIds.length) return false;
  const inventory = await loadEligibleQuestionInventory([subjectId]);
  const eligibleQuestions = inventory.eligibleQuestionsBySubjectId.get(subjectId) ?? [];
  if (!isPlayableExamQuestionCount(eligibleQuestions.length)) return false;
  const eligibleIds = new Set(eligibleQuestions.map(({ question }) => question.id));
  return questionIds.every((questionId) => eligibleIds.has(questionId));
}

/**
 * Loads a randomized, browser-safe subject exam pool. It deliberately does
 * not accept class or term because the migrated records have no such metadata.
 */
export async function loadSafeExamQuestions({
  subject,
  subjectId,
}: SafeExamQuestionRequest): Promise<SafeExamQuestion[]> {
  const resolvedSubjectId = await getSubjectId(subject, subjectId);
  if (!resolvedSubjectId) return [];

  const inventory = await loadEligibleQuestionInventory([resolvedSubjectId]);
  const eligibleQuestions = inventory.eligibleQuestionsBySubjectId.get(resolvedSubjectId) ?? [];
  if (!isPlayableExamQuestionCount(eligibleQuestions.length)) return [];

  const selectedQuestions = shuffle(eligibleQuestions).slice(0, DEFAULT_EXAM_QUESTION_COUNT);
  return selectedQuestions.map(({ question, options }) => ({
    id: question.id,
    text: question.question_text,
    points: toPoints(question.points),
    options: shuffle(options).map((option) => ({
      id: option.id,
      label: option.option_label,
      text: option.option_text,
    })),
  }));
}
