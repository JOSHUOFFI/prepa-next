import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (!attemptId)
    return NextResponse.json(
      { error: "An attempt ID is required." },
      { status: 400 },
    );

  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .select(
      "id, score, percentage, grade, passed, total_questions, status, started_at, expires_at, submitted_at",
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
  const [{ count }, { data: snapshots }] = await Promise.all([
    supabase
      .from("exam_answers")
      .select("id", { count: "exact", head: true })
      .eq("attempt_id", attempt.id),
    supabase
      .from("exam_attempt_questions")
      .select("points")
      .eq("attempt_id", attempt.id),
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
