import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

let accessToken: string | null = null;
let refreshing: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && !original.url?.endsWith('/auth/refresh')) {
      original._retry = true;
      try {
        refreshing ||= api.post('/auth/refresh').then(({ data }) => {
          setAccessToken(data.accessToken);
          return data.accessToken;
        }).finally(() => { refreshing = null; });
        await refreshing;
        return api(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);
