import { ExamSetup } from "@/components/exam/exam-setup";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isEligibleQuestionOptionSet } from "@/services/supabase-question-repository";
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
  if (!subject.production_subject_id || subject.questionCount <= 0) {
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

  const questionCountsBySubjectId: Record<string, number> = {};

  if (mappedSubjectIds.length > 0) {
    const { data: questionRows, error: questionCountError } = await supabase
      .from("questions")
      .select("id, subject_id")
      .in("subject_id", mappedSubjectIds)
      .eq("is_active", true);

    if (questionCountError) {
      console.error("Exam subject question count load failed", questionCountError);
    } else {
      const questionIds = (questionRows ?? []).map(row => row.id);
      if (questionIds.length > 0) {
        const { data: optionRows, error: optionError } = await supabase
          .from("question_options")
          .select("question_id, option_text, is_correct")
          .in("question_id", questionIds);

        if (optionError) {
          console.error("Exam subject option validation failed", optionError);
        } else {
          const optionsByQuestionId = new Map<string, Array<{ option_text?: string | null; is_correct?: boolean | null }>>();
          for (const option of optionRows ?? []) {
            const options = optionsByQuestionId.get(option.question_id) ?? [];
            options.push(option);
            optionsByQuestionId.set(option.question_id, options);
          }

          for (const question of questionRows ?? []) {
            const options = optionsByQuestionId.get(question.id) ?? [];
            if (!isEligibleQuestionOptionSet(options)) continue;
            questionCountsBySubjectId[question.subject_id] = (questionCountsBySubjectId[question.subject_id] ?? 0) + 1;
          }
        }
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
