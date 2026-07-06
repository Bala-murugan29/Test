import type { FastifyInstance } from "fastify";
import * as sessionsRepo from "./sessions.repository";
import { HttpError } from "../../shared/errors/http-error";

export async function startSession(
  app: FastifyInstance,
  examId: string,
  studentUserId: string,
) {
  const exam = await app.prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw new HttpError(404, "Exam not found");
  }

  if (exam.status !== "ACTIVE") {
    throw new HttpError(400, "Exam is not currently active");
  }

  if (exam.endsAt && new Date(exam.endsAt) < new Date()) {
    throw new HttpError(400, "Exam has already ended");
  }

  const existingSession = await sessionsRepo.findSessionByExamAndStudent(
    app,
    examId,
    studentUserId,
  );

  if (existingSession) {
    const activeStatuses = ["CREATED", "IN_PROGRESS", "PAUSED"];
    if (activeStatuses.includes(existingSession.status)) {
      const expiresAt = existingSession.expiresAt
        ? new Date(existingSession.expiresAt)
        : new Date(Date.now() + exam.durationMinutes * 60 * 1000);

      if (expiresAt > new Date()) {
        return {
          id: existingSession.id,
          examId: existingSession.examId,
          studentUserId: existingSession.studentUserId,
          attemptNo: existingSession.attemptNo,
          status: existingSession.status,
          startedAt: existingSession.startedAt?.toISOString() ?? null,
          submittedAt: existingSession.submittedAt?.toISOString() ?? null,
          expiresAt: existingSession.expiresAt?.toISOString() ?? null,
          createdAt: existingSession.createdAt.toISOString(),
        };
      }
    }
  }

  const maxAttempt = await sessionsRepo.getMaxAttemptNo(app, examId, studentUserId);
  const nextAttempt = maxAttempt + 1;

  if (nextAttempt > exam.attemptLimit) {
    throw new HttpError(403, "Attempt limit reached for this exam");
  }

  const expiresAt = new Date(Date.now() + exam.durationMinutes * 60 * 1000);

  const session = await sessionsRepo.createSession(
    app,
    examId,
    studentUserId,
    nextAttempt,
    expiresAt,
  );

  return {
    id: session.id,
    examId: session.examId,
    studentUserId: session.studentUserId,
    attemptNo: session.attemptNo,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    submittedAt: session.submittedAt?.toISOString() ?? null,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
  };
}

export async function getSession(app: FastifyInstance, id: string) {
  const session = await sessionsRepo.findSessionById(app, id);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  return {
    id: session.id,
    examId: session.examId,
    studentUserId: session.studentUserId,
    attemptNo: session.attemptNo,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    submittedAt: session.submittedAt?.toISOString() ?? null,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
  };
}

export async function getSessionDetail(app: FastifyInstance, id: string) {
  const session = await sessionsRepo.findSessionById(app, id);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  return {
    id: session.id,
    examId: session.examId,
    studentUserId: session.studentUserId,
    attemptNo: session.attemptNo,
    status: session.status,
    startedAt: session.startedAt?.toISOString() ?? null,
    submittedAt: session.submittedAt?.toISOString() ?? null,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    answers: session.answers.map((a: {
      id: string;
      questionId: string;
      answerText: string | null;
      selectedOptionIndex: number | null;
      codeAnswer: string | null;
      submittedAt: Date;
    }) => ({
      id: a.id,
      questionId: a.questionId,
      answerText: a.answerText,
      selectedOptionIndex: a.selectedOptionIndex,
      codeAnswer: a.codeAnswer,
      submittedAt: a.submittedAt.toISOString(),
    })),
  };
}

export async function getSessionQuestions(app: FastifyInstance, sessionId: string) {
  const session = await sessionsRepo.findSessionById(app, sessionId);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  const examQuestions = await app.prisma.examQuestion.findMany({
    where: { examId: session.examId },
    include: {
      question: {
        include: {
          mcq: true,
          coding: true,
        },
      },
    },
    orderBy: { sequenceNo: "asc" },
  });

  let questions = examQuestions.map((eq: {
    sequenceNo: number;
    marksOverride: number | null;
    negativeMarks: number;
    isMandatory: boolean;
    question: {
      id: string;
      type: string;
      title: string;
      prompt: string;
      difficulty: number;
      marks: number;
      mcq: { options: unknown; shuffleOptions: boolean } | null;
      coding: { starterCode: string | null; testCases: unknown } | null;
    };
  }) => ({
    sequenceNo: eq.sequenceNo,
    marks: eq.marksOverride ?? eq.question.marks,
    negativeMarks: eq.negativeMarks,
    isMandatory: eq.isMandatory,
    question: {
      id: eq.question.id,
      type: eq.question.type,
      title: eq.question.title,
      prompt: eq.question.prompt,
      difficulty: eq.question.difficulty,
      mcq: eq.question.mcq,
      coding: eq.question.coding,
    },
  }));

  if (session.exam.randomizeQuestions) {
    questions = shuffleArray(questions);
  }

  return questions;
}

