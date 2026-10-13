import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="w-8 h-8 rounded-full border-3 border-[#0FA38F] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Redirect logged-in users visiting /login or /register to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] font-sans selection:bg-[#0FA38F]/20 selection:text-[#0FA38F]">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
