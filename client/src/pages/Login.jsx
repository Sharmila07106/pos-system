import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { LoginScene } from '../components/ui/LoginScene';

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
      toast.success('Welcome back to NovaPOS!');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <LoginScene />
      
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center z-10">
        
        {/* Left Side Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden md:flex flex-col justify-center space-y-8 p-8 relative"
        >
          <Link to="/" className="flex items-center gap-3 w-fit group">
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white text-3xl shadow-[0_0_30px_rgba(0,229,255,0.4)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-shadow duration-500">
               N
             </div>
             <h1 className="text-5xl font-black text-text-color tracking-tight">Nova<span className="gradient-text">POS</span></h1>
          </Link>
          
          <h2 className="text-6xl font-extrabold text-text-color leading-tight">
            Scan. Pay. <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Grow.</span>
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 text-xl max-w-md leading-relaxed font-medium">
            Faster checkout. Smarter retail operations. Process payments and track inventory in real-time.
          </p>
        </motion.div>

        {/* Right Side Form */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex justify-center md:justify-end w-full"
        >
          <GlassCard tilt className="w-full max-w-md p-8 shadow-2xl">
            {/* Inner top glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-blue-500"></div>
            
            <div className="mb-8 mt-2">
              <h2 className="text-3xl font-bold text-text-color mb-2">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Sign in to your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/5 dark:bg-white/5 border border-border-color rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-text-color placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none font-medium"
                    placeholder="admin@novapos.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-black/5 dark:bg-white/5 border border-border-color rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-text-color placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-text-color transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm font-medium">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 border border-border-color rounded bg-black/5 dark:bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer" />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 group-hover:text-text-color transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-lg shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              Don't have an account? <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300">Contact admin</a>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
