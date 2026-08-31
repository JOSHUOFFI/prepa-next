import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  let body: { attemptId?: unknown };
  try {
    body = (await request.json()) as { attemptId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  if (typeof body.attemptId !== "string" || !body.attemptId)
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });

  const { data, error } = await supabase.rpc("submit_safe_exam_attempt", {
    p_attempt_id: body.attemptId,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : 409;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(
    { result: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
