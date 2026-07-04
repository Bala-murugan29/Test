import { MockUser } from '../types';
import { users } from '../data/mock-users';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mutableUsers: MockUser[] = [...users];

export const userService = {
  getAllStudents: async (): Promise<MockUser[]> => {
    await delay(400);
    return mutableUsers.filter((u) => u.role === 'student');
  },

  getAllFaculty: async (): Promise<MockUser[]> => {
    await delay(400);
    return mutableUsers.filter((u) => u.role === 'faculty');
  },

  getAllUsers: async (): Promise<MockUser[]> => {
    await delay(400);
    return [...mutableUsers];
  },

  getUserById: async (id: string): Promise<MockUser> => {
    await delay(300);
    const user = mutableUsers.find((u) => u.id === id);
    if (!user) throw new Error(`User "${id}" not found.`);
    return user;
  },

  createUser: async (data: Partial<MockUser>): Promise<MockUser> => {
    await delay(600);
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: data.name ?? 'New User',
      email: data.email ?? 'user@university.edu',
      role: data.role ?? 'student',
      department: data.department ?? 'Computer Science',
      rollNumber: data.rollNumber,
      employeeId: data.employeeId,
    };
    mutableUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id: string, data: Partial<MockUser>): Promise<MockUser> => {
    await delay(500);
    const idx = mutableUsers.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User "${id}" not found.`);
    mutableUsers[idx] = { ...mutableUsers[idx], ...data };
    return mutableUsers[idx];
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(400);
    const idx = mutableUsers.findIndex((u) => u.id === id);
    if (idx !== -1) mutableUsers.splice(idx, 1);
  },
};
