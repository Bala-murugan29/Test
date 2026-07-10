import type { FastifyInstance } from "fastify";

export async function getExamReport(app: FastifyInstance, examId: string) {
  const exam = await app.prisma.exam.findUnique({
    where: { id: examId },
    include: {
      course: true,
      questions: {
        include: {
          question: true,
        },
      },
      sessions: {
        include: {
          user: true,
          result: true,
          answers: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  });

  return exam;
}

export async function getStudentReport(app: FastifyInstance, studentUserId: string) {
  const profile = await app.prisma.user.findUnique({
    where: { id: studentUserId },
    include: {
      studentProfile: true,
      examSessions: {
        include: {
          exam: true,
          result: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return profile;
}

export async function getDepartmentReport(app: FastifyInstance, departmentId: string) {
  const department = await app.prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      students: true,
      faculty: true,
      courses: true,
    },
  });

  return department;
}

export async function exportExamResults(app: FastifyInstance, examId: string) {
  const results = await app.prisma.examSession.findMany({
    where: { examId },
    include: {
      user: true,
      result: true,
      exam: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return results;
}

export async function exportStudentResults(app: FastifyInstance, studentUserId: string) {
  const results = await app.prisma.examSession.findMany({
    where: { studentUserId },
    include: {
      result: true,
      exam: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return results;
}
