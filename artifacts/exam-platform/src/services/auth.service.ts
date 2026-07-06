import { apiGet, apiPost, apiPut } from '@/lib/axios';

/* ---------- backend response shapes ---------- */

interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  roles: string[];
  createdAt: string;
}

interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

interface MessageResponse {
  message: string;
}

/* ---------- public service API ---------- */

export const authService = {
  login(email: string, password: string) {
    return apiPost<AuthResponse>('/auth/login', { email, password });
  },

  register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
  }) {
    return apiPost<AuthResponse>('/auth/register', data);
  },

  refreshToken(refreshToken: string) {
    return apiPost<AuthResponse>('/auth/refresh', { refreshToken });
  },

  logout(refreshToken: string) {
    return apiPost<MessageResponse>('/auth/logout', { refreshToken });
  },

  getMe() {
    return apiGet<UserResponse>('/auth/me');
  },

  changePassword(currentPassword: string, newPassword: string) {
    return apiPut<MessageResponse>('/auth/password', {
      currentPassword,
      newPassword,
    });
  },
};

/* ---------- exported types for downstream consumers ---------- */

export type { UserResponse, AuthResponse, MessageResponse };
