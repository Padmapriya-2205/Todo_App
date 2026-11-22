import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { void refreshSession(); }, []);
  async function refreshSession() {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }
  async function login(username: string, password: string) {
    const { data } = await api.post('/auth/login', { username, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }
  async function register(username: string, password: string) {
    await api.post('/auth/register', { username, password });
  }
  async function logout() {
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, restore: refreshSession }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
