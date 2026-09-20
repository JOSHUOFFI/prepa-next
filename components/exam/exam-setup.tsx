"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import { safeExamStorage } from "@/services/safe-exam-storage";
import { legacyExamDurationMinutes } from "@/services/legacy-exam-fallback";
import type { SafeExamQuestion, Subject } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";

export function ExamSetup({
  profile,
  initialSubjectId,
  subjects,
}: {
  profile: { fullName: string };
  initialSubjectId?: string;
  subjects: Subject[];
}) {
  const router = useRouter();
  const activeExam = examStorage.getActiveExam();
  const safeActiveExam = safeExamStorage.getActiveExam();
  const nameParts = profile.fullName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const initialSubject = subjects.find(item => item.id === initialSubjectId) ?? subjects[0];
  const [subject, setSubject] = useState(initialSubject?.name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedSubject = subjects.find(item => item.name === subject);

  async function startExam() {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !selectedSubject) {
      setError("Enter your name and choose a subject before starting.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: selectedSubject.id || "", subject });
      const response = await fetch(`/api/exam/questions?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as { code?: string; questions?: SafeExamQuestion[] };
      if (response.status === 422 && payload.code === "EXAM_UNAVAILABLE") {
        setError("No questions are currently available for this subject. Please try another subject.");
        setLoading(false);
        return;
      }
      if (response.status === 422 && payload.code === "EXAM_INSUFFICIENT_QUESTIONS") {
        setError("There are not enough questions currently available for this subject. Please try another subject.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("Safe question route failed");
      if (!payload.questions?.length) throw new Error("No safe question pool");
      const questions = payload.questions.slice(0, 40);
      const configuration = { firstName, lastName, subjectId: selectedSubject.id, subject, durationMinutes: legacyExamDurationMinutes };
      const remoteAttempt = await safeExamStorage.createRemoteAttempt(configuration, questions);
      safeExamStorage.createExam(configuration, questions, remoteAttempt.attemptId, remoteAttempt.startedAt, remoteAttempt.expiresAt);
    } catch {
      setError("We could not start the SAFE exam. Check internet connection and try again.");
      setLoading(false);
      return;
    }
    router.push("/exam/take");
  }

  return (
    <section className="exam-setup">
      <ProfileIdentity />
      <div className="section-heading">
        <p className="eyebrow">Computer Based Test</p>
        <h1>Start an examination</h1>
        <p>Choose a subject. The exam uses a randomized 40-question subject pool.</p>
      </div>

      {activeExam || safeActiveExam ? (
        <div className="notice-row">
          <span>An unfinished {(activeExam ?? safeActiveExam)!.configuration.subject} exam is available.</span>
          <button className="btn btn-secondary" onClick={() => router.push("/exam/take")}>Continue</button>
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          First name
          <input value={firstName} onChange={event => setFirstName(event.target.value)} />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={event => setLastName(event.target.value)} />
        </label>
        <label className="wide">
          Subject
          <select value={subject} onChange={event => setSubject(event.target.value)}>
            {subjects.map(item => (
              <option key={item.id || item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="exam-setup-footer">
        <p>Up to 40 questions will be selected from the subject pool.</p>
        <button className="btn btn-primary" onClick={startExam} disabled={loading}>{loading ? "Loading questions..." : "Start exam"}</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
