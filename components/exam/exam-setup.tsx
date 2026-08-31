"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import { safeExamStorage } from "@/services/safe-exam-storage";
import { legacyExamDurationMinutes } from "@/services/legacy-exam-fallback";
import type { Class, ClassLevel, SafeExamQuestion, Subject, Term } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";

export function ExamSetup({
  profile,
  classOptions,
  termOptions,
  subjects,
}: {
  profile: { fullName: string; classLevel?: ClassLevel };
  classOptions: Class[];
  termOptions: Term[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const activeExam = examStorage.getActiveExam();
  const safeActiveExam = safeExamStorage.getActiveExam();
  const nameParts = profile.fullName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel ?? classOptions[0].value);
  const [term, setTerm] = useState<Term>(termOptions[0]);
  const [subject, setSubject] = useState(subjects[0]?.name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startExam() {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !classLevel || !term || !subject) {
      setError("Enter your name and choose a class, term, and subject before starting.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/exam/questions?subject=${encodeURIComponent(subject)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Safe question route failed");
      const payload = await response.json() as { questions?: SafeExamQuestion[] };
      if (!payload.questions?.length || payload.questions.some(question => question.options.length === 0)) throw new Error("No safe question pool");
      const questions = payload.questions.slice(0, 40);
      const remoteAttempt = await safeExamStorage.createRemoteAttempt({ firstName, lastName, classLevel, term, subject, durationMinutes: legacyExamDurationMinutes }, questions);
      safeExamStorage.createExam({ firstName, lastName, classLevel, term, subject, durationMinutes: legacyExamDurationMinutes }, questions, remoteAttempt.attemptId, remoteAttempt.startedAt, remoteAttempt.expiresAt);
    } catch {
      setError("We could not start the SAFE exam. Please try again.");
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
        <p>Select your details and subject. The exam uses a randomized 40-question subject pool.</p>
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
        <label>
          Class
          <select value={classLevel} onChange={event => setClassLevel(event.target.value as ClassLevel)}>
            {classOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Term
          <select value={term} onChange={event => setTerm(event.target.value as Term)}>
            {termOptions.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="wide">
          Subject
          <select value={subject} onChange={event => setSubject(event.target.value)}>
            {subjects.map(item => (
              <option key={item.name} value={item.name}>
                {item.name} ({item.questionCount})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="exam-setup-footer">
        <p>Up to 40 questions are available for this subject.</p>
        <button className="btn btn-primary" onClick={startExam} disabled={loading}>{loading ? "Loading questions..." : "Start exam"}</button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
