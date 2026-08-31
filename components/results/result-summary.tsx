"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import { legacyExamDurationMinutes } from "@/services/legacy-exam-fallback";
import type { ExamResult, SafeExamResult } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";

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
  useEffect(() => {
    if (!hydrated || searchParams.get("safe") !== "1" || remoteSafeResult) return;
    const attemptId = searchParams.get("attemptId");
    if (!attemptId) return;
    fetch(`/api/exam/results?attemptId=${encodeURIComponent(attemptId)}`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(payload => { if (payload?.result) setRemoteSafeResult(payload.result as SafeExamResult); });
  }, [hydrated, remoteSafeResult, searchParams]);
  if (searchParams.get("safe") === "1" && remoteSafeResult) {
    return <section className="results-empty"><ProfileIdentity /><h1>Examination result</h1><p>{remoteSafeResult.performanceMessage}</p><div className="result-metrics"><div><span>Score</span><strong>{remoteSafeResult.score}/{remoteSafeResult.totalPoints || "-"}</strong></div><div><span>Percentage</span><strong>{remoteSafeResult.percentage}%</strong></div><div><span>Grade</span><strong>{remoteSafeResult.grade}</strong></div><div><span>Status</span><strong>{remoteSafeResult.status === "expired" ? "Expired" : remoteSafeResult.passed ? "Pass" : "Fail"}</strong></div></div><button className="btn btn-primary" onClick={() => router.push("/exam")}>Back to exam setup</button></section>;
  }

  if (!result) {
    return (
      <section className="results-empty">
        <h1>No result available</h1>
        <p>Complete an examination first, then your score and review will appear here.</p>
        <button className="btn btn-primary" onClick={() => router.push("/exam")}>Go to exam</button>
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
    </section>
  );
}
