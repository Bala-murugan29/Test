import { MockUser } from '../types';

export const users: MockUser[] = [
  {
    id: 's001',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@university.edu',
    role: 'student',
    department: 'Computer Science',
    rollNumber: 'CS2021001',
  },
  {
    id: 's002',
    name: 'Priya Singh',
    email: 'priya.singh@university.edu',
    role: 'student',
    department: 'Computer Science',
    rollNumber: 'CS2021002',
  },
  {
    id: 's003',
    name: 'Rohit Verma',
    email: 'rohit.verma@university.edu',
    role: 'student',
    department: 'Electronics',
    rollNumber: 'EC2021001',
  },
  {
    id: 's004',
    name: 'Sneha Patel',
    email: 'sneha.patel@university.edu',
    role: 'student',
    department: 'Mechanical',
    rollNumber: 'ME2021001',
  },
  {
    id: 's005',
    name: 'Vikram Nair',
    email: 'vikram.nair@university.edu',
    role: 'student',
    department: 'Computer Science',
    rollNumber: 'CS2021005',
  },
  {
    id: 'f001',
    name: 'Dr. Priya Mehta',
    email: 'priya.mehta@university.edu',
    role: 'faculty',
    department: 'Computer Science',
    employeeId: 'FAC001',
  },
  {
    id: 'f002',
    name: 'Prof. Suresh Iyer',
    email: 'suresh.iyer@university.edu',
    role: 'faculty',
    department: 'Electronics',
    employeeId: 'FAC002',
  },
  {
    id: 'f003',
    name: 'Dr. Anita Bose',
    email: 'anita.bose@university.edu',
    role: 'faculty',
    department: 'Mechanical',
    employeeId: 'FAC003',
  },
  {
    id: 'a001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@university.edu',
    role: 'admin',
    department: 'Administration',
    employeeId: 'ADM001',
  },
];

export const getMockUserByRole = (role: MockUser['role']): MockUser | undefined =>
  users.find((u) => u.role === role);
