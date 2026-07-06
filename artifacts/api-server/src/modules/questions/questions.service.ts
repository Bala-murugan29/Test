import type { FastifyInstance } from "fastify";
import * as questionsRepo from "./questions.repository";
import type {
  PaginationQuery,
  CreateMcqQuestionBody,
  CreateCodingQuestionBody,
  UpdateQuestionBody,
} from "./questions.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function listQuestions(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  return questionsRepo.findQuestions(app, query);
}

export async function getQuestionById(app: FastifyInstance, id: string) {
  const question = await questionsRepo.findQuestionById(app, id);
  if (!question) {
    throw new HttpError(404, "Question not found");
  }
  return formatQuestion(question);
}

export async function createMcqQuestion(
  app: FastifyInstance,
  data: CreateMcqQuestionBody,
  createdByUserId: string,
) {
  if (data.correctOptionIndex >= data.options.length) {
    throw new HttpError(
      400,
      "correctOptionIndex must be less than the number of options",
    );
  }

  const question = await questionsRepo.createMcqQuestion(
    app,
    data,
    createdByUserId,
  );
  return formatQuestion(question);
}

export async function createCodingQuestion(
  app: FastifyInstance,
  data: CreateCodingQuestionBody,
  createdByUserId: string,
) {
  const question = await questionsRepo.createCodingQuestion(
    app,
    data,
    createdByUserId,
  );
  return formatQuestion(question);
}

export async function updateQuestion(
  app: FastifyInstance,
  id: string,
  data: UpdateQuestionBody,
) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const question = await questionsRepo.updateQuestion(app, id, data);
  return formatQuestion(question);
}

export async function updateQuestionStatus(
  app: FastifyInstance,
  id: string,
  status: string,
) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const question = await questionsRepo.updateQuestionStatus(app, id, status);
  return formatQuestion(question);
}

export async function deleteQuestion(app: FastifyInstance, id: string) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  await questionsRepo.deleteQuestion(app, id);
  return { message: "Question deleted successfully" };
}

export async function getQuestionUsage(app: FastifyInstance, id: string) {
  const existing = await questionsRepo.findQuestionById(app, id);
  if (!existing) {
    throw new HttpError(404, "Question not found");
  }

  const usage = await questionsRepo.getQuestionUsage(app, id);
  return {
    questionId: id,
    usedInExams: usage.map(
      (u: {
        exam: { id: string; title: string; status: string };
        sequenceNo: number;
        marksOverride: number | null;
      }) => ({
        examId: u.exam.id,
        examTitle: u.exam.title,
        examStatus: u.exam.status,
        sequenceNo: u.sequenceNo,
        marksOverride: u.marksOverride,
      }),
    ),
    totalUsage: usage.length,
  };
}

type QuestionWithSubtype = {
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
};

function formatQuestion(q: QuestionWithSubtype) {
  return {
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
          languageConstraints: q.coding.languageConstraints as string[] | null,
          sampleInput: q.coding.sampleInput,
          sampleOutput: q.coding.sampleOutput,
        }
      : null,
  };
}
