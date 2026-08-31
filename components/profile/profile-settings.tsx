"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ProfileAvatar } from "./profile-avatar";

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProfileSettings() {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState("Student");
    const [avatarPath, setAvatarPath] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        let active = true;
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;
            const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", data.user.id).maybeSingle();
            if (!active || !profile) return;
            setUserId(data.user.id);
            setName(profile.full_name);
            setAvatarPath(profile.avatar_url);
            if (profile.avatar_url) {
                const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
                if (active) setAvatarUrl(signed?.signedUrl ?? null);
            }
        });
        return () => { active = false; };
    }, []);

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    function chooseFile(file: File | undefined) {
        setError("");
        setMessage("");
        if (!file) return;
        if (!ALLOWED_TYPES.has(file.type)) { setSelectedFile(null); setError("Choose a JPG, PNG, or WebP image."); return; }
        if (file.size > MAX_FILE_SIZE) { setSelectedFile(null); setError("Images must be 3 MB or smaller."); return; }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    async function saveAvatar() {
        if (!userId || !selectedFile) return;
        setBusy(true); setError(""); setMessage("");
        const supabase = createSupabaseBrowserClient();
        const extension = selectedFile.type === "image/jpeg" ? "jpg" : selectedFile.type.split("/")[1];
        const nextPath = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(nextPath, selectedFile, { contentType: selectedFile.type, upsert: false });
        if (uploadError) { setError(`Upload failed: ${uploadError.message}`); setBusy(false); return; }
        const { error: profileError } = await supabase.from("profiles").update({ avatar_url: nextPath }).eq("id", userId);
        if (profileError) {
            await supabase.storage.from("avatars").remove([nextPath]);
            setError(`Could not save your profile: ${profileError.message}`); setBusy(false); return;
        }
        if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(nextPath, 3600);
        setAvatarPath(nextPath); setAvatarUrl(signed?.signedUrl ?? previewUrl); setSelectedFile(null); setPreviewUrl(null); setMessage("Profile picture updated."); setBusy(false);
    }

    async function removeAvatar() {
        if (!userId || !avatarPath) return;
        setBusy(true); setError(""); setMessage("");
        const supabase = createSupabaseBrowserClient();
        const { error: profileError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
        if (profileError) { setError(`Could not remove your profile picture: ${profileError.message}`); setBusy(false); return; }
        const { error: removeError } = await supabase.storage.from("avatars").remove([avatarPath]);
        if (removeError) setError(`Picture removed from your profile, but file cleanup failed: ${removeError.message}`);
        else setMessage("Profile picture removed.");
        setAvatarPath(null); setAvatarUrl(null); setBusy(false);
    }

    return (
        <section className="profile-settings" aria-labelledby="profile-picture-title">
            <div><p className="eyebrow">Account</p><h2 id="profile-picture-title">Profile picture</h2><p className="muted">Use a JPG, PNG, or WebP image up to 3 MB.</p></div>
            <div className="profile-settings-row">
                <ProfileAvatar name={name} url={previewUrl ?? avatarUrl} size={76} />
                <div className="profile-settings-actions">
                    <label className="btn btn-secondary profile-file-label">Choose image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseFile(event.target.files?.[0])} disabled={busy} /></label>
                    {selectedFile ? <button className="btn btn-primary" onClick={saveAvatar} disabled={busy}>{busy ? "Saving..." : "Save picture"}</button> : null}
                    {avatarPath && !selectedFile ? <button className="btn btn-secondary" onClick={removeAvatar} disabled={busy}>{busy ? "Removing..." : "Remove picture"}</button> : null}
                </div>
            </div>
            {selectedFile ? <p className="muted">Previewing {selectedFile.name}</p> : null}
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {message ? <p className="form-success" role="status">{message}</p> : null}
        </section>
    );
}
