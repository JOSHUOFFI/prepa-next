"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

type Review = { number: number; points: number; questionText: string; studentAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string };
type AdminResult = { attemptId: string; studentName: string; studentEmail: string; avatarUrl: string | null; subject: string; classLevel: string; term: string; score: number; percentage: number; grade: string; passed: boolean; totalQuestions: number; correctAnswers: number; incorrectAnswers: number; startedAt: string; submittedAt: string; reviews: Review[] };

export function AdminResultDetail({ attemptId }: { attemptId: string }) {
    const router = useRouter();
    const [result, setResult] = useState<AdminResult>({} as AdminResult);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    useEffect(() => { fetch(`/api/admin/results/${attemptId}`, { cache: "no-store" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data.result; }).then(setResult).catch((reason: Error) => setError(reason.message)); }, [attemptId]);
    if (error) return <section className="admin-results"><p className="form-error">{error}</p><Link className="button button-secondary" href="/admin/results">Back to results</Link></section>;
    if (!result.attemptId) return <section className="admin-results"><p className="muted">Loading result...</p></section>;
    const timeTaken = Math.max(0, Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000));
    async function avatarDataUrl(url: string | null) {
        if (!url) return null;
        try {
            const response = await fetch(url, { mode: "cors" });
            if (!response.ok) return null;
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            try {
                const image = new Image();
                image.src = objectUrl;
                await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to load avatar.")); });
                const size = Math.min(image.naturalWidth, image.naturalHeight);
                if (!size) return null;
                const canvas = document.createElement("canvas");
                canvas.width = 512;
                canvas.height = 512;
                canvas.getContext("2d")?.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 512, 512);
                return canvas.toDataURL("image/jpeg", 0.9);
            } finally { URL.revokeObjectURL(objectUrl); }
        } catch { return null; }
    }
    async function downloadPdf() { const pdf = new jsPDF(); const embeddedAvatar = await avatarDataUrl(result.avatarUrl); let y = 18; const write = (text: string, size = 10) => { pdf.setFontSize(size); const lines = pdf.splitTextToSize(text, 175); if (y + lines.length * 6 > 280) { pdf.addPage(); y = 18; } pdf.text(lines, 18, y); y += lines.length * 6; }; write("PrePa | Examination Result", 18); if (embeddedAvatar) pdf.addImage(embeddedAvatar, "JPEG", 164, 18, 28, 28); if (embeddedAvatar) y = 54; write(`Student: ${result.studentName} (${result.studentEmail})`); write(`Subject: ${result.subject} | Class: ${result.classLevel} | Term: ${result.term}`); write(`Submitted: ${new Date(result.submittedAt).toLocaleString()} | Time taken: ${timeTaken} min`); write(`Score: ${result.score} | Percentage: ${result.percentage}% | Grade: ${result.grade} | Status: ${result.passed ? "PASSED" : "FAILED"}`); write(`Correct: ${result.correctAnswers} | Incorrect: ${result.incorrectAnswers}`, 11); y += 5; write("Question Review", 14); result.reviews.forEach((review) => { write(`${review.number}. ${review.isCorrect ? "Correct" : "Incorrect"} | ${review.points} points`); write(`Question: ${review.questionText}`); write(`Your answer: ${review.studentAnswer}`); write(`Correct answer: ${review.correctAnswer}`); write(`Why: ${review.explanation}`); y += 3; }); pdf.save(`prepa-admin-result-${result.attemptId}.pdf`); }
    async function deleteResult() { if (!confirm("Delete this submitted result and its answer data? This cannot be undone.")) return; setBusy(true); const response = await fetch(`/api/admin/results/${result.attemptId}`, { method: "DELETE" }); if (response.ok) router.push("/admin/results"); else { const data = await response.json(); setError(data.error ?? "Unable to delete result."); setBusy(false); } }
    return <section className="admin-results"><div className="section-heading" style={{ display: "flex", alignItems: "center", gap: 16 }}><ProfileAvatar name={result.studentName} url={result.avatarUrl} size={88} /><div><p className="eyebrow">Student result</p><h1>{result.studentName}</h1><p>{result.studentEmail} | {result.classLevel}</p></div></div><div className="notice-row"><span>{result.subject} | {result.term} | Submitted {new Date(result.submittedAt).toLocaleString()}</span><div className="actions"><button className="btn btn-secondary" onClick={downloadPdf}>Download PDF</button><button className="btn btn-secondary" disabled={busy} onClick={deleteResult}>{busy ? "Deleting..." : "Delete result"}</button><Link className="button button-secondary" href="/admin/results">Back</Link></div></div><div className="result-metrics"><div><span>Score</span><strong>{result.score}</strong></div><div><span>Percentage</span><strong>{result.percentage}%</strong></div><div><span>Grade</span><strong>{result.grade}</strong></div><div><span>Status</span><strong>{result.passed ? "Passed" : "Failed"}</strong></div><div><span>Correct</span><strong>{result.correctAnswers}</strong></div><div><span>Incorrect</span><strong>{result.incorrectAnswers}</strong></div><div><span>Time taken</span><strong>{timeTaken} min</strong></div></div><div className="review-list">{result.reviews.map((review) => <article key={review.number} className={`review-card ${review.isCorrect ? "correct" : "wrong"}`}><div className="review-card-head"><span>Question {review.number} | {review.points} points</span><strong>{review.isCorrect ? "Correct" : "Incorrect"}</strong></div><h2>{review.questionText}</h2><p><strong>Your answer:</strong> {review.studentAnswer}</p><p><strong>Correct answer:</strong> {review.correctAnswer}</p><p className="explanation"><strong>Why:</strong> {review.explanation}</p></article>)}</div></section>;
}
