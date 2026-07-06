import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/axios';
import type { MockUser, Role } from '@/types';

/* ---------- backend response shapes ---------- */

interface BackendUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  roles: string[];
  createdAt: string;
}

interface BackendStudentProfile {
  userId: string;
  departmentId: string;
  studentNumber: string;
  admissionYear: number;
  currentSemester: number;
  gpa: number | null;
  user: BackendUser;
  department: { id: string; code: string; name: string };
  createdAt: string;
}

interface BackendFacultyProfile {
  userId: string;
  employeeNumber: string;
  designation: string;
  specialization: string | null;
  hireDate: string | null;
  department: { id: string; code: string; name: string };
  user: BackendUser;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- mappers ---------- */

function toRole(roles: string[]): Role {
  const order: Role[] = ['admin', 'faculty', 'student'];
  return (roles.find((r) => order.includes(r as Role)) ?? 'student') as Role;
}

function studentToMockUser(s: BackendStudentProfile): MockUser {
  return {
    id: s.userId,
    name: s.user.fullName,
    email: s.user.email,
    role: 'student',
    department: s.department.name,
    rollNumber: s.studentNumber,
  };
}

function facultyToMockUser(f: BackendFacultyProfile): MockUser {
  return {
    id: f.userId,
    name: f.user.fullName,
    email: f.user.email,
    role: 'faculty',
    department: f.department.name,
    employeeId: f.employeeNumber,
  };
}

function userToMockUser(u: BackendUser, department = ''): MockUser {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: toRole(u.roles),
    department,
  };
}

/* ---------- helpers ---------- */

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const res = await apiGet<PaginatedResponse<T>>(url, { params: { page, limit: 100 } });
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return all;
}

/* ---------- public service ---------- */

export const userService = {
  async getAllStudents(): Promise<MockUser[]> {
    const students = await fetchAllPages<BackendStudentProfile>('/students');
    return students.map(studentToMockUser);
  },

  async getAllFaculty(): Promise<MockUser[]> {
    const faculty = await fetchAllPages<BackendFacultyProfile>('/faculty');
    return faculty.map(facultyToMockUser);
  },

  async getAllUsers(): Promise<MockUser[]> {
    const [students, faculty, users] = await Promise.all([
      fetchAllPages<BackendStudentProfile>('/students').catch(() => [] as BackendStudentProfile[]),
      fetchAllPages<BackendFacultyProfile>('/faculty').catch(() => [] as BackendFacultyProfile[]),
      fetchAllPages<BackendUser>('/users'),
    ]);
    const profiledIds = new Set([...students.map((s) => s.userId), ...faculty.map((f) => f.userId)]);
    return [
      ...students.map(studentToMockUser),
      ...faculty.map(facultyToMockUser),
      ...users.filter((u) => !profiledIds.has(u.id)).map((u) => userToMockUser(u)),
    ];
  },

  async getUserById(id: string): Promise<MockUser> {
    try {
      const s = await apiGet<BackendStudentProfile>(`/students/${id}`);
      return studentToMockUser(s);
    } catch { /* not student */ }
    try {
      const f = await apiGet<BackendFacultyProfile>(`/faculty/${id}`);
      return facultyToMockUser(f);
    } catch { /* not faculty */ }
    const u = await apiGet<BackendUser>(`/users/${id}`);
    return userToMockUser(u);
  },

  async createUser(data: Partial<MockUser>): Promise<MockUser> {
    const newUser = await apiPost<BackendUser>('/users', {
      email: data.email,
      fullName: data.name,
      phone: null,
      role: data.role ?? 'student',
    });

    if (data.role === 'student') {
      let departmentId = '';
      try {
        const depts = await apiGet<PaginatedResponse<{ id: string }>>('/departments', { params: { page: 1, limit: 1 } });
        if (depts.data.length > 0) departmentId = depts.data[0].id;
      } catch { /* no departments */ }
      const profile = await apiPost<BackendStudentProfile>('/students', {
        userId: newUser.id,
        departmentId,
        studentNumber: data.rollNumber ?? '',
        admissionYear: new Date().getFullYear(),
        currentSemester: 1,
      });
      return studentToMockUser(profile);
    }

    if (data.role === 'faculty') {
      let departmentId = '';
      try {
        const depts = await apiGet<PaginatedResponse<{ id: string }>>('/departments', { params: { page: 1, limit: 1 } });
        if (depts.data.length > 0) departmentId = depts.data[0].id;
      } catch { /* no departments */ }
      const profile = await apiPost<BackendFacultyProfile>('/faculty', {
        userId: newUser.id,
        departmentId,
        employeeNumber: data.employeeId ?? '',
        designation: 'Faculty',
      });
      return facultyToMockUser(profile);
    }

    return userToMockUser(newUser);
  },

  async updateUser(id: string, data: Partial<MockUser>): Promise<MockUser> {
    if (data.name || data.email) {
      await apiPut<BackendUser>(`/users/${id}`, {
        ...(data.email ? { email: data.email } : {}),
        ...(data.name ? { fullName: data.name } : {}),
      });
    }
    return userService.getUserById(id);
  },

  async deleteUser(id: string): Promise<void> {
    await apiDelete(`/users/${id}`);
  },
};
