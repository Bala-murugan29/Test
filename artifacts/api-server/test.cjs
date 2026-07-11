const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const prisma = new PrismaClient();

const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  studentUserId: z.string().uuid(),
  attemptNo: z.number().int(),
  status: z.string(),
  startedAt: z.string().datetime().nullable().optional(),
  submittedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});

async function main() {
  const user = await prisma.user.findFirst();
  const exam = await prisma.exam.findFirst();
  if (!user || !exam) {
    console.log('User or exam not found');
    return;
  }

  const existingSession = await prisma.examSession.findFirst({
    where: { examId: exam.id, studentUserId: user.id },
    orderBy: { attemptNo: "desc" },
  });

  if (existingSession) {
    const activeStatuses = ["CREATED", "IN_PROGRESS", "PAUSED"];
    if (activeStatuses.includes(existingSession.status)) {
      const expiresAt = existingSession.expiresAt
        ? new Date(existingSession.expiresAt)
        : new Date(Date.now() + exam.durationMinutes * 60 * 1000);

      if (expiresAt > new Date()) {
        const result = {
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
        console.log('Existing session result:', result);
        try {
          sessionResponseSchema.parse(result);
          console.log('Zod validation passed for existing session!');
        } catch (err) {
          console.error('Zod validation failed for existing session:', err);
        }
        return;
      }
    }
  }

  const maxAttempt = existingSession?.attemptNo ?? 0;
  const nextAttempt = maxAttempt + 1;
  const expiresAt = new Date(Date.now() + exam.durationMinutes * 60 * 1000);

  const session = await prisma.examSession.create({
    data: {
      examId: exam.id,
      studentUserId: user.id,
      attemptNo: nextAttempt,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      expiresAt,
    },
  });

  const result = {
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

  console.log('New session result:', result);
  try {
    sessionResponseSchema.parse(result);
    console.log('Zod validation passed for new session!');
  } catch (err) {
    console.error('Zod validation failed for new session:', err);
  }
}

main().finally(() => prisma.$disconnect());
