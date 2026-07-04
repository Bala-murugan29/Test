export type Language = 'c' | 'cpp' | 'python' | 'java';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface StarterCode {
  c: string;
  cpp: string;
  python: string;
  java: string;
}

export interface CodingProblem {
  id: string;
  examId: string;
  order: number;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: TestCase[];
  hiddenTests: TestCase[];
  difficulty: Difficulty;
  marks: number;
  timeLimit: string;
  memoryLimit: string;
  starterCode: StarterCode;
}

export interface TestRunResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  runtime?: string;
  isHidden?: boolean;
}

export interface CodeSubmission {
  problemId: string;
  language: Language;
  code: string;
  passedTests: number;
  totalTests: number;
  score: number;
  verdict: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error' | 'pending';
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  c: 'C',
  cpp: 'C++',
  python: 'Python 3',
  java: 'Java',
};

export const LANGUAGE_MONACO_MAP: Record<Language, string> = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java',
};
