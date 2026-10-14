import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Power,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';

export default function RegisteredStores() {
  const { refreshCounter, accentColor } = useOutletContext() || {};
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/stores');
      if (res.data?.success) {
        setStores(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load registered stores:', err);
      toast.error('Failed to load registered stores from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [refreshCounter]);

  const handleToggleStoreStatus = async (store, targetStatus = null) => {
    let nextStatus = targetStatus;
    if (!nextStatus) {
      if (store.status === 'SUSPENDED') nextStatus = 'ACTIVE';
      else if (store.status === 'ACTIVE' || store.status === 'APPROVED') nextStatus = 'SUSPENDED';
      else if (store.status === 'PENDING') nextStatus = 'ACTIVE';
      else nextStatus = 'ACTIVE';
    }

    const confirmMsg =
      nextStatus === 'ACTIVE'
        ? `Approve & activate supermarket "${store.name}"? Staff will be granted access.`
        : nextStatus === 'REJECTED'
        ? `Reject supermarket "${store.name}"? Access will be denied.`
        : `Are you sure you want to SUSPEND "${store.name}"? All POS checkout and staff access will be locked immediately.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/platform/stores/${store._id}/status`, {
        status: nextStatus,
        reason:
          nextStatus === 'ACTIVE'
            ? 'Approved and activated by Platform Admin'
            : nextStatus === 'REJECTED'
            ? 'Registration rejected by Platform Admin'
            : 'Suspended by Platform Admin for policy review',
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Store status updated to ${nextStatus}.`);
        fetchStores();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update store status.';
      toast.error(msg);
    }
  };

  const filteredStores = stores.filter((st) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (st.name && st.name.toLowerCase().includes(q)) ||
      (st.storeCode && st.storeCode.toLowerCase().includes(q)) ||
      (st.city && st.city.toLowerCase().includes(q)) ||
      (st.businessEmail && st.businessEmail.toLowerCase().includes(q)) ||
      (st.phone && st.phone.includes(q));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && (st.status === 'ACTIVE' || st.status === 'APPROVED')) ||
      st.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/30">
            <Power size={12} /> SUSPENDED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
            <Clock size={12} /> PENDING
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/30">
            <XCircle size={12} /> REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30">
            <CheckCircle2 size={12} /> ACTIVE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Registered Supermarket Stores
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Real-time multi-tenant stores registered on StoreFlow, active operational status, and tenancy control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#53607A] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-xl shadow-xs">
            Total Stores: <span className="font-extrabold text-[#0B1B3A]">{stores.length}</span>
          </span>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
          <input
            type="text"
            placeholder="Search by store name, code, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] placeholder-[#8B96AB] focus:outline-none focus:border-[#0FA38F] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#0B1B3A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#53607A] border border-[#CBD5E1] hover:bg-white hover:text-[#0B1B3A]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Table */}
      <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#53607A]">
            <RefreshCw className="animate-spin text-[#0FA38F] mb-3" size={32} />
            <p className="font-bold text-sm">Loading registered stores from database...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-16 text-center text-[#53607A]">
            <Store className="mx-auto mb-3 text-[#CBD5E1]" size={44} />
            <h3 className="font-extrabold text-base text-[#0B1B3A]">No registered stores found</h3>
            <p className="text-xs text-[#8B96AB] mt-1">
              {searchQuery
                ? `No stores match the search query "${searchQuery}".`
                : 'No supermarket stores have registered or been approved yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Store Code</th>
                  <th className="py-3.5 px-4">Supermarket Name & Slug</th>
                  <th className="py-3.5 px-4">Contact & Email</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Tenancy Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredStores.map((st) => (
                  <tr key={st._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0B1B3A]">
                      <span className="px-2 py-1 rounded bg-[#F1F5F9] border border-[#CBD5E1]">
                        {st.storeCode || 'STR-DEMO'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0B1B3A]">{st.name}</div>
                      <div className="text-xs text-[#53607A]">
                        Slug: <span className="font-mono text-[#0FA38F]">{st.slug}</span> &bull;{' '}
                        {st.storeType || 'Supermarket'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-xs text-[#0B1B3A] flex items-center gap-1.5">
                        <Mail size={12} className="text-[#8B96AB]" />
                        {st.businessEmail || st.owner?.email || 'N/A'}
                      </div>
                      {st.phone && (
                        <div className="text-xs text-[#53607A] flex items-center gap-1.5 mt-0.5">
                          <Phone size={12} className="text-[#8B96AB]" />
                          {st.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[#8B96AB]" />
                        <span>{st.city || 'Tamil Nadu'}</span>
                      </div>
                      {st.address && (
                        <div className="text-[11px] text-[#8B96AB] truncate max-w-[180px]">
                          {st.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(st.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {st.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleToggleStoreStatus(st, 'ACTIVE')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/40 hover:bg-[#0FA38F]/10 transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleToggleStoreStatus(st, 'REJECTED')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/40 hover:bg-[#E5484D]/10 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : st.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleToggleStoreStatus(st, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/40 hover:bg-[#0FA38F]/10 transition-all cursor-pointer"
                          >
                            Reactivate
                          </button>
                        ) : st.status === 'REJECTED' ? (
                          <button
                            onClick={() => handleToggleStoreStatus(st, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/40 hover:bg-[#0FA38F]/10 transition-all cursor-pointer"
                          >
                            Re-approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStoreStatus(st, 'SUSPENDED')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/40 hover:bg-[#E5484D]/10 transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
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
