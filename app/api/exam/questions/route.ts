import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_EXAM_QUESTION_COUNT,
  loadSafeExamQuestions,
} from "@/services/supabase-question-repository";

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

  const params = new URL(request.url).searchParams;
  const subjectId = params.get("subjectId")?.trim();
  const subject = params.get("subject")?.trim();
  if (!subjectId && !subject)
    return NextResponse.json(
      { error: "Subject is required." },
      { status: 400 },
    );

  try {
    const questions = await loadSafeExamQuestions({ subject: subject || "", subjectId });
    if (questions.length === 0) {
      return NextResponse.json(
        {
          code: "EXAM_UNAVAILABLE",
          error: "There are no eligible questions for this subject.",
        },
        { status: 422 },
      );
    }
    if (questions.length < DEFAULT_EXAM_QUESTION_COUNT) {
      return NextResponse.json(
        {
          code: "EXAM_INSUFFICIENT_QUESTIONS",
          error: `There are only ${questions.length} eligible questions; ${DEFAULT_EXAM_QUESTION_COUNT} are required.`,
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { questions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("SAFE exam question pool load failed", {
      operation: "load_safe_exam_questions",
      userId: user.id,
      subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to load the exam question pool." },
      { status: 500 },
    );
  }
}
