import type { FastifyInstance } from "fastify";
import * as facultyRepo from "./faculty.repository";
import type { PaginationQuery, CreateFacultyBody, UpdateFacultyBody } from "./faculty.schemas";
import { HttpError } from "../../shared/errors/http-error";

export async function listFaculty(app: FastifyInstance, query: PaginationQuery) {
  return facultyRepo.findFaculty(app, query);
}

export async function getFaculty(app: FastifyInstance, userId: string) {
  const faculty = await facultyRepo.findFacultyByUserId(app, userId);
  if (!faculty) {
    throw new HttpError(404, "Faculty profile not found");
  }
  return {
    userId: faculty.userId,
    employeeNumber: faculty.employeeNumber,
    designation: faculty.designation,
    specialization: faculty.specialization,
    hireDate: faculty.hireDate?.toISOString() ?? null,
    createdAt: faculty.createdAt.toISOString(),
    department: faculty.department,
    user: faculty.user,
  };
}

export async function createFaculty(app: FastifyInstance, data: CreateFacultyBody) {
  const user = await app.prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const existingProfile = await facultyRepo.findFacultyByUserId(app, data.userId);
  if (existingProfile) {
    throw new HttpError(409, "Faculty profile already exists for this user");
  }

  const department = await app.prisma.department.findUnique({
    where: { id: data.departmentId },
  });
  if (!department) {
    throw new HttpError(404, "Department not found");
  }

  const employeeExists = await app.prisma.facultyProfile.findUnique({
    where: { employeeNumber: data.employeeNumber },
  });
  if (employeeExists) {
    throw new HttpError(409, "Employee number already in use");
  }

  const faculty = await facultyRepo.createFaculty(app, data);
  return {
    userId: faculty.userId,
    employeeNumber: faculty.employeeNumber,
    designation: faculty.designation,
    specialization: faculty.specialization,
    hireDate: faculty.hireDate?.toISOString() ?? null,
    createdAt: faculty.createdAt.toISOString(),
    department: faculty.department,
    user: faculty.user,
  };
}

export async function updateFaculty(
  app: FastifyInstance,
  userId: string,
  data: UpdateFacultyBody,
) {
  const existing = await facultyRepo.findFacultyByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Faculty profile not found");
  }

  const faculty = await facultyRepo.updateFaculty(app, userId, data);
  return {
    userId: faculty.userId,
    employeeNumber: faculty.employeeNumber,
    designation: faculty.designation,
    specialization: faculty.specialization,
    hireDate: faculty.hireDate?.toISOString() ?? null,
    createdAt: faculty.createdAt.toISOString(),
    department: faculty.department,
    user: faculty.user,
  };
}

export async function getCourseAssignments(app: FastifyInstance, userId: string) {
  const existing = await facultyRepo.findFacultyByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Faculty profile not found");
  }

  const assignments = await facultyRepo.getCourseAssignments(app, userId);
  return assignments.map((a: {
    courseId: string;
    assignedAt: Date;
    assignedByUserId: string | null;
    course: { id: string; code: string; title: string };
  }) => ({
    courseId: a.courseId,
    courseCode: a.course.code,
    courseTitle: a.course.title,
    assignedAt: a.assignedAt.toISOString(),
    assignedByUserId: a.assignedByUserId,
  }));
}

export async function assignCourse(
  app: FastifyInstance,
  userId: string,
  courseId: string,
  assignedByUserId: string,
) {
  const existing = await facultyRepo.findFacultyByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Faculty profile not found");
  }

  const course = await app.prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, "Course not found");
  }

  const alreadyAssigned = await app.prisma.courseInstructor.findUnique({
    where: {
      courseId_facultyUserId: {
        courseId,
        facultyUserId: userId,
      },
    },
  });
  if (alreadyAssigned) {
    throw new HttpError(409, "Course already assigned to this faculty");
  }

  await facultyRepo.assignCourse(app, userId, courseId, assignedByUserId);
  return { message: "Course assigned successfully" };
}

export async function unassignCourse(
  app: FastifyInstance,
  userId: string,
  courseId: string,
) {
  const existing = await facultyRepo.findFacultyByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Faculty profile not found");
  }

  const assignment = await app.prisma.courseInstructor.findUnique({
    where: {
      courseId_facultyUserId: {
        courseId,
        facultyUserId: userId,
      },
    },
  });
  if (!assignment) {
    throw new HttpError(404, "Course assignment not found");
  }

  await facultyRepo.unassignCourse(app, userId, courseId);
  return { message: "Course unassigned successfully" };
}
