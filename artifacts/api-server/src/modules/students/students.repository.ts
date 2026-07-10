import type { FastifyInstance } from "fastify";
import type { PaginationQuery, CreateStudentBody, UpdateStudentBody } from "./students.schemas";

export async function findStudents(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search, departmentId } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { studentNumber: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const [students, total] = await Promise.all([
    app.prisma.studentProfile.findMany({
      where,
      include: {
        user: true,
        department: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.studentProfile.count({ where }),
  ]);

  return {
    data: students.map((s: any) => ({
      userId: s.userId,
      departmentId: s.departmentId,
      studentNumber: s.studentNumber,
      admissionYear: s.admissionYear,
      currentSemester: s.currentSemester,
      gpa: s.gpa?.toNumber() ?? null,
      user: {
        id: s.user.id,
        email: s.user.email,
        fullName: s.user.fullName,
        phone: s.user.phone,
        status: s.user.status,
        createdAt: s.user.createdAt.toISOString(),
      },
      department: {
        id: s.department.id,
        code: s.department.code,
        name: s.department.name,
      },
      createdAt: s.createdAt.toISOString(),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findStudentByUserId(app: FastifyInstance, userId: string) {
  return app.prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true,
    },
  });
}

export async function createStudent(
  app: FastifyInstance,
  data: CreateStudentBody,
) {
  return app.prisma.studentProfile.create({
    data: {
      userId: data.userId,
      departmentId: data.departmentId,
      studentNumber: data.studentNumber,
      admissionYear: data.admissionYear,
      currentSemester: data.currentSemester,
      gpa: data.gpa,
    },
    include: {
      user: true,
      department: true,
    },
  });
}

export async function updateStudent(
  app: FastifyInstance,
  userId: string,
  data: UpdateStudentBody,
) {
  return app.prisma.studentProfile.update({
    where: { userId },
    data,
    include: {
      user: true,
      department: true,
    },
  });
}

export async function getEnrollments(app: FastifyInstance, userId: string) {
  return app.prisma.enrollment.findMany({
    where: { studentUserId: userId },
    include: {
      course: true,
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function createEnrollment(
  app: FastifyInstance,
  userId: string,
  courseId: string,
) {
  return app.prisma.enrollment.create({
    data: {
      studentUserId: userId,
      courseId,
      status: "ACTIVE",
    },
    include: {
      course: true,
    },
  });
}

export async function deleteEnrollment(
  app: FastifyInstance,
  userId: string,
  courseId: string,
) {
  return app.prisma.enrollment.delete({
    where: {
      courseId_studentUserId: { courseId, studentUserId: userId },
    },
  });
}

export async function getStudentResults(app: FastifyInstance, userId: string) {
  return app.prisma.result.findMany({
    where: {
      session: {
        studentUserId: userId,
      },
    },
    include: {
      session: {
        include: {
          exam: {
            select: {
              title: true,
              courseId: true,
            },
          },
        },
      },
    },
    orderBy: { evaluatedAt: "desc" },
  });
}
