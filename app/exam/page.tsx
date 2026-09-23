import { ExamSetup } from "@/components/exam/exam-setup";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Subject } from "@/types";

const catalogueGroupLabels: Record<string, string> = {
  core_general: "Junior Secondary • Core / General",
  religion: "Junior Secondary • Religion",
  language: "Junior Secondary • Languages",
  trade_vocational: "Junior Secondary • Trade / Vocational",
  core_compulsory: "Senior Secondary • Core & Compulsory",
  science: "Senior Secondary • Science",
  arts_humanities: "Senior Secondary • Arts",
  commercial_business: "Senior Secondary • Commercial",
};

export const metadata = { title: "Exam setup" };

export default async function ExamPage({ searchParams }: { searchParams: Promise<{ subjectId?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exam");
  const { subjectId } = await searchParams;

  const [{ data: profile }, { data: subjectRows, error: catalogueError }] = await Promise.all([
    supabase.from("profiles").select("full_name, class_id").eq("id", user.id).maybeSingle(),
    supabase
      .from("catalogue_subjects")
      .select("production_subject_id, display_name, education_level, subject_field, sort_order")
      .eq("is_active", true)
      .not("production_subject_id", "is", null)
      .order("sort_order"),
  ]);

  if (catalogueError) {
    console.error("Exam subject catalogue load failed", catalogueError);
    throw catalogueError;
  }

  const canonicalSubjectRows = new Map<string, (typeof subjectRows extends (infer T)[] ? T : never)>();

  for (const row of subjectRows ?? []) {
    const key = row.production_subject_id ?? row.display_name;
    const existing = canonicalSubjectRows.get(key);
    if (!existing || (row.production_subject_id && !existing.production_subject_id) || (!row.production_subject_id && !existing.production_subject_id && row.sort_order < existing.sort_order)) {
      canonicalSubjectRows.set(key, row);
    }
  }

  const subjects: Subject[] = [...canonicalSubjectRows.values()].map(row => ({
    id: row.production_subject_id ?? undefined,
    name: row.display_name,
    group:
      catalogueGroupLabels[row.subject_field ?? ""] ??
      (row.education_level === "jss" ? "Junior Secondary" : row.education_level === "sss" ? "Senior Secondary" : "Catalogue subject"),
    hasQuestions: true,
    questionCount: 0,
  }));

  return (
    <main className="page">
      <ExamSetup
        profile={{ fullName: profile?.full_name ?? user.email ?? "Student" }}
        initialSubjectId={subjectId}
        subjects={subjects}
      />
    </main>
  );
}
