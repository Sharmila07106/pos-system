import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Mail, 
  Shield, 
  Clock, 
  Copy, 
  Check, 
  RotateCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Sparkles, 
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Users() {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'invitations'
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CASHIER');
  const [inviting, setInviting] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Edit user role modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('CASHIER');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Fetch users & invitations
  const loadUsersData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setInvitations(res.data.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Could not fetch staff members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Handle send invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error('Please enter both name and email.');
      return;
    }

    try {
      setInviting(true);
      const res = await api.post('/users/invite', {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Invitation sent successfully!');
        const activationUrl = `${window.location.origin}/activate-staff?token=${res.data.data.token}`;
        setGeneratedInvite({
          ...res.data.data,
          activationUrl
        });
        loadUsersData();
      } else {
        toast.error(res.data?.message || 'Failed to send invitation');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send invitation';
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  // Copy activation link
  const handleCopyLink = (token, inviteId) => {
    const fullUrl = `${window.location.origin}/activate-staff?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(inviteId || 'generated');
    toast.success('Activation link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Resend / Renew invite
  const handleResendInvite = async (inviteId) => {
    try {
      const res = await api.post(`/users/invite/${inviteId}/resend`);
      if (res.data?.success) {
        toast.success('Invitation renewed with fresh 48-hour token!');
        loadUsersData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to renew invitation');
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to revoke this staff invitation?')) return;
    try {
      const res = await api.delete(`/users/invite/${inviteId}`);
      if (res.data?.success) {
        toast.success('Staff invitation revoked.');
        loadUsersData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke invitation');
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    if (!window.confirm(`Set status of ${user.name} to ${nextStatus}?`)) return;

    try {
      const res = await api.put(`/users/${user._id}`, { status: nextStatus });
      if (res.data?.success) {
        toast.success(`User is now ${nextStatus}`);
        loadUsersData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Update role
  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdatingRole(true);
      const res = await api.put(`/users/${editingUser._id}`, { role: newRole });
      if (res.data?.success) {
        toast.success(`Role updated to ${newRole}`);
        setEditingUser(null);
        loadUsersData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Filtered staff
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    return matchesRole && matchesQuery;
  });

  // Filtered invitations
  const filteredInvitations = invitations.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return !searchQuery ||
      (inv.name && inv.name.toLowerCase().includes(q)) ||
      (inv.email && inv.email.toLowerCase().includes(q));
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'STORE_OWNER':
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30 uppercase">Store Owner</span>;
      case 'INVENTORY_MANAGER':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#7C3AED] border border-[#7C3AED]/30 uppercase">Inventory Manager</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]/30 uppercase">Cashier</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
            Staff & Access Management
          </h1>
          <p className="text-sm font-medium text-[#53607A] mt-1">
            Manage your supermarket cashiers, inventory managers, and role permissions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setGeneratedInvite(null);
            setInviteName('');
            setInviteEmail('');
            setInviteRole('CASHIER');
            setShowInviteModal(true);
          }}
          className="shadow-md shadow-[#0FA38F]/20 font-bold"
        >
          <UserPlus size={16} className="mr-2" />
          Invite Staff Member
        </Button>
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Active Employees</div>
            <div className="text-2xl font-extrabold text-[#0B1B3A] mt-0.5">{users.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center font-bold">
            <UsersIcon size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Pending Invites</div>
            <div className="text-2xl font-extrabold text-[#D97706] mt-0.5">
              {invitations.filter((i) => i.status === 'PENDING').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Access Security</div>
            <div className="text-sm font-extrabold text-[#0FA38F] mt-1 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Token Expiry (48h)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-bold">
            <Shield size={20} />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#CBD5E1] gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'staff' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Active Staff ({users.length})
          {activeTab === 'staff' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'invitations' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Invitations & Tokens ({invitations.length})
          {activeTab === 'invitations' && (
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
            placeholder={activeTab === 'staff' ? "Search staff by name or email..." : "Search invitations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
          />
        </div>

        {activeTab === 'staff' && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {['ALL', 'CASHIER', 'INVENTORY_MANAGER', 'STORE_OWNER'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === rf
                    ? 'bg-[#0B1B3A] text-white shadow-sm'
                    : 'bg-white text-[#53607A] border border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                {rf.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Staff Table */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-[#53607A]">
                      <UsersIcon className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                      <p className="font-semibold">No staff members found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = currentUser && (currentUser._id === u._id || currentUser.email === u.email);
                    return (
                      <tr key={u._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0B1B3A] text-[#0FA38F] flex items-center justify-center font-bold text-sm">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-[#0B1B3A] flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#E2F6F3] text-[#0FA38F]">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#53607A]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#53607A]">
                          {u.phone || 'Standard Access'}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.status === 'Disabled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D]">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F]">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setNewRole(u.role);
                              }}
                              disabled={isSelf}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#CBD5E1] text-[#0B1B3A] hover:bg-[#F4F7FB] disabled:opacity-40"
                              title="Change Role"
                            >
                              Role
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                u.status === 'Disabled'
                                  ? 'border-[#0FA38F]/40 text-[#0FA38F] hover:bg-[#E2F6F3]'
                                  : 'border-[#E5484D]/40 text-[#E5484D] hover:bg-[#FEE2E2]'
                              } disabled:opacity-40`}
                            >
                              {u.status === 'Disabled' ? 'Enable' : 'Disable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Invitations Table */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invitee</th>
                  <th className="py-3.5 px-4">Target Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Expires In</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-[#53607A]">
                      <Mail className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                      <p className="font-semibold">No pending invitations</p>
                      <p className="text-xs text-[#8B96AB] mt-1">Click &quot;Invite Staff Member&quot; to send an invitation.</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => {
                    const isPending = inv.status === 'PENDING';
                    const isAccepted = inv.status === 'ACCEPTED';
                    return (
                      <tr key={inv._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1B3A]">{inv.name}</div>
                          <div className="text-xs text-[#53607A]">{inv.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getRoleBadge(inv.role)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F]">
                              <CheckCircle2 size={12} /> Activated
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
                              <Clock size={12} /> Pending Activation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D]">
                              <XCircle size={12} /> Revoked
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                          {new Date(inv.expiresAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleCopyLink(inv.token, inv._id)}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#0FA38F]/40 text-[#0FA38F] hover:bg-[#E2F6F3] flex items-center gap-1"
                                  title="Copy activation link"
                                >
                                  {copiedId === inv._id ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedId === inv._id ? 'Copied' : 'Copy Link'}</span>
                                </button>

                                <button
                                  onClick={() => handleResendInvite(inv._id)}
                                  className="p-1.5 text-[#53607A] hover:text-[#0B1B3A] hover:bg-[#F4F7FB] rounded-lg transition-colors"
                                  title="Renew 48h Token"
                                >
                                  <RotateCw size={14} />
                                </button>

                                <button
                                  onClick={() => handleRevokeInvite(inv._id)}
                                  className="p-1.5 text-[#E5484D] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                                  title="Revoke Invitation"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E3E8F0] shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#0B1B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0FA38F]/20 text-[#0FA38F] flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Invite Staff Member</h3>
                  <p className="text-xs text-white/70">Single-use secure activation token</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            {generatedInvite ? (
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center mx-auto">
                  <Sparkles size={24} />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="text-base font-extrabold text-[#0B1B3A]">Invitation Ready!</h4>
                  <p className="text-xs text-[#53607A]">
                    Share this unique single-use link with <strong>{generatedInvite.name}</strong>. It expires in 48 hours.
                  </p>
                </div>

                <div className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E3E8F0] text-xs font-mono break-all text-[#0B1B3A]">
                  {generatedInvite.activationUrl}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleCopyLink(generatedInvite.token, 'generated')}
                  className="w-full font-bold"
                >
                  {copiedId === 'generated' ? (
                    <span className="flex items-center gap-2">
                      <Check size={16} /> Link Copied to Clipboard
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Copy size={16} /> Copy Activation Link
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setGeneratedInvite(null);
                    setShowInviteModal(false);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh@freshmart.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                    Assigned Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  >
                    <option value="CASHIER">CASHIER (Counter Billing, Scan & Tender)</option>
                    <option value="INVENTORY_MANAGER">INVENTORY MANAGER (Stock In, Batches, Adjustments)</option>
                    <option value="STORE_OWNER">CO-ADMIN / STORE MANAGER (Full Supermarket Control)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={inviting}
                    className="font-bold"
                  >
                    {inviting ? 'Generating...' : 'Generate Invitation'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-[#E3E8F0] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0B1B3A]">Change Staff Role</h3>
              <button onClick={() => setEditingUser(null)} className="text-[#8B96AB] hover:text-[#0B1B3A]">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#53607A]">
              Update role permissions for <strong>{editingUser.name}</strong> ({editingUser.email}):
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
              >
                <option value="CASHIER">CASHIER</option>
                <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                <option value="STORE_OWNER">STORE_OWNER / ADMIN</option>
              </select>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={updatingRole} className="font-bold">
                  {updatingRole ? 'Saving...' : 'Update Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
