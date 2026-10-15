import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Store,
  Users,
  AlertTriangle,
  Download,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, loading: authLoading } = useAuth();

  // Collapsed state with localStorage persistence
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('storeflow_admin_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Live counts for badges
  const [badges, setBadges] = useState({
    pendingApplications: 0,
    openComplaints: 0,
  });

  // Global refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Appearance accent color state
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('storeflow_platform_accent') || '#0FA38F';
  });

  // Auth Guard: Only PLATFORM_SUPER_ADMIN / PLATFORM_ADMIN permitted
  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        toast.error('Please log in to access Platform Admin');
        navigate('/login', { replace: true });
        return;
      }
      const isPlatformAdmin =
        user.role === 'PLATFORM_SUPER_ADMIN' ||
        user.role === 'PLATFORM_ADMIN' ||
        user.role === 'platform_super_admin' ||
        user.isPlatformAdmin === true;

      if (!isPlatformAdmin) {
        toast.error('Access restricted to Platform Administrators');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [authLoading, token, user, navigate]);

  // Load badges & appearance from backend
  const fetchBadgesAndAppearance = async () => {
    try {
      const [statsRes, appRes] = await Promise.allSettled([
        api.get('/platform/stats'),
        api.get('/platform/appearance'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
        const d = statsRes.value.data.data;
        setBadges({
          pendingApplications: d.pendingApplications || 0,
          openComplaints: d.openComplaints || 0,
        });
      }

      if (appRes.status === 'fulfilled' && appRes.value?.data?.data?.accentColor) {
        const color = appRes.value.data.data.accentColor;
        setAccentColor(color);
        localStorage.setItem('storeflow_platform_accent', color);
        document.documentElement.style.setProperty('--admin-accent', color);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchBadgesAndAppearance();
  }, [refreshCounter]);

  // Apply CSS custom property on load
  useEffect(() => {
    document.documentElement.style.setProperty('--admin-accent', accentColor);
  }, [accentColor]);

  // Toggle collapse
  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('storeflow_admin_sidebar_collapsed', String(next));
  };

  // Trigger page-wide refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshCounter((prev) => prev + 1);
    toast.success('Refreshing platform metrics...');
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out of Platform Admin');
    navigate('/login');
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      name: 'Overview',
      path: '/platform-admin',
      end: true,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Supermarket Applications',
      path: '/platform-admin/applications',
      end: false,
      icon: FileText,
      badge: badges.pendingApplications > 0 ? badges.pendingApplications : null,
      badgeColor: 'bg-[#F59E0B] text-white',
    },
    {
      name: 'Registered Stores',
      path: '/platform-admin/stores',
      end: false,
      icon: Store,
      badge: null,
    },
    {
      name: 'Staff & Access',
      path: '/platform-admin/staff',
      end: false,
      icon: Users,
      badge: null,
    },
    {
      name: 'Complaints',
      path: '/platform-admin/complaints',
      end: false,
      icon: AlertTriangle,
      badge: badges.openComplaints > 0 ? badges.openComplaints : null,
      badgeColor: 'bg-[#EF4444] text-white',
    },
    {
      name: 'Reports & PDF Downloads',
      path: '/platform-admin/reports',
      end: false,
      icon: Download,
      badge: null,
    },
    {
      name: 'Appearance',
      path: '/platform-admin/appearance',
      end: false,
      icon: Palette,
      badge: null,
    },
    {
      name: 'Settings',
      path: '/platform-admin/settings',
      end: false,
      icon: Settings,
      badge: null,
    },
  ];

  // Derive current page title for breadcrumb
  const currentItem = navItems.find((it) =>
    it.end ? location.pathname === it.path : location.pathname.startsWith(it.path)
  );
  const pageTitle = currentItem ? currentItem.name : 'Platform Management';

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] font-sans flex overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* FIXED SIDEBAR */}
      <aside
        style={{ '--accent': accentColor }}
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0B1B3A] text-white border-r border-[#12274F] shadow-xl flex flex-col justify-between transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[80px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top: Logo & Platform Admin Badge */}
        <div>
          <div className="h-16 flex items-center px-5 border-b border-[#12274F] justify-between">
            <Link to="/platform-admin" className="flex items-center gap-3 overflow-hidden">
              <StoreFlowLogo size={collapsed ? 28 : 32} variant="light" />
              {!collapsed && (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm tracking-tight text-white">StoreFlow</span>
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="px-1.5 py-0.2 text-[9px] font-black rounded text-white"
                    >
                      POS
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#8B96AB]">
                    Platform Admin
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                      isActive
                        ? 'bg-white/10 text-white font-bold shadow-xs'
                        : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator Bar on the left */}
                      {isActive && (
                        <span
                          style={{ backgroundColor: accentColor }}
                          className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full"
                        />
                      )}

                      <div
                        style={isActive ? { color: accentColor } : {}}
                        className={`transition-colors shrink-0 ${
                          isActive ? 'text-white' : 'group-hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      {!collapsed && (
                        <span className="truncate flex-1 tracking-tight">{item.name}</span>
                      )}

                      {/* Badge counter */}
                      {item.badge > 0 && (
                        <span
                          className={`ml-auto shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums ${
                            item.badgeColor || 'bg-white/20 text-white'
                          } ${collapsed ? 'absolute top-1.5 right-1.5 w-2 h-2 p-0 rounded-full' : ''}`}
                        >
                          {!collapsed ? item.badge : ''}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Admin Details & Collapse Button & Logout */}
        <div className="p-3 border-t border-[#12274F] space-y-2 bg-[#08152E]">
          {/* Collapse/Expand Toggle on Desktop */}
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-[#8B96AB] hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? 'Expand sidebar (260px)' : 'Collapse sidebar (80px)'}
          >
            {collapsed ? (
              <ChevronRight size={16} />
            ) : (
              <>
                <ChevronLeft size={16} />
                <span className="text-[11px]">Collapse Menu</span>
              </>
            )}
          </button>

          {/* User Account Info */}
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
              <div
                style={{ backgroundColor: accentColor }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs"
              >
                SA
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.email || 'admin@storeflow.com'}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#94A3B8]">
                    PLATFORM SUPER ADMIN
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{ backgroundColor: accentColor }}
              className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs"
              title={`${user?.email || 'admin@storeflow.com'} (PLATFORM_SUPER_ADMIN)`}
            >
              SA
            </div>
          )}

          {/* Sidebar Logout Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-bold text-[#E5484D] hover:bg-[#E5484D]/15 hover:text-[#FF6B6B] transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title="Log out of Platform Admin"
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN WRAPPER */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'
        }`}
      >
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-[#0B1B3A] text-white border-b border-[#12274F] px-4 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Left: Mobile hamburger & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              title="Open menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8B96AB] hidden sm:inline">Platform Admin</span>
                <span className="text-xs text-[#8B96AB] hidden sm:inline">/</span>
                <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                  {pageTitle}
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              title="Refresh all metrics and live database tables"
            >
              <RefreshCw
                size={14}
                className={refreshing ? 'animate-spin text-[#0FA38F]' : 'text-white'}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* POS Dashboard Switch */}
            <Link to="/dashboard">
              <button
                style={{ backgroundColor: accentColor }}
                className="px-3.5 py-2 rounded-xl hover:brightness-110 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all cursor-pointer"
              >
                <span>POS Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </Link>

            {/* Header Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-[#E5484D]/20 hover:bg-[#E5484D] border border-[#E5484D]/40 hover:border-[#E5484D] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Log out"
            >
              <LogOut size={14} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* CONTENT SCROLL AREA */}
        <main className="flex-1 overflow-y-auto bg-[#F4F7FB] p-4 sm:p-6 lg:p-8">
          <Outlet
            context={{
              refreshCounter,
              triggerRefresh: handleRefresh,
              accentColor,
              onAccentColorChange: (newColor) => {
                setAccentColor(newColor);
                localStorage.setItem('storeflow_platform_accent', newColor);
                document.documentElement.style.setProperty('--admin-accent', newColor);
              },
            }}
          />
        </main>
      </div>
    </div>
  );
}
