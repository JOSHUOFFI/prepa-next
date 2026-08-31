"use client";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export function LogoutButton(){const router=useRouter();async function out(){await createSupabaseBrowserClient().auth.signOut();router.replace("/login");router.refresh();}return <button className="btn btn-secondary" onClick={out}>Log out</button>;}
