import type { ExamResult, ExamState, QuestionReview } from "@/types";

const gradeScale = [
  { min: 80, grade: "A+", message: "Outstanding performance" },
  { min: 70, grade: "A", message: "Excellent work" },
  { min: 60, grade: "B", message: "Very good job" },
  { min: 50, grade: "C", message: "Good effort" },
  { min: 40, grade: "D", message: "Pass" },
  { min: 0, grade: "F", message: "Needs improvement" }
];

export function calculateExamResult(state: ExamState): ExamResult {
  const reviews: QuestionReview[] = state.questions.map(question => {
    const answer = state.answers[question.id];
    const selectedOption = question.options.find(option => option.id === answer?.optionId);
    const isCorrect = answer?.optionId === question.correctOptionId;

    return {
      question,
      selectedOptionId: answer?.optionId,
      selectedAnswer: selectedOption?.text,
      correctOptionId: question.correctOptionId,
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      pointsAvailable: question.points,
      explanation: question.explanation
    };
  });

  const score = reviews.reduce((total, review) => total + review.pointsEarned, 0);
  const totalPoints = reviews.reduce((total, review) => total + review.pointsAvailable, 0);
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const gradeInfo = gradeScale.find(item => percentage >= item.min) || gradeScale[gradeScale.length - 1];

  return {
    id: `result-${Date.now()}`,
    attemptId: state.id,
    student: state.student,
    configuration: state.configuration,
    score,
    totalPoints,
    percentage,
    grade: gradeInfo.grade,
    performanceMessage: gradeInfo.message,
    passed: percentage >= 50,
    totalQuestions: state.questions.length,
    correctAnswers: reviews.filter(review => review.isCorrect).length,
    incorrectAnswers: reviews.filter(review => !review.isCorrect).length,
    reviews,
    completedAt: new Date().toISOString()
  };
}
