import { apiDownload } from '@/lib/axios';

function slugifyFilename(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'exam';
}

export const reportService = {
  async downloadExamResultsCsv(examId: string, examTitle?: string): Promise<void> {
    const fallbackFilename = `${slugifyFilename(examTitle ?? 'exam')}-results.csv`;
    await apiDownload(`/reports/export/exam/${examId}?format=csv`, fallbackFilename);
  },

  async downloadStudentResultsCsv(studentUserId: string): Promise<void> {
    await apiDownload(
      `/reports/export/student/${studentUserId}?format=csv`,
      `student-${studentUserId}-results.csv`,
    );
  },
};
