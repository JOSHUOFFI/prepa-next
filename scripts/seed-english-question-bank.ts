import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const ENGLISH_SUBJECT_ID = "a0e64f96-d382-4cee-9f84-b1e6b5e075c6";
const ENGLISH_SUBJECT_NAME = "English Language";
const SOURCE_KEY_CANDIDATES = [
  "English",
  "English Language",
  "English Studies",
] as const;

const TOPIC_NAMES = [
  "Grammar & Usage",
  "Vocabulary & Lexis",
  "Comprehension & Reading",
  "Sentence Structure",
  "Tenses & Concord",
  "Punctuation & Spelling",
  "Oral English & Phonetics",
  "Literature & Idioms",
] as const;

function pickTopic(text: string, idx: number) {
  const haystack = text.toLowerCase();
  if (/(comprehension|passage|reading|paragraph|read)/.test(haystack))
    return "Comprehension & Reading";
  if (
    /(synonym|antonym|vocabulary|lexis|idiom|word meaning|word)/.test(haystack)
  )
    return "Vocabulary & Lexis";
  if (
    /(punctuation|spelling|apostrophe|comma|semicolon|capitalization)/.test(
      haystack,
    )
  )
    return "Punctuation & Spelling";
  if (
    /(phonetics|pronunciation|vowel|consonant|stress|intonation|oral)/.test(
      haystack,
    )
  )
    return "Oral English & Phonetics";
  if (/(tense|concord|agreement)/.test(haystack)) return "Tenses & Concord";
  if (
    /(noun|verb|adjective|adverb|pronoun|conjunction|article|preposition|agreement|concord|tense)/.test(
      haystack,
    )
  )
    return "Grammar & Usage";
  if (
    /(sentence|clause|phrase|subject|predicate|fragment|inversion)/.test(
      haystack,
    )
  )
    return "Sentence Structure";
  if (/(literature|poem|novel|drama|author|writer|play)/.test(haystack))
    return "Literature & Idioms";
  return TOPIC_NAMES[idx % TOPIC_NAMES.length];
}

function pickDifficulty(
  index: number,
  total: number,
): "easy" | "medium" | "hard" {
  const ratio = index / total;
  if (ratio < 0.3) return "easy";
  if (ratio < 0.8) return "medium";
  return "hard";
}

const EXTRA_ENGLISH_QUESTIONS = [
  {
    id: "E101",
    questionText: "Choose the sentence that is grammatically correct.",
    options: [
      "The children was playing in the garden.",
      "The children were playing in the garden.",
      "The children are playing in the garden yesterday.",
      "The children has playing in the garden.",
    ],
    answer: "B",
    correctAnswer: "B",
    explanation:
      "The subject 'children' is plural, so it takes the plural verb 'were' and the sentence is grammatically correct.",
    points: 1,
  },
] as const;

async function ensureSubject(supabase: ReturnType<typeof createClient<any>>) {
  const { data: existing, error } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", ENGLISH_SUBJECT_ID)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    console.log(`Subject already exists: ${existing.name}`);
    return existing;
  }

  const payload = {
    id: ENGLISH_SUBJECT_ID,
    name: ENGLISH_SUBJECT_NAME,
    slug: "english-language",
    category: "core_academic",
    is_active: true,
  };

  const { data, error: insertError } = await supabase
    .from("subjects")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: false })
    .select("id, name")
    .single();

  if (insertError) throw insertError;

  console.log(`Inserted subject: ${data.name}`);
  return data;
}

