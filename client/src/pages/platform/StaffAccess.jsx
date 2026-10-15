import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Shield,
  Store,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StaffAccess() {
  const { refreshCounter, accentColor } = useOutletContext() || {};
  const [staffList, setStaffList] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');

  const fetchStaffAndStores = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStore !== 'ALL') params.storeId = selectedStore;
      if (selectedRole !== 'ALL') params.role = selectedRole;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [staffRes, storesRes] = await Promise.allSettled([
        api.get('/platform/staff', { params }),
        api.get('/platform/stores'),
      ]);

      if (staffRes.status === 'fulfilled' && staffRes.value?.data?.success) {
        setStaffList(staffRes.value.data.data || []);
      }
      if (storesRes.status === 'fulfilled' && storesRes.value?.data?.success) {
        setStores(storesRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
      toast.error('Failed to load staff roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndStores();
  }, [selectedStore, selectedRole, refreshCounter]);

  // Handle Search Debounce or submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStaffAndStores();
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r.includes('ADMIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30">
          <Shield size={12} /> {r.replace('_', ' ')}
        </span>
      );
    }
    if (r.includes('CASHIER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/30">
          <UserCheck size={12} /> CASHIER
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
        {r}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Supermarket Staff & Access Roster
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Real staff records across all registered tenants, isolated role assignments, and active platform logins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#53607A] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-xl shadow-xs">
            Total Staff: <span className="font-extrabold text-[#0B1B3A]">{staffList.length}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3E8F0] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] placeholder-[#8B96AB] focus:outline-none focus:border-[#0FA38F] focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold text-white rounded-lg cursor-pointer"
            style={{ backgroundColor: accentColor || '#0FA38F' }}
          >
            Search
          </button>
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Store Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#53607A]">
            <Store size={14} className="text-[#8B96AB]" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
            >
              <option value="ALL">All Supermarkets</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.storeCode || 'STR'})
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#53607A]">
            <Shield size={14} className="text-[#8B96AB]" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
            >
              <option value="ALL">All Staff Roles</option>
              <option value="store_admin">Store Admin / Owner</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#53607A]">
            <RefreshCw className="animate-spin text-[#0FA38F] mb-3" size={32} />
            <p className="font-bold text-sm">Loading staff directory from MongoDB...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center text-[#53607A]">
            <Users className="mx-auto mb-3 text-[#CBD5E1]" size={44} />
            <h3 className="font-extrabold text-base text-[#0B1B3A]">No staff members found</h3>
            <p className="text-xs text-[#8B96AB] mt-1">
              {searchQuery
                ? `No staff match the filter criteria.`
                : 'No supermarket staff users have been registered yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Assigned Supermarket</th>
                  <th className="py-3.5 px-4">Role Access</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {staffList.map((user) => (
                  <tr key={user._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0B1B3A] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {user.name ? user.name.slice(0, 2) : 'ST'}
                        </div>
                        <div>
                          <div className="font-bold text-[#0B1B3A]">{user.name || 'Unnamed Staff'}</div>
                          <div className="text-xs text-[#53607A] flex items-center gap-1">
                            <Mail size={11} className="text-[#8B96AB]" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {user.store ? (
                        <div>
                          <div className="font-bold text-[#0B1B3A] text-xs sm:text-sm">
                            {user.store.name}
                          </div>
                          <div className="text-[11px] text-[#53607A]">
                            Code: <span className="font-mono">{user.store.storeCode || 'STR'}</span> &bull;{' '}
                            {user.store.city || 'Tamil Nadu'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8B96AB] italic">Platform Level / Global</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3.5 px-4">
                      {user.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0FA38F]">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#E5484D]">
                          <XCircle size={13} /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs font-medium text-[#53607A]">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar size={12} className="text-[#8B96AB]" />
                        <span>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
