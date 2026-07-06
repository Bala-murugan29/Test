import { z } from "zod";

const exportQuerySchema = z.object({
  format: z.enum(["csv"]).default("csv"),
});

const scoreDistributionItemSchema = z.object({
  range: z.string(),
  count: z.number(),
});

const questionAnalysisItemSchema = z.object({
  questionId: z.string().uuid(),
  title: z.string(),
  type: z.string(),
  totalAttempts: z.number(),
  correctAttempts: z.number(),
  avgMarks: z.number(),
  maxMarks: z.number(),
  correctRate: z.number(),
});

const examReportResponseSchema = z.object({
  examId: z.string().uuid(),
  examTitle: z.string(),
  totalStudents: z.number(),
  appeared: z.number(),
  passed: z.number(),
  avgScore: z.number(),
  medianScore: z.number(),
  passRate: z.number(),
  scoreDistribution: z.array(scoreDistributionItemSchema),
  questionWiseAnalysis: z.array(questionAnalysisItemSchema),
});

const studentResultItemSchema = z.object({
  examId: z.string().uuid(),
  examTitle: z.string(),
  obtainedMarks: z.number(),
  maxMarks: z.number(),
  percentage: z.number(),
  passed: z.boolean(),
  grade: z.string().nullable(),
  attemptedAt: z.string().datetime(),
});

const studentReportResponseSchema = z.object({
  studentUserId: z.string().uuid(),
  studentName: z.string(),
  totalExamsTaken: z.number(),
  avgScore: z.number(),
  passRate: z.number(),
  results: z.array(studentResultItemSchema),
});

const departmentReportResponseSchema = z.object({
  departmentId: z.string().uuid(),
  departmentName: z.string(),
  totalStudents: z.number(),
  totalFaculty: z.number(),
  totalCourses: z.number(),
  avgScore: z.number(),
  passRate: z.number(),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;
export type ExamReportResponse = z.infer<typeof examReportResponseSchema>;
export type StudentReportResponse = z.infer<typeof studentReportResponseSchema>;
export type DepartmentReportResponse = z.infer<typeof departmentReportResponseSchema>;

export {
  exportQuerySchema,
  examReportResponseSchema,
  studentReportResponseSchema,
  departmentReportResponseSchema,
  scoreDistributionItemSchema,
  questionAnalysisItemSchema,
  studentResultItemSchema,
};
