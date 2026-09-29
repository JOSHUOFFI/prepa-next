import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CataloguePicker, type CatalogueSubject } from "./catalogue-picker";
import { loadExamSubjectReadiness } from "@/services/supabase-question-repository";
import { isPlayableExamQuestionCount } from "@/services/exam-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CataloguePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/catalogue");

  let data;
  let error;

  try {
    const response = await supabase
      .from("catalogue_subjects")
      .select("catalogue_key, display_name, category, education_level, subject_field, production_subject_id, availability_status, selection_group, selection_rule, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order");
    data = response.data;
    error = response.error;
  } catch (queryError) {
    console.error("Catalogue load failed", queryError);
    throw queryError;
  }

  if (error) {
    console.error("Catalogue subject query error", error);
    throw error;
  }

  const catalogueSubjects = (data ?? []) as Omit<CatalogueSubject, "eligibleQuestionCount" | "isExamAvailable">[];
  const subjectIds = catalogueSubjects.map(subject => subject.production_subject_id).filter((id): id is string => Boolean(id));
  const readiness = await loadExamSubjectReadiness(subjectIds);
  const subjects: CatalogueSubject[] = catalogueSubjects.map(subject => {
    const eligibleQuestionCount = subject.production_subject_id
      ? readiness.get(subject.production_subject_id)?.eligibleQuestionCount ?? 0
      : 0;
    return {
      ...subject,
      eligibleQuestionCount,
      isExamAvailable: isPlayableExamQuestionCount(eligibleQuestionCount),
    };
  });
  const availableCount = subjects.filter(subject => subject.isExamAvailable).length;

  return <CataloguePicker subjects={subjects} availableCount={availableCount} />;
}
