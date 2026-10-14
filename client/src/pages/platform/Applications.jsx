import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Building2,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Applications() {
  const { refreshCounter, accentColor } = useOutletContext() || {};

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      const res = await api.get(`/platform/applications?${params.toString()}`);
      if (res.data?.success) {
        setApplications(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, refreshCounter]);

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setReviewAction('APPROVE');
    setReviewNotes('');
  };

  const handleConfirmDecision = async (e) => {
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
        reviewNotes: reviewNotes.trim() || 'Verified and approved.',
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Application ${reviewAction.toLowerCase()}d successfully.`);
        setSelectedApp(null);
        setReviewNotes('');
        fetchApplications();
      } else {
        toast.error(res.data?.message || 'Review action failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Review action failed.';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (app.businessName && app.businessName.toLowerCase().includes(q)) ||
      (app.applicationId && app.applicationId.toLowerCase().includes(q)) ||
      (app.ownerName && app.ownerName.toLowerCase().includes(q)) ||
      (app.city && app.city.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30">
            <CheckCircle2 size={12} /> APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] border border-[#EF4444]/30">
            <XCircle size={12} /> REJECTED
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/30">
            <AlertTriangle size={12} /> CHANGES REQUESTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
            <Clock size={12} /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#0B1B3A] tracking-tight">Supermarket Applications</h2>
          <p className="text-xs text-[#8B96AB] mt-0.5">
            Review, approve, or request documentation updates from retail onboarding applicants
          </p>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E3E8F0] rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
          {['ALL', 'PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#0B1B3A] text-white shadow-xs'
                  : 'text-[#53607A] hover:text-[#0B1B3A] hover:bg-[#F4F7FB]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-xs flex items-center gap-3">
        <Search size={18} className="text-[#8B96AB] shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search applications by ID, store name, owner, city, or email..."
          className="w-full text-xs font-medium text-[#0B1B3A] placeholder-[#8B96AB] outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs font-bold text-[#8B96AB] hover:text-[#0B1B3A]">
            Clear
          </button>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white border border-[#E3E8F0] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#8B96AB] space-y-2">
            <RefreshCw size={24} className="animate-spin text-[#0FA38F]" />
            <p className="text-xs font-semibold">Loading applications...</p>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#53607A] font-bold border-b border-[#E3E8F0]">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Supermarket Name</th>
                  <th className="py-3 px-4">Owner & Contact</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Store Scale</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B1B3A]">
                      {app.applicationId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">
                      <div>{app.businessName}</div>
                      <div className="text-[10px] text-[#8B96AB] font-normal">{app.storeType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#53607A]">
                      <div className="font-semibold text-[#0B1B3A]">{app.ownerName}</div>
                      <div className="text-[11px] text-[#8B96AB]">{app.email}</div>
                      <div className="text-[11px] text-[#8B96AB]">{app.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#53607A]">
                      <div>{app.city}</div>
                      <div className="text-[10px] text-[#8B96AB] truncate max-w-[160px]">
                        {app.address}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#53607A]">
                      <div>{app.storeSize || 'Medium'}</div>
                      <div className="text-[10px] text-[#8B96AB]">
                        {app.branchesCount || 1} Counters/Branches
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className="px-3 py-1.5 rounded-lg bg-[#0B1B3A] hover:bg-[#12274F] text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-[#8B96AB] space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#F4F7FB] flex items-center justify-center text-[#CBD5E1]">
              <Inbox size={24} />
            </div>
            <p className="text-xs font-semibold">No applications found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 text-[#0B1B3A] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#0B1B3A]/10 text-[#0B1B3A]">
                  {selectedApp.applicationId}
                </span>
                <h3 className="text-base font-extrabold text-[#0B1B3A]">{selectedApp.businessName}</h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-[#F4F7FB] hover:bg-[#E3E8F0] flex items-center justify-center text-[#53607A]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Application Overview Summary */}
            <div className="bg-[#F8FAFC] border border-[#E3E8F0] rounded-2xl p-4 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Owner</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.ownerName}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Contact Email</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Phone Number</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">City & Location</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.city}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E3E8F0]">
                <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Physical Address</span>
                <p className="font-medium text-[#53607A]">{selectedApp.address}</p>
              </div>
            </div>

            {/* Decision Selector */}
            <form onSubmit={handleConfirmDecision} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#53607A] block mb-2">Review Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewAction === 'APPROVE'
                        ? 'bg-[#0FA38F]/15 border-[#0FA38F] text-[#0FA38F]'
                        : 'border-[#E3E8F0] text-[#53607A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Approve & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REQUEST_CHANGES')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewAction === 'REQUEST_CHANGES'
                        ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6]'
                        : 'border-[#E3E8F0] text-[#53607A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewAction === 'REJECT'
                        ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]'
                        : 'border-[#E3E8F0] text-[#53607A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#53607A] block mb-1">
                  Review Notes / Feedback {reviewAction !== 'APPROVE' && <span className="text-[#EF4444]">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'Optional note (e.g. Verified documentation and approved for live POS).'
                      : 'Provide clear reasons for rejection or requested document changes...'
                  }
                  className="w-full p-3 rounded-xl border border-[#CBD5E1] text-xs font-medium outline-none focus:ring-2 focus:ring-[#0FA38F]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#53607A] hover:bg-[#F4F7FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{ backgroundColor: accentColor || '#0FA38F' }}
                  className="px-5 py-2.5 rounded-xl text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingReview ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm Decision</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
