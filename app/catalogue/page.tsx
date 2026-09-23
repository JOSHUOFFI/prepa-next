import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CataloguePicker, type CatalogueSubject } from "./catalogue-picker";

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

  const subjects = (data ?? []) as CatalogueSubject[];
  const availableCount = subjects.filter(subject => subject.production_subject_id).length;

  return <CataloguePicker subjects={subjects} availableCount={availableCount} />;
}
