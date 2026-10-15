import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowRight, 
  Zap, 
  Boxes, 
  BarChart3, 
  ShieldCheck, 
  Barcode, 
  Receipt, 
  CheckCircle2, 
  UserCheck, 
  Shield, 
  Send,
  LogIn,
  Menu,
  X
} from 'lucide-react';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import { Card, TiltCard } from '../components/ui/Card';

const StoreFlow3DScene = lazy(() => import('../components/three/StoreFlow3DScene'));

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Silent wake-up ping for free tier backend (Render)
    api.get('/health', { skipToast: true }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0F1B33] font-sans selection:bg-[#12A58B]/20 selection:text-[#12A58B]">
      
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5EAF1] shadow-[0_1px_3px_rgba(11,27,58,0.05)]">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <StoreFlowLogo size={34} variant="dark" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#55607A]">
            <a href="#hero" className="hover:text-[#12A58B] transition-colors">Home</a>
            <a href="#features" className="hover:text-[#12A58B] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#12A58B] transition-colors">How it works</a>
            <Link to="/onboard" className="text-[#12A58B] hover:text-[#0E8C76] font-extrabold hover:underline transition-colors">
              Register Supermarket
            </Link>
            <Link to="/application-status" className="hover:text-[#12A58B] transition-colors">
              Track Status
            </Link>
          </nav>

          {/* Desktop Right Side: EXACTLY ONE Teal Login Button */}
          <div className="hidden md:flex items-center">
            <Link 
              to="/login"
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#12A58B] hover:bg-[#0E8C76] text-white font-bold text-sm shadow-[0_2px_8px_rgba(18,165,139,0.25)] hover:shadow-[0_4px_12px_rgba(18,165,139,0.35)] transition-all whitespace-nowrap cursor-pointer active:scale-[0.98]"
            >
              <LogIn size={17} strokeWidth={2.2} />
              <span>Log In</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-xl bg-[#F4F7FB] border border-[#E5EAF1] text-[#0B1B3A] flex items-center justify-center hover:bg-[#E5EAF1] transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5EAF1] bg-white px-6 py-5 space-y-4 shadow-xl animate-fade-in">
            <nav className="flex flex-col space-y-3.5 text-sm font-bold text-[#55607A]">
              <a 
                href="#hero" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#12A58B] transition-colors"
              >
                Home
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#12A58B] transition-colors"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#12A58B] transition-colors"
              >
                How it works
              </a>
              <Link 
                to="/onboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[#12A58B] font-extrabold hover:text-[#0E8C76]"
              >
                Register Supermarket
              </Link>
              <Link 
                to="/application-status" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#12A58B] transition-colors"
              >
                Track Status
              </Link>
            </nav>

            <div className="pt-2 border-t border-[#E5EAF1]">
              <Link 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-[#12A58B] hover:bg-[#0E8C76] text-white font-bold text-sm shadow-md transition-all whitespace-nowrap"
              >
                <LogIn size={17} strokeWidth={2.2} />
                <span>Log In</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Navy to deep teal gradient) */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#0D2845] to-[#0B3B4A] text-white py-16 md:py-24">
        {/* Subtle teal ambient glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#12A58B]/15 blur-[140px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F6F2]/15 border border-[#12A58B]/40 text-xs font-bold text-[#5EEAD4] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#12A58B]" />
              Retail checkout, simplified
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-display">
              Checkout in seconds. <br />
              <span className="text-[#2DD4BF]">Stock always right.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 max-w-xl font-medium leading-relaxed">
              Scan product barcodes instantly, process cash, card, and UPI transactions smoothly, and reconcile live inventory without manual math. Built for fast retail operations.
            </p>

            {/* CTAs strictly pointing to public onboarding / login */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link 
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#12A58B] hover:bg-[#0E8C76] text-white font-bold text-base shadow-[0_4px_16px_rgba(18,165,139,0.4)] hover:shadow-[0_6px_20px_rgba(18,165,139,0.5)] transition-all whitespace-nowrap active:scale-[0.98]"
              >
                <span>Log In to Open Register</span>
                <ArrowRight size={18} />
              </Link>

              <Link 
                to="/onboard"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-white text-[#0B1B3A] hover:bg-[#E6F6F2] hover:text-[#0E8C76] font-bold text-base border border-[#E5EAF1] shadow-sm hover:shadow-md transition-all whitespace-nowrap active:scale-[0.98]"
              >
                Register Supermarket
              </Link>

              <Link 
                to="/application-status" 
                className="text-xs sm:text-sm font-bold text-[#5EEAD4] hover:text-white underline underline-offset-4 transition-colors ml-1"
              >
                Track Application
              </Link>
            </div>

            <div className="pt-8 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="text-[#2DD4BF]">✓</span> MERN Architecture</span>
              <span className="flex items-center gap-1.5"><span className="text-[#2DD4BF]">✓</span> Atomic Stock Checks</span>
              <span className="flex items-center gap-1.5"><span className="text-[#2DD4BF]">✓</span> Zero Latency Scanning</span>
            </div>
          </div>

          {/* 3D Scene viewport */}
          <div className="lg:col-span-5 h-[380px] sm:h-[460px] relative rounded-[24px] overflow-hidden border border-white/15 bg-white/[0.04] shadow-2xl flex items-center justify-center">
            <Suspense fallback={
              <div className="text-sm font-bold text-[#2DD4BF]">
                Loading Interactive POS Terminal...
              </div>
            }>
              <StoreFlow3DScene />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section id="features" className="py-20 md:py-28 max-w-[1440px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-[#12A58B] uppercase tracking-wider">Key Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2 font-display">
            Engineered for high-volume counter operations
          </h2>
          <p className="text-[#55607A] font-medium text-base mt-3">
            Every feature is purpose-built to accelerate cashier throughput and maintain pristine stock ledgers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Zap,
              title: 'Fast Checkout',
              desc: 'High-speed barcode scanner integration with instant keyboard shortcuts [F2, F8, F9] for rapid cashier workflows.',
              color: '#0E8C76',
              tint: '#E6F6F2'
            },
            {
              icon: Boxes,
              title: 'Live Inventory',
              desc: 'Stock automatically deducts atomically upon sale completion with prevention against overselling and negative counts.',
              color: '#D97706',
              tint: '#FEF3C7'
            },
            {
              icon: BarChart3,
              title: 'Sales Insights',
              desc: 'Live MongoDB aggregation feeds daily revenues, payment breakdown donuts, and real-time transaction history.',
              color: '#2563EB',
              tint: '#DBEAFE'
            },
            {
              icon: ShieldCheck,
              title: 'Secure Roles',
              desc: 'Strict role segregation between Supermarket Administrators (catalog, inventory, staff) and Cashiers (billing, checkout).',
              color: '#16A34A',
              tint: '#DCFCE7'
            }
          ].map((feat, i) => (
            <TiltCard key={i} className="flex flex-col justify-between bg-white border border-[#E5EAF1] p-6 rounded-[20px] shadow-sm">
              <div>
                <div 
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5"
                  style={{ backgroundColor: feat.tint, color: feat.color }}
                >
                  <feat.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-[#0B1B3A] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#55607A] leading-relaxed font-medium">{feat.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* 4. How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E5EAF1]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-[#12A58B] uppercase tracking-wider">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2 font-display">
              Simple 3-step checkout cycle
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                icon: Barcode,
                title: 'Scan Products',
                desc: 'Point your USB or Bluetooth barcode scanner or type with instant item lookup. Quantity steppers adjust automatically.'
              },
              {
                step: '02',
                icon: Receipt,
                title: 'Bill and Pay',
                desc: 'Tender via Cash (with instant change calculation), Credit/Debit Card, or scan-and-pay UPI with exact tax calculation.'
              },
              {
                step: '03',
                icon: CheckCircle2,
                title: 'Stock Updates Automatically',
                desc: 'MongoDB transactions record stock movement atomically, generate print-ready thermal receipts, and refresh analytics.'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative p-8 rounded-[20px] bg-[#F4F7FB] border border-[#E5EAF1] shadow-xs">
                <div className="text-4xl font-extrabold text-[#12A58B]/30 mb-4">{step.step}</div>
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E5EAF1] text-[#0B1B3A] flex items-center justify-center mb-4 shadow-2xs">
                  <step.icon size={22} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-[#0B1B3A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#55607A] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Role Capabilities (Admin vs Cashier) */}
      <section id="roles" className="py-20 md:py-28 max-w-[1440px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-extrabold text-[#12A58B] uppercase tracking-wider">Access Control</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2 font-display">
            Tailored interfaces by staff responsibility
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin card */}
          <Card className="p-8 border border-[#E5EAF1] border-t-4 border-t-[#0B1B3A] rounded-[20px] bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-[#EEF2F8] text-[#0B1B3A] flex items-center justify-center font-bold">
                <Shield size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#0B1B3A]">Store Administrator</h3>
                <p className="text-xs font-bold text-[#55607A] uppercase tracking-wider">Full Supermarket Authority</p>
              </div>
            </div>
            <ul className="space-y-3.5 text-sm text-[#55607A] font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <span>Product catalogue management & image uploading</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <span>Inventory adjustments and complete stock movement audit</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <span>Store-wide sales analytics & 7-day revenue charts</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <span>Employee accounts & cashier register invitations</span>
              </li>
            </ul>
          </Card>

          {/* Cashier card */}
          <Card className="p-8 border border-[#E5EAF1] border-t-4 border-t-[#12A58B] rounded-[20px] bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-[#E6F6F2] text-[#0E8C76] flex items-center justify-center font-bold">
                <UserCheck size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#0B1B3A]">Cashier</h3>
                <p className="text-xs font-bold text-[#0E8C76] uppercase tracking-wider">High-Speed Register & Inventory</p>
              </div>
            </div>
            <ul className="space-y-3.5 text-sm text-[#55607A] font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0E8C76] shrink-0" />
                <span>Ultra-fast barcode scanning and product search terminal</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0E8C76] shrink-0" />
                <span>Live cart calculations with automatic tax & change computing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0E8C76] shrink-0" />
                <span>Cash, Card, and UPI tender processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0E8C76] shrink-0" />
                <span>Stock intake, product details lookup, and shift sales summary</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-[#E5EAF1]">
        <div className="max-w-xl mx-auto px-6 text-center">
          <span className="text-xs font-extrabold text-[#12A58B] uppercase tracking-wider">Inquiries</span>
          <h2 className="text-3xl font-extrabold text-[#0B1B3A] tracking-tight mt-2 mb-4 font-display">
            Connect with StoreFlow support
          </h2>
          <p className="text-[#55607A] font-medium text-sm mb-8">
            Deploying StoreFlow in your supermarket or need support configuring your barcode scanners?
          </p>

          <form onSubmit={(e) => { e.preventDefault(); alert('Message dispatched to system administrator.'); }} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-[#55607A] uppercase tracking-wider block mb-1">Your Name</label>
              <input required type="text" placeholder="Store Manager" className="w-full bg-[#F4F7FB] border border-[#E5EAF1] rounded-xl px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#12A58B]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#55607A] uppercase tracking-wider block mb-1">Your Email</label>
              <input required type="email" placeholder="manager@retailstore.com" className="w-full bg-[#F4F7FB] border border-[#E5EAF1] rounded-xl px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#12A58B]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#55607A] uppercase tracking-wider block mb-1">Message</label>
              <textarea rows={3} placeholder="Inquiry details..." className="w-full bg-[#F4F7FB] border border-[#E5EAF1] rounded-xl px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#12A58B]" />
            </div>
            <button 
              type="submit" 
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#12A58B] hover:bg-[#0E8C76] text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
            >
              <Send size={16} />
              <span>Send Inquiry</span>
            </button>
          </form>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[#E5EAF1] py-12 bg-[#F4F7FB]">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#55607A]">
          <StoreFlowLogo size={28} variant="dark" />
          <div className="flex items-center gap-6 font-semibold text-xs text-[#55607A]">
            <Link to="/onboard" className="hover:text-[#12A58B] transition-colors">Register Supermarket</Link>
            <Link to="/application-status" className="hover:text-[#12A58B] transition-colors">Track Status</Link>
            <Link to="/login" className="hover:text-[#12A58B] transition-colors flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#12A58B]" /> Terminal Log In
            </Link>
          </div>
          <div className="font-medium text-xs text-[#55607A]">
            &copy; {new Date().getFullYear()} StoreFlow POS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
