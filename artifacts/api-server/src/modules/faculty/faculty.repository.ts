import type { FastifyInstance } from "fastify";
import type { PaginationQuery, CreateFacultyBody, UpdateFacultyBody } from "./faculty.schemas";

export async function findFaculty(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search, departmentId } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { employeeNumber: { contains: search, mode: "insensitive" } },
      { designation: { contains: search, mode: "insensitive" } },
      { user: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  const [faculty, total] = await Promise.all([
    app.prisma.facultyProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.facultyProfile.count({ where }),
  ]);

  return {
    data: faculty.map((f: {
      userId: string;
      employeeNumber: string;
      designation: string;
      specialization: string | null;
      hireDate: Date | null;
      createdAt: Date;
      user: { id: string; email: string; fullName: string; phone: string | null; status: string };
      department: { id: string; code: string; name: string };
    }) => ({
      userId: f.userId,
      employeeNumber: f.employeeNumber,
      designation: f.designation,
      specialization: f.specialization,
      hireDate: f.hireDate?.toISOString() ?? null,
      createdAt: f.createdAt.toISOString(),
      user: f.user,
      department: f.department,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findFacultyByUserId(app: FastifyInstance, userId: string) {
  return app.prisma.facultyProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
        },
      },
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function createFaculty(
  app: FastifyInstance,
  data: CreateFacultyBody,
) {
  return app.prisma.facultyProfile.create({
    data: {
      userId: data.userId,
      departmentId: data.departmentId,
      employeeNumber: data.employeeNumber,
      designation: data.designation,
      specialization: data.specialization,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
        },
      },
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function updateFaculty(
  app: FastifyInstance,
  userId: string,
  data: UpdateFacultyBody,
) {
  return app.prisma.facultyProfile.update({
    where: { userId },
    data: {
      ...(data.designation !== undefined && { designation: data.designation }),
      ...(data.specialization !== undefined && { specialization: data.specialization }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
        },
      },
      department: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function getCourseAssignments(app: FastifyInstance, userId: string) {
  return app.prisma.courseInstructor.findMany({
    where: { facultyUserId: userId },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
}

export async function assignCourse(
  app: FastifyInstance,
  userId: string,
  courseId: string,
  assignedByUserId: string,
) {
  return app.prisma.courseInstructor.create({
    data: {
      facultyUserId: userId,
      courseId,
      assignedByUserId,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });
}

export async function unassignCourse(
  app: FastifyInstance,
  userId: string,
  courseId: string,
) {
  return app.prisma.courseInstructor.delete({
    where: {
      courseId_facultyUserId: {
        courseId,
        facultyUserId: userId,
      },
    },
  });
}
