"use client";

import { useState } from "react";

type PreviewRow = {
    rowNumber: number;
    questionText: string;
    errors: string[];
    duplicate?: boolean;
};

type Preview = {
    total: number;
    valid: PreviewRow[];
    invalid: PreviewRow[];
    duplicates: PreviewRow[];
    missingTopics?: string[];
};

export function QuestionImport() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [createMissingTopics, setCreateMissingTopics] = useState(false);

    async function previewFile() {
        if (!file) return;
        setBusy(true);
        setError("");
        setMessage("");
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/admin/import", { method: "POST", body: form });
        const payload = (await response.json()) as Preview & { error?: string };
        if (!response.ok)
            setError(payload.error ?? "Unable to preview workbook.");
        else setPreview(payload);
        setBusy(false);
    }

    async function importFile() {
        if (!file || !preview || preview.invalid.length || preview.duplicates.length) return;
        setBusy(true);
        const form = new FormData();
        form.set("file", file);
        form.set("confirm", "true");
        form.set("createMissingTopics", String(createMissingTopics));
        const response = await fetch("/api/admin/import", { method: "POST", body: form });
        const payload = (await response.json()) as {
            imported?: number;
            skippedDuplicates?: number;
            rejected?: number;
            topicsCreated?: number;
            error?: string;
        };
        if (response.ok) {
            const parts = [
                `Imported: ${payload.imported ?? 0}`,
                `Skipped duplicates: ${payload.skippedDuplicates ?? 0}`,
                `Rejected: ${payload.rejected ?? 0}`,
            ];
            if (payload.topicsCreated) parts.push(`Topics created: ${payload.topicsCreated}`);
            setMessage(`Import completed. ${parts.join(" · ")}`);
        } else setError(payload.error ?? "Import failed.");
        setBusy(false);
    }

    const hasMissingTopics = (preview?.missingTopics?.length ?? 0) > 0;
    const canImport =
        preview &&
        !preview.invalid.length &&
        !preview.duplicates.length &&
        (!hasMissingTopics || createMissingTopics);

    return (
        <section className="admin-import">
            <div className="admin-page-heading">
                <div>
                    <p className="eyebrow">Bulk import</p>
                    <h1>Import questions</h1>
                </div>
                <a className="button button-secondary" href="/api/admin/import/template">
                    Download Excel Template
                </a>
            </div>
            <p className="muted">
                Excel is the recommended format. Upload a workbook to preview every row before importing.
            </p>
            <input
                type="file"
                accept=".xlsx"
                onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreview(null);
                }}
            />
            <button
                className="btn btn-primary"
                onClick={() => void previewFile()}
                disabled={!file || busy}
            >
                {busy ? "Checking..." : "Preview workbook"}
            </button>

            {preview ? (
                <div className="import-summary">
                    <p>{preview.total} rows detected</p>
                    <p>
                        {preview.valid.length} valid · {preview.duplicates.length} duplicates ·{" "}
                        {preview.invalid.length} invalid
                    </p>

                    {hasMissingTopics && (
                        <div className="missing-topics-section">
                            <p>
                                <strong>Missing topics: {preview.missingTopics?.length}</strong>
                            </p>
                            <ul>
                                {preview.missingTopics?.map((topic, idx) => (
                                    <li key={idx}>{topic}</li>
                                ))}
                            </ul>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={createMissingTopics}
                                    onChange={(e) => setCreateMissingTopics(e.target.checked)}
                                />
                                Create {preview.missingTopics?.length} missing topic(s)
                            </label>
                        </div>
                    )}

                    {preview.invalid.concat(preview.duplicates).map((row) => (
                        <p className="form-error" key={row.rowNumber}>
                            Row {row.rowNumber}: {row.errors.join(" ")}
                        </p>
                    ))}
                    <button
                        className="btn btn-primary"
                        disabled={busy || !canImport}
                        onClick={() => void importFile()}
                    >
                        {canImport ? `Import ${preview.valid.length} Questions` : "Fix errors to import"}
                    </button>
                </div>
            ) : null}

            {error ? (
                <p className="form-error" role="alert">
                    {error}
                </p>
            ) : null}
            {message ? (
                <p className="form-success" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
}
