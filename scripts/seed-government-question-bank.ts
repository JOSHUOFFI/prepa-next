import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";
import { LEGACY_QUESTIONS_BY_SUBJECT } from "@/data/legacy-question-bank";

loadEnvConfig(process.cwd());

const SUBJECT_ID = "d9dabed8-efa8-46fb-9637-ca4c30caa97d";
const SUBJECT_NAME = "Government";

// These are the reviewed Government strands represented by the existing
// canonical Government questions.  Topic IDs are always read/created in the
// live topics table; no IDs are invented in this script.
const TOPICS = [
  "Meaning, Concepts and Theories of Government",
  "Constitutions, Rule of Law and Human Rights",
  "Organs and Systems of Government",
  "Political Parties, Pressure Groups and Public Opinion",
  "Elections, Citizenship and Political Participation",
  "Federalism and Local Government",
  "Nigerian Constitutional and Political Development",
  "Pre-colonial, Colonial and Nationalist Politics",
  "Public Administration and Foreign Policy",
  "Democratic Governance and Political Culture",
] as const;

const REPLACEMENT_QUESTIONS = {
  GOV179: {
    question_text: "A major purpose of the code of conduct for public officers is to",
    explanation: "The code of conduct sets ethical standards for public officers and helps prevent conflicts of interest, misuse of office, and corruption.",
    options: ["promote integrity in public service", "give civil servants party powers", "remove all public records", "replace the constitution"],
    correct: "A",
  },
  GOV180: {
    question_text: "Which body is responsible for conducting population censuses in Nigeria?",
    explanation: "The National Population Commission is the federal body responsible for population censuses and demographic data in Nigeria.",
    options: ["National Population Commission", "Independent National Electoral Commission", "Revenue Mobilisation Allocation and Fiscal Commission", "National Assembly"],
    correct: "A",
  },
} as const;

