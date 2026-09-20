import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const attemptId = new URL(request.url).searchParams.get("attemptId");
  if (!attemptId) {
    const { data: attempts, error: historyError } = await supabase
      .from("exam_attempts")
      .select(
        "id, subject_id, started_at, score, percentage, grade, passed, status",
      )
      .eq("student_id", user.id)
      .neq("status", "in_progress")
      .order("started_at", { ascending: false });
    if (historyError)
      return NextResponse.json(
        { error: "Unable to load result history." },
        { status: 500 },
      );
    const subjectIds = [
      ...new Set((attempts ?? []).map((item) => item.subject_id)),
    ];
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds);
    const subjectNames = new Map(
      (subjects ?? []).map((item) => [item.id, item.name]),
    );
    return NextResponse.json(
      {
        history: (attempts ?? []).map((item) => ({
          ...item,
          subject: subjectNames.get(item.subject_id) ?? "",
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .select(
      "id, score, percentage, grade, passed, total_questions, status, started_at, expires_at, submitted_at, subject_id, class_id, term_id",
    )
    .eq("id", attemptId)
    .eq("student_id", user.id)
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
  const admin = createSupabaseAdminClient();
  const [
    { count },
    { data: snapshots },
    { data: answers },
    { data: profile },
    { data: subject },
    { data: classRow },
    { data: term },
  ] = await Promise.all([
    supabase
      .from("exam_answers")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attempt.id),
    admin
      .from("exam_result_question_snapshots")
      .select(
        "question_id, display_order, points, question_text, explanation, options, correct_option_id, correct_answer",
      )
      .eq("attempt_id", attempt.id),
    supabase
      .from("exam_answers")
      .select("question_id, selected_option_id, is_correct")
      .eq("attempt_id", attempt.id),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("name")
      .eq("id", attempt.subject_id)
      .maybeSingle(),
    attempt.class_id
      ? supabase
          .from("classes")
          .select("name")
          .eq("id", attempt.class_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    attempt.term_id
      ? supabase
          .from("terms")
          .select("name")
          .eq("id", attempt.term_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const totalPoints = (snapshots ?? []).reduce(
    (total, snapshot) => total + Number(snapshot.points),
    0,
  );
  return NextResponse.json(
    {
      result: {
        attemptId: attempt.id,
        score: Number(attempt.score ?? 0),
        totalPoints,
        percentage: Number(attempt.percentage ?? 0),
        grade: attempt.grade ?? "",
        passed: Boolean(attempt.passed),
        totalQuestions: attempt.total_questions,
        answeredQuestions: count ?? 0,
        status: attempt.status,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        submittedAt: attempt.submitted_at,
        studentName: profile?.full_name ?? "Student",
        subject: subject?.name ?? "",
        classLevel: classRow?.name ?? undefined,
        term: term?.name ?? undefined,
        correctAnswers: (answers ?? []).filter(
          (answer) => answer.is_correct === true,
        ).length,
        incorrectAnswers: (answers ?? []).filter(
          (answer) => answer.is_correct === false,
        ).length,
        reviews: (snapshots ?? [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((snapshot, index) => {
            const answer = (answers ?? []).find(
              (item) => item.question_id === snapshot.question_id,
            );
            const options = Array.isArray(snapshot.options)
              ? (snapshot.options as {
                  id: string;
                  label: string;
                  text: string;
                }[])
              : [];
            return {
              number: index + 1,
              points: Number(snapshot.points),
              questionText: snapshot.question_text,
              studentAnswer:
                options.find(
                  (option) => option.id === answer?.selected_option_id,
                )?.text ?? "Not answered",
              correctAnswer: snapshot.correct_answer,
              isCorrect: answer?.is_correct === true,
              explanation:
                snapshot.explanation ||
                "No explanation provided for this question.",
            };
          }),
        performanceMessage:
          attempt.grade === "A+"
            ? "Outstanding performance"
            : attempt.grade === "A"
              ? "Excellent work"
              : attempt.grade === "B"
                ? "Very good job"
                : attempt.grade === "C"
                  ? "Good effort"
                  : attempt.grade === "D"
                    ? "Pass"
                    : "Needs improvement",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
