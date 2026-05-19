import { create } from 'zustand';
import { getMe } from '../api/users';
import { login as loginApi, logoutApi, register as registerApi } from '../api/auth';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  user: null,
  loading: false,
  isDark: localStorage.getItem('theme') === 'dark',
  setTheme: (dark) => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
    set({ isDark: dark });
  },
  login: async (values) => {
    set({ loading: true });
    const data = await loginApi(values);
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    const user = await getMe();
    set({ token: data.access_token, refreshToken: data.refresh_token, user, loading: false });
  },
  register: async (values) => registerApi(values),
  hydrate: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    set({ loading: true });
    try {
      const user = await getMe();
      set({ user, token });
    } finally { set({ loading: false }); }
  },
  logout: async () => {
    try { await logoutApi(); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ token: null, refreshToken: null, user: null });
  },
}));
