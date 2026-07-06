import type { FastifyInstance } from "fastify";
import type { PaginationQuery, CreateDepartmentBody, UpdateDepartmentBody, CreateCourseBody } from "./departments.schemas";

export async function findDepartments(
  app: FastifyInstance,
  query: PaginationQuery,
) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }

  const [departments, total] = await Promise.all([
    app.prisma.department.findMany({
      where,
      include: {
        _count: {
          select: { students: true, faculty: true, courses: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.department.count({ where }),
  ]);

  return {
    data: departments.map((d: { id: string; code: string; name: string; description: string | null; _count: { students: number; faculty: number; courses: number }; createdAt: Date; updatedAt: Date }) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      _count: d._count,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findDepartmentById(app: FastifyInstance, id: string) {
  return app.prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true, faculty: true, courses: true },
      },
    },
  });
}

export async function createDepartment(
  app: FastifyInstance,
  data: CreateDepartmentBody,
) {
  return app.prisma.department.create({
    data,
    include: {
      _count: {
        select: { students: true, faculty: true, courses: true },
      },
    },
  });
}

export async function updateDepartment(
  app: FastifyInstance,
  id: string,
  data: UpdateDepartmentBody,
) {
  return app.prisma.department.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { students: true, faculty: true, courses: true },
      },
    },
  });
}

export async function deleteDepartment(app: FastifyInstance, id: string) {
  return app.prisma.department.delete({ where: { id } });
}

export async function getCourses(app: FastifyInstance, departmentId: string) {
  return app.prisma.course.findMany({
    where: { departmentId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCourse(
  app: FastifyInstance,
  departmentId: string,
  data: CreateCourseBody,
) {
  return app.prisma.course.create({
    data: {
      departmentId,
      code: data.code,
      title: data.title,
      description: data.description,
      credits: data.credits,
      level: data.level,
    },
  });
}

export async function getDepartmentStats(app: FastifyInstance, id: string) {
  const department = await app.prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: { students: true, faculty: true, courses: true },
      },
      courses: {
        select: { id: true },
      },
    },
  });

  if (!department) return null;

  const courseIds = (department.courses as Array<{ id: string }>).map((c: { id: string }) => c.id);

  const examCount = courseIds.length > 0
    ? await app.prisma.exam.count({
        where: { courseId: { in: courseIds } },
      })
    : 0;

  return {
    id: department.id,
    code: department.code,
    name: department.name,
    studentCount: department._count.students,
    facultyCount: department._count.faculty,
    courseCount: department._count.courses,
    examCount,
  };
}
