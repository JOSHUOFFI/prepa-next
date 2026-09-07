import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import {
  normalizeQuestionText,
  validateQuestionImport,
  type QuestionImportInput,
} from "@/services/question-import-validation";
import { normalizeTopic, isTopicEqual } from "@/services/topic-management";

type Reference = { id: string; name: string };
type ImportRow = QuestionImportInput & {
  rowNumber: number;
  subjectId?: string;
  classId?: string;
  termId?: string;
  topicId?: string;
  topicName?: string;
  duplicate?: boolean;
  errors: string[];
};

async function parseFile(
  request: Request,
): Promise<{
  rows: Record<string, unknown>[];
  confirm: boolean;
  createMissingTopics: boolean;
}> {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx"))
    throw new Error("Upload an .xlsx file.");
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook has no worksheet.");
  return {
    rows: XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    }),
    confirm: form.get("confirm") === "true",
    createMissingTopics: form.get("createMissingTopics") === "true",
  };
}

async function validateRows(
  rows: Record<string, unknown>[],
  admin: SupabaseClient,
): Promise<ImportRow[]> {
  const [
    { data: subjects },
    { data: classes },
    { data: terms },
    { data: topics },
    { data: existing },
  ] = await Promise.all([
    admin.from("subjects").select("id, name").eq("is_active", true),
    admin.from("classes").select("id, name"),
    admin.from("terms").select("id, name"),
    admin
      .from("topics")
      .select("id, subject_id, name, class_id, term_id")
      .eq("is_active", true),
    admin
      .from("questions")
      .select("subject_id, class_id, term_id, question_text"),
  ]);
  const subjectList = (subjects ?? []) as Reference[];
  const classList = (classes ?? []) as Reference[];
  const termList = (terms ?? []) as Reference[];
  const topicList = (topics ?? []) as (Reference & {
    subject_id: string;
    class_id: string | null;
    term_id: string | null;
  })[];
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const subject = String(row.subject ?? "").trim();
    const className = String(row.class ?? "").trim();
    const termName = String(row.term ?? "").trim();
    const topicName = String(row.topic ?? "").trim();
    const questionType = String(
      row.question_type ?? "",
    ).trim() as QuestionImportInput["questionType"];
    const optionEntries =
      questionType === "true_false"
        ? [
            { label: "True", text: "True" },
            { label: "False", text: "False" },
          ]
        : questionType === "short_answer"
          ? [{ label: "ANSWER", text: String(row.correct_option ?? "").trim() }]
          : ["a", "b", "c", "d", "e", "f"]
              .map((label) => ({
                label: label.toUpperCase(),
                text: String(row[`option_${label}`] ?? "").trim(),
              }))
              .filter((option) => option.text);
    const correctOption = String(row.correct_option ?? "").trim();
    const input: QuestionImportInput = {
      subject,
      className,
      termName,
      topic: topicName,
      questionText: String(row.question ?? "").trim(),
      options: optionEntries,
      correctOption,
      difficulty: String(
        row.difficulty ?? "",
      ).trim() as QuestionImportInput["difficulty"],
      questionType,
      points: row.points === "" ? undefined : String(row.points),
      explanation: String(row.explanation ?? "").trim(),
    };
    const errors = validateQuestionImport(input);
    const subjectRow = subjectList.find((item) => item.name === subject);
    const classRow = classList.find((item) => item.name === className);
    const termRow = termList.find((item) => item.name === termName);
    const topicRow = topicList.find(
      (item) =>
        isTopicEqual(item.name, topicName) &&
        item.subject_id === subjectRow?.id &&
        item.class_id === (classRow?.id ?? null) &&
        item.term_id === (termRow?.id ?? null),
    );
    if (!subjectRow) errors.push("Subject does not exist.");
    if (!classRow && className) errors.push("Class does not exist.");
    if (!termRow && termName) errors.push("Term does not exist.");
    if (topicName && !topicRow) {
      const scopeDesc = `${subjectRow?.name}${classRow ? ` → ${classRow.name}` : ""}${termRow ? ` → ${termRow.name}` : ""}`;
      errors.push(`Topic "${topicName}" does not exist for ${scopeDesc}.`);
    }
    if (
      optionEntries.length !==
      new Set(optionEntries.map((option) => option.text.toLowerCase())).size
    )
      errors.push("Option values are duplicated.");
    const key = `${subjectRow?.id}|${classRow?.id}|${termRow?.id}|${normalizeQuestionText(input.questionText)}`;
    const duplicate =
      seen.has(key) ||
      (existing ?? []).some(
        (item) =>
          `${item.subject_id}|${item.class_id}|${item.term_id}|${normalizeQuestionText(item.question_text)}` ===
          key,
      );
    if (duplicate)
      errors.push("Duplicate question in this upload or question bank.");
    seen.add(key);
    return {
      ...input,
      rowNumber: index + 2,
      subjectId: subjectRow?.id,
      classId: classRow?.id,
      termId: termRow?.id,
      topicId: topicRow?.id,
      topicName: topicName,
      duplicate,
      errors,
    };
  });
}

