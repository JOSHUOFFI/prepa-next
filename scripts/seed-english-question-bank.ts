import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import curriculum from "@/data/curriculum/jss1-3.json";
import { ENGLISH_AUTHORED } from "@/scripts/data/jss-priority-authored-questions";
import {
  LEGACY_QUESTIONS_BY_SUBJECT,
  type LegacyQuestionRecord,
} from "@/data/legacy-question-bank";
import { balanceCorrectOptionPositions } from "@/scripts/lib/balanced-question-options";

loadEnvConfig(process.cwd());

const SUBJECT_ID = "a0e64f96-d382-4cee-9f84-b1e6b5e075c6";
const SOURCE_KEY = "English";
const EXPECTED_SOURCE_COUNT = 100;
const DUPLICATE_PREFIX = "legacy_english_";
const SOURCE_DOCUMENT = "jss1-3_english_studies.pdf";
const SOURCE_URL =
  "https://www.nerdc.gov.ng/content_manager/jss/jss1-3_english_studies.pdf";
const RETIRED_TOPIC_NAMES = [
  "Grammar & Usage",
  "Vocabulary & Lexis",
  "Comprehension & Reading",
  "Sentence Structure",
  "Tenses & Concord",
  "Punctuation & Spelling",
  "Oral English & Phonetics",
  "Literature & Idioms",
];

const IMPLEMENTATION_TOPICS = [
  {
    theme: "Language Study and Expression",
    subtheme: "Vocabulary and Meaning",
    topic: "Vocabulary and Word Meaning",
    curriculumId: "topic_310bf0a68c1b1381",
    subthemeId: "subtheme_1d59ad42e9f4ca21",
  },
  {
    theme: "Language Study and Expression",
    subtheme: "Vocabulary and Meaning",
    topic: "Idioms and Figurative Language",
    curriculumId: "topic_4a3b0fc4d892fd13",
    subthemeId: "subtheme_1d59ad42e9f4ca21",
  },
  {
    theme: "Language Study and Expression",
    subtheme: "Grammar and Sentence Use",
    topic: "Grammar and Usage",
    curriculumId: "topic_2e9a44cc71a50f2b",
    subthemeId: "subtheme_bca256e1c42079ad",
  },
  {
    theme: "Language Study and Expression",
    subtheme: "Grammar and Sentence Use",
    topic: "Sentence Transformation",
    curriculumId: "topic_5c3e191f4d26a087",
    subthemeId: "subtheme_bca256e1c42079ad",
  },
  {
    theme: "Language Study and Expression",
    subtheme: "Writing Conventions",
    topic: "Spelling and Punctuation",
    curriculumId: "topic_7f8f288dca04a611",
    subthemeId: "subtheme_8915c30b7a6e42fd",
  },
] as const;

const IMPLEMENTATION_THEME_ID = "theme_14caa639fd323d88";
const IMPLEMENTATION_SUBTHEMES = [
  { id: "subtheme_1d59ad42e9f4ca21", name: "Vocabulary and Meaning" },
  { id: "subtheme_bca256e1c42079ad", name: "Grammar and Sentence Use" },
  { id: "subtheme_8915c30b7a6e42fd", name: "Writing Conventions" },
] as const;

const MEDIUM_IDS = new Set([
  "E19",
  "E31",
  "E35",
  "E51",
  "E53",
  "E55",
  "E56",
  "E58",
  "E60",
  "E61",
  "E62",
  "E63",
  "E64",
  "E65",
  "E66",
  "E67",
  "E68",
  "E69",
  "E70",
  "E73",
  "E77",
  "E78",
  "E79",
  "E80",
  "E97",
]);

const TOPIC_ID_BY_SOURCE_IDS: Record<string, readonly string[]> = {
  "Vocabulary and Word Meaning": [
    ...Array.from({ length: 10 }, (_, index) => `E${index + 1}`),
    ...Array.from({ length: 10 }, (_, index) => `E${index + 51}`),
    "E81",
    "E82",
    "E91",
    "E93",
    "E96",
    "E99",
  ],
  "Grammar and Usage": [
    ...Array.from({ length: 10 }, (_, index) => `E${index + 11}`),
    ...Array.from({ length: 10 }, (_, index) => `E${index + 41}`),
    ...Array.from({ length: 9 }, (_, index) => `E${index + 72}`),
    "E85",
    "E87",
    "E88",
    "E89",
    "E90",
    "E95",
    "E98",
  ],
  "Spelling and Punctuation": [
    ...Array.from({ length: 10 }, (_, index) => `E${index + 21}`),
    "E71",
    "E86",
    "E92",
    "E100",
  ],
  "Idioms and Figurative Language": [
    ...Array.from({ length: 10 }, (_, index) => `E${index + 31}`),
    "E83",
    "E84",
    "E94",
    "E97",
  ],
  "Sentence Transformation": Array.from(
    { length: 10 },
    (_, index) => `E${index + 61}`,
  ),
};

