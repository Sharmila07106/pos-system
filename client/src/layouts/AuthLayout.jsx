import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
        <div className="w-8 h-8 rounded-full border-3 border-[#12A58B] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Do NOT auto-redirect already logged in users. Always allow viewing the form.
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0F1B33] font-sans selection:bg-[#12A58B]/20 selection:text-[#12A58B]">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
