"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import { legacyExamDurationMinutes } from "@/services/legacy-exam-fallback";
import type { ExamResult, SafeExamResult } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";
import { jsPDF } from "jspdf";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const subscribeToHydration = () => () => { };
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function ResultSummary() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const result: ExamResult | null = hydrated ? examStorage.getLastResult() : null;

  const safeResult = hydrated && searchParams.get("safe") === "1" ? JSON.parse(sessionStorage.getItem("prepa:exam:safe-result") || "null") as SafeExamResult | null : null;
  const [remoteSafeResult, setRemoteSafeResult] = useState<SafeExamResult | null>(safeResult);
  const [history, setHistory] = useState<{ id: string; subject: string; started_at: string; score: number | null; percentage: number | null; grade: string | null; passed: boolean | null }[]>([]);
  const [loadError, setLoadError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!hydrated || searchParams.get("safe") !== "1") return;
    const attemptId = searchParams.get("attemptId");
    if (!attemptId) return;
    if (remoteSafeResult && "reviews" in remoteSafeResult) return;
    fetch(`/api/exam/results?attemptId=${encodeURIComponent(attemptId)}`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(payload => { if (payload?.result) setRemoteSafeResult(payload.result as SafeExamResult); else setLoadError("This result is unavailable."); });
  }, [hydrated, remoteSafeResult, searchParams]);
  useEffect(() => {
    if (!hydrated || searchParams.get("safe") === "1") return;
    fetch("/api/exam/results", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(payload => setHistory(payload?.history ?? []));
  }, [hydrated, searchParams]);
  useEffect(() => {
    if (!hydrated || searchParams.get("safe") !== "1") return;
    let active = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", data.user.id).maybeSingle();
      if (!active || !profile?.avatar_url) return;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 3600);
      if (active) setAvatarUrl(signed?.signedUrl ?? null);
    });
    return () => { active = false; };
  }, [hydrated, searchParams]);
  if (searchParams.get("safe") === "1" && remoteSafeResult && Array.isArray(remoteSafeResult.reviews)) {
    const result = remoteSafeResult as SafeExamResult & { studentName: string; subject: string; classLevel: string; term: string; correctAnswers: number; incorrectAnswers: number; reviews: { number: number; questionText: string; studentAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string }[] };
    async function avatarDataUrl(url: string | null) {
      if (!url) return null;
      if (url.startsWith("data:image/")) return url;
      try {
        const response = await fetch(url, { mode: "cors" });
        if (!response.ok) return null;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        try {
          const image = new Image();
          image.src = objectUrl;
          await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Unable to load avatar.")); });
          const canvas = document.createElement("canvas");
          const size = Math.min(image.naturalWidth, image.naturalHeight);
          const offsetX = (image.naturalWidth - size) / 2;
          const offsetY = (image.naturalHeight - size) / 2;
          canvas.width = 512;
          canvas.height = 512;
          canvas.getContext("2d")?.drawImage(image, offsetX, offsetY, size, size, 0, 0, 512, 512);
          return canvas.toDataURL("image/jpeg", 0.9);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        return null;
      }
    }
    async function downloadPdf() {
      const pdf = new jsPDF();
      const embeddedAvatar = await avatarDataUrl(avatarUrl);
      let y = 18;
      const write = (text: string, size = 10) => { pdf.setFontSize(size); const lines = pdf.splitTextToSize(text, 175); if (y + lines.length * 6 > 280) { pdf.addPage(); y = 18; } pdf.text(lines, 18, y); y += lines.length * 6; };
      write("PrePa | Examination Result", 18);
      if (embeddedAvatar) pdf.addImage(embeddedAvatar, "JPEG", 164, 18, 28, 28);
      if (embeddedAvatar) y = 54;
      write(`Student: ${result.studentName}`); write(`Subject: ${result.subject}${result.classLevel ? ` | Class: ${result.classLevel}` : ""}${result.term ? ` | Term: ${result.term}` : ""}`); write(`Date: ${new Date(result.submittedAt).toLocaleDateString()} | Score: ${result.score}/${result.totalPoints} | Percentage: ${result.percentage}%`); write(`Grade: ${result.grade} | Status: ${result.passed ? "PASSED" : "FAILED"} | Correct: ${result.correctAnswers} | Incorrect: ${result.incorrectAnswers}`, 11); y += 5; write("Question Review", 14);
      result.reviews.forEach((review) => { write(`${review.number}. ${review.isCorrect ? "Correct" : "Incorrect"}`); write(`Question: ${review.questionText}`); write(`Your answer: ${review.studentAnswer}`); write(`Correct answer: ${review.correctAnswer}`); write(`Why: ${review.explanation}`); y += 3; });
      pdf.save(`prepa-result-${result.attemptId}.pdf`);
    }
    return <section className="results-page"><div className="result-hero"><ProfileIdentity /><div><p className="eyebrow">Examination Result</p><h1>{result.studentName}</h1><p>{result.subject}{result.classLevel ? ` - ${result.classLevel}` : ""}{result.term ? ` - ${result.term}` : ""}</p><p>Submitted {new Date(result.submittedAt).toLocaleString()}</p></div><div className={`score-ring ${result.passed ? "pass" : "fail"}`}><strong>{result.percentage}%</strong><span>{result.grade}</span></div></div><div className="result-metrics"><div><span>Score</span><strong>{result.score}/{result.totalPoints}</strong></div><div><span>Total questions</span><strong>{result.totalQuestions}</strong></div><div><span>Correct</span><strong>{result.correctAnswers}</strong></div><div><span>Incorrect</span><strong>{result.incorrectAnswers}</strong></div><div><span>Status</span><strong>{result.passed ? "PASSED" : "FAILED"}</strong></div><div><span>Time taken</span><strong>{Math.max(0, Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000))} min</strong></div></div><div className="notice-row"><span>{result.performanceMessage}</span><button className="btn btn-secondary" onClick={downloadPdf}>Download Result as PDF</button></div><div className="review-list">{result.reviews.map((review) => <article key={review.number} className={`review-card ${review.isCorrect ? "correct" : "wrong"}`}><div className="review-card-head"><span>Question {review.number}</span><strong>{review.isCorrect ? "✅ Correct" : "❌ Incorrect"}</strong></div><h2>{review.questionText}</h2><p><strong>Your answer:</strong> {review.studentAnswer}</p><p><strong>Correct answer:</strong> {review.correctAnswer}</p><p className="explanation"><strong>Why:</strong> {review.explanation}</p></article>)}</div></section>;
  }

  if (searchParams.get("safe") === "1") return <section className="results-empty"><h1>{loadError || "Loading result..."}</h1></section>;

  if (!result) {
    return (
      <section className="results-page">
        <h1>No result available</h1>
        <p>Complete an examination first, then your score and review will appear here.</p>
        <button className="btn btn-primary" onClick={() => router.push("/exam")}>Go to exam</button>
        <section className="card"><h2>Result history</h2>{history.length === 0 ? <p className="muted">No submitted results yet.</p> : history.map((item) => <p key={item.id}><strong>{item.subject}</strong> - {new Date(item.started_at).toLocaleDateString()} - {item.score ?? 0} points - {item.percentage ?? 0}% ({item.grade ?? "-"}) - {item.passed ? "Passed" : "Failed"} <a href={`/results?safe=1&attemptId=${item.id}`}>View result</a></p>)}</section>
      </section>
    );
  }

  const wrongReviews = result.reviews.filter(review => !review.isCorrect);

  function retryWrong() {
    if (!result || wrongReviews.length === 0) return;
    examStorage.createExam(
      {
        ...result.configuration,
        durationMinutes: legacyExamDurationMinutes,
        isRetry: true
      },
      wrongReviews.map(review => review.question)
    );
    router.push("/exam/take");
  }

  return (
    <section className="results-page">
      <div className="result-hero">
        <ProfileIdentity />
        <div>
          <p className="eyebrow">Examination Result</p>
          <h1>{result.student.name}</h1>
          <p>{result.configuration.subject} - {result.configuration.classLevel} - {result.configuration.term}</p>
        </div>
        <div className={`score-ring ${result.passed ? "pass" : "fail"}`}>
          <strong>{result.percentage}%</strong>
          <span>{result.grade}</span>
        </div>
      </div>

      <div className="result-metrics">
        <div><span>Score</span><strong>{result.score}/{result.totalPoints}</strong></div>
        <div><span>Total questions</span><strong>{result.totalQuestions}</strong></div>
        <div><span>Correct</span><strong>{result.correctAnswers}</strong></div>
        <div><span>Incorrect</span><strong>{result.incorrectAnswers}</strong></div>
        <div><span>Status</span><strong>{result.passed ? "Pass" : "Fail"}</strong></div>
      </div>

      <div className="notice-row">
        <span>{result.performanceMessage} - {result.percentage}% - {result.passed ? "PASS" : "FAIL"}</span>
        <button className="btn btn-secondary" disabled={wrongReviews.length === 0} onClick={retryWrong}>
          Retry wrong questions
        </button>
      </div>

      <div className="review-list">
        {result.reviews.map((review, index) => (
          <article key={review.question.examQuestionId} className={`review-card ${review.isCorrect ? "correct" : "wrong"}`}>
            <div className="review-card-head">
              <span>Question {index + 1}</span>
              <strong>{review.isCorrect ? "Correct" : "Incorrect"}</strong>
            </div>
            <h2>{review.question.questionText}</h2>
            <p><strong>Your answer:</strong> {review.selectedAnswer || "Not Answered"}</p>
            <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
            {review.explanation ? <p className="explanation">{review.explanation}</p> : null}
          </article>
        ))}
      </div>
      <section className="card"><h2>Result history</h2>{history.length === 0 ? <p className="muted">No submitted results yet.</p> : history.map((item) => <p key={item.id}><strong>{item.subject}</strong> - {new Date(item.started_at).toLocaleDateString()} - {item.percentage ?? 0}% ({item.grade ?? "-"}) - {item.passed ? "Passed" : "Failed"} <a href={`/results?safe=1&attemptId=${item.id}`}>View result</a></p>)}</section>
    </section>
  );
}
