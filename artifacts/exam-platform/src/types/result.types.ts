export interface SubmissionAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  timeTakenMinutes: number;
  submittedAt: string;
  answers: SubmissionAnswer[];
  rank?: number;
  totalStudents?: number;
}