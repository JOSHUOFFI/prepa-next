import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import curriculum from "@/data/curriculum/jss1-3.json";
import { MATHEMATICS_AUTHORED } from "@/scripts/data/jss-priority-authored-questions";
import {
  LEGACY_QUESTIONS_BY_SUBJECT,
  type LegacyQuestionRecord,
} from "@/data/legacy-question-bank";
import { balanceCorrectOptionPositions } from "@/scripts/lib/balanced-question-options";

loadEnvConfig(process.cwd());

const SUBJECT_ID = "91f37d59-3401-47c5-ae18-46ead707c570";
const SOURCE_KEY = "Mathematics";
const ARCHIVE_REASONS: Record<string, string> = {
  M24: "Common logarithms are outside the verified JSS1-3 mathematics topics.",
  M25: "Logarithm laws are outside the verified JSS1-3 mathematics topics.",
  M26: "Logarithms are outside the verified JSS1-3 mathematics topics.",
  M29: "Logarithmic equations are outside the verified JSS1-3 mathematics topics.",
  M41: "The polynomial remainder theorem is beyond the verified JSS algebra scope.",
  M43: "The polynomial factor theorem is beyond the verified JSS algebra scope.",
  M45: "Polynomial degree notation at this level is not supported by the verified JSS topics.",
  M49: "Function notation with a quadratic expression is beyond the verified JSS algebra scope.",
  M53: "Variation involving a squared variable exceeds the defensible JSS scope of this source set.",
  M56: "Square-root variation is not represented in the verified JSS topics.",
  M57: "Compound direct and inverse variation is not represented in the verified JSS topics.",
  M58: "Cubic variation is not represented in the verified JSS topics.",
  M59: "The solid whose volume is being compared is unspecified, making the item ambiguous.",
  M60: "Inverse-square variation is beyond the verified JSS topics.",
  M63: "Quadratic inequalities are beyond the verified JSS inequality topic.",
  M65: "Absolute-value inequalities are beyond the verified JSS inequality topic.",
  M66: "Quadratic product inequalities are beyond the verified JSS inequality topic.",
  M68: "Rational inequalities are beyond the verified JSS inequality topic.",
  M74: "Sum to infinity of a geometric progression is beyond the verified JSS topics.",
  M81: "A custom binary operation is not supported by the verified JSS mathematics topics.",
  M82: "A custom binary operation is not supported by the verified JSS mathematics topics.",
  M83: "An inverse element for a custom binary operation is beyond the verified JSS topics.",
  M84: "Abstract operation properties are beyond the verified JSS mathematics topics.",
  M85: "Abstract operation properties are beyond the verified JSS mathematics topics.",
  M86: "Nested custom binary operations are beyond the verified JSS mathematics topics.",
  M87: "Identity elements for custom binary operations are beyond the verified JSS topics.",
  M88: "Custom operations involving square roots are beyond the verified JSS topics.",
  M89: "Abstract operation properties are beyond the verified JSS mathematics topics.",
  M90: "Binary-operation tables are not represented in the verified JSS mathematics topics.",
  M91: "Matrix determinants are beyond the verified JSS mathematics topics.",
  M92: "Matrix inverses are beyond the verified JSS mathematics topics.",
  M93: "Matrix multiplication is beyond the verified JSS mathematics topics.",
  M94: "Matrix classification is beyond the verified JSS mathematics topics.",
  M95: "Identity matrices are beyond the verified JSS mathematics topics.",
  M96: "Singular matrices are beyond the verified JSS mathematics topics.",
  M97: "Matrix transposition is beyond the verified JSS mathematics topics.",
  M98: "Matrix equations are beyond the verified JSS mathematics topics.",
  M99: "Matrix trace is beyond the verified JSS mathematics topics.",
  M100: "Determinant equations are beyond the verified JSS mathematics topics.",
  M107: "Differentiation is beyond the verified JSS mathematics topics.",
  M108: "Integration is beyond the verified JSS mathematics topics.",
  M111: "Differentiation is beyond the verified JSS mathematics topics.",
  M117: "The trigonometric equation has no stated angle domain and admits multiple solutions.",
  M118: "Differentiation is beyond the verified JSS mathematics topics.",
  M126: "Integration is beyond the verified JSS mathematics topics.",
  M127: "Differentiation is beyond the verified JSS mathematics topics.",
  M131: "Complex numbers are beyond the verified JSS mathematics topics.",
  M133: "The general quadratic-root product formula is beyond the verified JSS topics.",
  M134: "The general quadratic-root sum formula is beyond the verified JSS topics.",
  M139: "Differentiation is beyond the verified JSS mathematics topics.",
  M140: "Integration is beyond the verified JSS mathematics topics.",
};

