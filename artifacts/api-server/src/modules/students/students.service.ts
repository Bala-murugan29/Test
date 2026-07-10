import type { FastifyInstance } from "fastify";
import * as studentsRepo from "./students.repository";
import type { PaginationQuery, CreateStudentBody, UpdateStudentBody } from "./students.schemas";
import { HttpError } from "../../shared/errors/http-error";

type StudentWithRelations = {
  userId: string;
  departmentId: string;
  studentNumber: string;
  admissionYear: number;
  currentSemester: number;
  gpa: { toNumber: () => number } | null;
  createdAt: Date;
  user: { id: string; email: string; fullName: string; phone: string | null; status: string; createdAt: Date };
  department: { id: string; code: string; name: string };
};

type EnrollmentWithCourse = {
  courseId: string;
  studentUserId: string;
  enrolledAt: Date;
  status: string;
  course: { id: string; code: string; title: string; credits: number };
};

type ResultWithSession = {
  id: string;
  sessionId: string;
  obtainedMarks: number;
  maxMarks: number;
  percentage: { toNumber: () => number };
  passed: boolean;
  grade: string | null;
  remarks: string | null;
  evaluatedAt: Date;
  session: {
    examId: string;
    attemptNo: number;
    exam: { title: string; courseId: string };
  };
};

function formatStudent(student: StudentWithRelations) {
  return {
    userId: student.userId,
    departmentId: student.departmentId,
    studentNumber: student.studentNumber,
    admissionYear: student.admissionYear,
    currentSemester: student.currentSemester,
    gpa: student.gpa?.toNumber() ?? null,
    user: {
      id: student.user.id,
      email: student.user.email,
      fullName: student.user.fullName,
      phone: student.user.phone,
      status: student.user.status,
      createdAt: student.user.createdAt.toISOString(),
    },
    department: {
      id: student.department.id,
      code: student.department.code,
      name: student.department.name,
    },
    createdAt: student.createdAt.toISOString(),
  };
}

function formatEnrollment(enrollment: EnrollmentWithCourse) {
  return {
    courseId: enrollment.courseId,
    studentUserId: enrollment.studentUserId,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    status: enrollment.status,
    course: {
      id: enrollment.course.id,
      code: enrollment.course.code,
      title: enrollment.course.title,
      credits: enrollment.course.credits,
    },
  };
}

function formatResult(result: ResultWithSession) {
  return {
    id: result.id,
    sessionId: result.sessionId,
    obtainedMarks: result.obtainedMarks,
    maxMarks: result.maxMarks,
    percentage: result.percentage.toNumber(),
    passed: result.passed,
    grade: result.grade,
    remarks: result.remarks,
    evaluatedAt: result.evaluatedAt.toISOString(),
    session: {
      examId: result.session.examId,
      attemptNo: result.session.attemptNo,
      exam: {
        title: result.session.exam.title,
        courseId: result.session.exam.courseId,
      },
    },
  };
}

export async function listStudents(app: FastifyInstance, query: PaginationQuery) {
  return studentsRepo.findStudents(app, query);
}

export async function getStudent(app: FastifyInstance, userId: string) {
  const student = await studentsRepo.findStudentByUserId(app, userId);
  if (!student) {
    throw new HttpError(404, "Student not found");
  }
  return formatStudent(student as StudentWithRelations);
}

export async function createStudent(app: FastifyInstance, data: CreateStudentBody) {
  const existingUser = await app.prisma.user.findUnique({
    where: { id: data.userId },
  });
  if (!existingUser) {
    throw new HttpError(404, "User not found");
  }

  const existingProfile = await studentsRepo.findStudentByUserId(app, data.userId);
  if (existingProfile) {
    throw new HttpError(409, "Student profile already exists for this user");
  }

  if (data.departmentId) {
    const existingDepartment = await app.prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!existingDepartment) {
      throw new HttpError(404, "Department not found");
    }
  }

  const existingNumber = await app.prisma.studentProfile.findUnique({
    where: { studentNumber: data.studentNumber },
  });
  if (existingNumber) {
    throw new HttpError(409, "Student number already in use");
  }

  const student = await studentsRepo.createStudent(app, data);
  return formatStudent(student as unknown as StudentWithRelations);
}

export async function updateStudent(
  app: FastifyInstance,
  userId: string,
  data: UpdateStudentBody,
) {
  const existing = await studentsRepo.findStudentByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Student not found");
  }

  if (data.departmentId) {
    const department = await app.prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      throw new HttpError(404, "Department not found");
    }
  }

  const student = await studentsRepo.updateStudent(app, userId, data);
  return formatStudent(student as StudentWithRelations);
}

export async function getEnrollments(app: FastifyInstance, userId: string) {
  const existing = await studentsRepo.findStudentByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Student not found");
  }

  const enrollments = await studentsRepo.getEnrollments(app, userId);
  return enrollments.map((e: EnrollmentWithCourse) => formatEnrollment(e));
}

export async function enrollStudent(app: FastifyInstance, userId: string, courseId: string) {
  const existing = await studentsRepo.findStudentByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Student not found");
  }

  const course = await app.prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new HttpError(404, "Course not found");
  }

  const existingEnrollment = await app.prisma.enrollment.findUnique({
    where: {
      courseId_studentUserId: { courseId, studentUserId: userId },
    },
  });
  if (existingEnrollment) {
    throw new HttpError(409, "Already enrolled in this course");
  }

  const enrollment = await studentsRepo.createEnrollment(app, userId, courseId);
  return formatEnrollment(enrollment as EnrollmentWithCourse);
}

export async function dropEnrollment(
  app: FastifyInstance,
  userId: string,
  courseId: string,
) {
  const existing = await studentsRepo.findStudentByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Student not found");
  }

  const enrollment = await app.prisma.enrollment.findUnique({
    where: {
      courseId_studentUserId: { courseId, studentUserId: userId },
    },
  });
  if (!enrollment) {
    throw new HttpError(404, "Enrollment not found");
  }

  await studentsRepo.deleteEnrollment(app, userId, courseId);
  return { message: "Enrollment dropped successfully" };
}

export async function getStudentResults(app: FastifyInstance, userId: string) {
  const existing = await studentsRepo.findStudentByUserId(app, userId);
  if (!existing) {
    throw new HttpError(404, "Student not found");
  }

  const results = await studentsRepo.getStudentResults(app, userId);
  return results.map((r: ResultWithSession) => formatResult(r));
}
