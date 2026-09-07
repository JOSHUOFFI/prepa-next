"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/state";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(""); if (!email.trim() || !password) { setMessage("Enter your email address and password."); return; } setLoading(true); const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: email.trim(), password }); setLoading(false); if (error) { setMessage("We could not sign you in. Check your email and password, please ensure you have a stable internet connection then try again."); return; } router.replace("/dashboard"); router.refresh(); }
  return <form className="auth-card auth-form" onSubmit={submit}><p className="auth-form__intro">Sign in to continue your preparation.</p><label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={loading} /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={loading} /></label><button className="btn btn-primary" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>{message ? <Alert tone="error" title="Unable to sign in">{message}</Alert> : null}</form>;
}
