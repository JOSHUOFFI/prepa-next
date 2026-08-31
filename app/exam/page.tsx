import { ExamSetup } from "@/components/exam/exam-setup";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classes as fallbackClasses, terms as fallbackTerms, subjectGroups } from "@/lib/constants";
import type { ClassLevel, Subject, Term } from "@/types";

export const metadata = { title: "Exam setup" };

export default async function ExamPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exam");

  const [{ data: profile }, { data: classRows }, { data: termRows }, { data: subjectRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, class_id").eq("id", user.id).maybeSingle(),
    supabase.from("classes").select("id, name").order("sort_order"),
    supabase.from("terms").select("name").order("sort_order"),
    supabase.from("subjects").select("name, category").eq("is_active", true).order("name"),
  ]);
  const availableClasses = (classRows ?? [])
    .map(row => ({ id: row.id, value: row.name.replace(/\s+/g, "") as ClassLevel, label: row.name }))
    .filter(item => fallbackClasses.some(classItem => classItem.value === item.value));
  const availableTerms = (termRows ?? []).map(row => row.name as Term).filter(term => fallbackTerms.includes(term));
  const classOptions = availableClasses.length > 0 ? availableClasses : fallbackClasses;
  const termOptions = availableTerms.length > 0 ? availableTerms : fallbackTerms;
  const profileClass = availableClasses.find(item => item.id === profile?.class_id)?.value;
  const subjects: Subject[] = (subjectRows ?? []).map(row => ({
    name: row.name,
    group: subjectGroups.find(group => group.subjects.includes(row.name))?.name ?? row.category,
    hasQuestions: true,
    questionCount: 0,
  }));

  return (
    <main className="page">
      <ExamSetup
        profile={{ fullName: profile?.full_name ?? user.email ?? "Student", classLevel: profileClass }}
        classOptions={classOptions}
        termOptions={termOptions}
        subjects={subjects}
      />
    </main>
  );
}
