import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const body = (await request.json()) as {
    attemptId?: string;
    questionId?: string;
    selectedOptionId?: string;
  };
  if (!body.attemptId || !body.questionId || !body.selectedOptionId)
    return NextResponse.json({ error: "Invalid answer." }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: attempt } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("id", body.attemptId)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();
  if (!attempt)
    return NextResponse.json(
      { error: "Attempt is not available." },
      { status: 403 },
    );
  const { data: snapshot } = await admin
    .from("exam_attempt_questions")
    .select("question_id")
    .eq("attempt_id", attempt.id)
    .eq("question_id", body.questionId)
    .maybeSingle();
  if (!snapshot)
    return NextResponse.json(
      { error: "Question is not part of this attempt." },
      { status: 400 },
    );
  const { data: option } = await admin
    .from("question_options")
    .select("id")
    .eq("id", body.selectedOptionId)
    .eq("question_id", body.questionId)
    .maybeSingle();
  if (!option)
    return NextResponse.json(
      { error: "Selected option is invalid." },
      { status: 400 },
    );
  const { error } = await admin
    .from("exam_answers")
    .upsert(
      {
        attempt_id: attempt.id,
        question_id: body.questionId,
        selected_option_id: body.selectedOptionId,
        answered_at: new Date().toISOString(),
        is_correct: null,
      },
      { onConflict: "attempt_id,question_id" },
    );
  if (error)
    return NextResponse.json(
      { error: "Unable to save answer." },
      { status: 500 },
    );
  return NextResponse.json({ saved: true });
}
