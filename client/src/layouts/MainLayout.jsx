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
  Menu
} from 'lucide-react';

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
    <div className="flex h-screen bg-[#030712] text-slate-200 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0a0f25]/80 backdrop-blur-xl ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Nova</span>POS
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
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
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-white border border-blue-500/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }
              `}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} className={collapsed ? "mx-auto" : ""} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <button className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-[#030712]/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div></div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-right hidden md:block">
                <div className="font-medium text-slate-200">Sharmila U</div>
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
