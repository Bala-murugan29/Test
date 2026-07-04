import { DepartmentStats, MonthlyStats, ExamPerformance } from '../types';

export const departmentStats: DepartmentStats[] = [
  { department: 'Computer Science', totalStudents: 320, avgScore: 74.2, passRate: 88 },
  { department: 'Electronics', totalStudents: 240, avgScore: 68.5, passRate: 81 },
  { department: 'Mechanical', totalStudents: 280, avgScore: 71.1, passRate: 84 },
  { department: 'Civil', totalStudents: 180, avgScore: 69.8, passRate: 79 },
  { department: 'Information Technology', totalStudents: 200, avgScore: 76.4, passRate: 91 },
];

export const monthlyStats: MonthlyStats[] = [
  { month: 'Jan', examsCreated: 8, studentsAppeared: 420, avgScore: 68 },
  { month: 'Feb', examsCreated: 12, studentsAppeared: 580, avgScore: 71 },
  { month: 'Mar', examsCreated: 15, studentsAppeared: 720, avgScore: 69 },
  { month: 'Apr', examsCreated: 10, studentsAppeared: 510, avgScore: 73 },
  { month: 'May', examsCreated: 18, studentsAppeared: 890, avgScore: 74 },
  { month: 'Jun', examsCreated: 6, studentsAppeared: 280, avgScore: 70 },
  { month: 'Jul', examsCreated: 4, studentsAppeared: 190, avgScore: 66 },
  { month: 'Aug', examsCreated: 9, studentsAppeared: 450, avgScore: 72 },
  { month: 'Sep', examsCreated: 14, studentsAppeared: 680, avgScore: 75 },
  { month: 'Oct', examsCreated: 16, studentsAppeared: 810, avgScore: 76 },
  { month: 'Nov', examsCreated: 20, studentsAppeared: 980, avgScore: 73 },
  { month: 'Dec', examsCreated: 11, studentsAppeared: 540, avgScore: 71 },
];

export const examPerformance: ExamPerformance[] = [
  { examTitle: 'Advanced DBMS', avgScore: 72, passRate: 86, totalAppeared: 48 },
  { examTitle: 'Data Structures', avgScore: 68, passRate: 80, totalAppeared: 62 },
  { examTitle: 'Operating Systems', avgScore: 74, passRate: 89, totalAppeared: 45 },
  { examTitle: 'Computer Networks', avgScore: 65, passRate: 76, totalAppeared: 52 },
  { examTitle: 'Software Engineering', avgScore: 78, passRate: 92, totalAppeared: 41 },
  { examTitle: 'Digital Electronics', avgScore: 70, passRate: 83, totalAppeared: 58 },
];

export const platformSummary = {
  totalStudents: 1220,
  totalFaculty: 48,
  totalExams: 186,
  avgPassRate: 84.6,
  activeExams: 3,
  examsConductedThisMonth: 11,
};
