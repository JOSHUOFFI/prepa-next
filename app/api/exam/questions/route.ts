import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSafeExamQuestions } from "@/services/supabase-question-repository";

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

  const subject = new URL(request.url).searchParams.get("subject")?.trim();
  if (!subject)
    return NextResponse.json(
      { error: "A subject is required." },
      { status: 400 },
    );

  try {
    const questions = await loadSafeExamQuestions({ subject });
    return NextResponse.json(
      { questions },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load the exam question pool." },
      { status: 500 },
    );
  }
}
