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

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STORE_OWNER', 'CASHIER'] },
    { path: '/pos', label: 'POS Checkout', icon: ShoppingCart, roles: ['ADMIN', 'STORE_OWNER', 'CASHIER'] },
    { path: '/products', label: 'Products', icon: Package, roles: ['ADMIN', 'STORE_OWNER'] },
    { path: '/inventory', label: 'Inventory', icon: Boxes, roles: ['ADMIN', 'STORE_OWNER', 'INVENTORY_MANAGER'] },
    { path: '/sales', label: 'Sales History', icon: History, roles: ['ADMIN', 'STORE_OWNER', 'CASHIER'] },
    { path: '/users', label: 'Staff & Roles', icon: Users, roles: ['ADMIN', 'STORE_OWNER'] },
    { path: '/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'STORE_OWNER', 'CASHIER', 'INVENTORY_MANAGER'] },
    { path: '/platform-admin', label: 'Platform Admin', icon: ShieldCheck, roles: ['ADMIN', 'PLATFORM_ADMIN'] },
  ];

  const userRole = user.role || 'ADMIN';
  const navItems = allNavItems.filter(item => 
    item.roles.includes(userRole) || (user.isPlatformAdmin && item.roles.includes('PLATFORM_ADMIN'))
  );

  // Determine current page title
  const currentNav = allNavItems.find(item => item.path === location.pathname);
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
        <header className="h-[72px] bg-white border-b border-[#E3E8F0] shadow-[0_1px_2px_rgba(11,27,58,0.04)] flex items-center justify-between px-8 z-20">
          {/* Page title & Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8B96AB] uppercase tracking-wider">StoreFlow</span>
            <ChevronRight size={14} className="text-[#8B96AB]" />
            <h1 className="text-xl font-extrabold text-[#0B1B3A] tracking-tight">{pageTitle}</h1>
          </div>

          {/* Right Header Area */}
          <div className="flex items-center gap-5">
            {/* Store Name & Tenant Chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#EEF2F8] border border-[#E3E8F0] rounded-[10px] text-xs font-bold text-[#0B1B3A]">
              <Store size={14} className="text-[#0FA38F]" strokeWidth={1.75} />
              <span>{user.store?.name || storeName || 'FreshMart Supermarket'}</span>
              <span className="w-2 h-2 rounded-full bg-[#0FA38F] animate-pulse" title="Tenant Active & Isolated" />
            </div>

            {/* Live Date / Time */}
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-[#0B1B3A] tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-[11px] font-semibold text-[#8B96AB]">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* User Profile Avatar Link */}
            <div 
              onClick={() => navigate('/profile')} 
              className="w-10 h-10 rounded-[12px] bg-[#E2F6F3] text-[#0FA38F] border border-[#A7F3D0] flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-[#0FA38F] hover:text-white transition-all shadow-sm"
              title="Profile Settings"
            >
              {user.name?.charAt(0) || 'U'}
            </div>
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
