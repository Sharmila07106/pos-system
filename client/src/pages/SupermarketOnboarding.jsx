import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Layers, 
  FileCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SupermarketOnboarding = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    ownerName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: '',
    storeType: 'Supermarket',
    storeSize: 'Medium (1000-3000 sq ft)',
    branchesCount: 1,
    address: '',
    city: 'Chennai',
    registrationNumber: '',
    notes: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        ownerName: prev.ownerName || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 2) {
      toast.error('Please enter a valid owner name (min 2 characters)');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error('Please enter a valid business email address');
      return false;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      toast.error('Please enter a valid contact phone number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.businessName.trim() || formData.businessName.trim().length < 2) {
      toast.error('Please enter your supermarket or business name');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      toast.error('Please enter complete store street address');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('Please specify store city');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/onboarding/apply', formData);
      setSubmittedApp(res.data.data);
      toast.success('Supermarket application submitted successfully!');
    } catch (err) {
      console.error('Onboarding application error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (submittedApp?.applicationId) {
      navigator.clipboard.writeText(submittedApp.applicationId);
      setCopied(true);
      toast.success('Application reference copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
          <Link to="/application-status" className="hover:text-[#0FA38F] transition-colors flex items-center gap-1.5">
            <Clock size={15} />
            <span>Track Application Status</span>
          </Link>
          <span className="text-[#CBD5E1] hidden sm:inline">|</span>
          <Link to="/login" className="px-3.5 py-1.5 rounded-xl border border-[#E3E8F0] hover:bg-[#EEF2F8] transition-colors hidden sm:inline-block">
            Store Log In
          </Link>
        </div>
      </header>

      {/* Main Wizard Area */}
      <main className="max-w-[760px] w-full mx-auto px-4 py-8 md:py-12 flex-1 flex flex-col justify-center">
        
        {submittedApp ? (
          /* Submission Success Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E3E8F0] rounded-[24px] p-8 md:p-12 shadow-[0_8px_30px_rgba(11,27,58,0.06)] text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3A] tracking-tight mb-2">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-[#53607A] max-w-md mx-auto mb-6">
              Thank you for choosing StoreFlow. Your supermarket application for <strong className="text-[#0B1B3A]">{submittedApp.businessName}</strong> is now under review by our platform administrator.
            </p>

            {/* Application Reference Chip */}
            <div className="bg-[#EEF2F8] border border-[#E3E8F0] rounded-2xl p-5 max-w-sm mx-auto mb-8 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block">
                  Application Reference ID
                </span>
                <span className="text-xl font-extrabold text-[#0B1B3A] tracking-wider font-mono">
                  {submittedApp.applicationId}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0FA38F] hover:text-[#0FA38F] text-[#53607A] transition-all"
                title="Copy Reference"
              >
                {copied ? <Check size={18} className="text-[#0FA38F]" /> : <Copy size={18} />}
              </button>
            </div>

            {/* Step summary checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left mb-8 max-w-lg mx-auto">
              <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-[#E3E8F0]">
                <div className="text-[11px] font-bold text-[#0FA38F] mb-1">Step 1: Submitted</div>
                <div className="text-xs font-semibold text-[#53607A]">Business details recorded</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FFF1E3] border border-[#FF8A1F]/30">
                <div className="text-[11px] font-bold text-[#D97706] mb-1">Step 2: Under Review</div>
                <div className="text-xs font-semibold text-[#53607A]">Admin verification</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F7FB] border border-[#E3E8F0]">
                <div className="text-[11px] font-bold text-[#8B96AB] mb-1">Step 3: Store Launch</div>
                <div className="text-xs font-semibold text-[#53607A]">POS & Staff activation</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/application-status?ref=${submittedApp.applicationId}`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(15,163,143,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <span>Track Application Status</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#E3E8F0] hover:bg-[#EEF2F8] text-[#53607A] font-bold text-sm transition-all"
              >
                Return to Home
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Multi-step Form Wizard */
          <div className="bg-white border border-[#E3E8F0] rounded-[24px] p-6 md:p-10 shadow-[0_8px_30px_rgba(11,27,58,0.06)]">
            
            {/* Header & Progress Indicator */}
            <div className="mb-8 pb-6 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#0FA38F] uppercase tracking-wider mb-2">
                <ShieldCheck size={16} />
                <span>Supermarket Onboarding Wizard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
                Register Your Supermarket on StoreFlow
              </h1>
              <p className="text-sm text-[#53607A] mt-1">
                Step {step} of 4 • Complete business registration for platform review.
              </p>

              {/* Step indicator bar */}
              <div className="flex items-center gap-2 mt-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      i < step
                        ? 'bg-[#0FA38F]'
                        : i === step
                        ? 'bg-[#0FA38F]/80 ring-2 ring-[#0FA38F]/30'
                        : 'bg-[#EEF2F8]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Owner Details */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#0B1B3A]">1. Owner / Authorized Representative</h2>
                
                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="e.g., Venkatesh Rao"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Business Email Address *</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., owner@greenmart.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#8B96AB] mt-1">
                    Approval confirmation and owner credentials will be sent to this email.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Primary Contact Phone *</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g., +91 98401 23456"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Supermarket Profile */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#0B1B3A]">2. Supermarket Profile & Operations</h2>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Supermarket / Trade Name *</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder="e.g., GreenMart Organics"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#53607A] block mb-1.5">Store Retail Format</label>
                    <select
                      name="storeType"
                      value={formData.storeType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all"
                    >
                      <option value="Supermarket">Supermarket</option>
                      <option value="Hypermarket">Hypermarket</option>
                      <option value="Organic Grocery">Organic Grocery</option>
                      <option value="Minimart">Minimart / Convenience</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#53607A] block mb-1.5">Store Floor Size</label>
                    <select
                      name="storeSize"
                      value={formData.storeSize}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all"
                    >
                      <option value="Small (<1000 sq ft)">Small (&lt;1000 sq ft)</option>
                      <option value="Medium (1000-3000 sq ft)">Medium (1000-3000 sq ft)</option>
                      <option value="Large (>3000 sq ft)">Large (&gt;3000 sq ft)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Operating Branches Count</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    name="branchesCount"
                    value={formData.branchesCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Location & Business ID */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#0B1B3A]">3. Store Location & Verification</h2>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Physical Store Address *</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3.5 top-3.5 text-[#8B96AB]" />
                    <textarea
                      rows="3"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g., 45, Anna Salai, T. Nagar"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#53607A] block mb-1.5">City / Locality *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., Chennai"
                      className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#53607A] block mb-1.5">
                      GSTIN / Business Reg (Optional)
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      placeholder="e.g., GSTIN33AAACG1234F1Z5"
                      className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#53607A] block mb-1.5">Additional Application Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g., Expanding with 2 checkout lanes and fresh produce inventory"
                    className="w-full px-4 py-3 bg-white border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#0B1B3A] outline-none focus:border-[#0FA38F] transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Consent */}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <h2 className="text-lg font-extrabold text-[#0B1B3A]">4. Review Details & Submit</h2>

                <div className="bg-[#F4F7FB] border border-[#E3E8F0] rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#E3E8F0] pb-2">
                    <span className="text-[#8B96AB] font-bold">Business Name:</span>
                    <span className="font-extrabold text-[#0B1B3A]">{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E8F0] pb-2">
                    <span className="text-[#8B96AB] font-bold">Authorized Owner:</span>
                    <span className="font-bold text-[#0B1B3A]">{formData.ownerName}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E8F0] pb-2">
                    <span className="text-[#8B96AB] font-bold">Email & Phone:</span>
                    <span className="font-bold text-[#0B1B3A]">{formData.email} • {formData.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E3E8F0] pb-2">
                    <span className="text-[#8B96AB] font-bold">Store Format & Size:</span>
                    <span className="font-bold text-[#0B1B3A]">{formData.storeType} ({formData.storeSize})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B96AB] font-bold">Address:</span>
                    <span className="font-bold text-[#0B1B3A] text-right max-w-xs">{formData.address}, {formData.city}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#E2F6F3] border border-[#A7F3D0] text-[#0B8A78] text-xs font-semibold flex items-start gap-2.5">
                  <ShieldCheck size={20} className="flex-shrink-0 text-[#0FA38F] mt-0.5" />
                  <span>
                    By submitting, you confirm that you are an authorized representative of this supermarket. Operational POS and inventory features will be activated upon platform administrator approval.
                  </span>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-[#E3E8F0] flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#EEF2F8] transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              ) : (
                <Link
                  to="/"
                  className="px-4 py-2 text-xs font-bold text-[#8B96AB] hover:text-[#0B1B3A] transition-colors"
                >
                  Cancel
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs shadow-[0_4px_14px_rgba(15,163,143,0.3)] transition-all flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-7 py-3 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(15,163,143,0.35)] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#8B96AB] border-t border-[#E3E8F0]">
        StoreFlow POS • Multi-Supermarket Retail SaaS Platform • Smart Checkout. Live Inventory. Less Waste.
      </footer>
    </div>
  );
};

export default SupermarketOnboarding;
