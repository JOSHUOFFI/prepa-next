"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import { safeExamStorage } from "@/services/safe-exam-storage";
import { legacyExamDurationMinutes } from "@/services/legacy-exam-fallback";
import type { SafeExamQuestion, Subject } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";

const levelOrder = ["jss", "sss"] as const;
const levelLabels: Record<(typeof levelOrder)[number], string> = {
  jss: "Junior Secondary",
  sss: "Senior Secondary",
};

const categoryOrder: Record<string, number> = {
  "Core / General": 1,
  Religion: 2,
  "Languages": 3,
  "Trade / Vocational": 4,
  "Core & Compulsory": 5,
  Science: 6,
  "Arts / Humanities": 7,
  Commercial: 8,
};

function getSubjectKey(subject: Subject) {
  return `${subject.educationLevel ?? "unknown"}:${subject.catalogueKey ?? subject.name}`;
}

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
  const [selectedLevel, setSelectedLevel] = useState<(typeof levelOrder)[number]>(
    subjects.some(subject => subject.educationLevel === "jss") ? "jss" : "sss",
  );
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(() => {
    const initialSubject = subjects.find(item => item.id === initialSubjectId) ?? subjects[0];
    return initialSubject ? getSubjectKey(initialSubject) : "";
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const groupedSubjects = useMemo(() => {
    const groups: Record<(typeof levelOrder)[number], Record<string, Subject[]>> = {
      jss: {},
      sss: {},
    };

    for (const subject of subjects) {
      const level = subject.educationLevel && levelOrder.includes(subject.educationLevel) ? subject.educationLevel : "jss";
      const category = subject.category ?? "Catalogue subject";
      groups[level][category] ??= [];
      groups[level][category].push(subject);
    }

    return levelOrder.map(level => ({
      level,
      label: levelLabels[level],
      categories: Object.entries(groups[level] ?? {})
        .sort(([left], [right]) => (categoryOrder[left] ?? 99) - (categoryOrder[right] ?? 99))
        .map(([category, items]) => ({
          category,
          items: [...items].sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" })),
        })),
    }));
  }, [subjects]);

  const selectedSubject =
    subjects.find(subject => getSubjectKey(subject) === selectedSubjectKey) ??
    subjects.find(subject => subject.educationLevel === selectedLevel) ??
    subjects[0] ??
    null;

  async function startExam() {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !selectedSubject) {
      setError("Enter your name and choose a subject before starting.");
      return;
    }

    if (!selectedSubject.isAvailable || !selectedSubject.id) {
      setError("This subject is not currently available for exam. Please choose another subject.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ subjectId: selectedSubject.id || "", subject: selectedSubject.name });
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
      const configuration = { firstName, lastName, subjectId: selectedSubject.id, subject: selectedSubject.name, durationMinutes: legacyExamDurationMinutes };
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

      <div className="form-grid exam-subject-picker">
        <label>
          First name
          <input value={firstName} onChange={event => setFirstName(event.target.value)} />
        </label>
        <label>
          Last name
          <input value={lastName} onChange={event => setLastName(event.target.value)} />
        </label>
      </div>

      <div className="exam-subject-selector">
        <div className="exam-level-tabs" role="tablist" aria-label="Education level">
          {groupedSubjects.map(level => (
            <button
              key={level.level}
              type="button"
              role="tab"
              aria-selected={selectedLevel === level.level}
              className={`exam-level-tab ${selectedLevel === level.level ? "is-active" : ""}`}
              onClick={() => setSelectedLevel(level.level)}
            >
              {level.label}
            </button>
          ))}
        </div>

        <div className="exam-subject-groups">
          {groupedSubjects
            .filter(level => level.level === selectedLevel)
            .map(level => (
              <div key={level.level} className="exam-subject-level">
                <h2>{level.label}</h2>
                {level.categories.map(category => (
                  <div key={`${level.level}-${category.category}`} className="exam-category-block">
                    <h3>{category.category}</h3>
                    <div className="exam-subject-grid">
                      {category.items.map(subject => {
                        const subjectKey = getSubjectKey(subject);
                        const selected = selectedSubjectKey === subjectKey;
                        const availabilityLabel = subject.availabilityLabel ?? (subject.isAvailable ? "Available" : "Coming soon");

                        return (
                          <button
                            key={subjectKey}
                            type="button"
                            className={`exam-subject-card ${selected ? "is-selected" : ""} ${subject.isAvailable ? "is-available" : "is-disabled"}`}
                            disabled={loading || !subject.isAvailable}
                            aria-pressed={selected}
                            onClick={() => setSelectedSubjectKey(subjectKey)}
                          >
                            <span className="exam-subject-name">{subject.name}</span>
                            <span className="exam-subject-meta">{subject.category ?? "Catalogue subject"}</span>
                            <span className={`exam-subject-status ${subject.isAvailable ? "status-available" : "status-disabled"}`}>
                              {availabilityLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      <div className="exam-setup-footer">
        <p>
          {selectedSubject ? `${selectedSubject.name} selected.` : "Choose a subject to continue."}
        </p>
        <button className="btn btn-primary" onClick={startExam} disabled={loading || !selectedSubject || !selectedSubject.isAvailable}>
          {loading ? "Loading questions..." : "Start exam"}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
