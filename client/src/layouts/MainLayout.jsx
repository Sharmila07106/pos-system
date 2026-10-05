import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
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
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button 
      onClick={toggleTheme}
      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'POS Checkout', icon: ShoppingCart },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/inventory', label: 'Inventory', icon: Boxes },
    { path: '/sales', label: 'Sales History', icon: History },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen text-text-color transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ease-in-out border-r border-border-color bg-card-bg/80 backdrop-blur-xl ${collapsed ? 'w-20' : 'w-64'} flex flex-col z-20`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-color">
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Nova</span>POS
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-600 dark:text-white border border-blue-500/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} className={collapsed ? "mx-auto" : ""} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-border-color">
          <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border-color bg-card-bg/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            {/* Can put breadcrumbs or search here */}
          </div>
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="text-sm text-right hidden md:block">
                <div className="font-medium text-slate-900 dark:text-slate-200">Sharmila U</div>
                <div className="text-xs text-slate-500">Admin</div>
             </div>
             <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
               SU
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
