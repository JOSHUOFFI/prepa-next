import { ExamContainer } from "@/components/exam/exam-container";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Take exam" };

export default async function TakeExamPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exam/take");

  return (
    <main className="page exam-page">
      <ExamContainer />
    </main>
  );
}
