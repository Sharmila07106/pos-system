import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Building2,
  Calendar,
  X,
  RefreshCw,
  HelpCircle,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Complaints() {
  const { refreshCounter, accentColor, triggerRefresh } = useOutletContext() || {};
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Update Status Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [updateNote, setUpdateNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/platform/complaints', { params });
      if (res.data?.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      toast.error('Failed to load supermarket complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, refreshCounter]);

  const handleOpenStatusModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status);
    setUpdateNote('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSubmitting(true);
      const res = await api.put(`/platform/complaints/${selectedTicket._id}/status`, {
        status: newStatus,
        note: updateNote.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Ticket #${selectedTicket.ticketNo} status updated`);
        setSelectedTicket(null);
        fetchComplaints();
        if (triggerRefresh) triggerRefresh();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update complaint status';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      (c.ticketNo && c.ticketNo.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.store?.name && c.store.name.toLowerCase().includes(q)) ||
      (c.raisedBy?.name && c.raisedBy.name.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] border border-[#EF4444]/30">
            <Clock size={12} /> OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30">
            <RefreshCw size={12} className="animate-spin" /> IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30">
            <CheckCircle2 size={12} /> RESOLVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]">
            CLOSED
          </span>
        );
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT':
        return <span className="text-[11px] font-extrabold text-[#EF4444] uppercase">Urgent</span>;
      case 'HIGH':
        return <span className="text-[11px] font-extrabold text-[#F59E0B] uppercase">High</span>;
      case 'MEDIUM':
        return <span className="text-[11px] font-extrabold text-[#3B82F6] uppercase">Medium</span>;
      default:
        return <span className="text-[11px] font-bold text-[#64748B] uppercase">Low</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B1B3A] tracking-tight">
            Supermarket Support Complaints
          </h2>
          <p className="text-xs sm:text-sm text-[#53607A] font-medium mt-0.5">
            Real complaints and support tickets filed by supermarket owners and staff with live resolution status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#53607A] bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-xl shadow-xs">
            Total Tickets: <span className="font-extrabold text-[#0B1B3A]">{complaints.length}</span>
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
          <input
            type="text"
            placeholder="Search tickets by ID, subject, store..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] placeholder-[#8B96AB] focus:outline-none focus:border-[#0FA38F] focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#0B1B3A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#53607A] border border-[#CBD5E1] hover:bg-white hover:text-[#0B1B3A]'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#53607A]">
            <RefreshCw className="animate-spin text-[#0FA38F] mb-3" size={32} />
            <p className="font-bold text-sm">Loading complaints from database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center text-[#53607A]">
            <AlertTriangle className="mx-auto mb-3 text-[#CBD5E1]" size={44} />
            <h3 className="font-extrabold text-base text-[#0B1B3A]">No complaints found</h3>
            <p className="text-xs text-[#8B96AB] mt-1">
              {searchQuery
                ? `No tickets match "${searchQuery}".`
                : 'No support complaints have been filed in this category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Supermarket Store</th>
                  <th className="py-3.5 px-4">Subject & Issue</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Filed On</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0B1B3A]">
                      <span className="px-2 py-1 rounded bg-[#F1F5F9] border border-[#CBD5E1]">
                        #{c.ticketNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0B1B3A] text-xs sm:text-sm">
                        {c.store?.name || 'Store'}
                      </div>
                      <div className="text-[11px] text-[#53607A]">
                        By: {c.raisedBy?.name || 'Store Admin'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-[#0B1B3A] truncate">{c.subject}</div>
                      <p className="text-xs text-[#53607A] line-clamp-1 mt-0.5">{c.description}</p>
                    </td>
                    <td className="py-3.5 px-4">{getPriorityBadge(c.priority)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[#53607A]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(c)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-white text-[#0B1B3A] border border-[#CBD5E1] transition-all cursor-pointer shadow-2xs"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E3E8F0] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 bg-[#0B1B3A] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Update Complaint Ticket</h3>
                <p className="text-xs text-white/70">Ticket #{selectedTicket.ticketNo}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-[#53607A] uppercase">Subject</span>
                <p className="font-bold text-sm text-[#0B1B3A] mt-0.5">{selectedTicket.subject}</p>
                <p className="text-xs text-[#53607A] mt-1 p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                  {selectedTicket.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B3A] mb-1.5 uppercase">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                >
                  <option value="OPEN">OPEN (Needs Attention)</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Under Investigation)</option>
                  <option value="RESOLVED">RESOLVED (Solution Provided)</option>
                  <option value="CLOSED">CLOSED (Completed & Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B3A] mb-1.5 uppercase">
                  Resolution Note / Action Comment
                </label>
                <textarea
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Explain resolution steps taken or instructions for the supermarket..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#53607A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: accentColor || '#0FA38F' }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
