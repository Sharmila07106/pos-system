import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Boxes, 
  History, 
  Users, 
  User, 
  LogOut,
  Menu,
  ChevronRight,
  Store,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreFlowLogo, StoreFlowIcon } from '../components/brand/StoreFlowLogo';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [storeName, setStoreName] = useState('Central Supermarket');
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  // Retrieve user or fallback to auth user or safe placeholder
  const user = authUser || JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null') || {
    name: 'Admin User',
    role: 'ADMIN',
    email: 'admin@storeflow.com'
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data?.data?.storeName) setStoreName(res.data.data.storeName);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const normalizedRole = (user.role || '').toLowerCase();
  const isPlatformAdmin =
    normalizedRole === 'platform_super_admin' ||
    normalizedRole === 'platform_admin' ||
    user.isPlatformAdmin === true;

  let navItems = [];
  if (isPlatformAdmin) {
    navItems = [
      { path: '/platform-admin', label: 'Platform Requests', icon: ShieldCheck },
    ];
  } else if (normalizedRole === 'cashier') {
    navItems = [
      { path: '/pos', label: 'POS Checkout', icon: ShoppingCart },
      { path: '/sales', label: 'My Bills Today', icon: History },
      { path: '/profile', label: 'Profile', icon: User },
    ];
  } else if (normalizedRole === 'inventory_manager') {
    navItems = [
      { path: '/inventory', label: 'Inventory & Stock', icon: Boxes },
      { path: '/products', label: 'Product Catalogue', icon: Package },
      { path: '/profile', label: 'Profile', icon: User },
    ];
  } else {
    // store_admin / store_owner / admin
    navItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/products', label: 'Product Catalogue', icon: Package },
      { path: '/inventory', label: 'Inventory & Stock', icon: Boxes },
      { path: '/sales', label: 'Sales & Reports', icon: History },
      { path: '/users', label: 'Staff Management', icon: Users },
      { path: '/profile', label: 'Profile', icon: User },
    ];
  }

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase();
    switch (r) {
      case 'store_admin':
      case 'store_owner':
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30 uppercase tracking-wider">
            Store Admin
          </span>
        );
      case 'inventory_manager':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EDE9FE] text-[#7C3AED] border border-[#7C3AED]/30 uppercase tracking-wider">
            Inventory Manager
          </span>
        );
      case 'cashier':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/30 uppercase tracking-wider">
            Cashier
          </span>
        );
      case 'platform_super_admin':
      case 'platform_admin':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-300 uppercase tracking-wider">
            Platform Super Admin
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
            {role || 'Staff'}
          </span>
        );
    }
  };

  // Determine current page title
  const currentNav = navItems.find((item) => item.path === location.pathname);
  const pageTitle = currentNav ? currentNav.label : 'StoreFlow';

  return (
    <div className="flex h-screen bg-[#F4F7FB] text-[#0B1B3A] overflow-hidden font-sans">
      
      {/* Sidebar: Ink Navy (#0B1B3A) */}
      <aside 
        className={`transition-all duration-300 ease-in-out bg-[#0B1B3A] text-white flex flex-col z-30 shadow-2xl ${
          collapsed ? 'w-20' : 'w-[264px]'
        }`}
      >
        {/* Top brand header */}
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-[#12274F]">
          {!collapsed ? (
            <StoreFlowLogo size={32} variant="light" />
          ) : (
            <div className="mx-auto">
              <StoreFlowIcon size={32} />
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1.5 rounded-lg text-[#8B96AB] hover:text-white hover:bg-[#12274F] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        </div>
        
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3.5 py-3 rounded-[12px] transition-all duration-200 group font-bold text-sm ${
                  isActive 
                    ? 'bg-[#12274F] text-[#0FA38F]' 
                    : 'text-[#8B96AB] hover:text-white hover:bg-[#12274F]/50'
                }`}
                title={collapsed ? item.label : ''}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div 
                    layoutId="activeSideBarTab" 
                    className="absolute left-0 top-2 bottom-2 w-1 bg-[#0FA38F] rounded-r-full shadow-[0_0_12px_#0FA38F]" 
                  />
                )}
                <Icon 
                  size={20} 
                  strokeWidth={1.75} 
                  className={isActive ? 'text-[#0FA38F]' : 'text-[#8B96AB] group-hover:text-white transition-colors'} 
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-[#12274F] space-y-2">
          {!collapsed ? (
            <div className="p-3 bg-[#12274F] rounded-[12px] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0FA38F] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(15,163,143,0.3)]">
                {user.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                <div className="text-xs text-[#8B96AB] uppercase tracking-wider font-semibold">{user.role}</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-full bg-[#0FA38F] text-white flex items-center justify-center font-bold text-sm">
              {user.name?.charAt(0) || 'A'}
            </div>
          )}

          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-[#8B96AB] hover:text-[#E5484D] hover:bg-[#E5484D]/10 transition-colors font-bold text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Log out"
          >
            <LogOut size={18} strokeWidth={1.75} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F7FB]">
        
        {/* Top Bar: White (#FFFFFF, 72px) */}
        <header className="h-[72px] bg-white border-b border-[#E3E8F0] shadow-[0_1px_2px_rgba(11,27,58,0.04)] flex items-center justify-between px-6 sm:px-8 z-20">
          {/* Page title & Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8B96AB] uppercase tracking-wider">StoreFlow</span>
            <ChevronRight size={14} className="text-[#8B96AB]" />
            <h1 className="text-lg sm:text-xl font-extrabold text-[#0B1B3A] tracking-tight">{pageTitle}</h1>
          </div>

          {/* Right Header Area */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Supermarket Name from Store Record */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#EEF2F8] border border-[#E3E8F0] rounded-[10px] text-xs font-bold text-[#0B1B3A]">
              <Store size={14} className="text-[#0FA38F]" strokeWidth={1.75} />
              <span className="truncate max-w-[180px]">
                {isPlatformAdmin ? 'StoreFlow Platform' : (user.store?.name || storeName || 'FreshMart Supermarket')}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#0FA38F] animate-pulse" title="Store Online" />
            </div>

            {/* Active Till / Register (if Cashier) */}
            {normalizedRole === 'cashier' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Till #01 (Active)</span>
              </div>
            )}

            {/* User Name & Role Pill */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-bold text-[#0B1B3A] truncate max-w-[120px]">
                {user.name}
              </span>
              {getRoleBadge(user.role)}
            </div>

            {/* User Profile Avatar Link */}
            <div 
              onClick={() => navigate('/profile')} 
              className="w-9 h-9 rounded-[10px] bg-[#E2F6F3] text-[#0FA38F] border border-[#A7F3D0] flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[#0FA38F] hover:text-white transition-all shadow-sm"
              title="Profile Settings"
            >
              {user.name?.charAt(0) || 'U'}
            </div>

            {/* Quick Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5484D]/30 text-xs font-bold text-[#E5484D] hover:bg-[#FEE2E2] transition-colors"
              title="Quick Logout"
            >
              <LogOut size={14} />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Body Viewport */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
