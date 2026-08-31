"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ProfileAvatar } from "./profile-avatar";
export function ProfileIdentity(){const [profile,setProfile]=useState<{full_name:string;avatar_url:string|null}|null>(null);const [url,setUrl]=useState<string|null>(null);useEffect(()=>{const supabase=createSupabaseBrowserClient();supabase.auth.getUser().then(async({data})=>{if(!data.user)return;const {data:row}=await supabase.from("profiles").select("full_name, avatar_url").eq("id",data.user.id).maybeSingle();if(!row)return;setProfile(row);if(row.avatar_url){const {data:signed}=await supabase.storage.from("avatars").createSignedUrl(row.avatar_url,3600);setUrl(signed?.signedUrl??null);}});},[]);if(!profile)return null;return <div style={{display:"flex",gap:8,alignItems:"center"}}><ProfileAvatar name={profile.full_name} url={url}/><span>{profile.full_name}</span></div>;}
