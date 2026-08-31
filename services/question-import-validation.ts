export type QuestionImportInput = {
  subject: string;
  className?: string;
  termName?: string;
  topic?: string;
  questionText: string;
  options: { label: string; text: string }[];
  correctOption: string;
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "multiple_choice" | "true_false" | "short_answer";
  points?: number | string;
  explanation?: string;
};

export function validateQuestionImport(input: QuestionImportInput): string[] {
  const errors: string[] = [];
  if (!input.subject.trim()) errors.push("Subject is required.");
  if (!input.questionText.trim()) errors.push("Question text is required.");
  if (
    !input.questionType ||
    !["multiple_choice", "true_false", "short_answer"].includes(
      input.questionType,
    )
  )
    errors.push("Question type is invalid.");
  if (input.questionType === "multiple_choice") {
    if (input.options.length < 2 || input.options.length > 6)
      errors.push("Multiple-choice questions require 2 to 6 options.");
    if (input.options.some((option) => !option.text.trim()))
      errors.push("Option values cannot be empty.");
    if (
      new Set(input.options.map((option) => option.text.trim().toLowerCase()))
        .size !== input.options.length
    )
      errors.push("Option values are duplicated.");
    if (!input.options.some((option) => option.label === input.correctOption))
      errors.push("Correct option must match an option label.");
  }
  if (
    input.questionType === "true_false" &&
    !["True", "False"].includes(input.correctOption)
  )
    errors.push(
      "True/false questions require True or False as the correct option.",
    );
  if (
    input.points !== undefined &&
    (!Number.isFinite(Number(input.points)) || Number(input.points) <= 0)
  )
    errors.push("Points must be a positive number.");
  if (input.questionType === "short_answer" && !input.correctOption.trim())
    errors.push("A correct answer is required for short-answer questions.");
  return errors;
}

export function normalizeQuestionText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
