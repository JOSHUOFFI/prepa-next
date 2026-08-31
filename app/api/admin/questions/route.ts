import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import {
  validateQuestionImport,
  type QuestionImportInput,
} from "@/services/question-import-validation";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (!access) return errorResponse("Admin access required.", 403);
  const params = new URL(request.url).searchParams;
  if (params.get("stats") === "1") {
    const [{ count: active }, { count: archived }] = await Promise.all([
      access.admin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      access.admin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", false),
    ]);
    return NextResponse.json({ active: active ?? 0, archived: archived ?? 0 });
  }
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(params.get("pageSize") ?? "25") || 25),
  );
  const from = (page - 1) * pageSize;
  let query = access.admin
    .from("questions")
    .select(
      "id, legacy_id, subject_id, class_id, term_id, topic_id, question_text, explanation, points, difficulty, question_type, is_active, created_by, created_at, updated_at, subjects(name), classes(name), terms(name), topics(name), question_options(id, option_label, option_text, is_correct)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  for (const [column, value] of [
    ["subject_id", params.get("subject")],
    ["class_id", params.get("class")],
    ["term_id", params.get("term")],
    ["topic_id", params.get("topic")],
    ["difficulty", params.get("difficulty")],
    ["question_type", params.get("question_type")],
  ] as const) {
    if (value) query = query.eq(column, value);
  }
  if (params.get("status") === "active") query = query.eq("is_active", true);
  if (params.get("status") === "archived") query = query.eq("is_active", false);
  if (params.get("search"))
    query = query.ilike("question_text", `%${params.get("search")}%`);
  const { data, error, count } = await query;
  if (error) return errorResponse("Unable to load questions.", 500);
  return NextResponse.json(
    {
      questions: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function HEAD() {
  const access = await requireAdminApi();
  if (!access) return new NextResponse(null, { status: 403 });
  const [{ count: active }, { count: archived }] = await Promise.all([
    access.admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    access.admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false),
  ]);
  return NextResponse.json({ active: active ?? 0, archived: archived ?? 0 });
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (!access) return errorResponse("Admin access required.", 403);
  const input = (await request.json()) as QuestionImportInput & {
    subjectId?: string;
    classId?: string | null;
    termId?: string | null;
    topicId?: string | null;
    explanation?: string;
    points?: number;
  };
  const validationErrors = validateQuestionImport(input);
  if (validationErrors.length || !input.subjectId)
    return errorResponse(
      validationErrors.join(" ") || "Subject ID is required.",
    );
  const { data: question, error: questionError } = await access.admin
    .from("questions")
    .insert({
      legacy_id: `admin-${crypto.randomUUID()}`,
      subject_id: input.subjectId,
      class_id: input.classId || null,
      term_id: input.termId || null,
      topic_id: input.topicId || null,
      question_text: input.questionText.trim(),
      explanation: input.explanation?.trim() || null,
      points: input.points || 1,
      difficulty: input.difficulty || null,
      question_type: input.questionType || "multiple_choice",
      created_by: access.user.id,
      is_active: true,
    })
    .select("id")
    .single();
  if (questionError || !question)
    return errorResponse("Unable to create question.", 500);
  const { error: optionsError } = await access.admin
    .from("question_options")
    .insert(
      input.options.map((option) => ({
        question_id: question.id,
        option_label: option.label,
        option_text: option.text.trim(),
        is_correct: option.label === input.correctOption,
      })),
    );
  if (optionsError)
    return errorResponse(
      "Question created, but options could not be saved.",
      500,
    );
  return NextResponse.json({ id: question.id }, { status: 201 });
}