const IMPLEMENTATION_TOPICS = [
  {
    theme: "Number Sense and Operations",
    subtheme: "Number Systems",
    name: "Conversion between number bases",
    id: "topic_a1e0ed42d86e16b2",
  },
  {
    theme: "Number Sense and Operations",
    subtheme: "Number Systems",
    name: "Standard form",
    id: "topic_6cba1670f0c5463e",
  },
  {
    theme: "Number Sense and Operations",
    subtheme: "Number Systems",
    name: "Indices and powers",
    id: "topic_5cf990a2d214c3e1",
  },
  {
    theme: "Number Sense and Operations",
    subtheme: "Ratio and Proportion",
    name: "Ratio, percentages and profit",
    id: "topic_b6de62e984a13f07",
  },
  {
    theme: "Number Sense and Operations",
    subtheme: "Ratio and Proportion",
    name: "Direct and inverse proportion",
    id: "topic_33d42421e7d24cb1",
  },
  {
    theme: "Algebraic Reasoning",
    subtheme: "Sets and Sequences",
    name: "Set operations",
    id: "topic_6d7310e37b4281b4",
  },
  {
    theme: "Algebraic Reasoning",
    subtheme: "Sets and Sequences",
    name: "Number sequences",
    id: "topic_171f06ccda15009a",
  },
  {
    theme: "Geometry Applications",
    subtheme: "Shape and Measurement",
    name: "Pythagoras and distance",
    id: "topic_31b96c4c3fe4a8d5",
  },
  {
    theme: "Statistics and Chance Extensions",
    subtheme: "Data and Chance",
    name: "Probability",
    id: "topic_f6c201f6934e67af",
  },
  {
    theme: "Statistics and Chance Extensions",
    subtheme: "Data and Chance",
    name: "Range",
    id: "topic_9fb3e015b460f243",
  },
] as const;

const IMPLEMENTATION_THEME_ROWS = [
  { id: "theme_2c517d6e979d31a0", name: "Number Sense and Operations" },
  { id: "theme_a4be206ceea331f2", name: "Algebraic Reasoning" },
  { id: "theme_d4c923ce9ad9b862", name: "Geometry Applications" },
  { id: "theme_4ce352ad9f2198c4", name: "Statistics and Chance Extensions" },
] as const;
const IMPLEMENTATION_SUBTHEME_ROWS = [
  {
    id: "subtheme_9381fae3c72b04a6",
    themeId: "theme_2c517d6e979d31a0",
    name: "Number Systems",
  },
  {
    id: "subtheme_b614cda9a95243f1",
    themeId: "theme_2c517d6e979d31a0",
    name: "Ratio and Proportion",
  },
  {
    id: "subtheme_128c0bc1f4f34793",
    themeId: "theme_a4be206ceea331f2",
    name: "Sets and Sequences",
  },
  {
    id: "subtheme_1422ab9ad6e130fa",
    themeId: "theme_d4c923ce9ad9b862",
    name: "Shape and Measurement",
  },
  {
    id: "subtheme_a8dd1568c6a901b3",
    themeId: "theme_4ce352ad9f2198c4",
    name: "Data and Chance",
  },
] as const;

