import type { FastifyInstance } from "fastify";
import type { PaginationQuery, CreateExamBody, UpdateExamBody, AddQuestionBody } from "./exams.schemas";

export async function findExams(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search, status, courseId } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (courseId) {
    where.courseId = courseId;
  }

  const [exams, total] = await Promise.all([
    app.prisma.exam.findMany({
      where,
      include: { course: { select: { id: true, title: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.exam.count({ where }),
  ]);

  return {
    data: exams.map((e: {
      id: string;
      courseId: string;
      title: string;
      instructions: string | null;
      durationMinutes: number;
      totalMarks: number;
      passMarks: number;
      status: string;
      startsAt: Date | null;
      endsAt: Date | null;
      randomizeQuestions: boolean;
      allowReview: boolean;
      attemptLimit: number;
      publishedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      course: { id: string; title: string } | null;
    }) => ({
      id: e.id,
      courseId: e.courseId,
      courseTitle: e.course?.title ?? null,
      title: e.title,
      instructions: e.instructions,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      passMarks: e.passMarks,
      status: e.status,
      startsAt: e.startsAt?.toISOString() ?? null,
      endsAt: e.endsAt?.toISOString() ?? null,
      randomizeQuestions: e.randomizeQuestions,
      allowReview: e.allowReview,
      attemptLimit: e.attemptLimit,
      publishedAt: e.publishedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findExamById(app: FastifyInstance, id: string) {
  return app.prisma.exam.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      questions: {
        orderBy: { sequenceNo: "asc" },
        select: {
          questionId: true,
          sequenceNo: true,
          marksOverride: true,
          negativeMarks: true,
          isMandatory: true,
        },
      },
    },
  });
}

export async function createExam(
  app: FastifyInstance,
  data: CreateExamBody,
  createdByUserId: string,
) {
  return app.prisma.exam.create({
    data: {
      courseId: data.courseId,
      createdByUserId,
      title: data.title,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      totalMarks: data.totalMarks,
      passMarks: data.passMarks,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      randomizeQuestions: data.randomizeQuestions,
      allowReview: data.allowReview,
      attemptLimit: data.attemptLimit,
    },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function updateExam(
  app: FastifyInstance,
  id: string,
  data: UpdateExamBody,
) {
  return app.prisma.exam.update({
    where: { id },
    data: {
      ...data,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function updateExamStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  return app.prisma.exam.update({
    where: { id },
    data: {
      status: status as "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED" | "ARCHIVED",
      ...(status === "SCHEDULED" ? { publishedAt: new Date() } : {}),
    },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function getExamQuestions(app: FastifyInstance, examId: string) {
  return app.prisma.examQuestion.findMany({
    where: { examId },
    orderBy: { sequenceNo: "asc" },
    select: {
      questionId: true,
      sequenceNo: true,
      marksOverride: true,
      negativeMarks: true,
      isMandatory: true,
    },
  });
}

export async function addQuestion(
  app: FastifyInstance,
  examId: string,
  data: AddQuestionBody,
) {
  return app.prisma.examQuestion.create({
    data: {
      examId,
      questionId: data.questionId,
      sequenceNo: data.sequenceNo,
      marksOverride: data.marksOverride ?? null,
      negativeMarks: data.negativeMarks,
      isMandatory: data.isMandatory,
    },
  });
}

export async function removeQuestion(
  app: FastifyInstance,
  examId: string,
  questionId: string,
) {
  return app.prisma.examQuestion.delete({
    where: { examId_questionId: { examId, questionId } },
  });
}

export async function reorderQuestions(
  app: FastifyInstance,
  examId: string,
  questionIds: string[],
) {
  const updates = questionIds.map((questionId: string, index: number) =>
    app.prisma.examQuestion.update({
      where: { examId_questionId: { examId, questionId } },
      data: { sequenceNo: index + 1 },
    })
  );

  return app.prisma.$transaction(updates);
}
