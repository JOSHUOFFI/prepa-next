import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";
import { subjectGroups } from "@/lib/constants";

loadEnvConfig(process.cwd());

type LegacyQuestion = {
  id?: string;
  text?: string;
  questionText?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  classLevel?: string;
  term?: string;
};

type SourceRecord = {
  subject: string;
  index: number;
  record: LegacyQuestion | null;
};
type Issue = {
  subject: string;
  index: number;
  id?: string;
  problem: string;
  action: string;
};
type OptionRow = {
  question_id: string;
  option_label: string;
  option_text: string;
  is_correct: boolean;
};
type MigrationClient = ReturnType<typeof createClient<any>>;
type ExistingQuestion = { id: string; legacy_id: string; subject_id: string };
type ExistingOptionStats = { total: number; correct: number };
type FailedRecord = {
  subject: string;
  legacyId: string;
  operation: string;
  error: string;
  retries: number;
};
type VerificationIssue = {
  subject: string;
  legacyId: string;
  questionId: string;
  problem: string;
};

const dryRun = process.argv.includes("--dry-run");
const MAX_RETRIES = 4;
const INITIAL_RETRY_DELAY_MS = 500;
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 150;
const PAGE_SIZE = 500;
const catalogSubjects = subjectGroups.flatMap((group) => group.subjects);
const sourceRecords: SourceRecord[] = Object.entries(
  LEGACY_QUESTIONS_BY_SUBJECT as Record<string, (LegacyQuestion | null)[]>,
).flatMap(([subject, records]) =>
  records.map((record, index) => ({ subject, index, record })),
);

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is required for the question migration.`);
  return value;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function resolveAnswer(
  record: LegacyQuestion,
  options: string[],
): number | null {
  const answer = record.correctAnswer ?? record.answer;
  if (!answer) return null;
  const normalizedAnswer = normalize(answer);
  const letterIndex = normalizedAnswer.match(/^[a-z]$/)?.[0].charCodeAt(0);
  if (letterIndex !== undefined) {
    const index = letterIndex - "a".charCodeAt(0);
    if (index >= 0 && index < options.length) return index;
  }
  const matches = options
    .map((option, index) =>
      normalize(option) === normalizedAnswer ? index : -1,
    )
    .filter((index) => index >= 0);
  return matches.length === 1 ? matches[0] : null;
}

function duplicateValues(values: string[]): string[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function isTransientError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    status?: number;
    message?: string;
  };
  const status = candidate.status;
  const code = candidate.code ?? "";
  const message = (candidate.message ?? "").toLowerCase();
  return Boolean(
    status === 408 ||
    status === 429 ||
    (status !== undefined && status >= 500) ||
    /^08|^53|^PGRST00[0-3]$/i.test(code) ||
    /fetch|network|timeout|timed out|econnreset|econnrefused|socket/.test(
      message,
    ),
  );
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withRetry<T>(
  label: string,
  operation: () => PromiseLike<T>,
): Promise<{ value: T; retries: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const result = await operation();
      const response = result as { error?: unknown };
      if (response && response.error) {
        throw Object.assign(response.error as object, { retries: attempt - 1 });
      }
      return { value: result, retries: attempt - 1 };
    } catch (error) {
      if (!isTransientError(error) || attempt === MAX_RETRIES) throw error;
      const delay = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `${label} failed transiently; retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`,
      );
      await wait(delay);
    }
  }
  throw new Error(`${label} failed unexpectedly.`);
}

function errorMessage(error: unknown): string {
  const candidate = error as { code?: string; message?: string };
  return (
    [candidate.code, candidate.message].filter(Boolean).join(": ") ||
    String(error)
  );
}

async function fetchAllRows<T>(
  label: string,
  queryPage: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: unknown;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { value: result } = await withRetry(
      `${label} rows ${from}-${from + PAGE_SIZE - 1}`,
      () => queryPage(from, from + PAGE_SIZE - 1),
    );
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
    from += PAGE_SIZE;
  }
}

function validateRecords() {
  const issues: Issue[] = [];
  const validRecords: SourceRecord[] = [];
  const answerFailures: SourceRecord[] = [];
  const subjectCounts = new Map<string, number>();
  let optionsCount = 0;

  for (const source of sourceRecords) {
    const record = source.record;
    if (!record) {
      issues.push({
        subject: source.subject,
        index: source.index,
        problem: "Missing record",
        action: "Not imported",
      });
      continue;
    }
    const id = record?.id;
    const questionText = record?.questionText ?? record?.text;
    const options = record?.options;
    const answer = record?.correctAnswer ?? record?.answer;
    const problems: string[] = [];
    if (!id) problems.push("Missing legacy ID");
    if (!questionText?.trim()) problems.push("Missing question text");
    if (!Array.isArray(options) || options.length === 0)
      problems.push("Missing options");
    if (!answer?.trim()) problems.push("Missing correct answer");
    if (problems.length > 0) {
      issues.push({
        subject: source.subject,
        index: source.index,
        id,
        problem: problems.join("; "),
        action: "Not imported",
      });
      continue;
    }
    const answerIndex = resolveAnswer(record, options as string[]);
    if (answerIndex === null) {
      answerFailures.push(source);
      issues.push({
        subject: source.subject,
        index: source.index,
        id,
        problem: "Answer does not resolve unambiguously to one option",
        action: "Not imported",
      });
      continue;
    }
    validRecords.push(source);
    subjectCounts.set(
      source.subject,
      (subjectCounts.get(source.subject) ?? 0) + 1,
    );
    optionsCount += (options as string[]).length;
  }

  const ids = sourceRecords
    .map((source) => source.record?.id)
    .filter((id): id is string => Boolean(id));
  const texts = sourceRecords
    .map((source) => source.record?.questionText ?? source.record?.text)
    .filter((text): text is string => Boolean(text?.trim()));
  return {
    issues,
    validRecords,
    answerFailures,
    subjectCounts,
    optionsCount,
    duplicateIds: duplicateValues(ids),
    duplicateTexts: duplicateValues(texts),
  };
}

async function loadReferenceMaps(client: MigrationClient) {
  const [subjectRows, classRows, termRows] = await Promise.all([
    fetchAllRows("Loading subjects", (from, to) =>
      client.from("subjects").select("id,name").range(from, to),
    ),
    fetchAllRows("Loading classes", (from, to) =>
      client.from("classes").select("id,name").range(from, to),
    ),
    fetchAllRows("Loading terms", (from, to) =>
      client.from("terms").select("id,name").range(from, to),
    ),
  ]);
  const subjectMap = new Map<string, string>(
    (subjectRows ?? []).map((row) => [row.name, row.id]),
  );
  const classMap = new Map<string, string>(
    (classRows ?? []).map((row) => [row.name, row.id]),
  );
  const termMap = new Map<string, string>(
    (termRows ?? []).map((row) => [row.name, row.id]),
  );
  return { subjectMap, classMap, termMap };
}

async function loadExistingState(client: MigrationClient) {
  const [questions, options] = await Promise.all([
    fetchAllRows("Loading existing questions", (from, to) =>
      client
        .from("questions")
        .select("id,legacy_id,subject_id")
        .range(from, to),
    ),
    fetchAllRows("Loading existing options", (from, to) =>
      client
        .from("question_options")
        .select("question_id,is_correct")
        .range(from, to),
    ),
  ]);
  const questionByKey = new Map<string, ExistingQuestion>();
  (questions ?? []).forEach((question) =>
    questionByKey.set(`${question.subject_id}:${question.legacy_id}`, question),
  );
  const optionStats = new Map<string, ExistingOptionStats>();
  (options ?? []).forEach((option) => {
    const stats = optionStats.get(option.question_id) ?? {
      total: 0,
      correct: 0,
    };
    stats.total += 1;
    if (option.is_correct) stats.correct += 1;
    optionStats.set(option.question_id, stats);
  });
  return { questionByKey, optionStats };
}

async function getFinalCounts(client: MigrationClient) {
  const [{ value: questionsResult }, { value: optionsResult }] =
    await Promise.all([
      withRetry("Counting questions", () =>
        client.from("questions").select("id", { count: "exact", head: true }),
      ),
      withRetry("Counting options", () =>
        client
          .from("question_options")
          .select("id", { count: "exact", head: true }),
      ),
    ]);
  const { count: questionsCount, error: questionsError } = questionsResult;
  const { count: optionsCount, error: optionsError } = optionsResult;
  if (questionsError) throw questionsError;
  if (optionsError) throw optionsError;
  return { questions: questionsCount ?? 0, options: optionsCount ?? 0 };
}

async function verifyBatch(
  client: MigrationClient,
  records: Array<{ source: SourceRecord; questionId: string }>,
): Promise<VerificationIssue[]> {
  const issues: VerificationIssue[] = [];
  if (records.length === 0) return issues;
  const questionIds = records.map(({ questionId }) => questionId);
  const [questions, options] = await Promise.all([
    fetchAllRows(
      `Verifying batch questions ${records[0].source.record?.id}`,
      (from, to) =>
        client
          .from("questions")
          .select("id")
          .in("id", questionIds)
          .range(from, to),
    ),
    fetchAllRows(
      `Verifying batch options ${records[0].source.record?.id}`,
      (from, to) =>
        client
          .from("question_options")
          .select("question_id,is_correct")
          .in("question_id", questionIds)
          .range(from, to),
    ),
  ]);
  const questionsById = new Set(
    (questions ?? []).map((question) => question.id),
  );
  const optionsByQuestion = new Map<
    string,
    { total: number; correct: number }
  >();
  (options ?? []).forEach((option) => {
    const stats = optionsByQuestion.get(option.question_id) ?? {
      total: 0,
      correct: 0,
    };
    stats.total += 1;
    if (option.is_correct) stats.correct += 1;
    optionsByQuestion.set(option.question_id, stats);
  });
  for (const { source, questionId } of records) {
    const record = source.record as LegacyQuestion;
    const stats = optionsByQuestion.get(questionId) ?? { total: 0, correct: 0 };
    if (
      !questionsById.has(questionId) ||
      stats.total !== 4 ||
      stats.correct !== 1
    ) {
      issues.push({
        subject: source.subject,
        legacyId: record.id as string,
        questionId,
        problem: `question=${questionsById.has(questionId) ? "present" : "missing"}, options=${stats.total}, correct_options=${stats.correct}`,
      });
    }
  }
  return issues;
}

async function importRecords(
  client: MigrationClient,
  records: SourceRecord[],
  maps: Awaited<ReturnType<typeof loadReferenceMaps>>,
  existing: Awaited<ReturnType<typeof loadExistingState>>,
  failedRecords: FailedRecord[],
) {
  let inserted = 0;
  let updated = 0;
  let optionsImported = 0;
  let skipped = 0;
  const batch: Array<{ source: SourceRecord; questionId: string }> = [];
  for (const [index, source] of records.entries()) {
    const record = source.record as LegacyQuestion;
    const subjectId = maps.subjectMap.get(source.subject);
    if (!subjectId)
      throw new Error(`Unable to map legacy subject: ${source.subject}`);
    const questionKey = `${subjectId}:${record.id}`;
    const existingQuestion = existing.questionByKey.get(questionKey);
    const existingOptions = existingQuestion
      ? existing.optionStats.get(existingQuestion.id)
      : undefined;
    const remaining = records.length - index - 1;
    console.log(
      `Processing ${source.subject}/${record.id} (${index + 1}/${records.length}; ${remaining} remaining)`,
    );
    if (
      existingQuestion &&
      existingOptions?.total === 4 &&
      existingOptions.correct === 1
    ) {
      skipped += 1;
      console.log(`Skipped ${record.id}; already complete.`);
      batch.push({ source, questionId: existingQuestion.id });
      continue;
    }
    try {
      let questionId = existingQuestion?.id;
      if (!questionId) {
        const question = {
          legacy_id: record.id as string,
          subject_id: subjectId,
          class_id: record.classLevel
            ? maps.classMap.get(record.classLevel)
            : null,
          term_id: record.term ? maps.termMap.get(record.term) : null,
          question_text: (record.questionText ?? record.text) as string,
          explanation: record.explanation ?? null,
          ...(typeof record.points === "number"
            ? { points: record.points }
            : {}),
          is_active: true,
        };
        const { value: questionResult, retries } = await withRetry(
          `Upserting question ${record.id}`,
          () =>
            client
              .from("questions")
              .upsert(question, {
                onConflict: "subject_id,legacy_id",
                ignoreDuplicates: false,
              })
              .select("id")
              .single(),
        );
        const { data, error } = questionResult;
        if (error) throw Object.assign(error, { retries });
        questionId = data.id;
        inserted += 1;
      } else {
        updated += 1;
      }
      const optionRows: OptionRow[] = (record.options as string[]).map(
        (option, optionIndex) => ({
          question_id: questionId as string,
          option_label: String.fromCharCode("A".charCodeAt(0) + optionIndex),
          option_text: option,
          is_correct:
            resolveAnswer(record, record.options as string[]) === optionIndex,
        }),
      );
      const { value: optionResult, retries } = await withRetry(
        `Upserting options for ${record.id}`,
        () =>
          client
            .from("question_options")
            .upsert(optionRows, { onConflict: "question_id,option_label" }),
      );
      const { error: optionError } = optionResult;
      if (optionError) throw Object.assign(optionError, { retries });
      optionsImported += optionRows.length;
      if (!questionId) {
        throw new Error(`Question ID was not resolved for ${record.id}.`);
      }
      batch.push({ source, questionId });
    } catch (error) {
      const candidate = error as { retries?: number };
      failedRecords.push({
        subject: source.subject,
        legacyId: record.id as string,
        operation: existingQuestion
          ? "upserting options"
          : "upserting question/options",
        error: errorMessage(error),
        retries: candidate.retries ?? 0,
      });
      console.error(
        `Failed ${source.subject}/${record.id}: ${errorMessage(error)} (retries=${candidate.retries ?? 0})`,
      );
    }
    if ((index + 1) % BATCH_SIZE === 0 || index === records.length - 1) {
      const verificationIssues = await verifyBatch(client, batch.splice(0));
      verificationIssues.forEach((issue) => {
        failedRecords.push({
          subject: issue.subject,
          legacyId: issue.legacyId,
          operation: "batch verification",
          error: issue.problem,
          retries: 0,
        });
      });
      if (index < records.length - 1) await wait(BATCH_DELAY_MS);
    }
  }
  const finalCounts = await getFinalCounts(client);
  return { inserted, updated, skipped, optionsImported, finalCounts };
}

async function verifyCompleteState(
  client: MigrationClient,
  subjectMap: Map<string, string>,
) {
  const [questions, options] = await Promise.all([
    fetchAllRows("Loading final questions", (from, to) =>
      client
        .from("questions")
        .select("id,legacy_id,subject_id,class_id,term_id")
        .range(from, to),
    ),
    fetchAllRows("Loading final options", (from, to) =>
      client
        .from("question_options")
        .select("id,question_id,is_correct")
        .range(from, to),
    ),
  ]);
  const questionIds = new Set((questions ?? []).map((question) => question.id));
  const questionSubjects = new Map(
    (questions ?? []).map((question) => [question.id, question.subject_id]),
  );
  const optionStats = new Map<string, { total: number; correct: number }>();
  const subjectCounts = new Map<string, number>();
  const optionCounts = new Map<string, number>();
  const keys = new Map<string, number>();
  let zeroOptions = 0;
  let unexpectedOptions = 0;
  let unexpectedCorrect = 0;
  let missingSubject = 0;
  let missingClass = 0;
  let missingTerm = 0;
  (questions ?? []).forEach((question) => {
    subjectCounts.set(
      question.subject_id,
      (subjectCounts.get(question.subject_id) ?? 0) + 1,
    );
    keys.set(
      `${question.subject_id}:${question.legacy_id}`,
      (keys.get(`${question.subject_id}:${question.legacy_id}`) ?? 0) + 1,
    );
    if (
      !question.subject_id ||
      ![...subjectMap.values()].includes(question.subject_id)
    )
      missingSubject += 1;
    if (!question.class_id) missingClass += 1;
    if (!question.term_id) missingTerm += 1;
  });
  (options ?? []).forEach((option) => {
    const stats = optionStats.get(option.question_id) ?? {
      total: 0,
      correct: 0,
    };
    stats.total += 1;
    if (option.is_correct) stats.correct += 1;
    optionStats.set(option.question_id, stats);
    const subjectId = questionSubjects.get(option.question_id);
    if (subjectId)
      optionCounts.set(subjectId, (optionCounts.get(subjectId) ?? 0) + 1);
  });
  (questions ?? []).forEach((question) => {
    const stats = optionStats.get(question.id) ?? { total: 0, correct: 0 };
    if (stats.total === 0) zeroOptions += 1;
    if (stats.total !== 4) unexpectedOptions += 1;
    if (stats.correct !== 1) unexpectedCorrect += 1;
  });
  return {
    questions: questions?.length ?? 0,
    options: options?.length ?? 0,
    zeroOptions,
    unexpectedOptions,
    unexpectedCorrect,
    orphanOptions: (options ?? []).filter(
      (option) => !questionIds.has(option.question_id),
    ).length,
    duplicateKeys: [...keys.values()].filter((count) => count > 1).length,
    missingSubject,
    missingClass,
    missingTerm,
    subjectCounts,
    optionCounts,
  };
}

async function main() {
  const audit = validateRecords();
  if (audit.duplicateIds.length > 0)
    throw new Error(
      `Duplicate legacy IDs detected: ${audit.duplicateIds.join(", ")}`,
    );
  const subjectsWithQuestions = [...audit.subjectCounts.keys()];
  console.log("========================================");
  console.log("PREPA QUESTION BANK MIGRATION REPORT");
  console.log("========================================");
  console.log(`Legacy records: ${sourceRecords.length}`);
  console.log(`Valid: ${audit.validRecords.length}`);
  console.log(`Malformed or failed: ${audit.issues.length}`);
  console.log(`Subjects in catalog: ${catalogSubjects.length}`);
  console.log(`Subjects containing questions: ${subjectsWithQuestions.length}`);
  console.log(
    `Subjects without questions: ${catalogSubjects.filter((subject) => !subjectsWithQuestions.includes(subject)).join(", ") || "None"}`,
  );
  console.log(`Duplicate legacy IDs: ${audit.duplicateIds.length}`);
  console.log(`Duplicate question text: ${audit.duplicateTexts.length}`);
  console.log(`Options to migrate: ${audit.optionsCount}`);
  console.log("\nSubject              Questions");
  audit.subjectCounts.forEach((count, subject) =>
    console.log(`${subject.padEnd(20)} ${count}`),
  );
  if (audit.issues.length > 0) {
    console.log("\nIssues:");
    audit.issues.forEach((issue) =>
      console.log(
        `${issue.id ?? "<missing id>"} | ${issue.subject} | ${issue.problem} | ${issue.action}`,
      ),
    );
  }
  if (dryRun) {
    console.log("\nDRY RUN: no database writes performed.");
    return;
  }
  const client = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const maps = await loadReferenceMaps(client);
  for (const subject of subjectsWithQuestions)
    if (!maps.subjectMap.has(subject))
      throw new Error(`Unable to map legacy subject: ${subject}`);
  for (const source of audit.validRecords) {
    if (
      source.record?.classLevel &&
      !maps.classMap.has(source.record.classLevel)
    )
      throw new Error(
        `Unable to map legacy class: ${source.record.classLevel}`,
      );
    if (source.record?.term && !maps.termMap.has(source.record.term))
      throw new Error(`Unable to map legacy term: ${source.record.term}`);
  }
  const existing = await loadExistingState(client);
  const completeRecords = audit.validRecords.filter((source) => {
    const record = source.record as LegacyQuestion;
    const subjectId = maps.subjectMap.get(source.subject);
    const question = subjectId
      ? existing.questionByKey.get(`${subjectId}:${record.id}`)
      : undefined;
    const options = question
      ? existing.optionStats.get(question.id)
      : undefined;
    return Boolean(options && options.total === 4 && options.correct === 1);
  });
  const incompleteRecords = audit.validRecords.filter((source) => {
    const record = source.record as LegacyQuestion;
    const subjectId = maps.subjectMap.get(source.subject);
    const question = subjectId
      ? existing.questionByKey.get(`${subjectId}:${record.id}`)
      : undefined;
    return Boolean(question && !completeRecords.includes(source));
  });
  console.log("\nResume summary:");
  console.log(`Already-complete records: ${completeRecords.length}`);
  console.log(
    `Records requiring migration: ${audit.validRecords.length - completeRecords.length}`,
  );
  console.log(`Records with incomplete options: ${incompleteRecords.length}`);
  const failedRecords: FailedRecord[] = [];
  const result = await importRecords(
    client,
    audit.validRecords,
    maps,
    existing,
    failedRecords,
  );
  console.log(`\nImported/processed questions: ${audit.validRecords.length}`);
  console.log(`Inserted: ${result.inserted}`);
  console.log(`Updated or already existed: ${result.updated}`);
  console.log(`Skipped as complete: ${result.skipped}`);
  console.log(`Options processed: ${result.optionsImported}`);
  const finalState = await verifyCompleteState(client, maps.subjectMap);
  console.log(`Final questions: ${finalState.questions} (expected 1749)`);
  console.log(`Final options: ${finalState.options} (expected 6996)`);
  console.log(`Questions with zero options: ${finalState.zeroOptions}`);
  console.log(`Questions with != 4 options: ${finalState.unexpectedOptions}`);
  console.log(
    `Questions with != 1 correct option: ${finalState.unexpectedCorrect}`,
  );
  console.log(`Orphan options: ${finalState.orphanOptions}`);
  console.log(`Duplicate (subject_id, legacy_id): ${finalState.duplicateKeys}`);
  console.log(`Missing subject references: ${finalState.missingSubject}`);
  console.log(`Missing class references: ${finalState.missingClass}`);
  console.log(`Missing term references: ${finalState.missingTerm}`);
  console.log("\nFinal counts by subject:");
  [...maps.subjectMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([subject, id]) =>
      console.log(
        `${subject.padEnd(20)} questions=${finalState.subjectCounts.get(id) ?? 0} options=${finalState.optionCounts.get(id) ?? 0}`,
      ),
    );
  if (failedRecords.length > 0) {
    console.log("\nFailed records:");
    failedRecords.forEach((failed) =>
      console.log(
        `${failed.subject}/${failed.legacyId} | ${failed.operation} | ${failed.error} | retries=${failed.retries}`,
      ),
    );
  }
  if (
    failedRecords.length > 0 ||
    finalState.questions !== 1749 ||
    finalState.options !== 6996 ||
    finalState.zeroOptions !== 0 ||
    finalState.unexpectedOptions !== 0 ||
    finalState.unexpectedCorrect !== 0 ||
    finalState.orphanOptions !== 0 ||
    finalState.duplicateKeys !== 0 ||
    finalState.missingSubject !== 0
  ) {
    throw new Error(
      `Final migration verification failed: questions=${finalState.questions}, options=${finalState.options}, failed_records=${failedRecords.length}.`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
