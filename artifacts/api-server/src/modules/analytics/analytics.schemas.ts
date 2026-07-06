import { z } from "zod";

const summaryResponseSchema = z.object({
  totalStudents: z.number(),
  totalFaculty: z.number(),
  totalExams: z.number(),
  avgPassRate: z.number(),
  activeExams: z.number(),
  examsConductedThisMonth: z.number(),
});

const departmentStatsItemSchema = z.object({
  departmentId: z.string(),
  departmentName: z.string(),
  totalStudents: z.number(),
  avgScore: z.number(),
  passRate: z.number(),
});

const examPerformanceItemSchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
  avgScore: z.number(),
  passRate: z.number(),
  totalAppeared: z.number(),
});

const monthlyStatsItemSchema = z.object({
  month: z.string(),
  examsCreated: z.number(),
  studentsAppeared: z.number(),
  avgScore: z.number(),
});

const studentPerformanceItemSchema = z.object({
  examId: z.string(),
  examTitle: z.string(),
  score: z.number(),
  maxScore: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  takenAt: z.string().datetime(),
});

const studentPerformanceSchema = z.object({
  totalExamsTaken: z.number(),
  avgScore: z.number(),
  bestScore: z.number(),
  passRate: z.number(),
  recentResults: z.array(studentPerformanceItemSchema),
});

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
export type DepartmentStatsItem = z.infer<typeof departmentStatsItemSchema>;
export type ExamPerformanceItem = z.infer<typeof examPerformanceItemSchema>;
export type MonthlyStatsItem = z.infer<typeof monthlyStatsItemSchema>;
export type StudentPerformanceItem = z.infer<typeof studentPerformanceItemSchema>;
export type StudentPerformance = z.infer<typeof studentPerformanceSchema>;

export {
  summaryResponseSchema,
  departmentStatsItemSchema,
  examPerformanceItemSchema,
  monthlyStatsItemSchema,
  studentPerformanceItemSchema,
  studentPerformanceSchema,
};
