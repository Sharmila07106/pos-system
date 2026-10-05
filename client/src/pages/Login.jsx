import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Fake login for now until API is wired
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Login successful!');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#030712] p-4">
      {/* 3D background placeholder (Glassmorphism blobs) */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[120px]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/20 blur-[120px]"></div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center z-10">
        
        {/* Left Side Branding */}
        <div className="hidden md:flex flex-col justify-center space-y-6 p-8">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white text-2xl shadow-[0_0_20px_rgba(0,229,255,0.4)]">
               N
             </div>
             <h1 className="text-4xl font-bold text-white tracking-tight">Nova<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">POS</span></h1>
          </div>
          
          <h2 className="text-5xl font-extrabold text-white leading-tight">
            Scan • Pay • <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Grow</span>
          </h2>
          
          <p className="text-slate-400 text-xl max-w-md">
            Faster checkout. Smarter retail operations. Manage your store, track inventory, and process payments all in one place.
          </p>
          
          <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-4 text-sm text-slate-500">
             <span>Secure & Reliable</span>
             <span>•</span>
             <span>Live Analytics</span>
             <span>•</span>
             <span>Fast Checkout</span>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="flex justify-center md:justify-end w-full">
          <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Inner top glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-blue-500"></div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-slate-400">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0f25]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition-all outline-none"
                    placeholder="admin@novapos.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-[#0a0f25]/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded bg-[#0a0f25] border-white/10 text-cyan-500 focus:ring-cyan-500/50" />
                  <span className="text-slate-300">Remember me</span>
                </label>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Don't have an account? <a href="#" className="text-cyan-400 hover:text-cyan-300">Contact admin</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
