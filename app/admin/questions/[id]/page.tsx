import { QuestionEditor } from "@/components/admin/question-editor";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export const metadata = { title: "Edit question" };

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
    const { admin } = await requireAdmin();
    const { id } = await params;
    const { data: question } = await admin.from("questions").select("id, subject_id, class_id, term_id, topic_id, question_text, explanation, points, difficulty, question_type, is_active, question_options(option_label, option_text, is_correct)").eq("id", id).maybeSingle();
    return <QuestionEditor initial={question ?? undefined} />;
}