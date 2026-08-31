"use client";

import { useState } from "react";

type PreviewRow = { rowNumber: number; questionText: string; errors: string[]; duplicate?: boolean };
type Preview = { total: number; valid: PreviewRow[]; invalid: PreviewRow[]; duplicates: PreviewRow[] };

export function QuestionImport() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    async function previewFile() {
        if (!file) return;
        setBusy(true); setError(""); setMessage("");
        const form = new FormData(); form.set("file", file);
        const response = await fetch("/api/admin/import", { method: "POST", body: form });
        const payload = await response.json() as Preview & { error?: string };
        if (!response.ok) setError(payload.error ?? "Unable to preview workbook."); else setPreview(payload);
        setBusy(false);
    }
    async function importFile() {
        if (!file || !preview || preview.invalid.length || preview.duplicates.length) return;
        setBusy(true);
        const form = new FormData(); form.set("file", file); form.set("confirm", "true");
        const response = await fetch("/api/admin/import", { method: "POST", body: form });
        const payload = await response.json() as { imported?: number; skippedDuplicates?: number; rejected?: number; error?: string };
        if (response.ok) setMessage(`Import completed. Imported: ${payload.imported ?? 0}. Skipped duplicates: ${payload.skippedDuplicates ?? 0}. Rejected: ${payload.rejected ?? 0}.`); else setError(payload.error ?? "Import failed.");
        setBusy(false);
    }
    return <section className="admin-import"><div className="admin-page-heading"><div><p className="eyebrow">Bulk import</p><h1>Import questions</h1></div><a className="button button-secondary" href="/api/admin/import/template">Download Excel Template</a></div><p className="muted">Excel is the recommended format. Upload a workbook to preview every row before importing.</p><input type="file" accept=".xlsx" onChange={event => { setFile(event.target.files?.[0] ?? null); setPreview(null); }} /><button className="btn btn-primary" onClick={() => void previewFile()} disabled={!file || busy}>{busy ? "Checking..." : "Preview workbook"}</button>{preview ? <div className="import-summary"><p>{preview.total} rows detected</p><p>{preview.valid.length} valid · {preview.duplicates.length} duplicates · {preview.invalid.length} invalid</p>{preview.invalid.concat(preview.duplicates).map(row => <p className="form-error" key={row.rowNumber}>Row {row.rowNumber}: {row.errors.join(" ")}</p>)}<button className="btn btn-primary" disabled={busy || preview.invalid.length > 0 || preview.duplicates.length > 0} onClick={() => void importFile()}>Import {preview.valid.length} Questions</button></div> : null}{error ? <p className="form-error" role="alert">{error}</p> : null}{message ? <p className="form-success" role="status">{message}</p> : null}</section>;
}
