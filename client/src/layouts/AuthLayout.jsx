import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors absolute top-6 right-6 z-50"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const AuthLayout = () => {
  const isAuthenticated = false;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen text-text-color relative transition-colors duration-300">
      <ThemeToggle />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
