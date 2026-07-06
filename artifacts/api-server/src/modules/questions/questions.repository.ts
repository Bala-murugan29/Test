import type { FastifyInstance } from "fastify";
import type {
  PaginationQuery,
  CreateMcqQuestionBody,
  CreateCodingQuestionBody,
  UpdateQuestionBody,
} from "./questions.schemas";

export async function findQuestions(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search, type, status, departmentId, difficulty } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { prompt: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  const [questions, total] = await Promise.all([
    app.prisma.question.findMany({
      where,
      include: { mcq: true, coding: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.question.count({ where }),
  ]);

  return {
    data: questions.map(
      (q: {
        id: string;
        departmentId: string;
        createdByUserId: string | null;
        type: string;
        status: string;
        title: string;
        prompt: string;
        explanation: string | null;
        difficulty: number;
        marks: number;
        timeLimitSeconds: number | null;
        tags: unknown;
        createdAt: Date;
        updatedAt: Date;
        mcq: {
          options: unknown;
          correctOptionIndex: number;
          shuffleOptions: boolean;
          answerExplanation: string | null;
        } | null;
        coding: {
          starterCode: string | null;
          solutionTemplate: string | null;
          testCases: unknown;
          languageConstraints: unknown;
          sampleInput: string | null;
          sampleOutput: string | null;
        } | null;
      }) => ({
        id: q.id,
        departmentId: q.departmentId,
        createdByUserId: q.createdByUserId,
        type: q.type,
        status: q.status,
        title: q.title,
        prompt: q.prompt,
        explanation: q.explanation,
        difficulty: q.difficulty,
        marks: q.marks,
        timeLimitSeconds: q.timeLimitSeconds,
        tags: q.tags,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
        mcq: q.mcq
          ? {
              options: q.mcq.options as Array<{ text: string }>,
              correctOptionIndex: q.mcq.correctOptionIndex,
              shuffleOptions: q.mcq.shuffleOptions,
              answerExplanation: q.mcq.answerExplanation,
            }
          : null,
        coding: q.coding
          ? {
              starterCode: q.coding.starterCode,
              solutionTemplate: q.coding.solutionTemplate,
              testCases: q.coding.testCases as Array<{
                input: string;
                expectedOutput: string;
              }>,
              languageConstraints: q.coding.languageConstraints as
                | string[]
                | null,
              sampleInput: q.coding.sampleInput,
              sampleOutput: q.coding.sampleOutput,
            }
          : null,
      }),
    ),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findQuestionById(app: FastifyInstance, id: string) {
  return app.prisma.question.findUnique({
    where: { id },
    include: { mcq: true, coding: true },
  });
}

export async function createMcqQuestion(
  app: FastifyInstance,
  data: CreateMcqQuestionBody,
  createdByUserId: string,
) {
  return app.prisma.question.create({
    data: {
      departmentId: data.departmentId,
      createdByUserId,
      type: "MCQ",
      status: "DRAFT",
      title: data.title,
      prompt: data.prompt,
      explanation: data.explanation,
      difficulty: data.difficulty,
      marks: data.marks,
      timeLimitSeconds: data.timeLimitSeconds,
      tags: data.tags,
      mcq: {
        create: {
          options: data.options,
          correctOptionIndex: data.correctOptionIndex,
          shuffleOptions: data.shuffleOptions,
          answerExplanation: data.answerExplanation,
        },
      },
    },
    include: { mcq: true, coding: true },
  });
}

export async function createCodingQuestion(
  app: FastifyInstance,
  data: CreateCodingQuestionBody,
  createdByUserId: string,
) {
  return app.prisma.question.create({
    data: {
      departmentId: data.departmentId,
      createdByUserId,
      type: "CODING",
      status: "DRAFT",
      title: data.title,
      prompt: data.prompt,
      explanation: data.explanation,
      difficulty: data.difficulty,
      marks: data.marks,
      timeLimitSeconds: data.timeLimitSeconds,
      tags: data.tags,
      coding: {
        create: {
          starterCode: data.starterCode,
          solutionTemplate: data.solutionTemplate,
          testCases: data.testCases,
          languageConstraints: data.languageConstraints,
          sampleInput: data.sampleInput,
          sampleOutput: data.sampleOutput,
        },
      },
    },
    include: { mcq: true, coding: true },
  });
}

export async function updateQuestion(
  app: FastifyInstance,
  id: string,
  data: UpdateQuestionBody,
) {
  return app.prisma.question.update({
    where: { id },
    data,
    include: { mcq: true, coding: true },
  });
}

export async function updateQuestionStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  return app.prisma.question.update({
    where: { id },
    data: { status: status as "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED" },
    include: { mcq: true, coding: true },
  });
}

export async function deleteQuestion(app: FastifyInstance, id: string) {
  return app.prisma.question.delete({ where: { id } });
}

export async function getQuestionUsage(app: FastifyInstance, id: string) {
  return app.prisma.examQuestion.findMany({
    where: { questionId: id },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}
