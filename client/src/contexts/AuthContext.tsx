import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { meApi } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/auth';

type User = { id: string; email: string; name?: string; role: 'user' | 'admin' | 'superadmin'; position?: string };

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string, position?: string) => Promise<User>;
  logout: () => void;
  updateProfile: (payload: Partial<{ email: string; name?: string; password: string; position?: string }>) => Promise<User>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const http = axios.create({ baseURL: 'https://course-v-0-1-2.onrender.com/api' });
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    // Lightweight decode (header.payload.signature) without validation, for demo
    try {
      const payloadBase64 = token.split('.')[1];
      const json = JSON.parse(atob(payloadBase64));
      if (json && json.email) setUser({ id: json.id, email: json.email, name: json.name, role: json.role });
    } catch {}
    // Try to refresh actual user data
    (async () => {
      try {
        const me = await meApi.get();
        if (me && me.email) setUser({ id: me.id, email: me.email, name: me.name, role: me.role as any });
      } catch {}
    })();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    async login(email, password) {
      const { data } = await http.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return data.user as User;
    },
    async register(email, password, name, position) {
      const { data } = await http.post('/auth/register', { email, password, name, position });
      setToken(data.token);
      setUser(data.user);
      return data.user as User;
    },
    logout() {
      clearToken();
      setUser(null);
    },
    async updateProfile(payload) {
      const { token, user: u } = await meApi.update(payload);
      setToken(token);
      setUser({ id: u.id, email: u.email, name: u.name, role: u.role as any, position: u.position });
      return { id: u.id, email: u.email, name: u.name, role: u.role as any, position: u.position };
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
