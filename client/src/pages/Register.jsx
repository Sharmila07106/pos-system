import React, { useState, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Store,
  Phone,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import { Input, PasswordInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';

// Lazy load 3D scene matching login
const StoreFlow3DScene = lazy(() => import('../components/three/StoreFlow3DScene'));

const getPasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: '#CBD5E1', percent: 0 };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#E5484D', percent: 25 };
  if (score === 2) return { score: 2, label: 'Fair', color: '#FF8A1F', percent: 50 };
  if (score <= 4) return { score: 3, label: 'Good', color: '#2F6BFF', percent: 75 };
  return { score: 4, label: 'Strong', color: '#0FA38F', percent: 100 };
};

const Register = () => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Touched state for inline validations
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  const navigate = useNavigate();
  const { registerStore, loginWithGoogle } = useAuth();

  const strength = getPasswordStrength(password);

  const navigateByRole = (userObj) => {
    if (
      userObj?.role === 'PLATFORM_SUPER_ADMIN' ||
      userObj?.role === 'PLATFORM_ADMIN' ||
      userObj?.isPlatformAdmin
    ) {
      navigate('/platform-admin');
    } else if (
      userObj?.role === 'store_admin' ||
      userObj?.role === 'STORE_ADMIN' ||
      userObj?.role === 'STORE_OWNER' ||
      userObj?.role === 'ADMIN'
    ) {
      navigate('/dashboard');
    } else if (userObj?.role === 'cashier' || userObj?.role === 'CASHIER') {
      navigate('/pos');
    } else {
      navigate('/dashboard');
    }
  };

  // Inline validation calculations
  const storeNameError =
    touched.storeName && storeName.trim().length < 2
      ? 'Supermarket name must be at least 2 characters'
      : '';

  const ownerNameError =
    touched.ownerName && ownerName.trim().length < 2
      ? 'Owner name must be at least 2 characters'
      : '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError =
    touched.email && !emailRegex.test(email.trim())
      ? 'Please enter a valid email address'
      : '';

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMissingLetterOrNum =
    password.length >= 8 && !/^(?=.*[A-Za-z])(?=.*\d)/.test(password);

  let passwordError = '';
  if (touched.password) {
    if (passwordTooShort) passwordError = 'Must be at least 8 characters';
    else if (passwordMissingLetterOrNum)
      passwordError = 'Must contain at least one letter and one number';
  }

  const confirmError =
    touched.confirmPassword && password !== confirmPassword
      ? 'Passwords do not match'
      : '';

  const isFormValid =
    storeName.trim().length >= 2 &&
    ownerName.trim().length >= 2 &&
    emailRegex.test(email.trim()) &&
    password.length >= 8 &&
    /^(?=.*[A-Za-z])(?=.*\d)/.test(password) &&
    password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setBackendError('');

    if (!isFormValid) {
      setTouched({
        storeName: true,
        ownerName: true,
        email: true,
        phone: true,
        address: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);

    try {
      await registerStore({
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
      });

      // Target flow: NO auto-login. Show toast and redirect to Login.
      toast.success('Registration submitted, waiting for platform approval', {
        duration: 5000,
      });
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 503 || err.response?.data?.code === 'DB_NOT_CONNECTED') {
        setBackendError(
          'Database Offline: The backend database is disconnected. Please configure MONGODB_URI in server/.env and restart.'
        );
      } else {
        const message =
          err.response?.data?.message || err.message || 'Registration failed';
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
      const data = await loginWithGoogle(credential, true);
      toast.success(`Welcome to StoreFlow, ${data.data?.name || 'User'}!`);
      navigateByRole(data.data);
    } catch (err) {
      if (err.response?.data?.code === 'STORE_PENDING') {
        toast.info('Registration submitted, waiting for platform approval', {
          duration: 5000,
        });
        navigate('/login');
      } else if (err.response?.status === 503 || err.response?.data?.code === 'DB_NOT_CONNECTED') {
        setBackendError(
          'Database Offline: The backend database is disconnected. Please configure MONGODB_URI in server/.env and restart.'
        );
      } else {
        const message =
          err.response?.data?.message || err.message || 'Google registration failed';
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
      {/* Left 50%: Navy to deep teal gradient with 3D scene */}
      <div className="w-full md:w-[48%] min-h-[300px] md:min-h-screen relative flex flex-col justify-between p-8 md:p-14 overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#0D2845] to-[#0B3B4A]">
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
                Loading 3D Terminal...
              </div>
            }
          >
            <StoreFlow3DScene />
          </Suspense>
        </div>

        {/* Bottom brand copy */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0FA38F]/20 text-[#0FA38F] text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={14} /> Supermarket Registration
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Register your supermarket. <br />
            <span className="text-[#0FA38F]">Unified retail platform.</span>
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#8B96AB] font-medium leading-relaxed">
            Submit your supermarket application to receive platform approval. Access multi-terminal checkout, real-time inventory management, and role-based staff control.
          </p>
        </div>
      </div>

      {/* Right 52%: Centered Register Card */}
      <div className="w-full md:w-[52%] flex items-center justify-center p-6 md:p-10 bg-[#F4F7FB] overflow-y-auto">
        <div className="w-full max-w-[500px] bg-white rounded-[24px] border border-[#E3E8F0] p-8 md:p-10 shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)] my-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-[#0B1B3A] tracking-tight">
              Register your supermarket
            </h2>
            <p className="text-sm text-[#53607A] font-medium mt-1">
              Submit your store details. Platform super admin review is required prior to activation.
            </p>
          </div>

          {/* Backend error banner */}
          {backendError && (
            <div
              className={`mb-5 p-4 rounded-[14px] border flex items-start gap-3 text-xs font-semibold leading-relaxed animate-shake ${
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
                  {isDbOffline ? 'Database Offline (Action Required)' : 'Registration Failed'}
                </strong>
                <span>{backendError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Supermarket Name */}
            <Input
              label="Supermarket / Store Name"
              type="text"
              required
              icon={Store}
              placeholder="e.g. FreshMart Supermarket"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, storeName: true }))}
              error={storeNameError}
            />

            {/* Owner Full Name */}
            <Input
              label="Owner Full Name"
              type="text"
              required
              icon={User}
              placeholder="e.g. Sharmila U"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, ownerName: true }))}
              error={ownerNameError}
            />

            {/* Email Address */}
            <Input
              label="Owner Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="owner@supermarket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              error={emailError}
            />

            {/* Phone & Address in grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                type="tel"
                icon={Phone}
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Store Location / City"
                type="text"
                icon={MapPin}
                placeholder="Chennai, TN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <PasswordInput
                label="Password"
                required
                icon={Lock}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                error={passwordError}
              />

              {/* Live Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#8B96AB]">Password strength:</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EEF2F8] rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="h-full flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            strength.score >= step ? strength.color : '#EEF2F8',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[#8B96AB] font-medium pt-0.5">
                    Requires at least 8 characters, with 1 letter & 1 number.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <PasswordInput
              label="Confirm Password"
              required
              icon={Lock}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, confirmPassword: true }))
              }
              error={confirmError}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Submit Supermarket Registration
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
            label="Continue with Google"
          />

          {/* Bottom link to Login */}
          <div className="mt-6 pt-5 border-t border-[#E3E8F0] text-center">
            <p className="text-xs text-[#53607A] font-medium">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-bold text-[#0FA38F] hover:text-[#0B8A78] transition-colors ml-1"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