const TOPIC_IDS: Record<string, readonly string[]> = {
  "Counting in Base 2": ["M1", "M9"],
  "Conversion of base 10 numerals to binary numbers": ["M5"],
  "Addition of numbers in base 2 numerals": ["M4"],
  "Multiplication of numbers in base 2 numerals": ["M7", "M10"],
  Fractions: ["M11", "M19"],
  "Standard form": ["M12"],
  Approximation: ["M18"],
  "Rational and non-rational numbers": ["M27", "M28", "M30", "M121", "M150"],
  "Indices and powers": ["M21", "M22", "M23"],
  "Ratio, percentages and profit": ["M13", "M14", "M15", "M16", "M17", "M20"],
  "Conversion between number bases": ["M2", "M3", "M6", "M8"],
  "Set operations": Array.from({ length: 10 }, (_, index) => `M${index + 31}`),
  Factorization: ["M42", "M47", "M50", "M122"],
  "Algebraic expressions": ["M44", "M46", "M48"],
  "Direct and inverse proportion": ["M51", "M52", "M54", "M55"],
  "Linear inequalities": ["M61", "M62", "M64", "M67", "M69", "M70"],
  "Number sequences": [
    "M71",
    "M72",
    "M73",
    "M75",
    "M76",
    "M77",
    "M80",
    "M129",
    "M132",
  ],
  "Measure of central tendency": ["M78", "M79", "M109", "M123", "M143", "M144"],
  Range: ["M119"],
  Probability: ["M110", "M120", "M128", "M141", "M142"],
  "Plane shapes": ["M102", "M113", "M135", "M136", "M147", "M148"],
  "Three-dimensional figures": ["M103", "M124"],
  Graphs: ["M104", "M112", "M114", "M125"],
  Trigonometry: ["M106", "M116", "M137", "M138"],
  Angles: ["M101", "M115", "M145", "M146"],
  "Pythagoras and distance": ["M105", "M130", "M149"],
};

const EASY_IDS = new Set([
  ...Array.from({ length: 20 }, (_, index) => `M${index + 1}`),
  "M31",
  "M32",
  "M35",
  "M37",
  "M38",
  "M40",
  "M42",
  "M44",
  "M45",
  "M48",
  "M55",
  "M61",
  "M62",
  "M64",
  "M69",
  "M70",
  "M71",
  "M75",
  "M78",
  "M109",
  "M113",
  "M114",
  "M119",
  "M123",
  "M124",
  "M135",
  "M141",
  "M142",
  "M143",
  "M144",
  "M145",
  "M146",
  "M147",
  "M148",
  "M150",
]);
const normalize = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const normalizeOption = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim();

