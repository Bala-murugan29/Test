import type { FastifyInstance } from "fastify";
import * as departmentsRepo from "./departments.repository";
import type { PaginationQuery, CreateDepartmentBody, UpdateDepartmentBody, CreateCourseBody } from "./departments.schemas";
import { HttpError } from "../../shared/errors/http-error";

type DepartmentWithCounts = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  _count: { students: number; faculty: number; courses: number };
  createdAt: Date;
  updatedAt: Date;
};

function formatDepartment(dept: DepartmentWithCounts) {
  return {
    id: dept.id,
    code: dept.code,
    name: dept.name,
    description: dept.description,
    _count: dept._count,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}

export async function listDepartments(app: FastifyInstance, query: PaginationQuery) {
  return departmentsRepo.findDepartments(app, query);
}

export async function getDepartment(app: FastifyInstance, id: string) {
  const dept = await departmentsRepo.findDepartmentById(app, id);
  if (!dept) {
    throw new HttpError(404, "Department not found");
  }
  return formatDepartment(dept as DepartmentWithCounts);
}

export async function createDepartment(app: FastifyInstance, data: CreateDepartmentBody) {
  const existing = await app.prisma.department.findFirst({
    where: { OR: [{ code: data.code }, { name: data.name }] },
  });
  if (existing) {
    throw new HttpError(409, "Department code or name already exists");
  }

  const dept = await departmentsRepo.createDepartment(app, data);
  return formatDepartment(dept as DepartmentWithCounts);
}

export async function updateDepartment(
  app: FastifyInstance,
  id: string,
  data: UpdateDepartmentBody,
) {
  const existing = await departmentsRepo.findDepartmentById(app, id);
  if (!existing) {
    throw new HttpError(404, "Department not found");
  }

  if (data.name) {
    const nameTaken = await app.prisma.department.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (nameTaken) {
      throw new HttpError(409, "Department name already in use");
    }
  }

  const dept = await departmentsRepo.updateDepartment(app, id, data);
  return formatDepartment(dept as DepartmentWithCounts);
}

export async function deleteDepartment(app: FastifyInstance, id: string) {
  const existing = await departmentsRepo.findDepartmentById(app, id);
  if (!existing) {
    throw new HttpError(404, "Department not found");
  }

  await departmentsRepo.deleteDepartment(app, id);
  return { message: "Department deleted successfully" };
}

export async function getCourses(app: FastifyInstance, departmentId: string) {
  const existing = await departmentsRepo.findDepartmentById(app, departmentId);
  if (!existing) {
    throw new HttpError(404, "Department not found");
  }

  const courses = await departmentsRepo.getCourses(app, departmentId);
  return courses.map((c: { id: string; departmentId: string; code: string; title: string; description: string | null; credits: number; level: number | null; isActive: boolean; createdAt: Date; updatedAt: Date }) => ({
    id: c.id,
    departmentId: c.departmentId,
    code: c.code,
    title: c.title,
    description: c.description,
    credits: c.credits,
    level: c.level,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function createCourse(
  app: FastifyInstance,
  departmentId: string,
  data: CreateCourseBody,
) {
  const existing = await departmentsRepo.findDepartmentById(app, departmentId);
  if (!existing) {
    throw new HttpError(404, "Department not found");
  }

  const courseTaken = await app.prisma.course.findFirst({
    where: { departmentId, code: data.code },
  });
  if (courseTaken) {
    throw new HttpError(409, "Course code already exists in this department");
  }

  const course = await departmentsRepo.createCourse(app, departmentId, data);
  return {
    id: course.id,
    departmentId: course.departmentId,
    code: course.code,
    title: course.title,
    description: course.description,
    credits: course.credits,
    level: course.level,
    isActive: course.isActive,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

export async function getDepartmentStats(app: FastifyInstance, id: string) {
  const stats = await departmentsRepo.getDepartmentStats(app, id);
  if (!stats) {
    throw new HttpError(404, "Department not found");
  }
  return stats;
}
