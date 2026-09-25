import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const CRS_SUBJECT_ID = "5e4ff239-fd12-4765-b035-70ea77ecee6c";
const CRS_SUBJECT_NAME = "CRS";
const SOURCE_KEY_CANDIDATES = ["CRS", "Christian Religious Studies"] as const;

const TOPIC_NAMES = [
  "Creation and the Nature of God",
  "Covenant, Prophets and the People of God",
  "The Life and Ministry of Jesus Christ",
  "The Church and Christian Living",
  "Morality, Wisdom and the Kingdom of God",
] as const;

function pickTopic(text: string, index: number): string {
  const haystack = text.toLowerCase();

  if (
    /(genesis|creation|adam|eve|noah|abraham|isaac|jacob|moses|exodus|egypt|passover|judges|david|solomon|prophet|israel|covenant|babel|prayer)/.test(
      haystack,
    )
  ) {
    return "Covenant, Prophets and the People of God";
  }

  if (
    /(jesus|mary|john the baptist|baptist|bethlehem|sermon|miracle|crucifix|resurrection|pentecost|apostle|paul|epistle|trinity|holy spirit|great commission|ascension|last supper)/.test(
      haystack,
    )
  ) {
    return "The Life and Ministry of Jesus Christ";
  }

  if (
    /(church|holy spirit|disciples|apostle|mission|mother church|communion|baptism|great commission|revelation|acts|epistle|sermon)/.test(
      haystack,
    )
  ) {
    return "The Church and Christian Living";
  }

  if (
    /(love|forgiveness|obedience|wisdom|beatitudes|fruit of the spirit|sin|righteousness|faith|humility|self-control|moral|character|truth)/.test(
      haystack,
    )
  ) {
    return "Morality, Wisdom and the Kingdom of God";
  }

  return TOPIC_NAMES[index % TOPIC_NAMES.length];
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

async function ensureSubject(supabase: ReturnType<typeof createClient<any>>) {
  const { data: existing, error } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", CRS_SUBJECT_ID)
    .maybeSingle();

  if (error) throw error;

  if (existing) {
    console.log(`Subject already exists: ${existing.name}`);
    return existing;
  }

  const payload = {
    id: CRS_SUBJECT_ID,
    name: CRS_SUBJECT_NAME,
    slug: "crs",
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

async function syncCrsQuestionTopics(
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
    const computedTopic = pickTopic(question.question_text ?? "", index);
    const topicId = topicMap.get(computedTopic) ?? topicMap.get(TOPIC_NAMES[0]);
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

async function seedCrsBank() {
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
      "No legacy CRS question bank was found in the source dataset.",
    );
  }

  const crsQuestions = sourceEntry.list as Array<{
    id?: string;
    text?: string;
    questionText?: string;
    options?: string[];
    answer?: string;
    correctAnswer?: string;
    explanation?: string;
    points?: number;
  }>;

  const total = crsQuestions.length;
  let inserted = 0;
  let updated = 0;

  for (const [index, record] of crsQuestions.entries()) {
    const questionText = (record.questionText ?? record.text ?? "").trim();
    const options = Array.isArray(record.options)
      ? record.options.filter(
          (option) => typeof option === "string" && option.trim().length > 0,
        )
      : [];

    if (!questionText || options.length < 2) {
      console.warn(
        `Skipping malformed CRS question at index ${index}: missing text or options`,
      );
      continue;
    }

    const rawAnswer = (record.correctAnswer ?? record.answer ?? "").trim();
    const answerText = rawAnswer
      .replace(/^\s*[A-Da-d]\s*[:.-]?\s*/i, "")
      .trim();
    const topicName = pickTopic(questionText, index);
    const topicId = topicMap.get(topicName) ?? topicMap.get(TOPIC_NAMES[0]);
    const legacyId = `legacy_crs_${record.id ?? `q${index + 1}`}`;

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

    const optionRows = ["A", "B", "C", "D"].map((label, optionIndex) => {
      const optionText = options[optionIndex] ?? "";
      const normalizedText = String(optionText).trim().toLowerCase();
      const matchesAnswer =
        normalizedText === answerText.toLowerCase() ||
        (/^[A-D]$/i.test(rawAnswer) &&
          label.toUpperCase() === rawAnswer.toUpperCase());

      return {
        question_id: question.id,
        option_label: label,
        option_text: optionText,
        is_correct: matchesAnswer,
      };
    });

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

  const syncedTopicCount = await syncCrsQuestionTopics(
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

  const { data: unassigned, error: topicError } = await supabase
    .from("questions")
    .select("id")
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
        remainingUnassigned: (unassigned ?? []).length,
        finalActiveCount: count,
        readinessStatus: (count ?? 0) >= 200 ? "Available" : "Coming soon",
      },
      null,
      2,
    ),
  );
}

seedCrsBank().catch((error) => {
  console.error("CRS bank seed failed:", error);
  process.exit(1);
});
