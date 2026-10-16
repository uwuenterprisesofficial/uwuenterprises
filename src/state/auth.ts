import { api } from '../lib/api';
import { createStore, useStore } from './store';

export interface AuthUser { id: number; username: string; role: 'management' | 'talent'; talentId: number | null; mustChange: boolean }

export const authStore = createStore<{ loading: boolean; user: AuthUser | null }>({ loading: true, user: null });

export async function refreshAuth() {
  try {
    const { user } = await api.get<{ user: AuthUser | null }>('/api/auth/me');
    authStore.set({ loading: false, user });
  } catch {
    authStore.set({ loading: false, user: null });
  }
}

export async function login(username: string, password: string) {
  const { user } = await api.post<{ user: AuthUser }>('/api/auth/login', { username, password });
  authStore.set({ loading: false, user });
}

export async function logout() {
  await api.post('/api/auth/logout').catch(() => {});
  authStore.set({ loading: false, user: null });
}

export const useAuth = () => useStore(authStore);
