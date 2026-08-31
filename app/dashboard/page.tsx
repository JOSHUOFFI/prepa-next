import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { ButtonLink } from "@/components/button-link";
import { PageShell } from "@/components/page-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileIdentity } from "@/components/profile/profile-identity";
import { ProfileSettings } from "@/components/profile/profile-settings";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase.from("profiles").select("id, full_name, email, role").eq("id", user.id).maybeSingle();

    return (
        <PageShell title="Your learning dashboard">
            <ProfileIdentity />
            <p className="lead">Welcome, {profile?.full_name || user.email || "student"}.</p>
            {profile ? <p className="muted">Signed in as {profile.email || user.email}. Your account role is {profile.role}.</p> : <p className="form-error">Your account is signed in, but your profile could not be loaded. Please contact support.</p>}
            <ProfileSettings />
            <LogoutButton />
            <div className="grid">
                <article className="card"><h2>Set up a new exam</h2><p>Choose class, term, and subject before starting.</p><ButtonLink href="/exam">Open exam setup</ButtonLink></article>
                <article className="card"><h2>Study with Classroom</h2><p>Explore topics before attempting an exam.</p><ButtonLink href="/classroom" variant="secondary">Open classroom</ButtonLink></article>
            </div>
        </PageShell>
    );
}
