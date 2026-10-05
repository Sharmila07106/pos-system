import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, ArrowRight, CheckCircle2, BarChart3, ShieldCheck, Zap } from 'lucide-react';

const Home = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-color text-text-color transition-colors duration-300 font-sans">
      {/* Background gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-cyan-500/20">
            N
          </div>
          <span className="font-bold text-xl tracking-tight">Nova<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-violet-500">POS</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-cyan-500 transition-colors">Features</a>
          <a href="#contact" className="hover:text-cyan-500 transition-colors">Contact</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <Link to="/login" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-blue-600/20 transition-all active:scale-95">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            More Than <br/> Just a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">POS</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg">
            Manage your store, track inventory, process payments and grow your business — all in one premium platform.
          </p>
          <div className="flex gap-4">
             <Link to="/login" className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-xl shadow-blue-500/30 transition-all flex items-center gap-2">
               Get Started <ArrowRight size={20} />
             </Link>
          </div>
        </div>
        
        {/* 3D / Premium Visual Placeholder */}
        <div className="flex-1 w-full relative">
          <div className="w-full aspect-square md:aspect-video rounded-3xl glass-card border border-border-color shadow-2xl overflow-hidden relative group">
            {/* Inner top glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500 z-10"></div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex items-center justify-center p-8">
               <div className="w-full h-full border border-dashed border-slate-400/30 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4 group-hover:scale-105 transition-transform duration-700">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 animate-pulse blur-xl absolute"></div>
                  <div className="relative z-10 w-24 h-24 rounded-2xl glass-card flex items-center justify-center shadow-2xl">
                    <span className="font-bold text-3xl text-text-color">N</span>
                  </div>
                  <p className="relative z-10 text-sm font-medium tracking-widest uppercase mt-4">Interactive 3D Scene Loading...</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-24 border-t border-border-color">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to run your retail business</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Built for speed, reliability, and growth. NovaPOS combines world-class design with powerful inventory and sales management tools.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'Fast Checkout', desc: 'Scan barcodes and process payments in seconds.' },
            { icon: CheckCircle2, title: 'Live Inventory', desc: 'Stock levels update automatically with every sale.' },
            { icon: BarChart3, title: 'Sales Analytics', desc: 'Beautiful charts to track your daily and monthly performance.' },
            { icon: ShieldCheck, title: 'Secure & Reliable', desc: 'Role-based access and secure data storage on MongoDB Atlas.' }
          ].map((feat, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-border-color hover:-translate-y-2 transition-transform duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border-color py-12 mt-12 bg-black/5 dark:bg-black/20">
        <div className="container mx-auto px-6 text-center text-sm text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center font-bold text-white text-xs">N</div>
             <span className="font-bold text-text-color tracking-tight">NovaPOS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} NovaPOS. Built for retail growth.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
