import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import {
  LEGACY_QUESTIONS_BY_SUBJECT,
  type LegacyQuestionRecord,
} from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const SUBJECT_ID = "bb3d3ab5-ba77-47f5-967d-0b850e406480";
const SOURCE_KEY = "Biology";
const EXPECTED_SOURCE_COUNT = 160;

const ARCHIVE_REASONS: Record<string, string> = {
  B17: "Ambiguous: carrots and vitamin-A-rich meat such as liver can both be sources.",
  B46: "Near-duplicate of B140, which asks more directly about transpiration.",
  B113: "Tests renewable-resource classification, not Biology.",
  B128: "Tests geological weathering rather than a biological process.",
  B129: "Repeats B108's exact stem about a flightless bird.",
  B135: "Near-duplicate of B1 about the mitochondrion's energy-related role.",
  B137: "Overlaps B105 and ambiguously asks what plants release during daytime.",
  B144: "Near-duplicate of B83 about fusion of male and female gametes.",
  B152: "Near-duplicate of B8 asking for the basic unit of life.",
  B154: "Near-duplicate of B11 asking how green plants make food.",
  B160: "Tests evaporation as a physical state change, not Biology.",
};

const MEDIUM_IDS = new Set(["B60", "B112"]);
const CLARIFIED_STEM_IDS = new Set([
  "B6",
  "B16",
  "B23",
  "B30",
  "B82",
  "B109",
  "B112",
  "B155",
  "B156",
]);
const EXPLANATION_OVERRIDES: Record<string, string> = {
  B16: "During complete starch digestion, amylases break starch into smaller sugars, and intestinal enzymes such as maltase release glucose. Other dietary carbohydrates can yield different monosaccharides.",
  B82: "In flowering plants, pollen carries the male gametes. The pollen grain germinates on the stigma and grows a pollen tube through which the sperm cells travel to the ovule. The ovule contains the female gamete; the anther produces pollen, and the stigma receives it.",
  B112: "In the described interaction, cattle egrets benefit by catching insects disturbed by grazing cattle, while the cattle are unaffected. This is commensalism.",
};

const GENERIC_EXPLANATION =
  /answer is correct because it matches the biological structure, process, function, or classification/i;

