import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] font-sans selection:bg-[#0FA38F]/20 selection:text-[#0FA38F]">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
