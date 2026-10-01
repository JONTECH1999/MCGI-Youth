export type UserRole = 'ADMIN' | 'OFFICER';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  title?: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
