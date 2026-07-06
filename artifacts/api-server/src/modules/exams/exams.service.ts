import type { FastifyInstance } from "fastify";
import * as examsRepo from "./exams.repository";
import type { PaginationQuery, CreateExamBody, UpdateExamBody, AddQuestionBody, ReorderQuestionsBody } from "./exams.schemas";
import { HttpError } from "../../shared/errors/http-error";

type ExamCourse = { id: string; title: string } | null;
type ExamQuestionEntry = { questionId: string; sequenceNo: number; marksOverride: number | null; negativeMarks: number; isMandatory: boolean };

function formatExam(exam: {
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
  course: ExamCourse;
}) {
  return {
    id: exam.id,
    courseId: exam.courseId,
    courseTitle: exam.course?.title ?? null,
    title: exam.title,
    instructions: exam.instructions,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    passMarks: exam.passMarks,
    status: exam.status,
    startsAt: exam.startsAt?.toISOString() ?? null,
    endsAt: exam.endsAt?.toISOString() ?? null,
    randomizeQuestions: exam.randomizeQuestions,
    allowReview: exam.allowReview,
    attemptLimit: exam.attemptLimit,
    publishedAt: exam.publishedAt?.toISOString() ?? null,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}

function formatExamWithQuestions(exam: {
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
  course: ExamCourse;
  questions: ExamQuestionEntry[];
}) {
  return {
    ...formatExam(exam),
    questions: exam.questions.map((q: ExamQuestionEntry) => ({
      questionId: q.questionId,
      sequenceNo: q.sequenceNo,
      marksOverride: q.marksOverride,
      negativeMarks: q.negativeMarks,
      isMandatory: q.isMandatory,
    })),
  };
}

export async function listExams(app: FastifyInstance, query: PaginationQuery) {
  return examsRepo.findExams(app, query);
}

export async function getExam(app: FastifyInstance, id: string) {
  const exam = await examsRepo.findExamById(app, id);
  if (!exam) {
    throw new HttpError(404, "Exam not found");
  }
  return formatExamWithQuestions(exam);
}

export async function createExam(app: FastifyInstance, data: CreateExamBody, createdByUserId: string) {
  const exam = await examsRepo.createExam(app, data, createdByUserId);
  return formatExam(exam);
}

export async function updateExam(app: FastifyInstance, id: string, data: UpdateExamBody) {
  const existing = await examsRepo.findExamById(app, id);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status !== "DRAFT") {
    throw new HttpError(400, "Only draft exams can be updated");
  }

  const exam = await examsRepo.updateExam(app, id, data);
  return formatExam(exam);
}

export async function publishExam(app: FastifyInstance, id: string) {
  const existing = await examsRepo.findExamById(app, id);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status !== "DRAFT") {
    throw new HttpError(400, "Only draft exams can be published");
  }

  if (existing.questions.length === 0) {
    throw new HttpError(400, "Cannot publish an exam with no questions");
  }

  const exam = await examsRepo.updateExamStatus(app, id, "SCHEDULED");
  return formatExam(exam);
}

export async function archiveExam(app: FastifyInstance, id: string) {
  const existing = await examsRepo.findExamById(app, id);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status === "DRAFT" || existing.status === "ARCHIVED") {
    throw new HttpError(400, "Cannot archive an exam that is draft or already archived");
  }

  const exam = await examsRepo.updateExamStatus(app, id, "ARCHIVED");
  return formatExam(exam);
}

export async function getExamQuestions(app: FastifyInstance, examId: string) {
  const existing = await examsRepo.findExamById(app, examId);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  return existing.questions.map((q: ExamQuestionEntry) => ({
    questionId: q.questionId,
    sequenceNo: q.sequenceNo,
    marksOverride: q.marksOverride,
    negativeMarks: q.negativeMarks,
    isMandatory: q.isMandatory,
  }));
}

export async function addQuestion(app: FastifyInstance, examId: string, data: AddQuestionBody) {
  const existing = await examsRepo.findExamById(app, examId);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status !== "DRAFT") {
    throw new HttpError(400, "Only draft exams can have questions added");
  }

  const duplicate = existing.questions.find((q: ExamQuestionEntry) => q.questionId === data.questionId);
  if (duplicate) {
    throw new HttpError(409, "Question already added to this exam");
  }

  const sequenceConflict = existing.questions.find((q: ExamQuestionEntry) => q.sequenceNo === data.sequenceNo);
  if (sequenceConflict) {
    throw new HttpError(409, "Sequence number already in use");
  }

  const examQuestion = await examsRepo.addQuestion(app, examId, data);
  return {
    questionId: examQuestion.questionId,
    sequenceNo: examQuestion.sequenceNo,
    marksOverride: examQuestion.marksOverride,
    negativeMarks: examQuestion.negativeMarks,
    isMandatory: examQuestion.isMandatory,
  };
}

export async function removeQuestion(app: FastifyInstance, examId: string, questionId: string) {
  const existing = await examsRepo.findExamById(app, examId);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status !== "DRAFT") {
    throw new HttpError(400, "Only draft exams can have questions removed");
  }

  const questionExists = existing.questions.find((q: ExamQuestionEntry) => q.questionId === questionId);
  if (!questionExists) {
    throw new HttpError(404, "Question not found in this exam");
  }

  await examsRepo.removeQuestion(app, examId, questionId);
  return { message: "Question removed successfully" };
}

export async function reorderQuestions(app: FastifyInstance, examId: string, data: ReorderQuestionsBody) {
  const existing = await examsRepo.findExamById(app, examId);
  if (!existing) {
    throw new HttpError(404, "Exam not found");
  }

  if (existing.status !== "DRAFT") {
    throw new HttpError(400, "Only draft exams can be reordered");
  }

  const existingIds = new Set(existing.questions.map((q: ExamQuestionEntry) => q.questionId));
  const missing = data.questionIds.filter((id: string) => !existingIds.has(id));
  if (missing.length > 0) {
    throw new HttpError(400, `Questions not found in exam: ${missing.join(", ")}`);
  }

  await examsRepo.reorderQuestions(app, examId, data.questionIds);
  return { message: "Questions reordered successfully" };
}
