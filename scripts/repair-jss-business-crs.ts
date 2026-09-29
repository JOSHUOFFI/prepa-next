import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const BUSINESS_SUBJECT_ID = "5b894bfe-6f29-41a6-907c-26a4c2f11fff";
const CRS_SUBJECT_ID = "5e4ff239-fd12-4765-b035-70ea77ecee6c";

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeAnswer = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const stripped = raw.replace(/^[A-Da-d][\s.:\-)]*\s*/i, "");
  return normalizeText(stripped);
};

const findAnswerIndex = (options: string[], rawAnswer: unknown) => {
  const answer = normalizeAnswer(rawAnswer);

  const exactIndex = options.findIndex(
    (option) => normalizeText(option) === answer,
  );
  if (exactIndex >= 0) return exactIndex;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (
      normalizeText(option).includes(answer) ||
      answer.includes(normalizeText(option))
    ) {
      return index;
    }
  }

  return -1;
};

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

async function fetchOptionRowsByQuestionIds(
  supabase: ReturnType<typeof createClient<any>>,
  questionIds: string[],
) {
  const optionMap = new Map<string, any[]>();

  for (const batch of chunkArray(questionIds, 50)) {
    const { data, error } = await supabase
      .from("question_options")
      .select("question_id, option_label, option_text, is_correct")
      .in("question_id", batch)
      .order("question_id", { ascending: true })
      .order("option_label", { ascending: true });

    if (error) throw error;

    for (const row of data ?? []) {
      const existing = optionMap.get(row.question_id) ?? [];
      existing.push(row);
      optionMap.set(row.question_id, existing);
    }
  }

  return optionMap;
}

async function repairSubject(
  subjectId: string,
  sourceKey: string,
  legacyPrefix: string,
) {
  const envUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!envUrl || !envKey) {
    throw new Error("Supabase URL and service-role key are required.");
  }

  const supabase = createClient(envUrl, envKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const sourceQuestions =
    (LEGACY_QUESTIONS_BY_SUBJECT as Record<string, any>)[sourceKey] ?? [];

  const sourceMap = new Map<string, any>();
  for (const record of sourceQuestions) {
    const id = String(record.id ?? "").trim();
    const keys = new Set<string>([
      `${legacyPrefix}${id}`,
      id,
      `legacy_${legacyPrefix.toLowerCase()}_${id}`,
    ]);

    for (const key of keys) {
      if (key) sourceMap.set(key, record);
    }
  }

  const { data: activeQuestions, error: fetchError } = await supabase
    .from("questions")
    .select("id, legacy_id, question_text, created_at")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (fetchError) throw fetchError;

  const questionGroups = new Map<string, Array<any>>();
  for (const question of activeQuestions ?? []) {
    const key = normalizeText(question.question_text);
    const bucket = questionGroups.get(key) ?? [];
    bucket.push(question);
    questionGroups.set(key, bucket);
  }

  let archivedDuplicates = 0;
  for (const group of Array.from(questionGroups.values())) {
    if (group.length <= 1) continue;
    const keep = group[0];
    for (const duplicate of group.slice(1)) {
      const { error: archiveError } = await supabase
        .from("questions")
        .update({ is_active: false, topic_id: null })
        .eq("id", duplicate.id);
      if (archiveError) throw archiveError;
      archivedDuplicates += 1;
      console.log(
        `Archived duplicate question ${duplicate.legacy_id ?? duplicate.id} in favor of ${keep.legacy_id ?? keep.id}`,
      );
    }
  }

  let fixedQuestions = 0;
  let fixedOptions = 0;

  for (const question of activeQuestions ?? []) {
    const record =
      sourceMap.get(question.legacy_id) ??
      sourceMap.get(
        String(question.legacy_id ?? "").replace(/^legacy_.*?_/, ""),
      );
    if (!record) continue;

    const options = Array.isArray(record.options)
      ? record.options.filter(
          (option) => typeof option === "string" && option.trim().length > 0,
        )
      : [];
    if (options.length === 0) continue;

    const answerIndex = findAnswerIndex(
      options,
      record.correctAnswer ?? record.answer ?? "",
    );
    if (answerIndex < 0) {
      console.warn(`Could not map answer for ${question.legacy_id}`);
      continue;
    }

    const { data: optionRows, error: optionFetchError } = await supabase
      .from("question_options")
      .select("question_id, option_label, option_text, is_correct")
      .eq("question_id", question.id)
      .order("option_label", { ascending: true });

    if (optionFetchError) throw optionFetchError;

    const rows = ["A", "B", "C", "D"].map((label, index) => {
      const existing =
        optionRows?.find((row) => row.option_label === label) ?? null;
      const optionText = options[index] ?? existing?.option_text ?? "";
      return {
        question_id: question.id,
        option_label: label,
        option_text: optionText,
        is_correct: index === answerIndex,
      };
    });

    const { error: upsertError } = await supabase
      .from("question_options")
      .upsert(rows, {
        onConflict: "question_id,option_label",
        ignoreDuplicates: false,
      });

    if (upsertError) throw upsertError;

    fixedQuestions += 1;
    fixedOptions += rows.length;
  }

  const { count, error: countError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId)
    .eq("is_active", true);

  if (countError) throw countError;

  const optionMap = await fetchOptionRowsByQuestionIds(
    supabase,
    (activeQuestions ?? []).map((question) => question.id),
  );

  const invalidCount = (activeQuestions ?? []).filter((question) => {
    const rows = optionMap.get(question.id) ?? [];
    return rows.length !== 4 || rows.filter((row) => row.is_correct).length !== 1;
  }).length;

  console.log(
    JSON.stringify(
      {
        subjectId,
        sourceKey,
        fixedQuestions,
        fixedOptions,
        archivedDuplicates,
        finalActiveCount: count,
        invalidAfterRepair: invalidCount,
      },
      null,
      2,
    ),
  );
}

async function main() {
  await repairSubject(BUSINESS_SUBJECT_ID, "Commerce", "legacy_business_");
  await repairSubject(CRS_SUBJECT_ID, "CRS", "legacy_crs_");
}

main().catch((error) => {
  console.error("Repair failed:", error);
  process.exit(1);
});