const normalize = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const normalizeOption = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim();

function validateSource(source: LegacyQuestionRecord[]) {
  if (source.length !== EXPECTED_SOURCE_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_SOURCE_COUNT} English records; found ${source.length}.`,
    );
  }
  const ids = new Set<string>();
  const stems = new Set<string>();
  for (const question of source) {
    const id = question.id;
    const stem = (question.text ?? question.questionText ?? "").trim();
    const options = question.options ?? [];
    const answer = normalize(question.answer ?? question.correctAnswer ?? "");
    if (!id || !/^E\d+$/.test(id) || ids.has(id))
      throw new Error(`Invalid or duplicate English ID: ${id}.`);
    if (!stem || stems.has(normalize(stem)))
      throw new Error(`Missing or duplicate English stem: ${id}.`);
    if (
      options.length !== 4 ||
      new Set(options.map(normalizeOption)).size !== 4 ||
      options.filter((option) => normalize(option) === answer).length !== 1
    ) {
      throw new Error(`Invalid four-option English record: ${id}.`);
    }
    ids.add(id);
    stems.add(normalize(stem));
  }

  const mappedIds = Object.values(TOPIC_ID_BY_SOURCE_IDS).flat();
  if (
    mappedIds.length !== source.length ||
    new Set(mappedIds).size !== mappedIds.length ||
    source.some((question) => !mappedIds.includes(question.id!))
  ) {
    throw new Error(
      "English question-to-topic map must cover each source ID exactly once.",
    );
  }

  const authoredIds = new Set<string>();
  for (const [
    id,
    topic,
    difficulty,
    text,
    options,
    answerIndex,
  ] of ENGLISH_AUTHORED) {
    const stem = normalize(text);
    if (!id.startsWith("PEA") || authoredIds.has(id) || stems.has(stem))
      throw new Error(`Invalid or duplicate authored English record: ${id}.`);
    if (!IMPLEMENTATION_TOPICS.some((candidate) => candidate.topic === topic))
      throw new Error(
        `Missing reviewed topic for authored English item ${id}.`,
      );
    if (
      options.length !== 4 ||
      new Set(options.map(normalizeOption)).size !== 4 ||
      answerIndex < 0 ||
      answerIndex > 3
    )
      throw new Error(`Invalid authored English options: ${id}.`);
    if (!["easy", "medium", "hard"].includes(difficulty))
      throw new Error(`Invalid authored English difficulty: ${id}.`);
    authoredIds.add(id);
    stems.add(stem);
  }
  if (ENGLISH_AUTHORED.length !== 100)
    throw new Error(
      `Expected 100 PrePa-authored English items; found ${ENGLISH_AUTHORED.length}.`,
    );
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
  const authored = ENGLISH_AUTHORED;

  const { data: subject, error: subjectError } = await db
    .from("subjects")
    .select("id,name,is_active")
    .eq("id", SUBJECT_ID)
    .maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject || subject.name !== "English" || !subject.is_active)
    throw new Error("Canonical English subject guard failed.");
  const { data: catalogue, error: catalogueError } = await db
    .from("catalogue_subjects")
    .select("catalogue_key,production_subject_id,availability_status,is_active")
    .eq("catalogue_key", "english_studies")
    .maybeSingle();
  if (catalogueError) throw catalogueError;
  if (
    !catalogue ||
    catalogue.production_subject_id !== SUBJECT_ID ||
    !catalogue.is_active
  )
    throw new Error("English Studies catalogue mapping guard failed.");

  const { data: startingRows, error: startingError } = await db
    .from("questions")
    .select("id,legacy_id,is_active")
    .eq("subject_id", SUBJECT_ID);
  if (startingError) throw startingError;
  const startingActive = (startingRows ?? []).filter(
    (row) => row.is_active,
  ).length;
  const classResult = await db
    .from("classes")
    .select("id,name")
    .in("name", ["JSS1"]);
  if (classResult.error) throw classResult.error;
  const jss1Id = classResult.data?.[0]?.id;
  if (!jss1Id)
    throw new Error(
      "JSS1 class record is required for the review-required implementation taxonomy.",
    );

  const officialEnglish = curriculum.verifiedHierarchy
    .find((level) => level.classCode === "JSS1")
    ?.subjects.find((item) => item.subjectCode === "ENGLISH_STUDIES");
  if (!officialEnglish || officialEnglish.sourceStatus !== "verified")
    throw new Error(
      "Verified JSS1 English Reading hierarchy is missing from the repository manifest.",
    );

  const { data: officialThemes, error: themeError } = await db
    .from("curriculum_themes")
    .upsert(
      officialEnglish.themes.map((theme) => ({
        id: theme.id,
        subject_id: SUBJECT_ID,
        class_id: jss1Id,
        name: theme.name,
        verification_status: theme.sourceStatus,
        source_document: officialEnglish.sourceDocument,
        source_url: officialEnglish.sourceUrl,
        source_pages: theme.sourcePages,
      })),
      { onConflict: "id" },
    )
    .select("id,name");
  if (themeError) throw themeError;

  const officialSubthemes = officialEnglish.themes.flatMap((theme) =>
    theme.subThemes.map((subtheme) => ({ ...subtheme, themeId: theme.id })),
  );
  const { error: officialSubthemeError } = await db
    .from("curriculum_subthemes")
    .upsert(
      officialSubthemes.map((subtheme) => ({
        id: subtheme.id,
        theme_id: subtheme.themeId,
        name: subtheme.name,
        verification_status: subtheme.sourceStatus,
        source_document: officialEnglish.sourceDocument,
        source_url: officialEnglish.sourceUrl,
        source_pages: subtheme.sourcePages,
      })),
      { onConflict: "id" },
    );
  if (officialSubthemeError) throw officialSubthemeError;

  const officialTopics = officialSubthemes.flatMap((subtheme) =>
    subtheme.topics.map((topic) => ({ ...topic, subthemeId: subtheme.id })),
  );
  const { error: officialTopicError } = await db.from("topics").upsert(
    officialTopics.map((topic) => ({
      subject_id: SUBJECT_ID,
      class_id: jss1Id,
      term_id: null,
      name: topic.name,
      is_active: true,
      curriculum_id: topic.id,
      curriculum_subtheme_id: topic.subthemeId,
      curriculum_verification_status: topic.sourceStatus,
      curriculum_source_document: topic.sourceDocument,
      curriculum_source_url: topic.sourceUrl,
      curriculum_source_pages: topic.sourcePages,
    })),
    { onConflict: "curriculum_id" },
  );
  if (officialTopicError) throw officialTopicError;

  const { error: implementationThemeError } = await db
    .from("curriculum_themes")
    .upsert(
      {
        id: IMPLEMENTATION_THEME_ID,
        subject_id: SUBJECT_ID,
        class_id: jss1Id,
        name: "Language Study and Expression",
        verification_status: "review_required",
        source_document: null,
        source_url: null,
        source_pages: [],
      },
      { onConflict: "id" },
    );
  if (implementationThemeError) throw implementationThemeError;
  const { error: implementationSubthemeError } = await db
    .from("curriculum_subthemes")
    .upsert(
      IMPLEMENTATION_SUBTHEMES.map((subtheme) => ({
        id: subtheme.id,
        theme_id: IMPLEMENTATION_THEME_ID,
        name: subtheme.name,
        verification_status: "review_required",
        source_document: null,
        source_url: null,
        source_pages: [],
      })),
      { onConflict: "id" },
    );
  if (implementationSubthemeError) throw implementationSubthemeError;

  const implementationRows = IMPLEMENTATION_TOPICS.map((topic) => ({
    subject_id: SUBJECT_ID,
    class_id: jss1Id,
    term_id: null,
    name: topic.topic,
    is_active: true,
    curriculum_id: topic.curriculumId,
    curriculum_subtheme_id: topic.subthemeId,
    curriculum_verification_status: "review_required",
    curriculum_source_document: null,
    curriculum_source_url: null,
    curriculum_source_pages: [],
  }));
  const { error: implementationTopicError } = await db
    .from("topics")
    .upsert(implementationRows, { onConflict: "curriculum_id" });
  if (implementationTopicError) throw implementationTopicError;
  const { data: topics, error: topicsError } = await db
    .from("topics")
    .select("id,curriculum_id")
    .eq("subject_id", SUBJECT_ID);
  if (topicsError) throw topicsError;
  const topicIdByName = new Map<string, string | undefined>(
    IMPLEMENTATION_TOPICS.map((topic) => [
      topic.topic,
      topics?.find((row) => row.curriculum_id === topic.curriculumId)?.id,
    ]),
  );
  const topicNameById = new Map<string, string>();
  for (const [topicName, ids] of Object.entries(TOPIC_ID_BY_SOURCE_IDS)) {
    for (const id of ids) topicNameById.set(id, topicName);
  }

  const { data: currentRows, error: currentError } = await db
    .from("questions")
    .select("id,legacy_id")
    .eq("subject_id", SUBJECT_ID);
  if (currentError) throw currentError;
  const currentIds = new Set((currentRows ?? []).map((row) => row.legacy_id));
  const insertedCount = source.filter(
    (question) => !currentIds.has(question.id!),
  ).length;
  const authoredInsertedCount = authored.filter(
    ([id]) => !currentIds.has(id),
  ).length;
  const sourceRows = source.map((question) => {
    const id = question.id!;
    const topicName = topicNameById.get(id)!;
    const topicId = topicIdByName.get(topicName);
    if (!topicId) throw new Error(`Missing topic assignment for ${id}.`);
    return {
      subject_id: SUBJECT_ID,
      legacy_id: id,
      question_text: (question.text ?? question.questionText ?? "").trim(),
      explanation: question.explanation ?? null,
      points: question.points ?? 1,
      is_active: true,
      topic_id: topicId,
      difficulty: MEDIUM_IDS.has(id) ? "medium" : "easy",
      question_type: "multiple_choice",
      content_provenance: "legacy_uncited",
    };
  });
  const authoredRows = authored.map(
    ([id, topic, difficulty, text, , , explanation]) => {
      const topicId = topicIdByName.get(topic);
      if (!topicId)
        throw new Error(
          `Missing topic assignment for authored English item ${id}.`,
        );
      return {
        subject_id: SUBJECT_ID,
        legacy_id: id,
        question_text: text,
        explanation: explanation ?? null,
        points: 1,
        is_active: true,
        topic_id: topicId,
        difficulty,
        question_type: "multiple_choice",
        content_provenance: "prepa_authored",
      };
    },
  );
  const questionRows = [...sourceRows, ...authoredRows];
  const { data: upsertedQuestions, error: upsertError } = await db
    .from("questions")
    .upsert(questionRows, { onConflict: "subject_id,legacy_id" })
    .select("id,legacy_id");
  if (upsertError) throw upsertError;
  const questionIdByLegacyId = new Map(
    (upsertedQuestions ?? []).map((row) => [row.legacy_id, row.id]),
  );
  const optionSources = [
    ...source.map((question) => ({
      id: question.id!,
      options: question.options!,
      answer: question.answer ?? question.correctAnswer ?? "",
    })),
    ...authored.map(([id, , , , options, answerIndex]) => ({
      id,
      options,
      answer: options[answerIndex],
    })),
  ];
  const balancedOptions = balanceCorrectOptionPositions(optionSources);
  const optionRows = optionSources.flatMap((question) =>
    balancedOptions.get(question.id)!.map((option, index) => ({
      question_id: questionIdByLegacyId.get(question.id)!,
      option_label: String.fromCharCode(65 + index),
      option_text: option,
      is_correct: normalizeOption(option) === normalizeOption(question.answer),
    })),
  );
  const { error: optionsError } = await db
    .from("question_options")
    .upsert(optionRows, { onConflict: "question_id,option_label" });
  if (optionsError) throw optionsError;

  const duplicateIds = (currentRows ?? [])
    .filter((row) => row.legacy_id.startsWith(DUPLICATE_PREFIX))
    .map((row) => row.legacy_id);
  if (duplicateIds.length > 0) {
    const { error } = await db
      .from("questions")
      .update({ is_active: false, topic_id: null, difficulty: null })
      .eq("subject_id", SUBJECT_ID)
      .in("legacy_id", duplicateIds);
    if (error) throw error;
  }

  const { data: retiredTopics, error: retiredTopicsError } = await db
    .from("topics")
    .select("id")
    .eq("subject_id", SUBJECT_ID)
    .in("name", RETIRED_TOPIC_NAMES);
  if (retiredTopicsError) throw retiredTopicsError;
  const retiredTopicIds = (retiredTopics ?? []).map((topic) => topic.id);
  if (retiredTopicIds.length > 0) {
    const { data: stillAssigned, error: assignedError } = await db
      .from("questions")
      .select("id,legacy_id")
      .eq("is_active", true)
      .in("topic_id", retiredTopicIds);
    if (assignedError) throw assignedError;
    if ((stillAssigned ?? []).length > 0)
      throw new Error(
        "Cannot deactivate legacy English topics while active questions still use them.",
      );
    const { error } = await db
      .from("topics")
      .update({ is_active: false })
      .eq("subject_id", SUBJECT_ID)
      .in("id", retiredTopicIds);
    if (error) throw error;
  }

  const { data: finalRows, error: finalError } = await db
    .from("questions")
    .select(
      "id,legacy_id,question_text,is_active,topic_id,difficulty,class_id,term_id",
    )
    .eq("subject_id", SUBJECT_ID);
  if (finalError) throw finalError;
  const finalQuestions = finalRows ?? [];
  const { data: finalOptions, error: finalOptionsError } = await db
    .from("question_options")
    .select("question_id,option_label,option_text,is_correct")
    .in(
      "question_id",
      finalQuestions.filter((row) => row.is_active).map((row) => row.id),
    );
  if (finalOptionsError) throw finalOptionsError;
  const optionsByQuestion = new Map<string, typeof finalOptions>();
  for (const option of finalOptions ?? []) {
    const options = optionsByQuestion.get(option.question_id) ?? [];
    options.push(option);
    optionsByQuestion.set(option.question_id, options);
  }
  const active = finalQuestions.filter((row) => row.is_active);
  const invalid = active.filter((row) => {
    const options = optionsByQuestion.get(row.id) ?? [];
    return (
      options.length !== 4 ||
      options.filter((option) => option.is_correct).length !== 1 ||
      new Set(options.map((option) => normalizeOption(option.option_text)))
        .size !== 4
    );
  });
  if (invalid.length)
    throw new Error(
      `English option integrity failed for: ${invalid.map((row) => row.legacy_id).join(", ")}.`,
    );
  const activeStems = active.map((row) => normalize(row.question_text));
  const duplicateCount = activeStems.length - new Set(activeStems).size;
  if (duplicateCount)
    throw new Error("Active English questions contain duplicate stems.");
  const eligible = active.filter(
    (row) =>
      !row.class_id &&
      !row.term_id &&
      (optionsByQuestion.get(row.id)?.length ?? 0) === 4,
  ).length;
  const blocking = new Set([
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
        sourceMode: "legacy_uncited",
        subject: "English Studies",
        productionSubjectId: SUBJECT_ID,
        startingActiveCount: startingActive,
        retainedCount: source.length,
        archivedCount: duplicateIds.length,
        newlyAuthoredCount: authored.length,
        insertedCount,
        authoredInsertedCount,
        finalActiveCount: active.length,
        invalidQuestionCount: invalid.length,
        duplicateCount,
        unassignedCount: active.filter((row) => !row.topic_id).length,
        topicDistribution: Object.fromEntries(
          IMPLEMENTATION_TOPICS.map((topic) => [
            topic.topic,
            active.filter(
              (row) => row.topic_id === topicIdByName.get(topic.topic),
            ).length,
          ]),
        ),
        difficultyDistribution: Object.fromEntries(
          ["easy", "medium", "hard"].map((level) => [
            level,
            active.filter((row) => row.difficulty === level).length,
          ]),
        ),
        answerPositionDistribution: Object.fromEntries(
          ["A", "B", "C", "D"].map((label) => [
            label,
            (finalOptions ?? []).filter(
              (option) => option.is_correct && option.option_label === label,
            ).length,
          ]),
        ),
        curriculum: {
          officialVerifiedTopics: officialTopics.length,
          implementationTopics: IMPLEMENTATION_TOPICS.length,
          implementationProvenance: "review_required",
        },
        readiness: {
          gate: 40,
          eligibleGlobalQuestions: eligible,
          available:
            eligible >= 40 &&
            !blocking.has(String(catalogue.availability_status).toLowerCase()),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("English Studies bank seeding failed:", error);
  process.exit(1);
});
