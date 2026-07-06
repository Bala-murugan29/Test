import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/axios';

/* ---------- backend shapes ---------- */

interface BackendQuestion {
  id: string;
  departmentId: string;
  createdByUserId: string | null;
  type: string;
  status: string;
  title: string;
  prompt: string;
  explanation: string | null;
  difficulty: number;
  marks: number;
  timeLimitSeconds: number | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
  mcq: {
    options: { text: string }[];
    correctOptionIndex: number;
    shuffleOptions: boolean;
    answerExplanation: string | null;
  } | null;
  coding: {
    starterCode: string | null;
    testCases: { input: string; expectedOutput: string }[];
    languageConstraints: string[] | null;
    sampleInput: string | null;
    sampleOutput: string | null;
  } | null;
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/* ---------- public service ---------- */

export const questionService = {
  async getAll(params?: Record<string, string | number>): Promise<BackendQuestion[]> {
    const all: BackendQuestion[] = [];
    let page = 1;
    while (true) {
      const res = await apiGet<Paginated<BackendQuestion>>('/questions', {
        params: { page, limit: 100, ...params },
      });
      all.push(...res.data);
      if (page >= res.meta.totalPages) break;
      page++;
    }
    return all;
  },

  async getById(id: string): Promise<BackendQuestion> {
    return apiGet<BackendQuestion>(`/questions/${id}`);
  },

  async createMcq(data: {
    departmentId: string;
    title: string;
    prompt: string;
    difficulty: number;
    marks: number;
    options: { text: string }[];
    correctOptionIndex: number;
  }): Promise<BackendQuestion> {
    return apiPost<BackendQuestion>('/questions/mcq', data);
  },

  async createCoding(data: {
    departmentId: string;
    title: string;
    prompt: string;
    difficulty: number;
    marks: number;
    testCases: { input: string; expectedOutput: string }[];
    starterCode?: string;
  }): Promise<BackendQuestion> {
    return apiPost<BackendQuestion>('/questions/coding', data);
  },

  async update(
    id: string,
    data: Partial<Pick<BackendQuestion, 'title' | 'prompt' | 'difficulty' | 'marks'>>,
  ): Promise<BackendQuestion> {
    return apiPut<BackendQuestion>(`/questions/${id}`, data);
  },

  async updateStatus(id: string, status: string): Promise<BackendQuestion> {
    return apiPut<BackendQuestion>(`/questions/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await apiDelete(`/questions/${id}`);
  },

  async getUsage(id: string) {
    return apiGet<{ examCount: number; lastUsedAt: string | null }>(`/questions/${id}/usage`);
  },
};
