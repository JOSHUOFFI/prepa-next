import { AdminResultDetail } from "@/components/admin/admin-result-detail";
export const metadata = { title: "Student Result" };
export default async function AdminResultDetailPage({ params }: { params: Promise<{ attemptId: string }> }) { return <AdminResultDetail attemptId={(await params).attemptId} />; }
