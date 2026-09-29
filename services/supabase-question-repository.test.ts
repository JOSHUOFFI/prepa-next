import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXAM_QUESTION_COUNT,
  calculateExamQuestionLimit,
  isEligibleQuestionOptionSet,
  normalizeExamQuestionText,
} from "./supabase-question-repository";
import { isPlayableExamQuestionCount, MIN_PLAYABLE_EXAM_QUESTIONS } from "./exam-readiness";

test("malformed questions are never considered eligible", () => {
  const validOptions = [
    { option_text: "A", is_correct: true },
    { option_text: "B", is_correct: false },
    { option_text: "C", is_correct: false },
    { option_text: "D", is_correct: false },
  ];

  assert.equal(isEligibleQuestionOptionSet(validOptions), true);
  assert.equal(
    isEligibleQuestionOptionSet([
      { option_text: "A", is_correct: true },
      { option_text: "B", is_correct: false },
      { option_text: "C", is_correct: false },
    ]),
    false,
  );
  assert.equal(
    isEligibleQuestionOptionSet([
      { option_text: "A", is_correct: true },
      { option_text: "B", is_correct: false },
      { option_text: "C", is_correct: false },
      { option_text: "D", is_correct: true },
    ]),
    false,
  );
});

test("subject availability requires 40 eligible questions and caps exams at 40", () => {
  assert.equal(calculateExamQuestionLimit(0), 0);
  assert.equal(calculateExamQuestionLimit(1), 1);
  assert.equal(calculateExamQuestionLimit(25), 25);
  assert.equal(calculateExamQuestionLimit(80), DEFAULT_EXAM_QUESTION_COUNT);
  assert.equal(MIN_PLAYABLE_EXAM_QUESTIONS, 40);
  assert.equal(isPlayableExamQuestionCount(39), false);
  assert.equal(isPlayableExamQuestionCount(40), true);
  assert.equal(isPlayableExamQuestionCount(200), true);
  assert.equal(normalizeExamQuestionText("  A   sample question?  "), "a sample question?");
});
