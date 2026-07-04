export type Role = 'student' | 'faculty' | 'admin';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
  rollNumber?: string;      // students only
  employeeId?: string;      // faculty/admin only
}