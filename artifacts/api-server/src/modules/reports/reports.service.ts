import type { FastifyInstance } from "fastify";
import * as reportsRepo from "./reports.repository";
import { HttpError } from "../../shared/errors/http-error";

type SessionWithResult = {
  id: string;
  status: string;
  student: {
    user: { fullName: string };
  };
  result: {
    obtainedMarks: number;
    maxMarks: number;
    percentage: number;
    passed: boolean;
    grade: string | null;
    evaluatedAt: Date;
  } | null;
  answers: Array<{
    questionId: string;
    isCorrect: boolean | null;
    marksAwarded: number | null;
    question: { title: string; type: string; marks: number };
  }>;
};

type ExamWithSessions = {
  id: string;
  title: string;
  totalMarks: number;
  passMarks: number;
  questions: Array<{
    questionId: string;
    question: { title: string; type: string; marks: number };
    negativeMarks: number;
  }>;
  sessions: SessionWithResult[];
};

type StudentProfileWithSessions = {
  userId: string;
  user: { fullName: string };
  examSessions: Array<{
    exam: { id: string; title: string; totalMarks: number };
    result: {
      obtainedMarks: number;
      maxMarks: number;
      percentage: number;
      passed: boolean;
      grade: string | null;
      evaluatedAt: Date;
    } | null;
  }>;
};

type DepartmentWithCounts = {
  id: string;
  name: string;
  students: unknown[];
  faculty: unknown[];
  courses: unknown[];
};

export async function generateExamReport(app: FastifyInstance, examId: string) {
  const exam = await reportsRepo.getExamReport(app, examId) as ExamWithSessions | null;
  if (!exam) {
    throw new HttpError(404, "Exam not found");
  }

  const evaluatedSessions = exam.sessions.filter(
    (s: SessionWithResult) => s.result !== null,
  );
  const totalStudents = exam.sessions.length;
  const appeared = evaluatedSessions.length;
  const passed = evaluatedSessions.filter(
    (s: SessionWithResult) => s.result!.passed,
  ).length;

  const scores = evaluatedSessions.map(
    (s: SessionWithResult) => s.result!.percentage,
  );
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100) / 100
      : 0;
  const medianScore = calculateMedian(scores);
  const passRate =
    appeared > 0 ? Math.round((passed / appeared) * 10000) / 100 : 0;

  const scoreDistribution = calculateScoreDistribution(scores);
  const questionWiseAnalysis = calculateQuestionAnalysis(
    exam.questions,
    evaluatedSessions,
  );

  return {
    examId: exam.id,
    examTitle: exam.title,
    totalStudents,
    appeared,
    passed,
    avgScore,
    medianScore,
    passRate,
    scoreDistribution,
    questionWiseAnalysis,
  };
}

export async function generateStudentReport(
  app: FastifyInstance,
  studentUserId: string,
) {
  const profile = (await reportsRepo.getStudentReport(
    app,
    studentUserId,
  )) as StudentProfileWithSessions | null;
  if (!profile) {
    throw new HttpError(404, "Student not found");
  }

  const evaluatedSessions = profile.examSessions.filter(
    (s) => s.result !== null,
  );
  const totalExamsTaken = evaluatedSessions.length;

  const percentages = evaluatedSessions.map(
    (s) => s.result!.percentage,
  );
  const avgScore =
    percentages.length > 0
      ? Math.round(
          (percentages.reduce((a: number, b: number) => a + b, 0) /
            percentages.length) *
            100,
        ) / 100
      : 0;

  const passedCount = evaluatedSessions.filter(
    (s) => s.result!.passed,
  ).length;
  const passRate =
    totalExamsTaken > 0
      ? Math.round((passedCount / totalExamsTaken) * 10000) / 100
      : 0;

  const results = evaluatedSessions.map((s) => ({
    examId: s.exam.id,
    examTitle: s.exam.title,
    obtainedMarks: s.result!.obtainedMarks,
    maxMarks: s.result!.maxMarks,
    percentage: s.result!.percentage,
    passed: s.result!.passed,
    grade: s.result!.grade,
    attemptedAt: s.result!.evaluatedAt.toISOString(),
  }));

  return {
    studentUserId: profile.userId,
    studentName: profile.user.fullName,
    totalExamsTaken,
    avgScore,
    passRate,
    results,
  };
}

