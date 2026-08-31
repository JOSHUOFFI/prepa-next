import { PageShell } from "@/components/page-shell";
export const metadata = { title: "Classroom" };
export default function ClassroomPage() { return <PageShell eyebrow="PrePa Classroom" title="Learn before you take an exam"><div className="card"><h2>AI learning assistant</h2><p>Topic explanations and follow-up conversations will be connected when the Classroom feature is migrated.</p><input placeholder="Try: Photosynthesis" disabled /><button disabled>Ask PrePa</button></div></PageShell>; }
