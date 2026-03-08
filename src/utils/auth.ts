import type { User } from './storage';

const CURRENT_USER_KEY = 'btech_current_user';
const ADMIN_AUTH_KEY = 'btech_admin_auth';

export const loginUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const loginAdmin = (id: string, pass: string): boolean => {
  if (id === 'Adminnikhil73' && pass === 'Nikhil7310') {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const logoutAdmin = () => {
  localStorage.removeItem(ADMIN_AUTH_KEY);
};

export const isAdminLoggedIn = (): boolean => {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
};
