import { ResultSummary } from "@/components/results/result-summary";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Results" };

export default async function ResultsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/results");

  return (
    <main className="page">
      <ResultSummary />
    </main>
  );
}
