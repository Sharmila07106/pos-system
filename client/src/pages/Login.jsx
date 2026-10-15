import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, RefreshCw, X, KeyRound, ArrowRight, LogOut } from 'lucide-react';
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
  const [retryStatus, setRetryStatus] = useState('');

  const navigate = useNavigate();
  const { user, isAuthenticated, login, loginWithGoogle, logout } = useAuth();

  // Poll database health every 3 seconds until connected
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

    checkDbHealth();
    const interval = setInterval(checkDbHealth, 3000);

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

  const executeLoginWithRetry = async (attempt = 1) => {
    try {
      const data = await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      setRetryStatus('');
      toast.success(`Welcome back, ${data.data?.name || 'User'}!`);
      navigateByRole(data.data);
    } catch (err) {
      const isDbNotReady =
        err.response?.status === 503 ||
        err.response?.data?.code === 'DB_NOT_CONNECTED' ||
        (err.message && err.message.includes('Network Error'));

      if (isDbNotReady && attempt < 5) {
        setDbConnecting(true);
        setRetryStatus(`Database connecting... Automatically retrying (${attempt}/5) in 2s`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return executeLoginWithRetry(attempt + 1);
      } else {
        setRetryStatus('');
        if (isDbNotReady) {
          setDbConnecting(true);
          setBackendError('Server is connecting to the database. Please wait a few seconds.');
        } else {
          const message =
            err.response?.data?.message || err.message || 'Invalid email or password';
          setBackendError(message);
        }
      }
    } finally {
      if (attempt === 1 || attempt >= 5) {
        setLoading(false);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setBackendError('');
    setLoading(true);
    await executeLoginWithRetry(1);
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#12A58B]/15 blur-[120px] pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10">
          <StoreFlowLogo size={36} variant="light" />
        </div>

        {/* 3D Scene in center */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-90">
          <Suspense
            fallback={
              <div className="flex items-center justify-center text-[#2DD4BF] text-sm font-bold">
                Loading 3D Workspace...
              </div>
            }
          >
            <StoreFlow3DScene />
          </Suspense>
        </div>

        {/* Bottom brand copy */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">
            Checkout in seconds. <br />
            <span className="text-[#2DD4BF]">Stock always right.</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-slate-200 font-medium leading-relaxed">
            Professional retail checkout with instant product scanning, live inventory reconciliation, and intelligent sales ledger.
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs text-slate-200 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#12A58B]" /> Instant Scanning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Live Inventory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Safe Transactions
            </span>
          </div>
        </div>
      </div>

      {/* Right 45%: White background with centered login card */}
      <div className="w-full md:w-[45%] flex items-center justify-center p-6 md:p-12 bg-[#F4F7FB]">
        <div className="w-full max-w-[440px] bg-white rounded-[24px] border border-[#E5EAF1] p-8 md:p-10 shadow-[0_1px_3px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)]">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#0B1B3A] tracking-tight font-display">
              Welcome back
            </h2>
            <p className="text-sm text-[#55607A] font-medium mt-1.5">
              Enter your credentials to access your store terminal.
            </p>
          </div>

          {/* Slim Notice if already signed in */}
          {isAuthenticated && user && (
            <div className="mb-5 p-3.5 rounded-xl border bg-[#E6F6F2] border-[#12A58B]/30 text-[#0E8C76] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#12A58B] shrink-0" />
                <span className="truncate">
                  Signed in as <strong className="font-bold text-[#0B1B3A]">{user.email}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateByRole(user)}
                  className="text-[#12A58B] hover:text-[#0E8C76] font-bold underline cursor-pointer"
                >
                  Continue to dashboard →
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[#E5484D] hover:underline font-bold cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* Small orange notice: database connecting */}
          {dbConnecting && (
            <div className="mb-5 p-3 rounded-xl border bg-[#FFF8EB] border-[#FDE68A] text-[#92400E] flex items-center gap-2.5 text-xs font-semibold leading-relaxed animate-fade-in shadow-2xs">
              <RefreshCw size={15} className="shrink-0 text-[#D97706] animate-spin" />
              <span>Connecting to the database, please wait...</span>
            </div>
          )}

          {/* Auto-retry notice */}
          {retryStatus && (
            <div className="mb-5 p-3 rounded-xl border bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF] flex items-center gap-2.5 text-xs font-semibold animate-pulse">
              <RefreshCw size={14} className="shrink-0 animate-spin text-[#3B82F6]" />
              <span>{retryStatus}</span>
            </div>
          )}

          {/* General authentication error banner */}
          {backendError && (
            <div className="mb-5 p-3.5 rounded-xl border bg-[#FEE2E2] border-[#FECACA] text-[#E5484D] flex items-start gap-3 text-xs font-semibold leading-relaxed animate-shake">
              <AlertCircle size={18} className="shrink-0 text-[#E5484D] mt-0.5" />
              <div>
                <strong className="font-extrabold block mb-0.5">Authentication Failed</strong>
                <span>{backendError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="name@company.com"
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

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#55607A] hover:text-[#0B1B3A] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#12A58B] focus:ring-[#12A58B] border-[#CBD5E1]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="font-bold text-[#12A58B] hover:text-[#0E8C76] transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-bold shadow-[0_2px_10px_rgba(18,165,139,0.3)] bg-[#12A58B] hover:bg-[#0E8C76]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying credentials...</span>
                </span>
              ) : (
                'Login to Terminal'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5EAF1] text-center">
            <p className="text-xs text-[#55607A] font-medium">
              Want to register a new supermarket?{' '}
              <Link
                to="/onboard"
                className="text-[#12A58B] font-bold hover:underline"
              >
                Apply for Onboarding
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 text-center space-y-4 border border-[#E5EAF1] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#E6F6F2] text-[#0E8C76] flex items-center justify-center mx-auto font-bold">
              <KeyRound size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0B1B3A]">Reset Password</h3>
            <p className="text-xs text-[#55607A] leading-relaxed">
              For security in multi-tenant mode, password resets must be issued by your Store Administrator or Platform Super Admin.
            </p>
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={() => setShowForgotModal(false)}
            >
              Back to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
