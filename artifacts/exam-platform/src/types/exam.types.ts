export type ExamStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled' | 'missed';
export type QuestionType = 'mcq' | 'true_false' | 'coding';

export interface ExamOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options: ExamOption[];
  correctOptionId: string;
  marks: number;
  negativeMarks: number;
  coding?: {
    starterCode?: string;
    testCases: { input: string; expectedOutput: string; isHidden?: boolean }[];
    sampleInput?: string;
    sampleOutput?: string;
  };
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  department: string;
  facultyId: string;
  facultyName: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  totalQuestions: number;
  status: ExamStatus;
  scheduledAt: string;
  endsAt: string;
  instructions: string[];
  allowedAttempts: number;
}

export interface StudentExam extends Exam {
  attemptsMade: number;
  lastScore?: number;
  isPassed?: boolean;
}