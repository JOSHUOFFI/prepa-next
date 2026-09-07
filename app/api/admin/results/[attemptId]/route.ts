import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { attemptId } = await params;
  const { data: attempt, error } = await access.admin
    .from("exam_attempts")
    .select(
      "id, student_id, subject_id, class_id, term_id, score, percentage, grade, passed, total_questions, started_at, expires_at, submitted_at, status, profiles(full_name, email, avatar_url), subjects(name), classes(name), terms(name)",
    )
    .eq("id", attemptId)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Unable to load result." },
      { status: 500 },
    );
  if (!attempt)
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  if (attempt.status === "in_progress")
    return NextResponse.json(
      { error: "Result is not available until submission." },
      { status: 409 },
    );
  const [{ data: snapshots }, { data: answers }] = await Promise.all([
    access.admin
      .from("exam_result_question_snapshots")
      .select(
        "question_id, display_order, points, question_text, explanation, options, correct_answer",
      )
      .eq("attempt_id", attemptId)
      .order("display_order"),
    access.admin
      .from("exam_answers")
      .select("question_id, selected_option_id, is_correct")
      .eq("attempt_id", attemptId),
  ]);
  const profile = Array.isArray(attempt.profiles)
    ? attempt.profiles[0]
    : attempt.profiles;
  const subject = Array.isArray(attempt.subjects)
    ? attempt.subjects[0]
    : attempt.subjects;
  const classRow = Array.isArray(attempt.classes)
    ? attempt.classes[0]
    : attempt.classes;
  const term = Array.isArray(attempt.terms) ? attempt.terms[0] : attempt.terms;
  const { data: signedAvatar } = profile?.avatar_url
    ? await access.admin.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_url, 600)
    : { data: null };
  return NextResponse.json(
    {
      result: {
        attemptId: attempt.id,
        studentName: profile?.full_name ?? "Student",
        studentEmail: profile?.email ?? "",
        avatarUrl: signedAvatar?.signedUrl ?? null,
        subject: subject?.name ?? "",
        classLevel: classRow?.name ?? "",
        term: term?.name ?? "",
        score: Number(attempt.score ?? 0),
        percentage: Number(attempt.percentage ?? 0),
        grade: attempt.grade ?? "",
        passed: Boolean(attempt.passed),
        totalQuestions: attempt.total_questions,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        submittedAt: attempt.submitted_at,
        status: attempt.status,
        correctAnswers: (answers ?? []).filter(
          (answer) => answer.is_correct === true,
        ).length,
        incorrectAnswers: (answers ?? []).filter(
          (answer) => answer.is_correct === false,
        ).length,
        reviews: (snapshots ?? []).map((snapshot, index) => {
          const answer = (answers ?? []).find(
            (item) => item.question_id === snapshot.question_id,
          );
          const options = Array.isArray(snapshot.options)
            ? (snapshot.options as { id: string; text: string }[])
            : [];
          return {
            number: index + 1,
            points: Number(snapshot.points),
            questionText: snapshot.question_text,
            studentAnswer:
              options.find((option) => option.id === answer?.selected_option_id)
                ?.text ?? "Not answered",
            correctAnswer: snapshot.correct_answer,
            isCorrect: answer?.is_correct === true,
            explanation:
              snapshot.explanation ||
              "No explanation provided for this question.",
          };
        }),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const { attemptId } = await params;
  const sessionClient = await createSupabaseServerClient();
  const { error } = await sessionClient.rpc("admin_delete_exam_attempt", {
    p_attempt_id: attemptId,
  });
  if (error)
    return NextResponse.json(
      { error: error.message },
      {
        status:
          error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 409,
      },
    );
  return new NextResponse(null, { status: 204 });
}
