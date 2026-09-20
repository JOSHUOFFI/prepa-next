import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SafeExamQuestion } from "@/types";

const EXAM_DURATION_MINUTES = 30;

type AttemptQuestionInput = { id: string; order: number };

export async function POST(request: Request) {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  let body: {
    subjectId?: string;
    subject?: string;
    questions?: AttemptQuestionInput[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Invalid exam attempt." },
      { status: 400 },
    );
  }
  if (
    (!body.subjectId && !body.subject) ||
    !Array.isArray(body.questions) ||
    body.questions.length === 0 ||
    body.questions.length > 40
  ) {
    return NextResponse.json(
      { error: "Invalid exam attempt." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  let subjectQuery = admin.from("subjects").select("id").eq("is_active", true);
  subjectQuery = body.subjectId
    ? subjectQuery.eq("id", body.subjectId)
    : subjectQuery.eq("name", body.subject || "");
  const { data: subject, error: subjectError } = await subjectQuery.maybeSingle();
  if (subjectError) {
    console.error("SAFE exam reference lookup failed", {
      operation: "create_safe_exam_attempt",
      userId: user.id,
      subject: body.subject,
      error: subjectError.message,
    });
    return NextResponse.json(
      { error: "Unable to validate exam configuration." },
      { status: 500 },
    );
  }
  if (!subject)
    return NextResponse.json(
      { error: "Exam reference data is invalid." },
      { status: 400 },
    );

  const orderedQuestions = [...body.questions].sort(
    (left, right) => left.order - right.order,
  );
  const questionIds = orderedQuestions.map((question) => question.id);
  if (
    new Set(questionIds).size !== questionIds.length ||
    orderedQuestions.some((question, index) => question.order !== index)
  ) {
    return NextResponse.json(
      { error: "Exam question order is invalid." },
      { status: 400 },
    );
  }
  const { data: questionRows, error: questionError } = await admin
    .from("questions")
    .select("id, subject_id, class_id, term_id, points")
    .in("id", questionIds)
    .eq("subject_id", subject.id)
    .eq("is_active", true);
  if (questionError) {
    console.error("SAFE exam question validation failed", {
      operation: "create_safe_exam_attempt",
      userId: user.id,
      subject: body.subject,
      requestedQuestionCount: questionIds.length,
      error: questionError.message,
    });
    return NextResponse.json(
      { error: "Unable to validate exam questions." },
      { status: 500 },
    );
  }
  if (!questionRows || questionRows.length !== questionIds.length)
    return NextResponse.json(
      { error: "Exam question set is invalid." },
      { status: 400 },
    );
  const startedAt = new Date();
  const expiresAt = new Date(
    startedAt.getTime() + EXAM_DURATION_MINUTES * 60 * 1000,
  );
  const { data: attempt, error: attemptError } = await admin
    .from("exam_attempts")
    .insert({
      student_id: user.id,
      subject_id: subject.id,
      class_id: null,
      term_id: null,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      total_questions: questionIds.length,
      status: "in_progress",
      score: null,
      percentage: null,
      grade: null,
      passed: null,
    })
    .select("id, started_at, expires_at")
    .single();
  if (attemptError || !attempt)
    return NextResponse.json(
      { error: "Unable to create exam attempt." },
      { status: 500 },
    );

  const pointsById = new Map(
    questionRows.map((question) => [question.id, Number(question.points)]),
  );
  const { error: snapshotError } = await admin
    .from("exam_attempt_questions")
    .insert(
      orderedQuestions.map((question) => ({
        attempt_id: attempt.id,
        question_id: question.id,
        display_order: question.order,
        points: pointsById.get(question.id) ?? 1,
      })),
    );
  if (snapshotError) {
    await admin
      .from("exam_attempts")
      .delete()
      .eq("id", attempt.id)
      .eq("student_id", user.id);
    console.error("SAFE exam question snapshot failed", {
      operation: "create_safe_exam_attempt",
      userId: user.id,
      attemptId: attempt.id,
      subject: body.subject,
      requestedQuestionCount: questionIds.length,
      error: snapshotError.message,
    });
    return NextResponse.json(
      { error: "Unable to save the exam question set." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    attemptId: attempt.id,
    startedAt: attempt.started_at,
    expiresAt: attempt.expires_at,
  });
}

export async function GET() {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const admin = createSupabaseAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select(
      "id, subject_id, class_id, term_id, started_at, expires_at, total_questions",
    )
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!attempt) return NextResponse.json({ attempt: null });
  const [{ data: subject }] =
    await Promise.all([
      admin
        .from("subjects")
        .select("name")
        .eq("id", attempt.subject_id)
        .maybeSingle(),
    ]);
  const { data: snapshots } = await admin
    .from("exam_attempt_questions")
    .select("question_id, display_order, points")
    .eq("attempt_id", attempt.id)
    .order("display_order");
  const ids = (snapshots ?? []).map((snapshot) => snapshot.question_id);
  const { data: questions } = await admin
    .from("questions")
    .select("id, question_text, points")
    .in("id", ids);
  const { data: options } = await admin
    .from("question_options")
    .select("id, question_id, option_label, option_text")
    .in("question_id", ids);
  const { data: answers } = await admin
    .from("exam_answers")
    .select("question_id, selected_option_id, answered_at")
    .eq("attempt_id", attempt.id);
  const questionMap = new Map(
    (questions ?? []).map((question) => [question.id, question]),
  );
  const optionMap = new Map<
    string,
    { id: string; label: string; text: string }[]
  >();
  for (const option of options ?? [])
    optionMap.set(option.question_id, [
      ...(optionMap.get(option.question_id) ?? []),
      { id: option.id, label: option.option_label, text: option.option_text },
    ]);
  const safeQuestions: SafeExamQuestion[] = (snapshots ?? []).flatMap(
    (snapshot) => {
      const question = questionMap.get(snapshot.question_id);
      return question
        ? [
            {
              id: question.id,
              text: question.question_text,
              points: Number(snapshot.points),
              options: optionMap.get(question.id) ?? [],
            },
          ]
        : [];
    },
  );
  return NextResponse.json(
    {
      attempt: {
        attemptId: attempt.id,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        subject: subject?.name,
        classLevel: undefined,
        term: undefined,
        totalQuestions: attempt.total_questions,
        questions: safeQuestions,
        answers: answers ?? [],
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
