import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
    const { admin } = await requireAdmin();
    const { count } = await admin.from("questions").select("id", { count: "exact", head: true });
    const { count: activeCount } = await admin.from("questions").select("id", { count: "exact", head: true }).eq("is_active", true);
    return <section className="admin-dashboard"><p className="eyebrow">Administration</p><h1>Question bank</h1><p className="lead">Manage the structured question catalog.</p><div className="grid"><article className="card"><h2>{count ?? 0}</h2><p>Total questions</p></article><article className="card"><h2>{activeCount ?? 0}</h2><p>Active questions</p></article></div><Link className="btn btn-primary" href="/admin/questions">Open question bank</Link></section>;
}