function normalized(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function questionText(question: LegacyQuestionRecord): string {
  const value = question.text ?? question.questionText;
  if (!value?.trim())
    throw new Error(`Missing stem for ${question.id ?? "unknown question"}.`);
  return value.trim();
}

function correctAnswer(question: LegacyQuestionRecord): string {
  const value = question.answer ?? question.correctAnswer;
  if (!value?.trim())
    throw new Error(`Missing answer for ${question.id ?? "unknown question"}.`);
  return value.trim();
}

function explanationFor(question: LegacyQuestionRecord): string | null {
  const id = question.id ?? "";
  if (EXPLANATION_OVERRIDES[id]) return EXPLANATION_OVERRIDES[id];
  const explanation = question.explanation?.trim() ?? "";
  return explanation && !GENERIC_EXPLANATION.test(explanation)
    ? explanation
    : null;
}

function validateSource(source: LegacyQuestionRecord[]): void {
  if (source.length !== EXPECTED_SOURCE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SOURCE_COUNT} Biology source records; found ${source.length}.`,
    );
  }

  const seenIds = new Set<string>();
  for (const question of source) {
    const id = question.id;
    if (!id || !/^B\d+$/.test(id) || seenIds.has(id)) {
      throw new Error(
        `Missing or duplicate Biology source ID: ${id ?? "unknown"}.`,
      );
    }
    seenIds.add(id);

    const options = question.options ?? [];
    const normalizedOptions = options.map(normalized);
    const answer = normalized(correctAnswer(question));
    if (
      options.length !== 4 ||
      new Set(normalizedOptions).size !== 4 ||
      normalizedOptions.filter((option) => option === answer).length !== 1
    ) {
      throw new Error(`Invalid four-option source record: ${id}.`);
    }
  }

  for (const id of Object.keys(ARCHIVE_REASONS)) {
    if (!seenIds.has(id))
      throw new Error(
        `Archive decision refers to missing source record ${id}.`,
      );
  }
  for (const id of [...MEDIUM_IDS, ...CLARIFIED_STEM_IDS]) {
    if (!seenIds.has(id))
      throw new Error(
        `Reviewed metadata refers to missing source record ${id}.`,
      );
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Supabase URL and service-role key are required.");

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const source =
    (LEGACY_QUESTIONS_BY_SUBJECT as Record<string, LegacyQuestionRecord[]>)[
      SOURCE_KEY
    ] ?? [];
  validateSource(source);

  const { data: subject, error: subjectError } = await db
    .from("subjects")
    .select("id,name,is_active")
    .eq("id", SUBJECT_ID)
    .maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject || subject.name !== SOURCE_KEY || !subject.is_active) {
    throw new Error("Canonical Biology production subject guard failed.");
  }

  const { data: catalogue, error: catalogueError } = await db
    .from("catalogue_subjects")
    .select("catalogue_key,production_subject_id,availability_status,is_active")
    .eq("catalogue_key", "biology")
    .maybeSingle();
  if (catalogueError) throw catalogueError;
  if (
    !catalogue ||
    catalogue.production_subject_id !== SUBJECT_ID ||
    !catalogue.is_active
  ) {
    throw new Error("Biology catalogue mapping guard failed.");
  }

  const { data: currentRows, error: currentError } = await db
    .from("questions")
    .select("id,legacy_id,is_active,question_text,explanation")
    .eq("subject_id", SUBJECT_ID);
  if (currentError) throw currentError;
  const currentByLegacyId = new Map(
    (currentRows ?? []).map((row) => [row.legacy_id, row]),
  );
  if (currentByLegacyId.size !== (currentRows ?? []).length) {
    throw new Error("Canonical Biology subject has duplicate legacy IDs.");
  }

  const insertedSourceQuestions = source.filter(
    (question) => !currentByLegacyId.has(question.id!),
  );
  if (insertedSourceQuestions.length > 0) {
    const { data: inserted, error: insertError } = await db
      .from("questions")
      .insert(
        insertedSourceQuestions.map((question) => {
          const id = question.id!;
          const archived = id in ARCHIVE_REASONS;
          return {
            subject_id: SUBJECT_ID,
            legacy_id: id,
            question_text: questionText(question),
            explanation: explanationFor(question),
            points: question.points ?? 1,
            is_active: !archived,
            topic_id: null,
            difficulty: archived
              ? null
              : MEDIUM_IDS.has(id)
                ? "medium"
                : "easy",
            question_type: "multiple_choice",
          };
        }),
      )
      .select("id,legacy_id");
    if (insertError) throw insertError;

    const insertedByLegacyId = new Map(
      (inserted ?? []).map((row) => [row.legacy_id, row.id]),
    );
    const optionRows = insertedSourceQuestions.flatMap((question) => {
      const questionId = insertedByLegacyId.get(question.id!);
      if (!questionId)
        throw new Error(`Inserted question ID missing for ${question.id}.`);
      return (question.options ?? []).map((option, index) => ({
        question_id: questionId,
        option_label: String.fromCharCode(65 + index),
        option_text: option.trim(),
        is_correct: normalized(option) === normalized(correctAnswer(question)),
      }));
    });
    const { error: optionInsertError } = await db
      .from("question_options")
      .insert(optionRows);
    if (optionInsertError) throw optionInsertError;
  }

  const sourceIds = source.map((question) => question.id!);
  const activeSourceIds = sourceIds.filter((id) => !(id in ARCHIVE_REASONS));
  const archiveIds = Object.keys(ARCHIVE_REASONS);
  const { error: archiveError } = await db
    .from("questions")
    .update({ is_active: false, topic_id: null, difficulty: null })
    .eq("subject_id", SUBJECT_ID)
    .in("legacy_id", archiveIds);
  if (archiveError) throw archiveError;

  const easyIds = activeSourceIds.filter((id) => !MEDIUM_IDS.has(id));
  const { error: easyError } = await db
    .from("questions")
    .update({ difficulty: "easy" })
    .eq("subject_id", SUBJECT_ID)
    .in("legacy_id", easyIds);
  if (easyError) throw easyError;
  const { error: mediumError } = await db
    .from("questions")
    .update({ difficulty: "medium" })
    .eq("subject_id", SUBJECT_ID)
    .in("legacy_id", [...MEDIUM_IDS]);
  if (mediumError) throw mediumError;

  let clarifiedCount = 0;
  for (const id of CLARIFIED_STEM_IDS) {
    const question = source.find((item) => item.id === id)!;
    const existing = currentByLegacyId.get(id);
    if (existing && existing.question_text !== questionText(question)) {
      const { error } = await db
        .from("questions")
        .update({ question_text: questionText(question) })
        .eq("id", existing.id);
      if (error) throw error;
      clarifiedCount += 1;
    }
  }

  const genericExplanationIds = source
    .filter(
      (question) =>
        question.explanation && GENERIC_EXPLANATION.test(question.explanation),
    )
    .map((question) => question.id!);
  const genericExplanationClearedCount = (currentRows ?? []).filter(
    (row) =>
      genericExplanationIds.includes(row.legacy_id) &&
      Boolean(row.explanation) &&
      !EXPLANATION_OVERRIDES[row.legacy_id],
  ).length;
  if (genericExplanationIds.length > 0) {
    const { error } = await db
      .from("questions")
      .update({ explanation: null })
      .eq("subject_id", SUBJECT_ID)
      .in(
        "legacy_id",
        genericExplanationIds.filter((id) => !EXPLANATION_OVERRIDES[id]),
      );
    if (error) throw error;
  }
  for (const [id, explanation] of Object.entries(EXPLANATION_OVERRIDES)) {
    const { error } = await db
      .from("questions")
      .update({ explanation })
      .eq("subject_id", SUBJECT_ID)
      .eq("legacy_id", id);
    if (error) throw error;
  }

  const { data: finalRows, error: finalError } = await db
    .from("questions")
    .select(
      "id,legacy_id,question_text,is_active,topic_id,difficulty,class_id,term_id",
    )
    .eq("subject_id", SUBJECT_ID);
  if (finalError) throw finalError;
  const rows = finalRows ?? [];
  const { data: optionRows, error: optionError } = await db
    .from("question_options")
    .select("question_id,option_text,is_correct")
    .in(
      "question_id",
      rows.map((row) => row.id),
    );
  if (optionError) throw optionError;

  const optionsByQuestion = new Map<string, typeof optionRows>();
  for (const option of optionRows ?? []) {
    const current = optionsByQuestion.get(option.question_id) ?? [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  }
  const activeRows = rows.filter((row) => row.is_active);
  const invalid = activeRows.filter((row) => {
    const options = optionsByQuestion.get(row.id) ?? [];
    return (
      options.length !== 4 ||
      options.filter((option) => option.is_correct).length !== 1 ||
      new Set(options.map((option) => normalized(option.option_text))).size !==
        4
    );
  });
  if (invalid.length > 0) {
    throw new Error(
      `Active Biology option integrity failed: ${invalid.map((row) => row.legacy_id).join(", ")}.`,
    );
  }

  const difficulty = Object.fromEntries(
    ["easy", "medium", "hard", "unassigned"].map((value) => [
      value,
      activeRows.filter((row) => (row.difficulty ?? "unassigned") === value)
        .length,
    ]),
  );
  const activeGlobalWithOptions = activeRows.filter(
    (row) =>
      !row.class_id &&
      !row.term_id &&
      (optionsByQuestion.get(row.id)?.length ?? 0) > 0,
  ).length;
  const blockedStatuses = new Set([
    "not_ready",
    "source_review_required",
    "scope_decision_required",
    "mapping_required",
    "pending",
    "review_required",
  ]);

  console.log(
    JSON.stringify(
      {
        sourceCount: source.length,
        insertedCount: insertedSourceQuestions.length,
        archivedCount: rows.filter((row) => !row.is_active).length,
        activeCount: activeRows.length,
        unassignedCount: activeRows.filter((row) => !row.topic_id).length,
        difficulty,
        genericExplanationsCleared: genericExplanationClearedCount,
        clarifiedStemsUpdated: clarifiedCount,
        activeInvalidOptionSets: invalid.map((row) => row.legacy_id),
        archivedReasons: ARCHIVE_REASONS,
        catalogueAvailabilityStatus: catalogue.availability_status,
        readiness: {
          questionCountGate: 40,
          activeGlobalQuestionsWithOptions: activeGlobalWithOptions,
          available:
            Boolean(catalogue.production_subject_id) &&
            activeGlobalWithOptions >= 40 &&
            !blockedStatuses.has(
              String(catalogue.availability_status ?? "").toLowerCase(),
            ),
        },
        topicAssignmentsPreserved: true,
        curriculumAction:
          "No Biology source hierarchy available; no curriculum rows or topic assignments synthesized.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Biology question-bank seeding failed:", error);
  process.exit(1);
});
