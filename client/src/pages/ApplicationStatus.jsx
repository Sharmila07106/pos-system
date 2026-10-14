import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import api from '../services/api';

const ApplicationStatus = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [searched, setSearched] = useState(false);

  const fetchStatus = async (term) => {
    if (!term || !term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/onboarding/status/${term.trim()}`);
      if (res.data?.data) {
        setApplication(res.data.data);
      }
    } catch (err) {
      console.error('Fetch status error:', err);
      setApplication(null);
      toast.error(err.response?.data?.message || 'No application found for this reference or email');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      fetchStatus(ref);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStatus(searchTerm);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC] flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 size={15} />
            <span>APPROVED & OPERATIONAL</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#FEE2E2] text-[#E5484D] border border-[#FCA5A5] flex items-center gap-1.5 shadow-xs">
            <XCircle size={15} />
            <span>REJECTED</span>
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#DBEAFE] text-[#2F6BFF] border border-[#93C5FD] flex items-center gap-1.5 shadow-xs">
            <AlertCircle size={15} />
            <span>ACTION REQUIRED</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-[#FFF1E3] text-[#D97706] border border-[#FF8A1F]/30 flex items-center gap-1.5 shadow-xs">
            <Clock size={15} />
            <span>PENDING ADMIN REVIEW</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] font-sans flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E3E8F0] h-[72px] flex items-center justify-between px-6 md:px-12">
        <Link to="/">
          <StoreFlowLogo size={32} variant="dark" />
        </Link>
        
        <div className="flex items-center gap-4 text-xs font-bold text-[#53607A]">
          <Link to="/onboard" className="hover:text-[#0FA38F] transition-colors">
            Register Supermarket
          </Link>
          <span className="text-[#CBD5E1]">|</span>
          <Link to="/login" className="px-3.5 py-1.5 rounded-xl border border-[#E3E8F0] hover:bg-[#EEF2F8] transition-colors">
            Store Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[700px] w-full mx-auto px-4 py-10 md:py-16 flex-1 flex flex-col justify-center">
        
        {/* Search Hero Box */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Clock size={24} strokeWidth={2} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
            Track Supermarket Application
          </h1>
          <p className="text-sm text-[#53607A] mt-1 max-w-md mx-auto">
            Check the review progress and operational status of your StoreFlow supermarket registration.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter Application ID (e.g., APP-10001) or Email"
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all uppercase placeholder:normal-case shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="px-5 py-3 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(15,163,143,0.3)] transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>
        </div>

        {/* Status Result Card */}
        {application ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E3E8F0] rounded-[24px] p-6 md:p-8 shadow-[0_8px_30px_rgba(11,27,58,0.06)]"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E3E8F0] gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-0.5">
                  Application Reference
                </span>
                <h3 className="text-xl font-extrabold text-[#0B1B3A] font-mono">
                  {application.applicationId}
                </h3>
              </div>
              <div>{getStatusBadge(application.status)}</div>
            </div>

            {/* Store Information Details */}
            <div className="py-5 space-y-3.5 text-sm border-b border-[#E3E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EEF2F8] text-[#0FA38F] flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="font-extrabold text-[#0B1B3A] text-base">{application.businessName}</div>
                  <div className="text-xs text-[#8B96AB] font-semibold">
                    {application.storeType} • {application.storeSize}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#EEF2F8]">
                  <span className="text-[#8B96AB] font-bold block mb-0.5">Authorized Owner</span>
                  <span className="font-extrabold text-[#0B1B3A]">{application.ownerName}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#EEF2F8]">
                  <span className="text-[#8B96AB] font-bold block mb-0.5">Contact Email</span>
                  <span className="font-extrabold text-[#0B1B3A]">{application.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#EEF2F8]">
                  <span className="text-[#8B96AB] font-bold block mb-0.5">Location</span>
                  <span className="font-extrabold text-[#0B1B3A]">{application.address}, {application.city}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#EEF2F8]">
                  <span className="text-[#8B96AB] font-bold block mb-0.5">Submitted Date</span>
                  <span className="font-extrabold text-[#0B1B3A]">
                    {new Date(application.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Notes / Admin Feedback */}
            {application.reviewNotes && (
              <div className="py-4 border-b border-[#E3E8F0]">
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                  Platform Reviewer Notes
                </span>
                <p className="text-xs font-semibold text-[#53607A] bg-[#EEF2F8] p-3 rounded-xl border border-[#E3E8F0]">
                  "{application.reviewNotes}"
                </p>
              </div>
            )}

            {/* Bottom Actions based on status */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#8B96AB]">
                {application.status === 'APPROVED' ? (
                  <span className="text-[#16A34A] font-bold flex items-center gap-1">
                    <ShieldCheck size={15} /> Store verified and operational
                  </span>
                ) : (
                  'Review typically completes within 24 business hours.'
                )}
              </span>

              {application.status === 'APPROVED' ? (
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign in to Store</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  onClick={() => fetchStatus(searchTerm)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#E3E8F0] text-xs font-bold text-[#53607A] hover:bg-[#EEF2F8] transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Refresh Status</span>
                </button>
              )}
            </div>
          </motion.div>
        ) : searched && !loading ? (
          <div className="bg-white border border-[#E3E8F0] rounded-[24px] p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#E5484D] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-extrabold text-[#0B1B3A] mb-1">No Application Found</h3>
            <p className="text-xs text-[#8B96AB] max-w-sm mx-auto mb-4">
              We couldn't locate any supermarket application with ID or email "{searchTerm}". Please verify the reference or register a new store.
            </p>
            <Link
              to="/onboard"
              className="px-5 py-2.5 rounded-xl bg-[#0FA38F] text-white text-xs font-bold hover:bg-[#0B8A78] transition-colors inline-block"
            >
              Start New Registration
            </Link>
          </div>
        ) : null}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#8B96AB] border-t border-[#E3E8F0]">
        StoreFlow POS • Multi-Supermarket Retail SaaS Platform • Smart Checkout. Live Inventory. Less Waste.
      </footer>
    </div>
  );
};

export default ApplicationStatus;
