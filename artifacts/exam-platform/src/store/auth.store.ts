import { create } from 'zustand';
import { MockUser, Role } from '../types';
import { users } from '../data/mock-users';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
  user: MockUser | null;
  login: (role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  user: null,
  login: (role: Role) => {
    const user = users.find(u => u.role === role) || null;
    if (user) {
      set({ isAuthenticated: true, role, user });
    }
  },
  logout: () => set({ isAuthenticated: false, role: null, user: null }),
}));