export async function submitSession(app: FastifyInstance, sessionId: string) {
  const session = await sessionsRepo.findSessionById(app, sessionId);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  const terminalStatuses = ["SUBMITTED", "AUTO_SUBMITTED", "EVALUATED", "INVALIDATED"];
  if (terminalStatuses.includes(session.status)) {
    throw new HttpError(400, "Session already submitted or in terminal state");
  }

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    await sessionsRepo.updateSessionStatus(app, sessionId, "AUTO_SUBMITTED");
    throw new HttpError(400, "Session has expired and was auto-submitted");
  }

  // Auto-grade MCQ answers before marking as submitted.
  const answers = session.answers ?? [];
  for (const answer of answers) {
    const question = await app.prisma.question.findUnique({
      where: { id: answer.questionId },
      include: { mcq: true },
    });
    if (question?.mcq && answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined) {
      const isCorrect = answer.selectedOptionIndex === question.mcq.correctOptionIndex;
      const examQuestion = await app.prisma.examQuestion.findFirst({
        where: { examId: session.examId, questionId: answer.questionId },
      });
      const marks = examQuestion?.marksOverride ?? question.marks;
      await app.prisma.studentAnswer.update({
        where: { id: answer.id },
        data: {
          isCorrect,
          marksAwarded: isCorrect ? marks : 0,
        },
      });
    }
  }

  const updated = await sessionsRepo.updateSessionStatus(app, sessionId, "SUBMITTED");

  // Auto-evaluate and create Result so the frontend gets immediate feedback.
  try {
    const exam = await app.prisma.exam.findUnique({
      where: { id: session.examId },
      select: { id: true, totalMarks: true, passMarks: true },
    });
    if (exam) {
      const gradedAnswers = await app.prisma.studentAnswer.findMany({
        where: { sessionId },
        select: { isCorrect: true, marksAwarded: true },
      });
      let obtainedMarks = 0;
      for (const a of gradedAnswers) {
        if (a.marksAwarded !== null && a.marksAwarded !== undefined) {
          obtainedMarks += a.marksAwarded;
        } else if (a.isCorrect === true) {
          obtainedMarks += 1;
        }
      }
      obtainedMarks = Math.min(obtainedMarks, exam.totalMarks);
      const percentage = exam.totalMarks > 0 ? Math.round((obtainedMarks / exam.totalMarks) * 10000) / 100 : 0;
      const passed = obtainedMarks >= exam.passMarks;
      const grade = calculateGrade(percentage);
      const breakdown = {
        totalQuestions: gradedAnswers.length,
        correctAnswers: gradedAnswers.filter((a: { isCorrect: boolean | null; marksAwarded: number | null }) => a.isCorrect === true).length,
        obtainedMarks,
        totalMarks: exam.totalMarks,
        passMarks: exam.passMarks,
      };

      await app.prisma.result.create({
        data: {
          sessionId,
          obtainedMarks,
          maxMarks: exam.totalMarks,
          percentage,
          passed,
          grade,
          breakdown,
          evaluatedByUserId: session.studentUserId,
        },
      });
      await app.prisma.examSession.update({
        where: { id: sessionId },
        data: { status: "EVALUATED", evaluatedAt: new Date() },
      });
      updated.status = "EVALUATED";
    }
  } catch {
    // If auto-evaluation fails, the session is still SUBMITTED — faculty can evaluate manually.
  }

  return {
    id: updated.id,
    examId: updated.examId,
    studentUserId: updated.studentUserId,
    attemptNo: updated.attemptNo,
    status: updated.status,
    startedAt: updated.startedAt?.toISOString() ?? null,
    submittedAt: updated.submittedAt?.toISOString() ?? null,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 30) return "D";
  return "F";
}

export async function pauseSession(app: FastifyInstance, sessionId: string) {
  const session = await sessionsRepo.findSessionById(app, sessionId);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.status !== "IN_PROGRESS") {
    throw new HttpError(400, "Only in-progress sessions can be paused");
  }

  const updated = await sessionsRepo.updateSessionStatus(app, sessionId, "PAUSED");

  return {
    id: updated.id,
    examId: updated.examId,
    studentUserId: updated.studentUserId,
    attemptNo: updated.attemptNo,
    status: updated.status,
    startedAt: updated.startedAt?.toISOString() ?? null,
    submittedAt: updated.submittedAt?.toISOString() ?? null,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function resumeSession(app: FastifyInstance, sessionId: string) {
  const session = await sessionsRepo.findSessionById(app, sessionId);
  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.status !== "PAUSED") {
    throw new HttpError(400, "Only paused sessions can be resumed");
  }

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    await sessionsRepo.updateSessionStatus(app, sessionId, "AUTO_SUBMITTED");
    throw new HttpError(400, "Session has expired and was auto-submitted");
  }

  const updated = await sessionsRepo.updateSessionStatus(app, sessionId, "IN_PROGRESS");

  return {
    id: updated.id,
    examId: updated.examId,
    studentUserId: updated.studentUserId,
    attemptNo: updated.attemptNo,
    status: updated.status,
    startedAt: updated.startedAt?.toISOString() ?? null,
    submittedAt: updated.submittedAt?.toISOString() ?? null,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function listSessionsByExam(
  app: FastifyInstance,
  examId: string,
  page: number,
  limit: number,
) {
  const exam = await app.prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) {
    throw new HttpError(404, "Exam not found");
  }

  return sessionsRepo.findSessionsByExam(app, examId, page, limit);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
