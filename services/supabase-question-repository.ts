import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SafeExamQuestion } from "@/types";

const QUESTION_PAGE_SIZE = 200;
const OPTION_PAGE_SIZE = 400;
export const DEFAULT_EXAM_QUESTION_COUNT = 40;

type QuestionRow = {
  id: string;
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
};

/** A question shape that is safe to send to an active exam browser. */
export type SafeExamQuestionRequest = {
  /** Matches public.subjects.name exactly. */
  subject: string;
  subjectId?: string;
  classLevel?: string;
  term?: string;
  /** Capped at 40, the current CBT maximum. */
  questionCount?: number;
};

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

async function getSubjectId(subject: string, subjectId?: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("subjects").select("id").eq("is_active", true);
  query = subjectId ? query.eq("id", subjectId) : query.eq("name", subject);
  const { data, error } = await query.maybeSingle();

  if (error) throw new Error(`Unable to load subject: ${error.message}`);
  return data?.id ?? null;
}

async function getQuestionRows(
  subjectId: string,
  classLevel?: string,
  term?: string,
): Promise<QuestionRow[]> {
  const supabase = createSupabaseAdminClient();
  let classId: string | null = null;
  let termId: string | null = null;
  if (classLevel && term) {
    const [{ data: classRow }, { data: termRow }] = await Promise.all([
      supabase
        .from("classes")
        .select("id")
        .eq("name", classLevel)
        .maybeSingle(),
      supabase.from("terms").select("id").eq("name", term).maybeSingle(),
    ]);
    classId = classRow?.id ?? null;
    termId = termRow?.id ?? null;
    if (!classId || !termId) return [];
  }
  const questions: QuestionRow[] = [];

  async function loadScope(scoped: boolean): Promise<QuestionRow[]> {
    const scopedQuestions: QuestionRow[] = [];
    for (let from = 0; ; from += QUESTION_PAGE_SIZE) {
      let query = supabase
        .from("questions")
        .select("id, question_text, points, class_id, term_id")
        .eq("subject_id", subjectId)
        .eq("is_active", true);
      query = scoped
        ? query.eq("class_id", classId!).eq("term_id", termId!)
        : query.is("class_id", null).is("term_id", null);
      const { data, error } = await query
        .order("id")
        .range(from, from + QUESTION_PAGE_SIZE - 1);

      if (error) throw new Error(`Unable to load questions: ${error.message}`);
      const page = (data ?? []) as QuestionRow[];
      scopedQuestions.push(...page);
      if (page.length < QUESTION_PAGE_SIZE) break;
    }
    return scopedQuestions;
  }

  if (classId && termId) {
    const scopedQuestions = await loadScope(true);
    if (scopedQuestions.length > 0) return scopedQuestions;
  }
  return loadScope(false);
}

async function getOptionRows(questionIds: string[]): Promise<OptionRow[]> {
  if (questionIds.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  const options: OptionRow[] = [];

  for (let from = 0; ; from += OPTION_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("question_options")
      .select("id, question_id, option_label, option_text")
      .in("question_id", questionIds)
      .order("question_id")
      .order("option_label")
      .range(from, from + OPTION_PAGE_SIZE - 1);

    if (error)
      throw new Error(`Unable to load question options: ${error.message}`);
    const page = (data ?? []) as OptionRow[];
    options.push(...page);
    if (page.length < OPTION_PAGE_SIZE) break;
  }

  return options;
}

/**
 * Loads a randomized, browser-safe subject exam pool. It deliberately does
 * not accept class or term because the migrated records have no such metadata.
 */
export async function loadSafeExamQuestions({
  subject,
  subjectId,
  classLevel,
  term,
  questionCount = DEFAULT_EXAM_QUESTION_COUNT,
}: SafeExamQuestionRequest): Promise<SafeExamQuestion[]> {
  const resolvedSubjectId = await getSubjectId(subject, subjectId);
  if (!resolvedSubjectId) return [];

  const normalizedCount = Number.isFinite(questionCount)
    ? Math.floor(questionCount)
    : DEFAULT_EXAM_QUESTION_COUNT;
  const requestedCount = Math.min(
    Math.max(normalizedCount, 0),
    DEFAULT_EXAM_QUESTION_COUNT,
  );
  const questionRows = await getQuestionRows(resolvedSubjectId);
  const optionRows = await getOptionRows(questionRows.map(({ id }) => id));
  const optionsByQuestionId = new Map<string, OptionRow[]>();

  for (const option of optionRows) {
    const options = optionsByQuestionId.get(option.question_id) ?? [];
    options.push(option);
    optionsByQuestionId.set(option.question_id, options);
  }

  const selectedQuestions = shuffle(
    questionRows.filter(
      (question) => (optionsByQuestionId.get(question.id)?.length ?? 0) > 0,
    ),
  ).slice(0, requestedCount);

  return selectedQuestions.map((question) => ({
    id: question.id,
    text: question.question_text,
    points: toPoints(question.points),
    options: shuffle(optionsByQuestionId.get(question.id) ?? []).map(
      (option) => ({
        id: option.id,
        label: option.option_label,
        text: option.option_text,
      }),
    ),
  }));
}
