import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
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
  Send
} from 'lucide-react';
import { StoreFlowLogo } from '../components/brand/StoreFlowLogo';
import { Card, TiltCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const StoreFlow3DScene = lazy(() => import('../components/three/StoreFlow3DScene'));

const Home = () => {
  const token = localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B1B3A] font-sans selection:bg-[#0FA38F]/20 selection:text-[#0FA38F]">
      
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E3E8F0] shadow-[0_1px_2px_rgba(11,27,58,0.04)]">
        <div className="max-w-[1440px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <StoreFlowLogo size={34} variant="dark" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[#53607A]">
            <a href="#hero" className="hover:text-[#0FA38F] transition-colors">Home</a>
            <a href="#features" className="hover:text-[#0FA38F] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0FA38F] transition-colors">How it works</a>
            <Link to="/onboard" className="text-[#0FA38F] hover:underline font-extrabold transition-colors">Register Supermarket</Link>
            <Link to="/application-status" className="hover:text-[#0FA38F] transition-colors">Track Status</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/onboard" className="hidden sm:inline-block">
              <Button variant="outline" size="sm" className="border-[#0FA38F]/40 text-[#0FA38F] hover:bg-[#E2F6F3]/50">
                Register Store
              </Button>
            </Link>
            {token ? (
              <Link to="/dashboard">
                <Button variant="primary" size="md">
                  Dashboard <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="md">
                  Login to POS
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Navy to deep teal gradient) */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#0D2845] to-[#0B3B4A] text-white py-16 md:py-24">
        {/* Teal glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0FA38F]/15 blur-[140px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2F6F3]/10 border border-[#0FA38F]/30 text-xs font-bold text-[#0FA38F] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#0FA38F]" />
              Retail checkout, simplified
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Checkout in seconds. <br />
              <span className="text-[#0FA38F]">Stock always right.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#8B96AB] max-w-xl font-medium leading-relaxed">
              Scan product barcodes instantly, process cash, card, and UPI transactions smoothly, and reconcile live inventory without manual math. Built for fast retail operations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={token ? "/dashboard" : "/login"}>
                <Button variant="primary" size="lg" className="shadow-[0_4px_16px_rgba(15,163,143,0.4)]">
                  {token ? "Open Register" : "Login to POS"} <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/onboard">
                <Button variant="outline" size="lg" className="border-[#0FA38F]/40 bg-[#0FA38F]/10 text-white hover:bg-[#0FA38F]/20 font-bold">
                  Register Supermarket
                </Button>
              </Link>
              <Link to="/application-status" className="text-xs font-bold text-white/70 hover:text-white underline">
                Track Application
              </Link>
            </div>

            <div className="pt-8 border-t border-white/10 flex items-center gap-8 text-xs font-bold text-white/70 uppercase tracking-wider">
              <span>✓ MERN Architecture</span>
              <span>✓ Atomic Stock Checks</span>
              <span>✓ Zero Latency Scanning</span>
            </div>
          </div>

          {/* 3D Scene viewport */}
          <div className="lg:col-span-5 h-[380px] sm:h-[460px] relative rounded-[24px] overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl flex items-center justify-center">
            <Suspense fallback={
              <div className="text-sm font-bold text-[#0FA38F]">
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
          <span className="text-xs font-bold text-[#0FA38F] uppercase tracking-wider">Key Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2">
            Engineered for high-volume counter operations
          </h2>
          <p className="text-[#53607A] font-medium text-base mt-3">
            Every feature is purpose-built to accelerate cashier throughput and maintain pristine stock ledgers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Zap,
              title: 'Fast Checkout',
              desc: 'High-speed barcode scanner integration with instant keyboard shortcuts [F2, F8, F9] for rapid cashier workflows.',
              color: '#0FA38F',
              tint: '#E2F6F3'
            },
            {
              icon: Boxes,
              title: 'Live Inventory',
              desc: 'Stock automatically deducts atomically upon sale completion with prevention against overselling and negative counts.',
              color: '#FF8A1F',
              tint: '#FFF1E3'
            },
            {
              icon: BarChart3,
              title: 'Sales Insights',
              desc: 'Live MongoDB aggregation feeds daily revenues, payment breakdown donuts, and real-time transaction history.',
              color: '#2F6BFF',
              tint: '#DBEAFE'
            },
            {
              icon: ShieldCheck,
              title: 'Secure Roles',
              desc: 'Strict role segregation between Administrators (catalog, inventory, users) and Cashiers (billing, checkout).',
              color: '#16A34A',
              tint: '#DCFCE7'
            }
          ].map((feat, i) => (
            <TiltCard key={i} className="flex flex-col justify-between">
              <div>
                <div 
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5"
                  style={{ backgroundColor: feat.tint, color: feat.color }}
                >
                  <feat.icon size={24} strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-[#0B1B3A] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#53607A] leading-relaxed font-medium">{feat.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* 4. How It Works (3 Steps) */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E3E8F0]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#0FA38F] uppercase tracking-wider">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2">
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
                desc: 'MongoDB ledger transactions record stock movement atomically, generate print-ready thermal receipts, and refresh analytics.'
              }
            ].map((step, idx) => (
              <div key={idx} className="relative p-8 rounded-[18px] bg-[#F4F7FB] border border-[#E3E8F0]">
                <div className="text-4xl font-extrabold text-[#0FA38F]/20 mb-4">{step.step}</div>
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E3E8F0] text-[#0B1B3A] flex items-center justify-center mb-4">
                  <step.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold text-[#0B1B3A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#53607A] font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Role Capabilities (Admin vs Cashier) */}
      <section id="roles" className="py-20 md:py-28 max-w-[1440px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#0FA38F] uppercase tracking-wider">Access Control</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1B3A] tracking-tight mt-2">
            Tailored interfaces by staff responsibility
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin card */}
          <Card className="p-8 border-t-4 border-t-[#0B1B3A]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-[#EEF2F8] text-[#0B1B3A] flex items-center justify-center font-bold">
                <Shield size={24} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#0B1B3A]">Administrator</h3>
                <p className="text-xs font-bold text-[#8B96AB] uppercase tracking-wider">Full Store Control</p>
              </div>
            </div>
            <ul className="space-y-3.5 text-sm text-[#53607A] font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                <span>Full Product Catalog CRUD & image uploading</span>
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
                <span>Employee accounts & cashier register management</span>
              </li>
            </ul>
          </Card>

          {/* Cashier card */}
          <Card className="p-8 border-t-4 border-t-[#0FA38F]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-bold">
                <UserCheck size={24} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#0B1B3A]">Cashier</h3>
                <p className="text-xs font-bold text-[#0FA38F] uppercase tracking-wider">High-Speed Register</p>
              </div>
            </div>
            <ul className="space-y-3.5 text-sm text-[#53607A] font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0FA38F] shrink-0" />
                <span>Ultra-fast barcode scanning and product search terminal</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0FA38F] shrink-0" />
                <span>Live cart calculations with automatic tax & change computing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0FA38F] shrink-0" />
                <span>Cash, Card, and UPI tender processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-[#0FA38F] shrink-0" />
                <span>Instant thermal receipt printing and shift sales summary</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-20 bg-white border-t border-[#E3E8F0]">
        <div className="max-w-xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-[#0FA38F] uppercase tracking-wider">Inquiries</span>
          <h2 className="text-3xl font-extrabold text-[#0B1B3A] tracking-tight mt-2 mb-4">
            Connect with StoreFlow support
          </h2>
          <p className="text-[#53607A] font-medium text-sm mb-8">
            Deploying StoreFlow in your retail outlet or need support configuring your barcode scanners?
          </p>

          <form onSubmit={(e) => { e.preventDefault(); alert('Message dispatched to system administrator.'); }} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-[#53607A] uppercase tracking-wider block mb-1">Your Name</label>
              <input required type="text" placeholder="Store Manager" className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-[12px] px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#0FA38F]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#53607A] uppercase tracking-wider block mb-1">Your Email</label>
              <input required type="email" placeholder="manager@retailstore.com" className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-[12px] px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#0FA38F]" />
            </div>
            <div>
              <label className="text-xs font-bold text-[#53607A] uppercase tracking-wider block mb-1">Message</label>
              <textarea rows={3} placeholder="Inquiry details..." className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-[12px] px-4 py-3 text-sm text-[#0B1B3A] outline-none focus:border-[#0FA38F]" />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" icon={Send}>
              Send Inquiry
            </Button>
          </form>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[#E3E8F0] py-12 bg-[#F4F7FB]">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#8B96AB]">
          <StoreFlowLogo size={28} variant="dark" />
          <div className="flex items-center gap-4 font-semibold text-xs text-[#53607A]">
            <Link to="/platform-admin" className="hover:text-[#0FA38F] transition-colors flex items-center gap-1">
              <ShieldCheck size={13} /> Platform Admin Evaluation
            </Link>
          </div>
          <div>
            &copy; {new Date().getFullYear()} StoreFlow POS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
