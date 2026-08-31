import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import {
  validateQuestionImport,
  type QuestionImportInput,
} from "@/services/question-import-validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { id } = await context.params;
  const { data, error } = await access.admin
    .from("questions")
    .select(
      "id, subject_id, class_id, term_id, topic_id, question_text, explanation, points, difficulty, question_type, is_active, question_options(option_label, option_text, is_correct)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Unable to load question." },
      { status: 500 },
    );
  if (!data)
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  return NextResponse.json(
    { question: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { id } = await context.params;
  const input = (await request.json()) as QuestionImportInput & {
    subjectId?: string;
    classId?: string | null;
    termId?: string | null;
    topicId?: string | null;
    explanation?: string;
    points?: number;
    isActive?: boolean;
  };
  const errors = validateQuestionImport(input);
  if (errors.length || !input.subjectId)
    return NextResponse.json(
      { error: errors.join(" ") || "Subject ID is required." },
      { status: 400 },
    );
  const { error: questionError } = await access.admin
    .from("questions")
    .update({
      subject_id: input.subjectId,
      class_id: input.classId || null,
      term_id: input.termId || null,
      topic_id: input.topicId || null,
      question_text: input.questionText.trim(),
      explanation: input.explanation?.trim() || null,
      points: input.points || 1,
      difficulty: input.difficulty || null,
      question_type: input.questionType || "multiple_choice",
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (questionError)
    return NextResponse.json(
      { error: "Unable to update question." },
      { status: 500 },
    );
  const { error: deleteError } = await access.admin
    .from("question_options")
    .delete()
    .eq("question_id", id);
  if (deleteError)
    return NextResponse.json(
      { error: "Unable to update options." },
      { status: 500 },
    );
  const { error: optionsError } = await access.admin
    .from("question_options")
    .insert(
      input.options.map((option) => ({
        question_id: id,
        option_label: option.label,
        option_text: option.text.trim(),
        is_correct: option.label === input.correctOption,
      })),
    );
  if (optionsError)
    return NextResponse.json(
      { error: "Unable to save options." },
      { status: 500 },
    );
  return NextResponse.json({ updated: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { id } = await context.params;
  const { error } = await access.admin
    .from("questions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Unable to archive question." },
      { status: 500 },
    );
  return NextResponse.json({ archived: true });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { id } = await context.params;
  const { error } = await access.admin
    .from("questions")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error)
    return NextResponse.json(
      { error: "Unable to restore question." },
      { status: 500 },
    );
  return NextResponse.json({ restored: true });
}
