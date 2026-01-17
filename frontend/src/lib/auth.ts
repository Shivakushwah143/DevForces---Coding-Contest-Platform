import { User } from '../types';

export const saveAuth = (token: string, user: User) => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getAuth = (): { token: string | null; user: User | null } => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
  const { token } = getAuth();
  return !!token;
};

export const isAdmin = (): boolean => {
  const { user } = getAuth();
  return user?.role === 'Admin';
};
