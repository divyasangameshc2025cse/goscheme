import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('goscheme_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('goscheme_jwt_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => {
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('goscheme_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        localStorage.removeItem('goscheme_jwt_token');
        localStorage.removeItem('goscheme_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = (token, userObj) => {
    localStorage.setItem('goscheme_jwt_token', token);
    localStorage.setItem('goscheme_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    if (data.success) persistSession(data.token, data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    if (data.success) persistSession(data.token, data.user);
    return data;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const { data } = await authApi.updateProfile(payload);
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('goscheme_user', JSON.stringify(data.user));
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('goscheme_jwt_token');
    localStorage.removeItem('goscheme_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
