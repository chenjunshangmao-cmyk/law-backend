import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // Google OAuth 直接登录（token + user 对象）
  loginWithToken: (token: string, user: User) => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  // 标记是否已确认 token 无效（只有真正 401 时才设为 true）
  const [tokenInvalidated, setTokenInvalidated] = useState(false);

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.auth.profile();
      setUser(res.data || res.user || res);
      setTokenInvalidated(false);
    } catch (err: any) {
      const msg = err?.message || '';
      // 只有明确的 401/认证失败才清除 token
      // 网络超时、服务器错误、Render冷启动等不踢出用户
      if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('认证') || msg.includes('无效') || msg.includes('expired')) {
        console.warn('[AuthContext] Token 已失效，清除登录状态');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setTokenInvalidated(true);
      } else {
        // 网络/超时/服务器错误 → 保留 token，保持登录状态
        console.warn('[AuthContext] 获取用户信息失败（非认证问题），保持登录:', msg);
        // 不清除 token，不清除 user（如果之前有 user 信息的话保留）
        // 如果完全没有 user 信息，至少不踢出去
        setTokenInvalidated(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 自动重试机制：非 401 错误时，3秒后静默重试一次
  const retryCountRef = React.useRef(0);
  useEffect(() => {
    if (!loading && !user && token && !tokenInvalidated) {
      // 有 token 但没拿到用户信息，且不是认证失败 → 可能是网络/冷启动问题
      if (retryCountRef.current < 2) {
        const timer = setTimeout(() => {
          retryCountRef.current += 1;
          console.warn(`[AuthContext] 静默重试获取用户信息 (${retryCountRef.current}/2)...`);
          refreshUser();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    // 重置计数器（当 user 成功加载时）
    if (user) {
      retryCountRef.current = 0;
    }
  }, [loading, user, token, tokenInvalidated]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    const { token: newToken, user: newUser } = res.data || res;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  // Google OAuth 直接登录（token + user 对象）
  const loginWithToken = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await api.auth.register(email, password, name);
    const { token: newToken, user: newUser } = res.data || res;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.auth.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
