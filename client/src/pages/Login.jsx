import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, RefreshCw, X, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import { Input, PasswordInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Lazy load the 3D scene
const StoreFlow3DScene = lazy(() => import('../components/three/StoreFlow3DScene'));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [dbConnecting, setDbConnecting] = useState(false);

  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Check database health on mount & poll every 5 seconds until connected
  useEffect(() => {
    let isMounted = true;

    const checkDbHealth = async () => {
      try {
        const res = await api.get('/health', { skipToast: true });
        if (!isMounted) return;

        if (res.data?.database === 'connected') {
          setDbConnecting(false);
        } else {
          setDbConnecting(true);
        }
      } catch (err) {
        if (!isMounted) return;
        setDbConnecting(true);
      }
    };

    // Immediate check
    checkDbHealth();

    // Recheck every 5 seconds
    const interval = setInterval(checkDbHealth, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
        setDbConnecting(true);
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
        setDbConnecting(true);
      } else {
        const message =
          err.response?.data?.message || err.message || 'Google authentication failed';
        setBackendError(message);
      }
    } finally {
      setLoading(false);
    }
  };

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

          {/* Yellow message banner: database connecting with 5s auto-retry */}
          {dbConnecting && (
            <div className="mb-6 p-4 rounded-[14px] border bg-[#FFF8EB] border-[#FDE68A] text-[#92400E] flex items-center gap-3 text-xs font-semibold leading-relaxed animate-fade-in shadow-2xs">
              <RefreshCw size={18} className="shrink-0 text-[#D97706] animate-spin" />
              <div>
                <strong className="font-extrabold block text-sm mb-0.5">
                  Database Connecting
                </strong>
                <span>Server is connecting to the database. Please wait a few seconds.</span>
              </div>
            </div>
          )}

          {/* General authentication error banner */}
          {backendError && (
            <div className="mb-6 p-4 rounded-[14px] border bg-[#FEE2E2] border-[#FECACA] text-[#E5484D] flex items-start gap-3 text-xs font-semibold leading-relaxed animate-shake">
              <AlertCircle size={20} className="shrink-0 text-[#E5484D] mt-0.5" />
              <div>
                <strong className="font-extrabold block mb-0.5">Authentication Failed</strong>
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
          <GoogleSignInButton onSuccess={handleGoogleSuccess} />

          {/* Onboarding Register link */}
          <div className="mt-8 text-center text-xs font-semibold text-[#53607A]">
            Registering a new supermarket?{' '}
            <Link
              to="/onboard"
              className="font-extrabold text-[#0FA38F] hover:text-[#0B8A78] transition-colors underline underline-offset-4"
            >
              Apply for Supermarket Onboarding
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E3E8F0] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2 text-[#0B1B3A]">
                <KeyRound size={20} className="text-[#0FA38F]" />
                <h3 className="font-extrabold text-base">Reset Password</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-[#8B96AB] hover:text-[#0B1B3A] hover:bg-[#F1F5F9] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-[#53607A] leading-relaxed mb-6">
              For security across supermarket tenants, staff password resets must be initiated by your Supermarket Store Administrator or Platform Support. Please contact your administrator to reset your credentials.
            </p>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForgotModal(false)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
