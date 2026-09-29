import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_EXAM_QUESTION_COUNT,
  calculateExamQuestionLimit,
  isEligibleQuestionOptionSet,
} from "./supabase-question-repository";

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

test("subject availability uses the real question pool instead of a hard 40-question gate", () => {
  assert.equal(calculateExamQuestionLimit(0), 0);
  assert.equal(calculateExamQuestionLimit(1), 1);
  assert.equal(calculateExamQuestionLimit(25), 25);
  assert.equal(calculateExamQuestionLimit(80), DEFAULT_EXAM_QUESTION_COUNT);
});
