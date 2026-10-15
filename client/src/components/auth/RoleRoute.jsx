import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ allowedRoles = [] }) {
  const { user, token } = useAuth();

  const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!activeToken) {
    return <Navigate to="/login" replace />;
  }

  const storedUser =
    user ||
    JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = (storedUser.role || '').toLowerCase();
  const isPlatformAdmin =
    normalizedRole === 'platform_super_admin' ||
    normalizedRole === 'platform_admin' ||
    storedUser.isPlatformAdmin === true;

  const allowed = allowedRoles.map((r) => r.toLowerCase());

  const isStoreAdminUser =
    normalizedRole === 'store_admin' ||
    normalizedRole === 'store_owner' ||
    normalizedRole === 'admin';

  const allowsStoreAdmin =
    allowed.includes('store_admin') ||
    allowed.includes('admin') ||
    allowed.includes('store_owner');

  const hasAccess =
    allowed.includes(normalizedRole) ||
    (isPlatformAdmin && (allowed.includes('platform_super_admin') || allowed.includes('platform_admin'))) ||
    (isStoreAdminUser && allowsStoreAdmin);

  if (hasAccess) {
    return <Outlet />;
  }

  // Redirect to role-appropriate home
  if (isPlatformAdmin) {
    return <Navigate to="/platform-admin" replace />;
  }
  if (normalizedRole === 'cashier') {
    return <Navigate to="/pos" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
