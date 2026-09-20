import { ExamSetup } from "@/components/exam/exam-setup";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { subjectGroups } from "@/lib/constants";
import type { Subject } from "@/types";

export const metadata = { title: "Exam setup" };

export default async function ExamPage({ searchParams }: { searchParams: Promise<{ subjectId?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exam");
  const { subjectId } = await searchParams;

  const [{ data: profile }, { data: subjectRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, class_id").eq("id", user.id).maybeSingle(),
    supabase.from("subjects").select("id, name, category").eq("is_active", true).order("name"),
  ]);
  const subjects: Subject[] = (subjectRows ?? []).map(row => ({
    id: row.id,
    name: row.name,
    group: subjectGroups.find(group => group.subjects.includes(row.name))?.name ?? row.category,
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
