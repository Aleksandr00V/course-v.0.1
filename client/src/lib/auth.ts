export type Role = 'user' | 'admin' | 'superadmin';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
};

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
