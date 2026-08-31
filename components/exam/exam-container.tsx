"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { examStorage } from "@/services/exam-storage";
import type { ExamQuestion, ExamState, SafeExamQuestion, SafeExamState } from "@/types";
import { ProfileIdentity } from "@/components/profile/profile-identity";
import { safeExamStorage } from "@/services/safe-exam-storage";

type ExamDisplayQuestion = ExamQuestion | SafeExamQuestion;
type ExamDisplayState = ExamState | SafeExamState;

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

const subscribeToHydration = () => () => { };
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function ExamTimer({ remainingSeconds }: { remainingSeconds: number }) {
  return <div className="exam-timer" aria-live="polite">{formatTime(remainingSeconds)}</div>;
}

function AnswerOption({
  option,
  selected,
  onSelect
}: {
  option: ExamDisplayQuestion["options"][number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={`answer-option${selected ? " selected" : ""}`} onClick={onSelect}>
      <span className="radio-dot" />
      <span>{option.text}</span>
    </button>
  );
}

function QuestionCard({
  question,
  questionNumber,
  selectedOptionId,
  onAnswer
}: {
  question: ExamDisplayQuestion;
  questionNumber: number;
  selectedOptionId?: string;
  onAnswer: (optionId: string) => void;
}) {
  return (
    <article className="question-card">
      <p className="question-number">Question {questionNumber}</p>
      <h2>{"questionText" in question ? question.questionText : question.text}</h2>
      <div className="answer-list">
        {question.options.map(option => (
          <AnswerOption
            key={option.id}
            option={option}
            selected={selectedOptionId === option.id}
            onSelect={() => onAnswer(option.id)}
          />
        ))}
      </div>
    </article>
  );
}

function QuestionPalette({
  state,
  onJump
}: {
  state: ExamDisplayState;
  onJump: (index: number) => void;
}) {
  return (
    <aside className="question-palette" aria-label="Question palette">
      {state.questions.map((question, index) => {
        const answered = Boolean(state.answers[question.id]);
        const active = state.currentQuestionIndex === index;
        return (
          <button
            key={question.id}
            className={`${active ? "active" : ""} ${answered ? "answered" : ""}`}
            onClick={() => onJump(index)}
            aria-label={`Go to question ${index + 1}`}
          >
            {index + 1}
          </button>
        );
      })}
    </aside>
  );
}

function SubmitExamModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="submit-modal">
        <h2 id="submit-title">Submit examination?</h2>
        <p>This will end the exam and calculate your result.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Keep writing</button>
          <button className="btn btn-primary" onClick={onConfirm}>Submit now</button>
        </div>
      </div>
    </div>
  );
}

export function ExamContainer() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const [localState, setLocalState] = useState<ExamDisplayState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const submittedRef = useRef(false);
  const storedState = useMemo<ExamDisplayState | null>(
    () => hydrated ? examStorage.getActiveExam() : null,
    [hydrated]
  );
  const safeStoredState = useMemo(
    () => hydrated ? safeExamStorage.getActiveExam() : null,
    [hydrated]
  );
  const state = localState ?? safeStoredState ?? storedState;

  useEffect(() => {
    if (!hydrated || state) return;
    void safeExamStorage.recoverRemoteExam().then(recovered => {
      if (recovered) setLocalState(recovered);
    });
  }, [hydrated, state]);

  useEffect(() => {
    if (hydrated && !state) {
      router.replace("/exam");
    }
  }, [hydrated, router, state]);

  const submitExam = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (state && "questions" in state && state.questions.length > 0 && !("correctOptionId" in state.questions[0])) {
      void safeExamStorage.submitRemoteExam(state.id).then(result => {
        safeExamStorage.clearActiveExam();
        sessionStorage.setItem("prepa:exam:safe-result", JSON.stringify(result));
        router.replace(`/results?safe=1&attemptId=${encodeURIComponent(state.id)}`);
      }).catch(() => {
        submittedRef.current = false;
      });
      return;
    }
    const result = examStorage.submitExam();
    if (result) router.replace("/results");
  }, [router, state]);

  useEffect(() => {
    if (!state) return undefined;
    const activeState = state;

    function syncRemaining() {
      const seconds = Math.max(0, Math.ceil((new Date(activeState.endsAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds <= 0) submitExam();
    }

    syncRemaining();
    const timer = window.setInterval(syncRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [state, submitExam]);

  useEffect(() => {
    if (!state) return undefined;
    const prevent = (event: Event) => event.preventDefault();
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
    };
  }, [state]);

  const currentQuestion = state?.questions[state.currentQuestionIndex];
  const answeredCount = useMemo(() => state ? Object.keys(state.answers).length : 0, [state]);

  if (!state || !currentQuestion) {
    return <section className="exam-loading">Loading exam...</section>;
  }

  function updateState(nextState: ExamDisplayState | null) {
    if (nextState) setLocalState(nextState);
  }

  function answer(optionId: string) {
    const question = currentQuestion;
    if (!question) return;
    updateState("questionText" in question
      ? examStorage.updateAnswer(question.id, optionId)
      : safeExamStorage.updateAnswer(question.id, optionId));
    if (!("questionText" in question)) {
      void safeExamStorage.saveRemoteAnswer(state!.id, question.id, optionId).catch(() => undefined);
    }
  }

  function jump(index: number) {
    const question = currentQuestion;
    if (!question) return;
    updateState("questionText" in question
      ? examStorage.updateCurrentQuestion(index)
      : safeExamStorage.updateCurrentQuestion(index));
  }

  return (
    <section className="exam-workspace">
      <header className="exam-topbar">
        <ProfileIdentity />
        <div>
          <p className="eyebrow">{state.configuration.isRetry ? "Retry examination" : "Live examination"}</p>
          <h1>{state.configuration.subject}</h1>
          <p>{state.student.name} - {state.configuration.classLevel} - {state.configuration.term}</p>
        </div>
        <ExamTimer remainingSeconds={remainingSeconds} />
      </header>

      <div className="exam-grid">
        <div>
          <div className="exam-progress">
            <span>{answeredCount}/{state.questions.length} answered</span>
            <span>Question {state.currentQuestionIndex + 1} of {state.questions.length}</span>
          </div>
          <QuestionCard
            question={currentQuestion}
            questionNumber={state.currentQuestionIndex + 1}
            selectedOptionId={state.answers[currentQuestion.id]?.optionId}
            onAnswer={answer}
          />
          <div className="exam-navigation">
            <button className="btn btn-secondary" disabled={state.currentQuestionIndex === 0} onClick={() => jump(state.currentQuestionIndex - 1)}>
              Previous
            </button>
            <button className="btn btn-secondary" disabled={state.currentQuestionIndex === state.questions.length - 1} onClick={() => jump(state.currentQuestionIndex + 1)}>
              Next
            </button>
            <button className="btn btn-primary" onClick={() => setShowSubmit(true)}>Submit</button>
          </div>
        </div>
        <QuestionPalette state={state} onJump={jump} />
      </div>

      {showSubmit ? <SubmitExamModal onCancel={() => setShowSubmit(false)} onConfirm={submitExam} /> : null}
    </section>
  );
}
