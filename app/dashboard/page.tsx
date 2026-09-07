import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/button-link";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { Badge, EmptyState } from "@/components/ui/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };
type Attempt = { id: string; subject_id: string; percentage: number | null; passed: boolean | null; started_at: string; submitted_at: string | null };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: attempts }, { data: subjects }] = await Promise.all([
    supabase.from("profiles").select("full_name, class_id, avatar_url, classes(name)").eq("id", user.id).maybeSingle(),
    supabase.from("exam_attempts").select("id, subject_id, percentage, passed, started_at, submitted_at").eq("student_id", user.id).neq("status", "in_progress").order("started_at", { ascending: false }),
    supabase.from("subjects").select("id, name, category").eq("is_active", true).order("name").limit(6),
  ]);
  const studentAttempts = (attempts ?? []) as Attempt[];
  const subjectNames = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));
  const classRow = Array.isArray(profile?.classes) ? profile?.classes[0] : profile?.classes;
  const avatarUrl = profile?.avatar_url ? (await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600)).data?.signedUrl ?? null : null;
  const scored = studentAttempts.filter((attempt) => attempt.percentage !== null);
  const average = scored.length ? Math.round(scored.reduce((total, attempt) => total + Number(attempt.percentage), 0) / scored.length) : null;
  const best = scored.length ? Math.max(...scored.map((attempt) => Number(attempt.percentage))) : null;
  const studentName = profile?.full_name || user.email || "Student";

  return <main className="student-page"><section className="dashboard-welcome"><div className="dashboard-welcome__identity"><ProfileAvatar name={studentName} url={avatarUrl} size={64} /><div><p className="eyebrow">Your learning space</p><h1>Welcome back, {studentName.split(" ")[0]}.</h1><p>{classRow?.name ? `${classRow.name} student` : "Ready to build confidence?"} Choose a subject and keep your preparation moving.</p></div></div><div className="dashboard-welcome__action"><ButtonLink href="/exam">Start an exam</ButtonLink><ButtonLink href="/results" variant="secondary">View results</ButtonLink></div></section><section className="dashboard-metrics" aria-label="Your learning progress"><article><span>Exams completed</span><strong>{studentAttempts.length}</strong><small>{studentAttempts.length === 1 ? "attempt recorded" : "attempts recorded"}</small></article><article><span>Average score</span><strong>{average === null ? "—" : `${average}%`}</strong><small>{average === null ? "Complete an exam to begin" : "across completed exams"}</small></article><article><span>Best score</span><strong>{best === null ? "—" : `${best}%`}</strong><small>{best === null ? "Your top result will show here" : "your strongest result"}</small></article></section><div className="dashboard-grid"><section className="dashboard-section dashboard-section--primary"><div className="dashboard-section__heading"><div><p className="eyebrow">Next step</p><h2>Choose your next subject</h2></div><ButtonLink href="/exam" variant="secondary">All subjects</ButtonLink></div>{subjects && subjects.length > 0 ? <div className="subject-list">{subjects.map((subject) => <article key={subject.id} className="subject-row"><div><strong>{subject.name}</strong><span>{subject.category || "Available for practice"}</span></div><ButtonLink href="/exam" variant="secondary">Practice</ButtonLink></article>)}</div> : <EmptyState title="No subjects available yet" description="Your school’s active subjects will appear here when they are ready." />}</section><section className="dashboard-section"><div className="dashboard-section__heading"><div><p className="eyebrow">Recent activity</p><h2>Your latest results</h2></div><ButtonLink href="/results" variant="secondary">See all</ButtonLink></div>{studentAttempts.length > 0 ? <div className="recent-results">{studentAttempts.slice(0, 4).map((attempt) => <article key={attempt.id}><div><strong>{subjectNames.get(attempt.subject_id) || "Exam result"}</strong><span>{new Date(attempt.submitted_at || attempt.started_at).toLocaleDateString()}</span></div><div className="recent-results__score"><strong>{attempt.percentage ?? 0}%</strong><Badge tone={attempt.passed ? "success" : "warning"}>{attempt.passed ? "Passed" : "Review"}</Badge></div></article>)}</div> : <EmptyState title="Your results will appear here" description="Complete your first exam to track your score and progress over time." action={<ButtonLink href="/exam">Take your first exam</ButtonLink>} />}</section></div><section className="dashboard-account"><div><p className="eyebrow">Account</p><h2>Personalise your profile</h2><p>Keep your PrePa identity up to date. Your picture is only used within your authenticated account.</p></div><ProfileSettings /></section></main>;
}