export async function generateDepartmentReport(
  app: FastifyInstance,
  departmentId: string,
) {
  const department = (await reportsRepo.getDepartmentReport(
    app,
    departmentId,
  )) as DepartmentWithCounts | null;
  if (!department) {
    throw new HttpError(404, "Department not found");
  }

  const totalStudents = department.students.length;
  const totalFaculty = department.faculty.length;
  const totalCourses = department.courses.length;

  const studentIds = department.students.map(
    (s: { userId: string }) => s.userId,
  );

  let avgScore = 0;
  let passRate = 0;

  if (studentIds.length > 0) {
    const results = await app.prisma.examSession.findMany({
      where: {
        studentUserId: { in: studentIds },
        result: { isNot: null },
      },
      include: { result: true },
    });

    type SessionWithNullableResult = { result: { percentage: number; passed: boolean } | null };

    const percentages = results
      .map((r: SessionWithNullableResult) => r.result?.percentage ?? 0)
      .filter((p: number) => p > 0);
    avgScore =
      percentages.length > 0
        ? Math.round(
            (percentages.reduce((a: number, b: number) => a + b, 0) /
              percentages.length) *
              100,
          ) / 100
        : 0;

    const passedCount = results.filter((r: SessionWithNullableResult) => r.result?.passed).length;
    passRate =
      results.length > 0
        ? Math.round((passedCount / results.length) * 10000) / 100
        : 0;
  }

  return {
    departmentId: department.id,
    departmentName: department.name,
    totalStudents,
    totalFaculty,
    totalCourses,
    avgScore,
    passRate,
  };
}

export async function exportToCsv(
  data: Array<Record<string, unknown>>,
  headers: string[],
): Promise<string> {
  const escapeField = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => escapeField(row[h])).join(","),
    ),
  ];

  return lines.join("\n");
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a: number, b: number) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return sorted[mid];
}

function calculateScoreDistribution(
  scores: number[],
): Array<{ range: string; count: number }> {
  const ranges = [
    { min: 0, max: 20, label: "0-20%" },
    { min: 20, max: 40, label: "20-40%" },
    { min: 40, max: 60, label: "40-60%" },
    { min: 60, max: 80, label: "60-80%" },
    { min: 80, max: 100, label: "80-100%" },
  ];

  return ranges.map((r) => ({
    range: r.label,
    count: scores.filter(
      (s) => s >= r.min && s < r.max,
    ).length,
  }));
}

function calculateQuestionAnalysis(
  questions: ExamWithSessions["questions"],
  sessions: SessionWithResult[],
): Array<{
  questionId: string;
  title: string;
  type: string;
  totalAttempts: number;
  correctAttempts: number;
  avgMarks: number;
  maxMarks: number;
  correctRate: number;
}> {
  return questions.map((eq) => {
    const questionAnswers = sessions.flatMap((s) =>
      s.answers.filter((a) => a.questionId === eq.questionId),
    );
    const totalAttempts = questionAnswers.length;
    const correctAttempts = questionAnswers.filter(
      (a) => a.isCorrect === true,
    ).length;

    const marksList = questionAnswers
      .map((a) => a.marksAwarded ?? 0)
      .filter((m): m is number => m !== null);
    const avgMarks =
      marksList.length > 0
        ? Math.round(
            (marksList.reduce((a: number, b: number) => a + b, 0) /
              marksList.length) *
              100,
          ) / 100
        : 0;

    const maxMarks = eq.question.marks;
    const correctRate =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 10000) / 100
        : 0;

    return {
      questionId: eq.questionId,
      title: eq.question.title,
      type: eq.question.type,
      totalAttempts,
      correctAttempts,
      avgMarks,
      maxMarks,
      correctRate,
    };
  });
}
