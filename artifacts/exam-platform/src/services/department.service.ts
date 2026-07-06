import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/axios';

/* ---------- backend shapes ---------- */

interface BackendDepartment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  _count?: {
    students: number;
    faculty: number;
    courses: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface BackendDepartmentStats {
  id: string;
  code: string;
  name: string;
  studentCount: number;
  facultyCount: number;
  courseCount: number;
  examCount: number;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- public service ---------- */

export const departmentService = {
  async getAll(): Promise<BackendDepartment[]> {
    const all: BackendDepartment[] = [];
    let page = 1;
    while (true) {
      const res = await apiGet<Paginated<BackendDepartment>>('/departments', { params: { page, limit: 100 } });
      all.push(...res.data);
      if (page >= res.meta.totalPages) break;
      page++;
    }
    return all;
  },

  async getById(id: string): Promise<BackendDepartment> {
    return apiGet<BackendDepartment>(`/departments/${id}`);
  },

  async create(data: { code: string; name: string; description?: string }): Promise<BackendDepartment> {
    return apiPost<BackendDepartment>('/departments', data);
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<BackendDepartment> {
    return apiPut<BackendDepartment>(`/departments/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/departments/${id}`);
  },

  async getStats(id: string): Promise<BackendDepartmentStats> {
    return apiGet<BackendDepartmentStats>(`/departments/${id}/stats`);
  },

  async getStatsAll(): Promise<BackendDepartmentStats[]> {
    const departments = await departmentService.getAll();
    return Promise.all(
      departments.map((d) =>
        departmentService.getStats(d.id).catch(() => ({
          id: d.id,
          code: d.code,
          name: d.name,
          studentCount: d._count?.students ?? 0,
          facultyCount: d._count?.faculty ?? 0,
          courseCount: d._count?.courses ?? 0,
          examCount: 0,
        })),
      ),
    );
  },
};
