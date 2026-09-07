import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/supabase/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    await requireAdmin();
    return <main className="page"><nav className="admin-nav" aria-label="Administration"><Link href="/admin">Overview</Link><Link href="/admin/results">Results</Link><Link href="/admin/questions">Question bank</Link><Link href="/admin/questions/new">Add question</Link><Link href="/admin/import">Bulk import</Link><Link href="/admin/curriculum">Curriculum</Link></nav>{children}</main>;
}
