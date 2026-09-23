import { ExamSetup } from "@/components/exam/exam-setup";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Subject } from "@/types";

const catalogueGroupLabels: Record<string, string> = {
  core_general: "Core / General",
  religion: "Religion",
  language: "Languages",
  trade_vocational: "Trade / Vocational",
  core_compulsory: "Core & Compulsory",
  science: "Science",
  arts_humanities: "Arts / Humanities",
  commercial_business: "Commercial",
};

const educationLevelLabels: Record<string, string> = {
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

function getAvailabilityState(subject: { production_subject_id: string | null; availability_status: string | null; questionCount: number }) {
  if (!subject.production_subject_id) {
    return { isAvailable: false, label: "Coming soon" };
  }

  if (subject.questionCount < 40) {
    return { isAvailable: false, label: "Coming soon" };
  }

  const status = String(subject.availability_status ?? "").toLowerCase();
  const unavailableStatuses = [
    "not_ready",
    "source_review_required",
    "scope_decision_required",
    "mapping_required",
    "pending",
    "review_required",
  ];

  if (unavailableStatuses.includes(status)) {
    return { isAvailable: false, label: "Coming soon" };
  }

  return { isAvailable: true, label: "Available" };
}

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
      .select("catalogue_key, display_name, education_level, category, subject_field, production_subject_id, availability_status, sort_order, is_active")
      .eq("is_active", true)
      .order("education_level")
      .order("category")
      .order("sort_order"),
  ]);

  if (catalogueError) {
    console.error("Exam subject catalogue load failed", catalogueError);
    throw catalogueError;
  }

  const mappedSubjectIds = (subjectRows ?? [])
    .map(row => row.production_subject_id)
    .filter((id): id is string => Boolean(id));

  let questionCountsBySubjectId: Record<string, number> = {};

  if (mappedSubjectIds.length > 0) {
    const { data: questionRows, error: questionCountError } = await supabase
      .from("questions")
      .select("subject_id")
      .in("subject_id", mappedSubjectIds)
      .eq("is_active", true);

    if (questionCountError) {
      console.error("Exam subject question count load failed", questionCountError);
    } else {
      for (const row of questionRows ?? []) {
        questionCountsBySubjectId[row.subject_id] = (questionCountsBySubjectId[row.subject_id] ?? 0) + 1;
      }
    }
  }

  const subjects: Subject[] = (subjectRows ?? []).map(row => {
    const level = row.education_level === "jss" || row.education_level === "sss" ? row.education_level : "jss";
    const questionCount = row.production_subject_id ? questionCountsBySubjectId[row.production_subject_id] ?? 0 : 0;
    const availability = getAvailabilityState({
      production_subject_id: row.production_subject_id,
      availability_status: row.availability_status,
      questionCount,
    });

    return {
      id: row.production_subject_id ?? row.catalogue_key,
      name: row.display_name,
      group: `${educationLevelLabels[level]} • ${catalogueGroupLabels[row.subject_field ?? row.category ?? ""] ?? "Catalogue subject"}`,
      hasQuestions: availability.isAvailable,
      questionCount,
      educationLevel: level,
      category: catalogueGroupLabels[row.subject_field ?? row.category ?? ""] ?? "Catalogue subject",
      catalogueKey: row.catalogue_key,
      availabilityStatus: row.availability_status ?? "not_ready",
      isAvailable: availability.isAvailable,
      availabilityLabel: availability.label,
    };
  });

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
