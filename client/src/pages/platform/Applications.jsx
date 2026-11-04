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
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Applications() {
  const { refreshCounter, triggerRefresh, accentColor } = useOutletContext() || {};

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [errorInsideDrawer, setErrorInsideDrawer] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
    setReviewAction(app.status === 'PENDING' ? 'APPROVE' : (app.status === 'CHANGES_REQUESTED' ? 'APPROVE' : app.status));
    setReviewNotes(app.reviewNotes || '');
    setErrorInsideDrawer('');
    setShowConfirmDialog(false);
  };

  const handlePreConfirm = (e) => {
    e.preventDefault();
    setErrorInsideDrawer('');

    if (reviewAction === 'REQUEST_CHANGES' && (!reviewNotes || reviewNotes.trim().length < 5)) {
      setErrorInsideDrawer('Please enter review notes with at least 5 characters explaining what changes are needed.');
      return;
    }

    if (reviewAction === 'REJECT' && (!reviewNotes || reviewNotes.trim().length < 3)) {
      setErrorInsideDrawer('Please provide a reason for rejecting this supermarket application.');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleExecuteDecision = async () => {
    if (!selectedApp) return;

    try {
      setSubmittingReview(true);
      setErrorInsideDrawer('');
      const targetId = selectedApp._id || selectedApp.applicationId;
      const res = await api.put(`/platform/applications/${targetId}/review`, {
        action: reviewAction,
        reviewNotes: reviewNotes.trim() || 'Verified and approved.',
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Application ${reviewAction.toLowerCase()}d successfully.`);
        if (triggerRefresh) triggerRefresh();
        setShowConfirmDialog(false);
        setSelectedApp(null);
        setReviewNotes('');
        fetchApplications();
      } else {
        setErrorInsideDrawer(res.data?.message || 'Review action failed.');
        setShowConfirmDialog(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Review action failed.';
      setErrorInsideDrawer(msg);
      setShowConfirmDialog(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
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

      {/* Review Drawer / Modal */}
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
                onClick={() => {
                  setSelectedApp(null);
                  setErrorInsideDrawer('');
                  setShowConfirmDialog(false);
                }}
                className="w-8 h-8 rounded-full bg-[#F4F7FB] hover:bg-[#E3E8F0] flex items-center justify-center text-[#53607A]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message Inside Drawer if failed */}
            {errorInsideDrawer && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                <XCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1">{errorInsideDrawer}</div>
              </div>
            )}

            {/* Application Overview Summary */}
            <div className="bg-[#F8FAFC] border border-[#E3E8F0] rounded-2xl p-4 text-xs space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Owner Name</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.ownerName}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Business Email</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Phone Number</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold">City & Region</span>
                  <p className="font-bold text-[#0B1B3A]">{selectedApp.city}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E3E8F0]">
                <span className="text-[#8B96AB] text-[10px] uppercase font-bold">Physical Address</span>
                <p className="font-medium text-[#53607A]">{selectedApp.address}</p>
              </div>

              {/* Owner Account Status */}
              <div className="pt-2 border-t border-[#E3E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[#8B96AB] text-[10px] uppercase font-bold block">Owner Account</span>
                  <span className="font-bold text-xs">
                    {selectedApp.status === 'APPROVED' ? (
                      <span className="text-[#0FA38F] flex items-center gap-1">
                        <CheckCircle2 size={13} /> Created & Verified
                      </span>
                    ) : (
                      <span className="text-[#D97706] flex items-center gap-1">
                        <Clock size={13} /> Not created yet (Activates on approval)
                      </span>
                    )}
                  </span>
                </div>
                {selectedApp.status === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`${window.location.origin}/login`)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#E2F6F3] text-[#0FA38F] hover:bg-[#D0F1EB] transition-colors flex items-center gap-1"
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>Copy Login Link</span>
                  </button>
                )}
              </div>
            </div>

            {/* Decision Selector & Form */}
            <form onSubmit={handlePreConfirm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#53607A] block mb-2">Review Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => {
                      setReviewAction('APPROVE');
                      setErrorInsideDrawer('');
                    }}
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
                    disabled={submittingReview}
                    onClick={() => {
                      setReviewAction('REQUEST_CHANGES');
                      setErrorInsideDrawer('');
                    }}
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
                    disabled={submittingReview}
                    onClick={() => {
                      setReviewAction('REJECT');
                      setErrorInsideDrawer('');
                    }}
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
                  disabled={submittingReview}
                  onChange={(e) => {
                    setReviewNotes(e.target.value);
                    setErrorInsideDrawer('');
                  }}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'Optional note (e.g. Verified documentation and approved for live POS).'
                      : reviewAction === 'REQUEST_CHANGES'
                      ? 'Detail required documentation corrections for applicant...'
                      : 'Provide clear reasons for rejecting this application...'
                  }
                  className="w-full p-3 rounded-xl border border-[#CBD5E1] text-xs font-medium outline-none focus:ring-2 focus:ring-[#0FA38F]"
                />
              </div>

              {/* Confirmation Dialog Box */}
              {showConfirmDialog ? (
                <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 text-[#D97706] mt-0.5" />
                    <div>
                      <p className="text-xs font-black">
                        {reviewAction === 'APPROVE'
                          ? `Approve ${selectedApp.businessName}?`
                          : reviewAction === 'REQUEST_CHANGES'
                          ? `Request changes for ${selectedApp.businessName}?`
                          : `Reject ${selectedApp.businessName}?`}
                      </p>
                      <p className="text-[11px] font-medium text-[#B45309] mt-0.5">
                        {reviewAction === 'APPROVE'
                          ? 'The store will become ACTIVE and the owner will be granted store administrator access.'
                          : reviewAction === 'REQUEST_CHANGES'
                          ? 'The applicant will see your note on the Track Status page and can update details.'
                          : 'The applicant will be notified of rejection.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={() => setShowConfirmDialog(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-xs font-bold text-[#53607A]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={handleExecuteDecision}
                      className="px-4 py-1.5 rounded-lg bg-[#0FA38F] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                    >
                      {submittingReview ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Yes, Confirm</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedApp(null);
                      setErrorInsideDrawer('');
                    }}
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
                    <span>Proceed to Confirm</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