async function ensureTopics(
  supabase: ReturnType<typeof createClient<any>>,
  subjectId: string,
) {
  const topicMap = new Map<string, string>();

  for (const name of TOPIC_NAMES) {
    const { data: existing, error } = await supabase
      .from("topics")
      .select("id")
      .eq("subject_id", subjectId)
      .eq("name", name)
      .maybeSingle();

    if (error) throw error;

    if (existing) {
      topicMap.set(name, existing.id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("topics")
      .insert({
        subject_id: subjectId,
        name,
        is_active: true,
        class_id: null,
        term_id: null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;
    topicMap.set(name, inserted.id);
  }

  return topicMap;
}

async function syncEnglishQuestionTopics(
  supabase: ReturnType<typeof createClient<any>>,
  subjectId: string,
  topicMap: Map<string, string>,
) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question_text, topic_id")
    .eq("subject_id", subjectId)
    .eq("is_active", true);

  if (error) throw error;

  let updated = 0;

  for (const [index, question] of (questions ?? []).entries()) {
    const topicName = pickTopic(question.question_text ?? "", index);
    const topicId = topicMap.get(topicName) ?? topicMap.get(TOPIC_NAMES[0]);
    if (!topicId || question.topic_id === topicId) continue;

    const { error: updateError } = await supabase
      .from("questions")
      .update({ topic_id: topicId })
      .eq("id", question.id);

    if (updateError) throw updateError;
    updated += 1;
  }

  return updated;
}

async function seedEnglishBank() {
  const envKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const envUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!envUrl || !envKey) {
    throw new Error("Supabase URL and service-role key are required.");
  }

  const supabase = createClient(envUrl, envKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const subject = await ensureSubject(supabase);
  const topicMap = await ensureTopics(supabase, subject.id);

  const sourceEntry = SOURCE_KEY_CANDIDATES.map((key) => ({
    key,
    list: (LEGACY_QUESTIONS_BY_SUBJECT as Record<string, any>)[key] ?? [],
  })).find((entry) => Array.isArray(entry.list) && entry.list.length > 0);

  if (!sourceEntry) {
    throw new Error(
      "No legacy English question bank was found in the source dataset.",
    );
  }

  const englishQuestions = [
    ...EXTRA_ENGLISH_QUESTIONS,
    ...(sourceEntry.list as Array<{
      id?: string;
      text?: string;
      questionText?: string;
      options?: string[];
      answer?: string;
      correctAnswer?: string;
      explanation?: string;
      points?: number;
    }>),
  ];

  const total = englishQuestions.length;
  let inserted = 0;
  let updated = 0;

  for (const [index, record] of englishQuestions.entries()) {
    const questionText = (record.questionText ?? record.text ?? "").trim();
    const options = Array.isArray(record.options)
      ? record.options.filter(
          (option) => typeof option === "string" && option.trim().length > 0,
        )
      : [];
    if (!questionText || options.length < 2) {
      console.warn(
        `Skipping malformed English question at index ${index}: missing text or options`,
      );
      continue;
    }

    const correctAnswer = (record.correctAnswer ?? record.answer ?? "").trim();
    const topicName = pickTopic(questionText, index);
    const topicId = topicMap.get(topicName) ?? topicMap.get(TOPIC_NAMES[0]);
    const legacyId = `legacy_english_${record.id ?? `q${index + 1}`}`;

    const { data: existingQuestion, error: existingError } = await supabase
      .from("questions")
      .select("id")
      .eq("subject_id", subject.id)
      .eq("legacy_id", legacyId)
      .maybeSingle();

    if (existingError) throw existingError;

    const questionPayload = {
      id: existingQuestion?.id,
      legacy_id: legacyId,
      subject_id: subject.id,
      class_id: null,
      term_id: null,
      topic_id: topicId ?? null,
      question_text: questionText,
      explanation: record.explanation ?? null,
      points: Number(record.points ?? 1),
      difficulty: pickDifficulty(index, total),
      question_type: "multiple_choice",
      is_active: true,
    };

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .upsert(questionPayload, {
        onConflict: "subject_id,legacy_id",
        ignoreDuplicates: false,
      })
      .select("id")
      .single();

    if (questionError) throw questionError;

    if (!question) continue;

    const optionRows = ["A", "B", "C", "D"].map((label, optionIndex) => ({
      question_id: question.id,
      option_label: label,
      option_text: options[optionIndex] ?? "",
      is_correct:
        correctAnswer.toLowerCase() ===
        String(options[optionIndex] ?? "")
          .trim()
          .toLowerCase(),
    }));

    const { error: optionError } = await supabase
      .from("question_options")
      .upsert(optionRows, {
        onConflict: "question_id,option_label",
        ignoreDuplicates: false,
      });

    if (optionError) throw optionError;

    if (existingQuestion) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  const syncedTopicCount = await syncEnglishQuestionTopics(
    supabase,
    subject.id,
    topicMap,
  );

  const { count, error: countError } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subject.id)
    .eq("is_active", true);

  if (countError) throw countError;

  const { data: topicSummary, error: topicError } = await supabase
    .from("questions")
    .select("topic_id")
    .eq("subject_id", subject.id)
    .eq("is_active", true)
    .is("topic_id", null);

  if (topicError) throw topicError;

  console.log(
    JSON.stringify(
      {
        subjectId: subject.id,
        subjectName: subject.name,
        sourceKey: sourceEntry.key,
        legacyQuestionCount: total,
        inserted,
        updated,
        syncedTopicCount,
        remainingUnassigned: (topicSummary ?? []).length,
        finalActiveCount: count,
        readinessStatus: (count ?? 0) >= 40 ? "Available" : "Coming soon",
      },
      null,
      2,
    ),
  );
}

seedEnglishBank().catch((error) => {
  console.error("English bank seed failed:", error);
  process.exit(1);
});