function topicFor(text: string, index: number) {
  const haystack = text.toLowerCase();
  if (/(constitution|rule of law|human right|fundamental right|habeas corpus|judicial review)/.test(haystack)) return TOPICS[1];
  if (/(legislature|legislative|executive|judiciary|judicial|parliament|senate|representative|cabinet|separation of powers|checks and balances|presidential|parliamentary)/.test(haystack)) return TOPICS[2];
  if (/(political part|pressure group|interest group|public opinion|mass media|opinion poll)/.test(haystack)) return TOPICS[3];
  if (/(election|electoral|inec|franchise|suffrage|vot|citizen|citizenship|political participation)/.test(haystack)) return TOPICS[4];
  if (/(federalism|federal |state government|local government|exclusive list|concurrent list|residual list|revenue allocation)/.test(haystack)) return TOPICS[5];
  if (/(nigerian constitution|richards|macpherson|lyttleton|independence|republic|military rule|coup|first republic|second republic|third republic|fourth republic|1960|1963|1979|1989|1999)/.test(haystack)) return TOPICS[6];
  if (/(pre-colonial|colonial|indirect rule|british|nationalism|nationalist|emirate|oba|obaship|acephalous|warrant chief)/.test(haystack)) return TOPICS[7];
  if (/(civil service|public corporation|public administration|foreign policy|diplomac|ambassador|consul|ministry)/.test(haystack)) return TOPICS[8];
  if (/(democra|legitimacy|political culture|transparen|accountab|good governance|corruption|stability)/.test(haystack)) return TOPICS[9];
  return TOPICS[index % TOPICS.length];
}

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenSimilarity(left: string, right: string) {
  const a = new Set(normalise(left).split(" ").filter(Boolean));
  const b = new Set(normalise(right).split(" ").filter(Boolean));
  const overlap = [...a].filter(token => b.has(token)).length;
  return overlap / new Set([...a, ...b]).size;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase URL and service-role key are required.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: subject, error: subjectError } = await db.from("subjects").select("id,name,is_active").eq("id", SUBJECT_ID).maybeSingle();
  if (subjectError) throw subjectError;
  if (!subject || subject.name !== SUBJECT_NAME || !subject.is_active) throw new Error("Canonical active Government subject was not found.");

  const { count: before, error: beforeError } = await db.from("questions").select("id", { count: "exact", head: true }).eq("subject_id", SUBJECT_ID).eq("is_active", true);
  if (beforeError) throw beforeError;

  const topicMap = new Map<string, string>();
  for (const name of TOPICS) {
    const existing = await db.from("topics").select("id,name").eq("subject_id", SUBJECT_ID).eq("name", name).is("class_id", null).is("term_id", null).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) { topicMap.set(name, existing.data.id); continue; }
    const { data, error } = await db.from("topics").insert({ subject_id: SUBJECT_ID, name, is_active: true, class_id: null, term_id: null }).select("id,name").single();
    if (error) throw error;
    topicMap.set(name, data.id);
  }

  const { data: questions, error: questionError } = await db.from("questions").select("id,question_text,topic_id,difficulty,legacy_id").eq("subject_id", SUBJECT_ID).eq("is_active", true).order("created_at");
  if (questionError) throw questionError;
  for (const question of questions ?? []) {
    const replacement = REPLACEMENT_QUESTIONS[question.legacy_id as keyof typeof REPLACEMENT_QUESTIONS];
    if (!replacement) continue;
    const { error: replacementError } = await db.from("questions").update({ question_text: replacement.question_text, explanation: replacement.explanation }).eq("id", question.id);
    if (replacementError) throw replacementError;
    const { error: optionError } = await db.from("question_options").upsert(replacement.options.map((option_text, optionIndex) => ({ question_id: question.id, option_label: String.fromCharCode(65 + optionIndex), option_text, is_correct: String.fromCharCode(65 + optionIndex) === replacement.correct })), { onConflict: "question_id,option_label", ignoreDuplicates: false });
    if (optionError) throw optionError;
    question.question_text = replacement.question_text;
  }
  let reassigned = 0;
  for (const [index, question] of (questions ?? []).entries()) {
    const topicId = topicMap.get(topicFor(question.question_text, index));
    if (!topicId) throw new Error("Topic mapping failed.");
    const difficulty = index < 60 ? "easy" : index < 160 ? "medium" : "hard";
    if (question.topic_id !== topicId || question.difficulty !== difficulty) {
      const { error } = await db.from("questions").update({ topic_id: topicId, difficulty }).eq("id", question.id);
      if (error) throw error;
      reassigned += 1;
    }
  }

  const ids = (questions ?? []).map((q) => q.id);
  const { data: finalQuestions, error: finalError } = await db.from("questions").select("id,question_text,topic_id,difficulty").eq("subject_id", SUBJECT_ID).eq("is_active", true);
  if (finalError) throw finalError;
  const { data: options, error: optionsError } = ids.length ? await db.from("question_options").select("question_id,option_label,option_text,is_correct").in("question_id", ids) : { data: [], error: null };
  if (optionsError) throw optionsError;
  const byQuestion = new Map<string, typeof options>();
  for (const option of options ?? []) byQuestion.set(option.question_id, [...(byQuestion.get(option.question_id) ?? []), option]);
  const invalidOptions = [...byQuestion.entries()].filter(([, rows]) => rows.length !== 4 || new Set(rows.map(r => r.option_label)).size !== 4 || rows.some(r => !r.option_text?.trim()));
  const invalidCorrect = [...byQuestion.entries()].filter(([, rows]) => rows.filter(r => r.is_correct).length !== 1);
  const textGroups = new Map<string, number>();
  for (const q of finalQuestions ?? []) { const key = normalise(q.question_text); textGroups.set(key, (textGroups.get(key) ?? 0) + 1); }
  const duplicates = [...textGroups.values()].filter(count => count > 1).reduce((sum, count) => sum + count - 1, 0);
  const nearDuplicatePairs: string[][] = [];
  for (let i = 0; i < (finalQuestions ?? []).length; i += 1) for (let j = i + 1; j < (finalQuestions ?? []).length; j += 1) {
    const left = finalQuestions![i]; const right = finalQuestions![j];
    if (tokenSimilarity(left.question_text, right.question_text) >= 0.9 && normalise(left.question_text) !== normalise(right.question_text)) nearDuplicatePairs.push([left.id, right.id]);
  }
  const distribution = Object.fromEntries(TOPICS.map(name => [name, (finalQuestions ?? []).filter(q => q.topic_id === topicMap.get(name)).length]));
  const difficulty = Object.fromEntries(["easy", "medium", "hard"].map(level => [level, (finalQuestions ?? []).filter(q => q.difficulty === level).length]));
  const unassigned = (finalQuestions ?? []).filter(q => !q.topic_id).length;
  const finalCount = finalQuestions?.length ?? 0;
  const readiness = finalCount >= 200 && unassigned === 0 && invalidOptions.length === 0 && invalidCorrect.length === 0 ? "Available" : "Coming soon";
  const { data: catalogue, error: catalogueError } = await db.from("catalogue_subjects").select("catalogue_key,display_name,production_subject_id,availability_status,is_active").eq("production_subject_id", SUBJECT_ID);
  if (catalogueError) throw catalogueError;
  console.log(JSON.stringify({ subjectId: SUBJECT_ID, beforeActiveCount: before, inserted: 0, reassigned, finalActiveCount: finalCount, remainingUnassigned: unassigned, topicDistribution: distribution, difficultyDistribution: difficulty, exactDuplicateCount: duplicates, nearDuplicatePairsAt90Percent: nearDuplicatePairs.length, optionIntegrityFailures: invalidOptions.length, correctAnswerIntegrityFailures: invalidCorrect.length, readiness, catalogue, source: { legacySubject: "Government", legacyQuestionCount: LEGACY_QUESTIONS_BY_SUBJECT.Government.length } }, null, 2));
  if (finalCount < 200 || unassigned || invalidOptions.length || invalidCorrect.length || duplicates || nearDuplicatePairs.length) process.exitCode = 1;
}

main().catch(error => { console.error("Government Phase 2D seed failed:", error); process.exit(1); });
