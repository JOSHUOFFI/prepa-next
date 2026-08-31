import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/supabase/admin-auth";

export async function GET() {
  const access = await requireAdminApi();
  if (!access)
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  const [
    { data: subjects },
    { data: classes },
    { data: terms },
    { data: topics },
  ] = await Promise.all([
    access.admin
      .from("subjects")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    access.admin.from("classes").select("id, name").order("sort_order"),
    access.admin.from("terms").select("id, name").order("sort_order"),
    access.admin
      .from("topics")
      .select("id, subject_id, name")
      .eq("is_active", true)
      .order("name"),
  ]);
  return NextResponse.json({
    subjects: subjects ?? [],
    classes: classes ?? [],
    terms: terms ?? [],
    topics: topics ?? [],
  });
}
