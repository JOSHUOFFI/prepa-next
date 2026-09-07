import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/supabase/admin-auth";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (!access) return errorResponse("Admin access required.", 403);
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(params.get("pageSize") ?? "25") || 25),
  );
  const search = params.get("search")?.trim();
  let studentIds: string[] | undefined;
  if (search) {
    const { data: profiles, error } = await access.admin
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (error) return errorResponse("Unable to search students.", 500);
    studentIds = (profiles ?? []).map((profile) => profile.id);
    if (studentIds.length === 0)
      return NextResponse.json({
        results: [],
        page,
        pageSize,
        total: 0,
        totalPages: 0,
        analytics: emptyAnalytics(),
      });
  }
  const buildQuery = (withRange: boolean) => {
    let query = access.admin
      .from("exam_attempts")
      .select(
        "id, student_id, subject_id, class_id, term_id, score, percentage, grade, passed, total_questions, started_at, submitted_at, status, profiles(full_name, email, avatar_url), subjects(name), classes(name), terms(name)",
        withRange ? { count: "exact" } : undefined,
      )
      .neq("status", "in_progress");
    if (studentIds) query = query.in("student_id", studentIds);
    if (params.get("subject"))
      query = query.eq("subject_id", params.get("subject")!);
    if (params.get("class")) query = query.eq("class_id", params.get("class")!);
    if (params.get("term")) query = query.eq("term_id", params.get("term")!);
    if (params.get("passed") === "passed") query = query.eq("passed", true);
    if (params.get("passed") === "failed") query = query.eq("passed", false);
    if (params.get("from"))
      query = query.gte("submitted_at", `${params.get("from")}T00:00:00.000Z`);
    if (params.get("to"))
      query = query.lte("submitted_at", `${params.get("to")}T23:59:59.999Z`);
    return query.order("submitted_at", { ascending: false, nullsFirst: false });
  };
  const from = (page - 1) * pageSize;
  const pageQuery = buildQuery(true).range(from, from + pageSize - 1);
  const allQuery = buildQuery(false).select("id, score, percentage, passed");
  const [{ data, error, count }, { data: allRows, error: analyticsError }] =
    await Promise.all([pageQuery, allQuery]);
  if (error || analyticsError)
    return errorResponse("Unable to load results.", 500);
  const results = await Promise.all(
    (data ?? []).map(async (row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const { data: signedAvatar } = profile?.avatar_url
        ? await access.admin.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 600)
        : { data: null };
      return {
        ...row,
        profiles: profile
          ? {
              full_name: profile.full_name,
              email: profile.email,
              avatarUrl: signedAvatar?.signedUrl ?? null,
            }
          : null,
      };
    }),
  );
  return NextResponse.json(
    {
      results,
      page,
      pageSize,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      analytics: analytics(
        (allRows ?? []) as {
          score: number | null;
          percentage: number | null;
          passed: boolean | null;
        }[],
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function emptyAnalytics() {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    averageScore: 0,
    averagePercentage: 0,
  };
}
function analytics(
  rows: {
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
  }[],
) {
  const scored = rows.filter((row) => row.percentage !== null);
  return {
    total: rows.length,
    passed: rows.filter((row) => row.passed === true).length,
    failed: rows.filter((row) => row.passed === false).length,
    passRate: rows.length
      ? Math.round(
          (rows.filter((row) => row.passed === true).length / rows.length) *
            100,
        )
      : 0,
    averageScore: scored.length
      ? Math.round(
          (scored.reduce((sum, row) => sum + Number(row.score ?? 0), 0) /
            scored.length) *
            100,
        ) / 100
      : 0,
    averagePercentage: scored.length
      ? Math.round(
          (scored.reduce((sum, row) => sum + Number(row.percentage ?? 0), 0) /
            scored.length) *
            100,
        ) / 100
      : 0,
  };
}