function validateSource(source: LegacyQuestionRecord[]) {
  const validRecords = source.filter(
    (question): question is LegacyQuestionRecord => Boolean(question),
  );
  if (validRecords.length !== 150)
    throw new Error(
      `Expected 150 non-null Mathematics records; found ${validRecords.length}.`,
    );
  const ids = new Set<string>();
  for (const question of validRecords) {
    const id = question.id;
    const options = question.options ?? [];
    const answer = normalize(question.answer ?? question.correctAnswer ?? "");
    if (!id || !/^M\d+$/.test(id) || ids.has(id))
      throw new Error(`Invalid or duplicate Mathematics ID: ${id}.`);
    if (
      !question.text?.trim() ||
      options.length !== 4 ||
      new Set(options.map(normalize)).size !== 4 ||
      options.filter((option) => normalize(option) === answer).length !== 1
    ) {
      throw new Error(`Invalid Mathematics source record: ${id}.`);
    }
    ids.add(id);
  }
  for (const id of Object.keys(ARCHIVE_REASONS))
    if (!ids.has(id))
      throw new Error(
        `Archive decision refers to missing source record ${id}.`,
      );
  const mappedIds = Object.values(TOPIC_IDS).flat();
  const activeIds = [...ids].filter((id) => !(id in ARCHIVE_REASONS));
  if (
    new Set(mappedIds).size !== mappedIds.length ||
    mappedIds.length !== activeIds.length ||
    activeIds.some((id) => !mappedIds.includes(id))
  ) {
    throw new Error(
      "Mathematics question-to-topic map must cover each retained source ID exactly once.",
    );
  }

  const stems = new Set(
    validRecords
      .filter((question) => !(question.id! in ARCHIVE_REASONS))
      .map((question) => normalize(question.text!)),
  );
  const authoredIds = new Set<string>();
  for (const [id, , , text, options, answerIndex] of MATHEMATICS_AUTHORED) {
    const stem = normalize(text);
    if (!id.startsWith("PMA") || authoredIds.has(id) || stems.has(stem))
      throw new Error(
        `Invalid or duplicate authored Mathematics record: ${id}.`,
      );
    if (
      options.length !== 4 ||
      new Set(options.map(normalizeOption)).size !== 4 ||
      answerIndex < 0 ||
      answerIndex > 3
    )
      throw new Error(`Invalid authored Mathematics options: ${id}.`);
    authoredIds.add(id);
    stems.add(stem);
  }
  if (MATHEMATICS_AUTHORED.length !== 101)
    throw new Error(
      `Expected 101 PrePa-authored Mathematics items; found ${MATHEMATICS_AUTHORED.length}.`,
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
  const authored = MATHEMATICS_AUTHORED;

  const { data: subject, error: subjectError } = await db
    .from("subjects")
    .select("id,name,is_active")
    .eq("id", SUBJECT_ID)
    .maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject || subject.name !== "Mathematics" || !subject.is_active)
    throw new Error("Canonical Mathematics subject guard failed.");
  const { data: catalogue, error: catalogueError } = await db
    .from("catalogue_subjects")
    .select("catalogue_key,production_subject_id,availability_status,is_active")
    .eq("catalogue_key", "mathematics")
    .maybeSingle();
  if (catalogueError) throw catalogueError;
  if (
    !catalogue ||
    catalogue.production_subject_id !== SUBJECT_ID ||
    !catalogue.is_active
  )
    throw new Error("Mathematics catalogue mapping guard failed.");

  const { data: classes, error: classError } = await db
    .from("classes")
    .select("id,name")
    .in("name", ["JSS1", "JSS2", "JSS3"]);
  if (classError) throw classError;
  const classIdByName = new Map(
    (classes ?? []).map((row) => [row.name, row.id]),
  );
  if (["JSS1", "JSS2", "JSS3"].some((name) => !classIdByName.has(name)))
    throw new Error(
      "All JSS class records are required to seed the verified Mathematics hierarchy.",
    );

  const verifiedSubjects = curriculum.verifiedHierarchy.flatMap((level) =>
    level.subjects
      .filter((item) => item.subjectCode === "MATHEMATICS")
      .map((item) => ({ ...item, classCode: level.classCode })),
  );
  if (
    verifiedSubjects.length !== 3 ||
    verifiedSubjects.some((item) => item.sourceStatus !== "verified")
  )
    throw new Error(
      "Expected verified Mathematics hierarchy evidence for JSS1, JSS2 and JSS3.",
    );

  for (const item of verifiedSubjects) {
    const classId = classIdByName.get(item.classCode)!;
    const { error: themesError } = await db.from("curriculum_themes").upsert(
      item.themes.map((theme) => ({
        id: theme.id,
        subject_id: SUBJECT_ID,
        class_id: classId,
        name: theme.name,
        verification_status: theme.sourceStatus,
        source_document: item.sourceDocument,
        source_url: item.sourceUrl,
        source_pages: theme.sourcePages,
      })),
      { onConflict: "id" },
    );
    if (themesError) throw themesError;

    const subthemes = item.themes.flatMap((theme) =>
      theme.subThemes.map((subtheme) => ({ ...subtheme, themeId: theme.id })),
    );
    const { error: subthemesError } = await db
      .from("curriculum_subthemes")
      .upsert(
        subthemes.map((subtheme) => ({
          id: subtheme.id,
          theme_id: subtheme.themeId,
          name: subtheme.name,
          verification_status: subtheme.sourceStatus,
          source_document: item.sourceDocument,
          source_url: item.sourceUrl,
          source_pages: subtheme.sourcePages,
        })),
        { onConflict: "id" },
      );
    if (subthemesError) throw subthemesError;

    const topics = subthemes.flatMap((subtheme) =>
      subtheme.topics.map((topic) => ({ ...topic, subthemeId: subtheme.id })),
    );
    const { error: topicsError } = await db.from("topics").upsert(
      topics.map((topic) => ({
        subject_id: SUBJECT_ID,
        class_id: classId,
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
    if (topicsError) throw topicsError;
  }

  for (const [index, theme] of IMPLEMENTATION_THEME_ROWS.entries()) {
    const classCode = index === 2 ? "JSS3" : "JSS1";
    const { error } = await db.from("curriculum_themes").upsert(
      {
        ...theme,
        subject_id: SUBJECT_ID,
        class_id: classIdByName.get(classCode),
        verification_status: "review_required",
        source_document: null,
        source_url: null,
        source_pages: [],
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }
  const { error: implementationSubthemesError } = await db
    .from("curriculum_subthemes")
    .upsert(
      IMPLEMENTATION_SUBTHEME_ROWS.map((row) => ({
        id: row.id,
        theme_id: row.themeId,
        name: row.name,
        verification_status: "review_required",
        source_document: null,
        source_url: null,
        source_pages: [],
      })),
      { onConflict: "id" },
    );
  if (implementationSubthemesError) throw implementationSubthemesError;

  const implementationTopics = IMPLEMENTATION_TOPICS.map((topic) => {
    const subthemeId = IMPLEMENTATION_SUBTHEME_ROWS.find(
      (row) => row.name === topic.subtheme,
    )?.id;
    const themeId = IMPLEMENTATION_SUBTHEME_ROWS.find(
      (row) => row.id === subthemeId,
    )?.themeId;
    const classId =
      IMPLEMENTATION_THEME_ROWS.find((row) => row.id === themeId)?.id ===
      "theme_d4c923ce9ad9b862"
        ? classIdByName.get("JSS3")
        : classIdByName.get("JSS1");
    return {
      subject_id: SUBJECT_ID,
      class_id: classId,
      term_id: null,
      name: topic.name,
      is_active: true,
      curriculum_id: topic.id,
      curriculum_subtheme_id: subthemeId,
      curriculum_verification_status: "review_required",
      curriculum_source_document: null,
      curriculum_source_url: null,
      curriculum_source_pages: [],
    };
  });
  const { error: implementationTopicsError } = await db
    .from("topics")
    .upsert(implementationTopics, { onConflict: "curriculum_id" });
  if (implementationTopicsError) throw implementationTopicsError;

  const { data: topics, error: topicsError } = await db
    .from("topics")
    .select("id,name,curriculum_id,class_id")
    .eq("subject_id", SUBJECT_ID);
  if (topicsError) throw topicsError;
  const { error: obsoleteTopicError } = await db
    .from("topics")
    .update({ is_active: false })
    .eq("subject_id", SUBJECT_ID)
    .eq("curriculum_id", "topic_7cc048386dd99203");
  if (obsoleteTopicError) throw obsoleteTopicError;
  const topicId = (name: string, className: string) => {
    const row = topics?.find(
      (topic) =>
        topic.name === name && topic.class_id === classIdByName.get(className),
    );
    if (!row) throw new Error(`Missing topic ${name} in ${className}.`);
    return row.id;
  };
  const topicByName = new Map<string, string>([
    ["Whole Numbers", topicId("Whole Numbers", "JSS1")],
    ["Counting in Base 2", topicId("Counting in Base 2", "JSS1")],
    [
      "Conversion of base 10 numerals to binary numbers",
      topicId("Conversion of base 10 numerals to binary numbers", "JSS1"),
    ],
    [
      "Addition of numbers in base 2 numerals",
      topicId("Addition of numbers in base 2 numerals", "JSS3"),
    ],
    [
      "Multiplication of numbers in base 2 numerals",
      topicId("Multiplication of numbers in base 2 numerals", "JSS3"),
    ],
    ["Fractions", topicId("Fractions", "JSS1")],
    ["Approximation", topicId("Approximation", "JSS1")],
    [
      "Rational and non-rational numbers",
      topicId("Rational and non-rational numbers", "JSS3"),
    ],
    ...IMPLEMENTATION_TOPICS.map(
      (topic) =>
        [
          topic.name,
          topics?.find((row) => row.curriculum_id === topic.id)?.id ?? "",
        ] as [string, string],
    ),
    ["Factorization", topicId("Factorization", "JSS3")],
    ["Algebraic expressions", topicId("Algebraic expressions", "JSS2")],
    ["Simple equations", topicId("Simple equations", "JSS1")],
    ["Linear inequalities", topicId("Linear inequalities", "JSS2")],
    [
      "Measure of central tendency",
      topicId("Measure of central tendency", "JSS3"),
    ],
    ["Data presentation", topicId("Data presentation", "JSS1")],
    ["Plane shapes", topicId("Plane shapes", "JSS1")],
    ["Three-dimensional figures", topicId("Three-dimensional figures", "JSS1")],
    ["Angles", topicId("Angles", "JSS1")],
    ["Graphs", topicId("Graphs", "JSS2")],
    ["Trigonometry", topicId("Trigonometry", "JSS3")],
  ]);
  const sourceRecords = source.filter(
    (question): question is LegacyQuestionRecord => Boolean(question),
  );
  const assignments = new Map<string, string>();
  for (const [name, ids] of Object.entries(TOPIC_IDS)) {
    for (const id of ids) {
      if (assignments.has(id))
        throw new Error(`Duplicate Mathematics topic assignment: ${id}.`);
      const resolved = topicByName.get(name);
      if (!resolved)
        throw new Error(`Missing reviewed Mathematics topic: ${name}.`);
      assignments.set(id, resolved);
    }
  }

  const { data: startingRows, error: startingError } = await db
    .from("questions")
    .select("id,legacy_id,is_active")
    .eq("subject_id", SUBJECT_ID);
  if (startingError) throw startingError;
  const startingActive = (startingRows ?? []).filter(
    (row) => row.is_active,
  ).length;
  const archiveIds = new Set(Object.keys(ARCHIVE_REASONS));
  const orphanAdminIds = (startingRows ?? [])
    .filter((row) => row.legacy_id.startsWith("admin-"))
    .map((row) => row.legacy_id);
  const retained = sourceRecords.filter(
    (question) => !archiveIds.has(question.id!),
  );
  const mappedIds = new Set(assignments.keys());
  if (
    retained.length !== mappedIds.size ||
    retained.some((question) => !mappedIds.has(question.id!))
  )
    throw new Error(
      "Every retained Mathematics source ID must have exactly one content-reviewed topic assignment.",
    );

  const currentIds = new Set((startingRows ?? []).map((row) => row.legacy_id));
  const insertedCount = retained.filter(
    (question) => !currentIds.has(question.id!),
  ).length;
  const authoredInsertedCount = authored.filter(
    ([id]) => !currentIds.has(id),
  ).length;
  const sourceRows = retained.map((question) => ({
    subject_id: SUBJECT_ID,
    legacy_id: question.id!,
    question_text: question.text!.trim(),
    explanation: question.explanation ?? null,
    points: question.points ?? 1,
    is_active: true,
    topic_id: assignments.get(question.id!)!,
    difficulty: EASY_IDS.has(question.id!) ? "easy" : "medium",
    question_type: "multiple_choice",
    content_provenance: "legacy_uncited",
  }));
  const authoredRows = authored.map(
    ([id, topic, difficulty, text, , , explanation]) => {
      const topicId = topicByName.get(topic);
      if (!topicId)
        throw new Error(
          `Missing reviewed Mathematics topic for authored item ${id}: ${topic}.`,
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
  const rows = [...sourceRows, ...authoredRows];
  const { data: upserted, error: upsertError } = await db
    .from("questions")
    .upsert(rows, { onConflict: "subject_id,legacy_id" })
    .select("id,legacy_id");
  if (upsertError) throw upsertError;
  const idsByLegacyId = new Map(
    (upserted ?? []).map((row) => [row.legacy_id, row.id]),
  );
  const optionSources = [
    ...retained.map((question) => ({
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
  const options = optionSources.flatMap((question) =>
    balancedOptions.get(question.id)!.map((option, index) => ({
      question_id: idsByLegacyId.get(question.id)!,
      option_label: String.fromCharCode(65 + index),
      option_text: option,
      is_correct: normalizeOption(option) === normalizeOption(question.answer),
    })),
  );
  const { error: optionsError } = await db
    .from("question_options")
    .upsert(options, { onConflict: "question_id,option_label" });
  if (optionsError) throw optionsError;

  const allArchiveIds = [...archiveIds, ...orphanAdminIds];
  const { error: archiveError } = await db
    .from("questions")
    .update({ is_active: false, topic_id: null, difficulty: null })
    .eq("subject_id", SUBJECT_ID)
    .in("legacy_id", allArchiveIds);
  if (archiveError) throw archiveError;

  const { data: finalRows, error: finalError } = await db
    .from("questions")
    .select(
      "id,legacy_id,question_text,is_active,topic_id,difficulty,class_id,term_id",
    )
    .eq("subject_id", SUBJECT_ID);
  if (finalError) throw finalError;
  const finalQuestions = finalRows ?? [];
  const { data: finalOptions, error: finalOptionError } = await db
    .from("question_options")
    .select("question_id,option_label,option_text,is_correct")
    .in(
      "question_id",
      finalQuestions.filter((row) => row.is_active).map((row) => row.id),
    );
  if (finalOptionError) throw finalOptionError;
  const optionsByQuestion = new Map<string, typeof finalOptions>();
  for (const option of finalOptions ?? []) {
    const questionOptions = optionsByQuestion.get(option.question_id) ?? [];
    questionOptions.push(option);
    optionsByQuestion.set(option.question_id, questionOptions);
  }
  const active = finalQuestions.filter((row) => row.is_active);
  const invalid = active.filter((row) => {
    const questionOptions = optionsByQuestion.get(row.id) ?? [];
    return (
      questionOptions.length !== 4 ||
      questionOptions.filter((option) => option.is_correct).length !== 1 ||
      new Set(
        questionOptions.map((option) => normalizeOption(option.option_text)),
      ).size !== 4
    );
  });
  if (invalid.length)
    throw new Error(
      `Mathematics option integrity failed for: ${invalid.map((row) => row.legacy_id).join(", ")}.`,
    );
  const duplicateStems = active.map((row) => normalize(row.question_text));
  if (new Set(duplicateStems).size !== duplicateStems.length)
    throw new Error("Active Mathematics questions contain duplicate stems.");
  const archivedQuestionIds = new Set([...archiveIds, ...orphanAdminIds]);
  const archivedCount = finalQuestions.filter(
    (row) => !row.is_active && archivedQuestionIds.has(row.legacy_id),
  ).length;
  const eligible = active.filter(
    (row) =>
      !row.class_id &&
      !row.term_id &&
      (optionsByQuestion.get(row.id)?.length ?? 0) === 4,
  ).length;
  const blocked = new Set([
    "not_ready",
    "source_review_required",
    "scope_decision_required",
    "mapping_required",
    "pending",
    "review_required",
  ]);
  const activeTopicDistribution = Object.fromEntries(
    [...topicByName]
      .map(([name, id]) => [
        name,
        active.filter((row) => row.topic_id === id).length,
      ])
      .filter(([, count]) => count),
  );
  console.log(
    JSON.stringify(
      {
        sourceMode: "legacy_uncited",
        subject: "Mathematics",
        productionSubjectId: SUBJECT_ID,
        sourceCount: sourceRecords.length,
        startingActiveCount: startingActive,
        retainedCount: retained.length,
        archivedCount,
        archiveReasons: {
          ...ARCHIVE_REASONS,
          ...Object.fromEntries(
            orphanAdminIds.map((id) => [
              id,
              "Malformed two-option admin-authored Mathematics question.",
            ]),
          ),
        },
        newlyAuthoredCount: authored.length,
        insertedCount,
        authoredInsertedCount,
        finalActiveCount: active.length,
        invalidQuestionCount: invalid.length,
        duplicateCount: 0,
        unassignedCount: active.filter((row) => !row.topic_id).length,
        topicDistribution: activeTopicDistribution,
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
          verifiedSourceClasses: verifiedSubjects.map((item) => item.classCode),
          implementationTopics: IMPLEMENTATION_TOPICS.length,
          implementationProvenance: "review_required",
        },
        readiness: {
          gate: 40,
          eligibleGlobalQuestions: eligible,
          available:
            eligible >= 40 &&
            !blocked.has(String(catalogue.availability_status).toLowerCase()),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Mathematics bank seeding failed:", error);
  process.exit(1);
});