function findMissingTopics(validated: ImportRow[]): {
  topics: string[];
  bySubject: Record<string, string[]>;
} {
  const missingMap = new Map<string, string>();
  const bySubject: Record<string, string[]> = {};

  for (const row of validated) {
    if (row.topicName && !row.topicId) {
      const key = normalizeTopic(row.topicName);
      // Store normalized key → original name. If duplicate normalized name, keep first
      if (!missingMap.has(key)) {
        missingMap.set(key, row.topicName);
      }
    }
  }

  return {
    topics: Array.from(missingMap.values()),
    bySubject,
  };
}

async function createMissingTopics(
  missing: string[],
  admin: SupabaseClient,
  subjectMapping: Record<string, string>,
  classMapping: Record<string, string | null>,
  termMapping: Record<string, string | null>,
): Promise<{ idMap: Record<string, string>; createdIds: string[] }> {
  const idMap: Record<string, string> = {};
  const createdIds: string[] = [];

  for (const topicName of missing) {
    const { data: topic, error } = await admin
      .from("topics")
      .insert({
        name: topicName.trim(),
        subject_id: subjectMapping[topicName] || "",
        class_id: classMapping[topicName] || null,
        term_id: termMapping[topicName] || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !topic) {
      throw new Error(`Failed to create topic "${topicName}".`);
    }

    idMap[normalizeTopic(topicName)] = topic.id;
    createdIds.push(topic.id);
  }

  return { idMap, createdIds };
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  try {
    const parsed = await parseFile(request);
    const validated = await validateRows(parsed.rows, access.admin);

    if (!parsed.confirm) {
      const { topics: missingTopics } = findMissingTopics(validated);
      return NextResponse.json({
        total: validated.length,
        valid: validated.filter((row) => !row.errors.length),
        invalid: validated.filter((row) => row.errors.length && !row.duplicate),
        duplicates: validated.filter((row) => row.duplicate),
        missingTopics: missingTopics,
      });
    }

    const valid = validated.filter((row) => !row.errors.length);

    // Detect missing topics and create them if requested
    const { topics: missingTopics } = findMissingTopics(valid);
    let createdTopicCount = 0;
    let createdTopicIds: string[] = [];
    const topicIdMap: Record<string, string> = {};

    if (missingTopics.length > 0 && parsed.createMissingTopics) {
      // Build mappings of topic name to subject/class/term
      const subjectMapping: Record<string, string> = {};
      const classMapping: Record<string, string | null> = {};
      const termMapping: Record<string, string | null> = {};

      for (const row of valid) {
        if (row.topicName && !row.topicId && row.subjectId) {
          if (!(normalizeTopic(row.topicName) in topicIdMap)) {
            subjectMapping[row.topicName] = row.subjectId;
            classMapping[row.topicName] = row.classId || null;
            termMapping[row.topicName] = row.termId || null;
          }
        }
      }

      const result = await createMissingTopics(
        missingTopics,
        access.admin,
        subjectMapping,
        classMapping,
        termMapping,
      );

      Object.assign(topicIdMap, result.idMap);
      createdTopicIds = result.createdIds;
      createdTopicCount = missingTopics.length;

      // Update topicId for rows that reference newly created topics
      for (const row of valid) {
        if (row.topicName && !row.topicId) {
          const normalizedName = normalizeTopic(row.topicName);
          if (normalizedName in topicIdMap) {
            row.topicId = topicIdMap[normalizedName];
          }
        }
      }
    }

    const insertedIds: string[] = [];
    try {
      for (const row of valid) {
        const { data: question, error } = await access.admin
          .from("questions")
          .insert({
            legacy_id: `import-${crypto.randomUUID()}`,
            subject_id: row.subjectId,
            class_id: row.classId || null,
            term_id: row.termId || null,
            topic_id: row.topicId || null,
            question_text: row.questionText,
            explanation: row.explanation || null,
            points: Number(row.points ?? 1),
            difficulty: row.difficulty || null,
            question_type: row.questionType,
            created_by: access.user.id,
            is_active: true,
          })
          .select("id")
          .single();
        if (error || !question) throw new Error("Question insert failed.");
        insertedIds.push(question.id);
        if (row.options.length) {
          const { error: optionError } = await access.admin
            .from("question_options")
            .insert(
              row.options.map((option) => ({
                question_id: question.id,
                option_label: option.label,
                option_text: option.text,
                is_correct: option.label === row.correctOption,
              })),
            );
          if (optionError) throw new Error("Option insert failed.");
        }
      }
    } catch (error) {
      for (const insertedId of insertedIds) {
        await access.admin
          .from("question_options")
          .delete()
          .eq("question_id", insertedId);
        await access.admin.from("questions").delete().eq("id", insertedId);
      }
      // Clean up newly-created topics if they have no questions
      for (const topicId of createdTopicIds) {
        const { count } = await access.admin
          .from("questions")
          .select("id", { count: "exact" })
          .eq("topic_id", topicId);
        if ((count ?? 0) === 0) {
          await access.admin.from("topics").delete().eq("id", topicId);
        }
      }
      throw error;
    }
    return NextResponse.json({
      imported: valid.length,
      skippedDuplicates: validated.filter((row) => row.duplicate).length,
      rejected: validated.filter((row) => row.errors.length && !row.duplicate)
        .length,
      topicsCreated: createdTopicCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process workbook.",
      },
      { status: 400 },
    );
  }
}
