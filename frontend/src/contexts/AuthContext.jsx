import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (username, password) => {
    const res = await api.post(`${import.meta.env.VITE_API_URL}/auth/login`, { username, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const register = async (username, email, password) => {
    const res = await api.post(`${import.meta.env.VITE_API_URL}/auth/register`, { username, email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const googleAuth = async (credential) => {
    const res = await api.post(`${import.meta.env.VITE_API_URL}/auth/google`, { credential });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
