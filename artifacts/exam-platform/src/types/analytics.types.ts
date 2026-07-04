export interface DepartmentStats {
  department: string;
  totalStudents: number;
  avgScore: number;
  passRate: number;
}

export interface MonthlyStats {
  month: string;
  examsCreated: number;
  studentsAppeared: number;
  avgScore: number;
}

export interface ExamPerformance {
  examTitle: string;
  avgScore: number;
  passRate: number;
  totalAppeared: number;
}