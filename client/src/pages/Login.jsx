import React, { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ShieldAlert, X, KeyRound, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import { Input, PasswordInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';

// Lazy load the 3D scene
const StoreFlow3DScene = lazy(() => import('../components/three/StoreFlow3DScene'));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const navigateByRole = (userObj) => {
    const role = (userObj?.role || '').toLowerCase();
    if (
      role === 'platform_super_admin' ||
      role === 'platform_admin' ||
      userObj?.isPlatformAdmin
    ) {
      navigate('/platform-admin');
    } else if (role === 'cashier') {
      navigate('/pos');
    } else if (role === 'inventory_manager') {
      navigate('/inventory');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBackendError('');
    setLoading(true);

    try {
      const data = await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      toast.success(`Welcome back, ${data.data?.name || 'User'}!`);
      navigateByRole(data.data);
    } catch (err) {
      if (err.response?.status === 503 || err.response?.data?.code === 'DB_NOT_CONNECTED') {
        setBackendError(
          'Database Offline: The backend database is disconnected. Please configure MONGODB_URI in server/.env and restart.'
        );
      } else {
        const message =
          err.response?.data?.message || err.message || 'Invalid email or password';
        setBackendError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setBackendError('');
    setLoading(true);

    try {
      const data = await loginWithGoogle(credential, rememberMe);
      toast.success(`Welcome back, ${data.data?.name || 'User'}!`);
      navigateByRole(data.data);
    } catch (err) {
      if (err.response?.status === 503 || err.response?.data?.code === 'DB_NOT_CONNECTED') {
        setBackendError(
          'Database Offline: The backend database is disconnected. Please configure MONGODB_URI in server/.env and restart.'
        );
      } else {
        const message =
          err.response?.data?.message || err.message || 'Google authentication failed';
        setBackendError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isDbOffline =
    backendError.toLowerCase().includes('database') ||
    backendError.toLowerCase().includes('mongodb');

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F4F7FB]">
      {/* Left 55%: Navy to deep teal gradient with 3D scene */}
      <div className="w-full md:w-[55%] min-h-[320px] md:min-h-screen relative flex flex-col justify-between p-8 md:p-14 overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#0D2845] to-[#0B3B4A]">
        {/* Subtle radial teal glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#0FA38F]/15 blur-[120px] pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10">
          <StoreFlowLogo size={36} variant="light" />
        </div>

        {/* 3D Scene in center */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-90">
          <Suspense
            fallback={
              <div className="flex items-center justify-center text-[#0FA38F] text-sm font-bold">
                Loading 3D Workspace...
              </div>
            }
          >
            <StoreFlow3DScene />
          </Suspense>
        </div>

        {/* Bottom brand copy */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Checkout in seconds. <br />
            <span className="text-[#0FA38F]">Stock always right.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-[#8B96AB] font-medium leading-relaxed">
            Professional retail checkout with instant product scanning, live inventory reconciliation, and intelligent sales ledger.
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs text-white/60 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0FA38F]" /> Instant Scanning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF8A1F]" /> Live Inventory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Safe Transactions
            </span>
          </div>
        </div>
      </div>

      {/* Right 45%: White background with centered login card */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-6 md:p-12 bg-[#F4F7FB]">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] border border-[#E3E8F0] p-8 md:p-10 shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)]">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-[#0B1B3A] tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-[#53607A] font-medium mt-1.5">
              Enter your credentials to access your store terminal.
            </p>
          </div>

          {/* Backend error banner */}
          {backendError && (
            <div
              className={`mb-6 p-4 rounded-[14px] border flex items-start gap-3 text-xs font-semibold leading-relaxed animate-shake ${
                isDbOffline
                  ? 'bg-[#FFF8EB] border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#FEE2E2] border-[#FECACA] text-[#E5484D]'
              }`}
            >
              {isDbOffline ? (
                <ShieldAlert size={20} className="shrink-0 text-[#D97706] mt-0.5" />
              ) : (
                <AlertCircle size={20} className="shrink-0 text-[#E5484D] mt-0.5" />
              )}
              <div>
                <strong className="font-extrabold block mb-0.5">
                  {isDbOffline ? 'Database Offline (Action Required)' : 'Authentication Failed'}
                </strong>
                <span>{backendError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="admin@storeflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              label="Password"
              required
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#53607A] hover:text-[#0B1B3A] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0FA38F] focus:ring-[#0FA38F] border-[#CBD5E1]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-bold text-[#0FA38F] hover:text-[#0B8A78] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign In to StoreFlow
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E3E8F0]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#8B96AB] font-bold tracking-wider">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(errMsg) => setBackendError(errMsg || 'Google authentication failed')}
            loading={loading}
          />

          {/* Helper notice with link to Register */}
          <div className="mt-8 pt-6 border-t border-[#E3E8F0] text-center">
            <p className="text-xs text-[#53607A] font-medium">
              New to StoreFlow?{' '}
              <Link
                to="/register"
                className="font-bold text-[#0FA38F] hover:text-[#0B8A78] transition-colors ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (No fake email sending, instructs admin reset) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-[24px] border border-[#E3E8F0] p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-[#8B96AB] hover:text-[#0B1B3A] hover:bg-[#EEF2F8] transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#FFF1E3] text-[#FF8A1F] flex items-center justify-center">
                <KeyRound size={24} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1B3A]">
                  Password Reset Instructions
                </h3>
                <p className="text-xs font-bold text-[#8B96AB] uppercase tracking-wider">
                  Store Security Policy
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-[#53607A] font-medium leading-relaxed my-4">
              <p>
                To safeguard store terminal credentials, StoreFlow does not broadcast password links over external email.
              </p>
              <div className="p-3.5 rounded-[14px] bg-[#F4F7FB] border border-[#E3E8F0] text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-[#0FA38F]">1.</span>
                  <span>
                    Contact your store administrator or owner.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-[#0FA38F]">2.</span>
                  <span>
                    The administrator can open the <strong>Users</strong> page (<code className="text-[#0B1B3A] bg-white px-1.5 py-0.5 rounded border border-[#E3E8F0]">/users</code>) and update your password directly.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-[#0FA38F]">3.</span>
                  <span>
                    Log in with the new password assigned to your register account.
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-2"
              onClick={() => setShowForgotModal(false)}
            >
              Understood
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
