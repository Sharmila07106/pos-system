import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';

export default function ActivateStaff() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMessage('No invitation token found in URL. Please check the link provided in your email or invitation notice.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/auth/invitation/${token}`);
        if (res.data?.success && res.data?.data) {
          setInvitation(res.data.data);
          setName(res.data.data.name || '');
        } else {
          setErrorMessage(res.data?.message || 'This invitation link is invalid or has expired.');
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'This invitation link has expired, was already used, or is invalid.';
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;
  const isFormValid = name.trim().length >= 2 && hasMinLength && hasLetter && hasNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Please ensure all password requirements and fields are met.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/activate-staff', {
        token,
        name: name.trim(),
        password
      });

      if (res.data?.success) {
        toast.success(`Welcome aboard, ${res.data.data.name}! Account activated.`);
        // Set user session in context & storage
        setSession(res.data.token, res.data.data, true);
        
        const role = (res.data.data?.role || '').toLowerCase();
        if (role === 'cashier') {
          navigate('/pos');
        } else if (role === 'inventory_manager') {
          navigate('/inventory');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(res.data?.message || 'Failed to activate staff account.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Account activation failed. Please try again or contact your store owner.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between selection:bg-[#0FA38F]/20 selection:text-[#0FA38F]">
      {/* Header */}
      <header className="bg-white border-b border-[#E3E8F0] shadow-sm py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/">
            <StoreFlowLogo size={32} variant="dark" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-[#53607A] bg-[#F4F7FB] px-3 py-1.5 rounded-full border border-[#E3E8F0]">
            <ShieldCheck size={14} className="text-[#0FA38F]" />
            Staff Security Onboarding
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E3E8F0] shadow-sm text-center space-y-4">
            <div className="w-12 h-12 border-3 border-[#0FA38F] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-[#0B1B3A]">Verifying Invitation Token...</h3>
            <p className="text-sm text-[#53607A]">Connecting to StoreFlow security gate...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E5484D]/30 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E5484D]/10 text-[#E5484D] flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#0B1B3A]">Invitation Unavailable</h2>
              <p className="text-sm text-[#53607A] leading-relaxed">{errorMessage}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F7FB] border border-[#E3E8F0] text-left text-xs text-[#53607A] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#0B1B3A]">
                <Clock size={14} className="text-[#F59E0B]" />
                Why might this happen?
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Invitations expire automatically after 48 hours for security.</li>
                <li>This single-use link has already been activated.</li>
                <li>The supermarket manager renewed or revoked the invitation.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="primary" size="md" className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  StoreFlow Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-xl overflow-hidden">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-[#0B1B3A] to-[#0FA38F] p-6 text-white text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white mb-3 backdrop-blur-sm">
                <Sparkles size={14} /> Official Staff Invitation
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Join Your Supermarket Team</h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Complete your profile and set your secure password to get started.
              </p>
            </div>

            {/* Invitation Details Summary */}
            <div className="p-6 bg-[#F8FAFC] border-b border-[#E3E8F0] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B1B3A] text-[#0FA38F] flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-xs text-[#53607A] font-semibold uppercase tracking-wider">Supermarket</div>
                  <div className="text-sm font-extrabold text-[#0B1B3A]">{invitation.storeName || 'FreshMart Supermarket'}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#53607A] font-semibold uppercase tracking-wider">Assigned Role</div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30 uppercase">
                  {invitation.role?.replace('_', ' ') || 'Staff Member'}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#53607A] mb-1.5">
                  Work Email (Read Only)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                  <input
                    type="email"
                    value={invitation.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl text-sm font-semibold text-[#53607A] cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                  Set Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 characters with letters & numbers"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB] hover:text-[#0B1B3A]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B1B3A] mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-sm font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20"
                  />
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0] space-y-2 text-xs">
                <div className="font-bold text-[#0B1B3A]">Security Checklist:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-[#0FA38F]' : 'text-[#8B96AB]'}`}>
                    <CheckCircle2 size={13} className={hasMinLength ? 'text-[#0FA38F]' : 'text-[#CBD5E1]'} />
                    8+ Characters
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${hasLetter ? 'text-[#0FA38F]' : 'text-[#8B96AB]'}`}>
                    <CheckCircle2 size={13} className={hasLetter ? 'text-[#0FA38F]' : 'text-[#CBD5E1]'} />
                    Contains letter
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-[#0FA38F]' : 'text-[#8B96AB]'}`}>
                    <CheckCircle2 size={13} className={hasNumber ? 'text-[#0FA38F]' : 'text-[#CBD5E1]'} />
                    Contains number
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${passwordsMatch ? 'text-[#0FA38F]' : 'text-[#8B96AB]'}`}>
                    <CheckCircle2 size={13} className={passwordsMatch ? 'text-[#0FA38F]' : 'text-[#CBD5E1]'} />
                    Passwords match
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isFormValid || submitting}
                className="w-full font-bold shadow-md shadow-[#0FA38F]/20"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Activating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Activate Account & Enter StoreFlow <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[#8B96AB]">
        StoreFlow Retail SaaS Platform &bull; Protected by Tenant Isolation &bull; End-to-End Audited
      </footer>
    </div>
  );
}
