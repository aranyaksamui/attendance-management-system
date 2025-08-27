import { apiRequest } from "@/lib/queryClient";
import type { LoginRequest } from "@shared/schema";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'teacher' | 'student';
  student?: any;
  teacher?: any;
}

let currentUser: AuthUser | null = null;

export const getCurrentUser = (): AuthUser | null => {
  return currentUser;
};

export const setCurrentUser = (user: AuthUser | null): void => {
  currentUser = user;
};

export const login = async (credentials: LoginRequest): Promise<AuthUser> => {
  const response = await apiRequest("POST", "/api/login", credentials);
  const userData = await response.json();
  
  setCurrentUser(userData);
  return userData;
};

export const logout = (): void => {
  setCurrentUser(null);
};

export const isAuthenticated = (): boolean => {
  return currentUser !== null;
};

export const hasRole = (role: 'teacher' | 'student'): boolean => {
  return currentUser?.role === role;
};
