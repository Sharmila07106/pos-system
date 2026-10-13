import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount from localStorage or sessionStorage
  useEffect(() => {
    try {
      const storedToken =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser =
        localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to parse stored auth session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAuthSession = (tokenVal, userVal, rememberMe) => {
    setToken(tokenVal);
    setUser(userVal);

    if (rememberMe) {
      localStorage.setItem('token', tokenVal);
      localStorage.setItem('user', JSON.stringify(userVal));
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', tokenVal);
      sessionStorage.setItem('user', JSON.stringify(userVal));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const login = async ({ email, password, rememberMe = true }) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      saveAuthSession(res.data.token, res.data.data, rememberMe);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async ({ name, email, password, rememberMe = true }) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.success) {
      saveAuthSession(res.data.token, res.data.data, rememberMe);
      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
