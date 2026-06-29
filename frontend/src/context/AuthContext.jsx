import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { loginUser, registerUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('ims-auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.user ?? null;
    } catch {
      window.localStorage.removeItem('ims-auth');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem('ims-auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.token ?? null;
    } catch {
      window.localStorage.removeItem('ims-auth');
      return null;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const payload = token && user ? { token, user } : null;
      if (payload) {
        window.localStorage.setItem('ims-auth', JSON.stringify(payload));
      } else {
        window.localStorage.removeItem('ims-auth');
      }
    }
  }, [token, user]);

  const login = async (payload) => {
    const result = await loginUser(payload);
    setUser(result.user);
    setToken(result.access_token);
    return result;
  };

  const register = async (payload) => {
    const result = await registerUser(payload);
    setUser(result.user);
    setToken(result.access_token);
    return result;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    navigate('/auth');
  };

  const value = useMemo(() => ({ user, token, login, register, logout, isAuthenticated: Boolean(token) }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
