import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FileText,
  RefreshCw,
  Store,
  Users,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
  Power,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';

export default function PlatformAdmin() {
  const navigate = useNavigate();
  const { user, token, logout, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'stores' | 'health'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Authentication & Role Route Guard
  useEffect(() => {
    if (!authLoading) {
      if (!token || !user) {
        toast.error('Please sign in to access Platform Admin');
        navigate('/login', { replace: true });
        return;
      }
      const isPlatformAdmin =
        user.role === 'PLATFORM_SUPER_ADMIN' ||
        user.role === 'PLATFORM_ADMIN' ||
        user.isPlatformAdmin === true;

      if (!isPlatformAdmin) {
        toast.error('Access restricted to Platform Administrators');
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [authLoading, token, user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out of Platform Admin');
    navigate('/login');
  };

  // Data states
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    pendingApplications: 0,
    totalApplications: 0,
    platformVersion: '2.0.0-multi-tenant',
    systemHealth: 'OPERATIONAL'
  });
  const [applications, setApplications] = useState([]);
  const [stores, setStores] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch stats and lists
  const loadPlatformData = async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes, storesRes, auditRes] = await Promise.allSettled([
        api.get('/platform/stats'),
        api.get('/platform/applications'),
        api.get('/platform/stores'),
        api.get('/platform/audit-logs')
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
        setStats(statsRes.value.data.data);
      }
      if (appsRes.status === 'fulfilled' && appsRes.value?.data?.success) {
        setApplications(appsRes.value.data.data || []);
      }
      if (storesRes.status === 'fulfilled' && storesRes.value?.data?.success) {
        setStores(storesRes.value.data.data || []);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data?.success) {
        setAuditLogs(auditRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load platform admin data:', err);
      if (err.response?.status === 503 || err.response?.data?.code === 'DB_NOT_CONNECTED') {
        toast.error('Database connection offline. Please check MONGODB_URI.');
      } else {
        toast.error('Failed to load platform data. Please check connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlatformData();
    }
  }, [token]);

  // Review Application
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (reviewAction !== 'APPROVE' && !reviewNotes.trim()) {
      toast.error('Please enter review notes explaining why changes or rejection is needed.');
      return;
    }

    try {
      setSubmittingReview(true);
      const targetId = selectedApp._id || selectedApp.applicationId;
      const res = await api.put(`/platform/applications/${targetId}/review`, {
        action: reviewAction,
        reviewNotes: reviewNotes.trim()
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Application ${reviewAction.toLowerCase()}d successfully.`);
        setSelectedApp(null);
        setReviewNotes('');
        loadPlatformData();
      } else {
        toast.error(res.data?.message || 'Review action failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Review action failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Toggle Store Status (Suspend / Reactivate)
  const handleToggleStoreStatus = async (store) => {
    const isSuspended = store.status === 'SUSPENDED';
    const nextStatus = isSuspended ? 'APPROVED' : 'SUSPENDED';
    const confirmMsg = isSuspended 
      ? `Reactivate supermarket "${store.name}"? Staff will regain POS access.`
      : `Are you sure you want to SUSPEND "${store.name}"? All POS checkout and staff access will be locked immediately.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/platform/stores/${store._id}/status`, {
        status: nextStatus,
        reason: isSuspended ? 'Reactivated by Platform Admin' : 'Suspended for platform review'
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Store status updated to ${nextStatus}.`);
        loadPlatformData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update store status.';
      toast.error(msg);
    }
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || 
      (app.businessName && app.businessName.toLowerCase().includes(q)) ||
      (app.applicationId && app.applicationId.toLowerCase().includes(q)) ||
      (app.ownerName && app.ownerName.toLowerCase().includes(q)) ||
      (app.city && app.city.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  // Filtered stores
  const filteredStores = stores.filter((st) => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || 
      (st.name && st.name.toLowerCase().includes(q)) ||
      (st.storeCode && st.storeCode.toLowerCase().includes(q)) ||
      (st.city && st.city.toLowerCase().includes(q));
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30"><CheckCircle2 size={12} /> APPROVED</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/30"><XCircle size={12} /> REJECTED</span>;
      case 'CHANGES_REQUESTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#7C3AED] border border-[#7C3AED]/30"><AlertTriangle size={12} /> CHANGES REQUESTED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30"><Clock size={12} /> PENDING REVIEW</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] selection:bg-[#0FA38F]/20 selection:text-[#0FA38F]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0B1B3A] text-white border-b border-[#12274F] shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StoreFlowLogo size={32} variant="light" />
            <div className="h-5 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0FA38F]/20 border border-[#0FA38F]/40 text-[#0FA38F] text-xs font-extrabold uppercase tracking-wider">
                Platform Admin
              </span>
              <span className="text-xs text-white/60 hidden sm:inline">Multi-Tenant Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full bg-[#0FA38F]" />
                <span className="font-semibold">{user.email}</span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-[#0FA38F]/20 text-[#0FA38F]">
                  {user.role}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPlatformData}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link to="/dashboard">
              <Button variant="primary" size="sm">
                POS Dashboard <ArrowRight size={14} />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/20 text-white hover:bg-[#E5484D]/20 hover:border-[#E5484D] hover:text-[#E5484D] transition-colors"
              title="Sign out of Platform Admin"
            >
              <Power size={14} className="text-[#E5484D]" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-[#E3E8F0] bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Total Supermarkets</div>
              <div className="text-3xl font-extrabold text-[#0B1B3A] mt-1">{stats.totalStores}</div>
              <div className="text-xs text-[#0FA38F] font-semibold mt-1">Tenant Database Isolated</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center">
              <Building2 size={24} />
            </div>
          </Card>

          <Card className="p-5 border-[#E3E8F0] bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Active Operational</div>
              <div className="text-3xl font-extrabold text-[#0FA38F] mt-1">{stats.activeStores}</div>
              <div className="text-xs text-[#53607A] font-semibold mt-1">Live POS Checkouts</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#0FA38F]/10 text-[#0FA38F] flex items-center justify-center">
              <Store size={24} />
            </div>
          </Card>

          <Card className="p-5 border-[#E3E8F0] bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Pending Approvals</div>
              <div className="text-3xl font-extrabold text-[#D97706] mt-1">{stats.pendingApplications}</div>
              <div className="text-xs text-[#D97706] font-semibold mt-1">Awaiting Compliance Review</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock size={24} />
            </div>
          </Card>

          <Card className="p-5 border-[#E3E8F0] bg-white flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">System Health</div>
              <div className="text-xl font-extrabold text-[#0FA38F] mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0FA38F] animate-pulse" />
                {stats.systemHealth}
              </div>
              <div className="text-xs text-[#53607A] font-medium mt-1">v{stats.platformVersion}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center">
              <Activity size={24} />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#CBD5E1] gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'applications'
                ? 'text-[#0FA38F]'
                : 'text-[#53607A] hover:text-[#0B1B3A]'
            }`}
          >
            Supermarket Applications
            {stats.pendingApplications > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-[#D97706] text-white">
                {stats.pendingApplications}
              </span>
            )}
            {activeTab === 'applications' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'stores'
                ? 'text-[#0FA38F]'
                : 'text-[#53607A] hover:text-[#0B1B3A]'
            }`}
          >
            Registered Stores & Tenancy
            {activeTab === 'stores' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'audit'
                ? 'text-[#0FA38F]'
                : 'text-[#53607A] hover:text-[#0B1B3A]'
            }`}
          >
            Audit Trail & Compliance ({auditLogs.length})
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />
            )}
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
            <input
              type="text"
              placeholder={activeTab === 'applications' ? "Search by store, owner, ID..." : "Search registered stores..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
            />
          </div>

          {activeTab === 'applications' && (
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['ALL', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-[#0B1B3A] text-white shadow-sm'
                      : 'bg-white text-[#53607A] border border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Applications List */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Application ID</th>
                    <th className="py-3.5 px-4">Supermarket</th>
                    <th className="py-3.5 px-4">Owner / Contact</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0] text-sm">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#53607A]">
                        <Building2 className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                        <p className="font-semibold">No applications found matching your criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app._id || app.applicationId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0FA38F]">
                          {app.applicationId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1B3A]">{app.businessName}</div>
                          <div className="text-xs text-[#53607A]">{app.storeType} &bull; {app.registerCount || 1} Counters</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0B1B3A]">{app.ownerName}</div>
                          <div className="text-xs text-[#53607A]">{app.email}</div>
                          <div className="text-xs text-[#8B96AB]">{app.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-xs text-[#53607A]">
                          {app.city}, {app.state || 'TN'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#53607A]">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setReviewAction(app.status === 'PENDING' ? 'APPROVE' : app.status);
                              setReviewNotes(app.reviewNotes || '');
                            }}
                            className="font-bold text-xs border-[#CBD5E1]"
                          >
                            <Eye size={13} className="mr-1" /> Review
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Registered Stores List */}
        {activeTab === 'stores' && (
          <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Store Code</th>
                    <th className="py-3.5 px-4">Supermarket Name</th>
                    <th className="py-3.5 px-4">Business Email / Phone</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0] text-sm">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[#53607A]">
                        <Store className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                        <p className="font-semibold">No registered stores found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((st) => (
                      <tr key={st._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0B1B3A]">
                          {st.storeCode || 'STR-DEMO'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1B3A]">{st.name}</div>
                          <div className="text-xs text-[#53607A]">Slug: {st.slug} &bull; Type: {st.storeType || 'Supermarket'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-xs text-[#0B1B3A]">{st.businessEmail || 'N/A'}</div>
                          <div className="text-xs text-[#53607A]">{st.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                          {st.city || 'Chennai'}
                        </td>
                        <td className="py-3.5 px-4">
                          {st.status === 'SUSPENDED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/30">
                              <Power size={12} /> SUSPENDED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30">
                              <CheckCircle2 size={12} /> ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStoreStatus(st)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              st.status === 'SUSPENDED'
                                ? 'bg-[#E2F6F3] text-[#0FA38F] border-[#0FA38F]/40 hover:bg-[#0FA38F]/10'
                                : 'bg-[#FEE2E2] text-[#E5484D] border-[#E5484D]/40 hover:bg-[#E5484D]/10'
                            }`}
                          >
                            {st.status === 'SUSPENDED' ? 'Reactivate Store' : 'Suspend Store'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Trail & Compliance */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Operator</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Audit Details</th>
                    <th className="py-3.5 px-4 text-right">Security State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0] text-sm">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[#53607A]">
                        <FileText className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                        <p className="font-semibold">No audit logs recorded yet</p>
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1B3A]">{log.actorName || 'System'}</div>
                          <div className="text-[11px] text-[#53607A] uppercase">{log.actorRole || 'PLATFORM_ADMIN'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30 uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono font-bold text-[#0B1B3A]">
                          {log.entity}: {log.entityId || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#53607A] max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0FA38F]">
                            <ShieldCheck size={14} /> Verified
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Review Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E3E8F0] shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#0B1B3A] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0FA38F]/20 text-[#0FA38F] flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Review Supermarket Application</h3>
                  <p className="text-xs text-white/70">ID: {selectedApp.applicationId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Application Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                  <span className="text-[#53607A] font-semibold uppercase">Supermarket Name</span>
                  <p className="font-extrabold text-sm text-[#0B1B3A] mt-0.5">{selectedApp.businessName}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                  <span className="text-[#53607A] font-semibold uppercase">Store Format</span>
                  <p className="font-extrabold text-sm text-[#0B1B3A] mt-0.5">{selectedApp.storeType}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                  <span className="text-[#53607A] font-semibold uppercase">Owner Full Name</span>
                  <p className="font-extrabold text-sm text-[#0B1B3A] mt-0.5">{selectedApp.ownerName}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0]">
                  <span className="text-[#53607A] font-semibold uppercase">Contact Information</span>
                  <p className="font-bold text-xs text-[#0B1B3A] mt-0.5">{selectedApp.email}</p>
                  <p className="text-xs text-[#53607A]">{selectedApp.phone}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0] col-span-2">
                  <span className="text-[#53607A] font-semibold uppercase">Physical Address</span>
                  <p className="font-medium text-xs text-[#0B1B3A] mt-0.5">
                    {selectedApp.address}, {selectedApp.city}, {selectedApp.state || 'Tamil Nadu'} - {selectedApp.pincode}
                  </p>
                </div>
              </div>

              {/* Regulatory & Hardware */}
              <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#E3E8F0] text-xs space-y-2">
                <div className="font-bold text-[#0B1B3A] uppercase tracking-wider">Business Verification & Registers:</div>
                <div className="grid grid-cols-2 gap-2 text-[#53607A]">
                  <div>&bull; Planned POS Registers: <strong className="text-[#0B1B3A]">{selectedApp.registerCount || 1} Counters</strong></div>
                  <div>&bull; Regulatory / GST: <strong className="text-[#0B1B3A]">{selectedApp.gstNumber || 'GST Verified'}</strong></div>
                </div>
              </div>

              {/* Review Decision Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2 border-t border-[#E3E8F0]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-2">
                    Review Decision *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewAction('APPROVE')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        reviewAction === 'APPROVE'
                          ? 'border-[#0FA38F] bg-[#E2F6F3] text-[#0FA38F] ring-2 ring-[#0FA38F]/20'
                          : 'border-[#CBD5E1] bg-white text-[#53607A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                      Approve & Activate
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction('REQUEST_CHANGES')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        reviewAction === 'REQUEST_CHANGES'
                          ? 'border-[#7C3AED] bg-[#F3E8FF] text-[#7C3AED] ring-2 ring-[#7C3AED]/20'
                          : 'border-[#CBD5E1] bg-white text-[#53607A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <AlertTriangle size={18} />
                      Request Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setReviewAction('REJECT')}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        reviewAction === 'REJECT'
                          ? 'border-[#E5484D] bg-[#FEE2E2] text-[#E5484D] ring-2 ring-[#E5484D]/20'
                          : 'border-[#CBD5E1] bg-white text-[#53607A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                    Review Notes / Feedback {reviewAction !== 'APPROVE' ? '*' : '(Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      reviewAction === 'APPROVE'
                        ? 'Optional comments for internal records or congratulatory note to store owner...'
                        : 'Explain the reason or missing documents so the supermarket owner can rectify...'
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setSelectedApp(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={submittingReview}
                    className="font-bold"
                  >
                    {submittingReview ? 'Processing...' : 'Confirm Decision'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
