import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import {
  questionScopeKey,
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
  missingTopic?: boolean;
  errors: string[];
};

type MissingTopic = {
  key: string;
  name: string;
  subjectId: string;
  classId: string | null;
  termId: string | null;
};

async function loadExistingQuestions(admin: SupabaseClient) {
  const existing: {
    subject_id: string;
    class_id: string | null;
    term_id: string | null;
    question_text: string;
  }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("questions")
      .select("subject_id, class_id, term_id, question_text")
      .range(from, from + 999);
    if (error) throw error;
    existing.push(...(data ?? []));
    if ((data ?? []).length < 1000) return existing;
  }
}

async function parseFile(request: Request): Promise<{
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
    loadExistingQuestions(admin).then((data) => ({ data })),
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
    if (!className) errors.push("Class is required.");
    else if (!classRow) errors.push("Class does not exist.");
    if (!termName) errors.push("Term is required.");
    else if (!termRow) errors.push("Term does not exist.");
    if (!topicName) errors.push("Topic is required.");
    const missingTopic = Boolean(topicName && !topicRow);
    if (
      optionEntries.length !==
      new Set(optionEntries.map((option) => option.text.toLowerCase())).size
    )
      errors.push("Option values are duplicated.");
    const key = questionScopeKey(
      subjectRow?.id,
      classRow?.id,
      termRow?.id,
      input.questionText,
    );
    const duplicate =
      seen.has(key) ||
      (existing ?? []).some(
        (item) =>
          questionScopeKey(
            item.subject_id,
            item.class_id,
            item.term_id,
            item.question_text,
          ) === key,
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
      missingTopic,
      errors,
    };
  });
}

function findMissingTopics(validated: ImportRow[]): MissingTopic[] {
  const missingMap = new Map<string, MissingTopic>();

  for (const row of validated) {
    if (row.topicName && row.missingTopic && row.subjectId) {
      const key = `${row.subjectId}|${row.classId ?? ""}|${row.termId ?? ""}|${normalizeTopic(row.topicName)}`;
      if (!missingMap.has(key)) {
        missingMap.set(key, {
          key,
          name: row.topicName,
          subjectId: row.subjectId,
          classId: row.classId ?? null,
          termId: row.termId ?? null,
        });
      }
    }
  }

  return Array.from(missingMap.values());
}

async function createMissingTopics(
  missing: MissingTopic[],
  admin: SupabaseClient,
): Promise<{ idMap: Record<string, string>; createdIds: string[] }> {
  const idMap: Record<string, string> = {};
  const createdIds: string[] = [];

  for (const missingTopic of missing) {
    const { data: topic, error } = await admin
      .from("topics")
      .insert({
        name: missingTopic.name.trim(),
        subject_id: missingTopic.subjectId,
        class_id: missingTopic.classId,
        term_id: missingTopic.termId,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !topic) {
      await Promise.all(
        createdIds.map((createdId) =>
          admin.from("topics").delete().eq("id", createdId),
        ),
      );
      throw new Error(`Failed to create topic "${missingTopic.name}".`);
    }

    idMap[missingTopic.key] = topic.id;
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
      const missingTopics = findMissingTopics(validated);
      return NextResponse.json({
        total: validated.length,
        valid: validated.filter((row) => !row.errors.length),
        invalid: validated.filter((row) => row.errors.length && !row.duplicate),
        duplicates: validated.filter((row) => row.duplicate),
        missingTopics: missingTopics.map((topic) => topic.name),
      });
    }

    const valid = validated.filter((row) => !row.errors.length);

    // Detect missing topics and create them if requested
    const missingTopics = findMissingTopics(valid);
    if (missingTopics.length > 0 && !parsed.createMissingTopics) {
      return NextResponse.json(
        { error: "Confirm creation of the missing topics before importing." },
        { status: 400 },
      );
    }
    let createdTopicCount = 0;
    let createdTopicIds: string[] = [];
    const topicIdMap: Record<string, string> = {};

    if (missingTopics.length > 0 && parsed.createMissingTopics) {
      const result = await createMissingTopics(missingTopics, access.admin);

      Object.assign(topicIdMap, result.idMap);
      createdTopicIds = result.createdIds;
      createdTopicCount = missingTopics.length;

      // Update topicId for rows that reference newly created topics
      for (const row of valid) {
        if (row.topicName && row.missingTopic) {
          const topicKey = `${row.subjectId ?? ""}|${row.classId ?? ""}|${row.termId ?? ""}|${normalizeTopic(row.topicName)}`;
          if (topicKey in topicIdMap) {
            row.topicId = topicIdMap[topicKey];
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
