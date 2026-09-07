"use client";
import { useState } from "react";

export function ProfileAvatar({ name, url, size = 44 }: { name: string; url?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";

  return <span aria-label={`${name}'s avatar`} className="profile-avatar" style={{ width: size, height: size }}>{url && !failed ? <img src={url} alt="" width={size} height={size} onError={() => setFailed(true)} /> : initials}</span>;
}
