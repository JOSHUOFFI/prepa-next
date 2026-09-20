"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { LogoutButton } from "@/components/auth/logout-button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

const studentRoutes = ["/dashboard", "/catalogue", "/exam", "/results", "/classroom"];
const navigation = [
  { href: "/dashboard", label: "Overview", mark: "O" },
  { href: "/catalogue", label: "Subjects", mark: "S" },
  { href: "/exam", label: "Take an exam", mark: "E" },
  { href: "/results", label: "My results", mark: "R" },
  { href: "/classroom", label: "Classroom", mark: "C" },
];

export function StudentAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; email: string; avatarUrl: string | null } | null>(null);
  const isStudentRoute = studentRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  useEffect(() => {
    if (!isStudentRoute) return;
    let active = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase.from("profiles").select("full_name, email, avatar_url").eq("id", data.user.id).maybeSingle();
      if (!row || !active) return;
      const { data: signed } = row.avatar_url ? await supabase.storage.from("avatars").createSignedUrl(row.avatar_url, 3600) : { data: null };
      if (active) setProfile({ fullName: row.full_name || "Student", email: row.email || data.user.email || "", avatarUrl: signed?.signedUrl ?? null });
    });
    return () => { active = false; };
  }, [isStudentRoute]);

  if (!isStudentRoute) return <>{children}</>;
  const displayName = profile?.fullName ?? "Student";
  return <div className="student-shell"><button className="student-shell__menu" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><span /><span /><span /></button>{open ? <button className="student-shell__overlay" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}<aside className={`student-sidebar ${open ? "is-open" : ""}`} aria-label="Student navigation"><Link href="/dashboard" className="student-sidebar__brand" onClick={() => setOpen(false)}><Image src="/images/logo.png" alt="PrePa" width={48} height={48} priority /><span>PrePa<small>Learning portal</small></span></Link><nav className="student-sidebar__nav" aria-label="Learning navigation"><p>Learning</p>{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)) ? "is-active" : ""}><span aria-hidden="true">{item.mark}</span>{item.label}</Link>)}</nav><div className="student-sidebar__account"><div className="student-sidebar__identity"><ProfileAvatar name={displayName} url={profile?.avatarUrl} size={38} /><div><strong>{displayName}</strong><small>{profile?.email || "Your PrePa account"}</small></div></div><LogoutButton /></div></aside><div className="student-shell__content"><header className="student-topbar"><div><p className="student-topbar__label">PrePa learning</p><strong>{navigation.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)))?.label ?? "Learning"}</strong></div><ProfileAvatar name={displayName} url={profile?.avatarUrl} size={36} /></header>{children}</div></div>;
}
