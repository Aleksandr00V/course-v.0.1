import axios from 'axios';
import type { Vehicle, Driver, Trip } from '../types';
import { getToken } from './auth';

const http = axios.create({ baseURL: 'https://course-v-0-1-2.onrender.com/api' });
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  async list(): Promise<Vehicle[]> {
    const { data } = await http.get<Vehicle[]>('/vehicles');
    return data;
  },
  async get(id: string): Promise<Vehicle> {
    const { data } = await http.get<Vehicle>(`/vehicles/${id}`);
    return data;
  },
  async create(payload: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const { data } = await http.post<Vehicle>('/vehicles', payload);
    return data;
  },
  async update(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const { data } = await http.put<Vehicle>(`/vehicles/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/vehicles/${id}`);
  },
};

export const driversApi = {
  async list(): Promise<Driver[]> {
    const { data } = await http.get<Driver[]>('/drivers');
    return data;
  },
  async get(id: string): Promise<Driver> {
    const { data } = await http.get<Driver>(`/drivers/${id}`);
    return data;
  },
  async create(payload: Omit<Driver, 'id'>): Promise<Driver> {
    const { data } = await http.post<Driver>('/drivers', payload);
    return data;
  },
  async update(id: string, payload: Partial<Driver>): Promise<Driver> {
    const { data } = await http.put<Driver>(`/drivers/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/drivers/${id}`);
  },
  async uploadPhoto(id: string, file: File): Promise<{ photoUrl: string }> {
    const form = new FormData();
    form.append('photo', file);
    const { data } = await http.post<{ photoUrl: string }>(`/drivers/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export type SafeUser = { id: string; email: string; name?: string; role: 'user' | 'admin' | 'superadmin'; position?: string };

export const usersApi = {
  async list(): Promise<SafeUser[]> {
    const { data } = await http.get<SafeUser[]>('/users');
    return data;
  },
  async create(payload: { email: string; password: string; name?: string; role: SafeUser['role']; position?: string }): Promise<SafeUser> {
    const { data } = await http.post<SafeUser>('/users', payload);
    return data;
  },
  async update(id: string, payload: Partial<{ email: string; password: string; name?: string; role: SafeUser['role']; position?: string }>): Promise<SafeUser> {
    const { data } = await http.put<SafeUser>(`/users/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/users/${id}`);
  },
};

export const registrationsApi = {
  async listPending(): Promise<Array<Omit<SafeUser, 'role'> & { role: SafeUser['role']; status?: string }>> {
    const { data } = await http.get('/registrations');
    return data;
  },
  async approve(id: string): Promise<SafeUser> {
    const { data } = await http.post<SafeUser>(`/users/${id}/approve`, {});
    return data;
  },
  async reject(id: string): Promise<SafeUser> {
    const { data } = await http.post<SafeUser>(`/users/${id}/reject`, {});
    return data;
  },
};

export const tripsApi = {
  async list(params?: { driverId?: string; vehicleId?: string }): Promise<Trip[]> {
    const { data } = await http.get<Trip[]>('/trips', { params });
    return data;
  },
  async create(payload: Omit<Trip, 'id' | 'date'> & { date?: string }): Promise<Trip> {
    const { data } = await http.post<Trip>('/trips', payload);
    return data;
  },
};

export const meApi = {
  async get(): Promise<{ id: string; email: string; name?: string; role: string; position?: string }>{
    const { data } = await http.get('/me');
    return data;
  },
  async update(payload: Partial<{ email: string; name?: string; password: string; position?: string }>): Promise<{ token: string; user: { id: string; email: string; name?: string; role: string; position?: string } }>{
    const { data } = await http.put('/me', payload);
    return data;
  },
};

export type RequestItem = {
  id: string;
  vehicleId: string;
  driverId: string;
  from: string;
  to: string;
  departAt: string;
  arriveAt?: string;
  kilometers?: number;
  status: 'planned' | 'in-progress' | 'done' | 'canceled';
  notes?: string;
  createdAt: string;
};

export const requestsApi = {
  async list(): Promise<RequestItem[]> {
    const { data } = await http.get<RequestItem[]>('/requests');
    return data;
  },
  async create(payload: Omit<RequestItem, 'id' | 'status' | 'createdAt'> & { status?: RequestItem['status'] }): Promise<RequestItem> {
    const { data } = await http.post<RequestItem>('/requests', payload);
    return data;
  },
  async update(id: string, payload: Partial<RequestItem>): Promise<RequestItem> {
    const { data } = await http.put<RequestItem>(`/requests/${id}`, payload);
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/requests/${id}`);
  },
};
