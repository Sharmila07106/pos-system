import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, QrCode, CheckCircle2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useSpring, useTransform, motionValue } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api from '../services/api';
import GlassCard from '../components/ui/GlassCard';

// Animated Number Component
const AnimatedNumber = ({ value }) => {
  const animatedValue = useSpring(value, { stiffness: 100, damping: 20 });
  
  useEffect(() => {
    animatedValue.set(value);
  }, [animatedValue, value]);

  const display = useTransform(animatedValue, (current) => `₹${current.toFixed(2)}`);
  
  return <motion.span>{display}</motion.span>;
};

const POS = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleteData, setSaleCompleteData] = useState(null);
  
  const searchInputRef = useRef(null);
  const { width, height } = useWindowSize();

  // Quick Products demo (Would be real API data in full production)
  const quickProducts = [
    { _id: '1', name: 'Organic Milk 1L', price: 65, category: 'Dairy' },
    { _id: '2', name: 'Whole Wheat Bread', price: 40, category: 'Bakery' },
    { _id: '3', name: 'Classic Chips', price: 20, category: 'Snacks' },
    { _id: '4', name: 'Cola 2L', price: 90, category: 'Beverages' },
    { _id: '5', name: 'Fresh Apples 1kg', price: 180, category: 'Fruits' },
    { _id: '6', name: 'Dark Chocolate', price: 120, category: 'Snacks' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      try {
        const { data } = await api.get(`/products/barcode/${search}`);
        addToCart(data.data);
        setSearch('');
      } catch (error) {
        toast.error('Product not found or out of stock');
      }
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [{ ...product, qty: 1 }, ...prev];
    });
    
    // Tiny haptic bump if supported
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% mock tax
  const discount = 0;
  const grandTotal = subtotal + tax - discount;
  const change = (Number(amountReceived) || 0) - grandTotal;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (paymentMethod === 'CASH' && (Number(amountReceived) < grandTotal)) {
      return toast.error('Insufficient amount received');
    }

    setIsProcessing(true);
    try {
      const payload = {
        items: cart.map(item => ({ _id: item._id, qty: item.qty, name: item.name, price: item.price })),
        discount,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : grandTotal
      };

      const { data } = await api.post('/sales', payload);
      
      // Success State
      setSaleCompleteData(data.data);
      setCart([]);
      setAmountReceived('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Full Screen Success & Receipt Overlay
  if (saleCompleteData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4">
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#00e5ff', '#8b5cf6', '#f97316']} />
        
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] mb-4">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Payment Successful!</h2>
          <p className="text-slate-300">Change Due: <span className="font-bold text-orange-400 text-xl">₹{saleCompleteData.changeGiven?.toFixed(2)}</span></p>
        </motion.div>

        <motion.div 
          initial={{ y: 1000 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 0.2 }}
          className="bg-white text-slate-900 w-full max-w-sm rounded-t-xl p-6 shadow-2xl relative"
        >
          {/* Paper jagged top edge effect could go here */}
          <div className="text-center mb-6 border-b border-slate-200 pb-4">
            <h3 className="font-bold text-2xl tracking-tighter">NovaPOS</h3>
            <p className="text-xs text-slate-500">Scan. Pay. Grow.</p>
            <p className="text-xs text-slate-500 mt-2">Txn: {saleCompleteData.transactionId}</p>
          </div>
          
          <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
            {saleCompleteData.items.map(item => (
              <div key={item._id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span className="font-medium">₹{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>₹{saleCompleteData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span>₹{saleCompleteData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>₹{saleCompleteData.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
             <button onClick={() => setSaleCompleteData(null)} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
               New Sale
             </button>
             <button className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
               <Printer size={18} /> Print
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 relative z-10">
      {/* LEFT: Products Area */}
      <div className="flex-1 flex flex-col gap-6">
        <GlassCard className="p-2 flex items-center shadow-lg relative group focus-within:ring-2 ring-cyan-500/50 transition-all">
          <div className="absolute left-6 text-slate-400 group-focus-within:text-cyan-400 transition-colors">
            <Search size={22} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeSearch}
            placeholder="Scan barcode or search product... [F2]"
            className="w-full bg-transparent pl-14 pr-4 py-4 text-lg text-text-color placeholder-slate-500 outline-none font-medium"
            autoFocus
          />
        </GlassCard>

        <GlassCard className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Snacks', 'Beverages', 'Dairy', 'Fruits'].map(cat => (
              <button key={cat} className={`px-5 py-2 rounded-xl whitespace-nowrap text-sm font-bold transition-all ${cat === 'All' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-black/5 dark:bg-white/5 text-slate-500 hover:text-text-color border border-border-color hover:bg-black/10 dark:hover:bg-white/10'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4 pr-2">
            {quickProducts.map((p, i) => (
              <motion.div 
                key={p._id} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(p)}
                className="bg-card-bg border border-border-color rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-[0_8px_30px_rgba(0,229,255,0.15)] hover:border-cyan-500/30 transition-all group backdrop-blur-sm"
              >
                <div className="aspect-square bg-black/5 dark:bg-white/5 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                  <ShoppingBag size={32} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
                <h3 className="font-bold text-text-color text-sm truncate">{p.name}</h3>
                <div className="mt-1 font-black text-cyan-500">₹{p.price.toFixed(2)}</div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* RIGHT: Cart & Billing */}
      <GlassCard className="w-full lg:w-[420px] flex flex-col shadow-2xl overflow-hidden min-h-0">
        
        {/* Cart Header */}
        <div className="p-5 border-b border-border-color bg-black/5 dark:bg-black/20 flex items-center justify-between">
          <h2 className="font-bold text-xl flex items-center gap-2">
            Current Order
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs rounded-md">{cart.length}</span>
          </h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-sm text-red-500 font-medium hover:text-red-400 transition-colors">Clear</button>
          )}
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4"
              >
                <ShoppingBag size={48} className="opacity-20" />
                <p className="font-medium">Cart is empty</p>
              </motion.div>
            ) : (
              cart.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={item._id} 
                  className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-border-color"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{item.name}</div>
                    <div className="text-cyan-500 font-bold text-xs mt-0.5">₹{item.price}</div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-bg-color rounded-lg border border-border-color p-0.5">
                    <button onClick={() => updateQty(item._id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-text-color hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"><Minus size={14} /></button>
                    <motion.span key={item.qty} initial={{ scale: 1.5, color: '#00e5ff' }} animate={{ scale: 1, color: 'var(--text-color)' }} className="w-6 text-center font-bold text-sm">{item.qty}</motion.span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-text-color hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"><Plus size={14} /></button>
                  </div>
                  
                  <button onClick={() => removeFromCart(item._id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors bg-black/5 dark:bg-white/5 hover:bg-red-500/10 rounded-lg ml-1">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Billing & Payment */}
        <div className="bg-black/5 dark:bg-black/30 border-t border-border-color">
          {/* Totals */}
          <div className="p-5 space-y-2 border-b border-border-color">
             <div className="flex justify-between text-sm text-slate-500 font-medium">
               <span>Subtotal</span>
               <span>₹{subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-500 font-medium">
               <span>Tax (5%)</span>
               <span>₹{tax.toFixed(2)}</span>
             </div>
             <div className="pt-3 flex justify-between items-end">
               <span className="text-lg font-bold text-slate-600 dark:text-slate-300">Total</span>
               <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
                 <AnimatedNumber value={grandTotal} />
               </span>
             </div>
          </div>

          {/* Payment Methods */}
          <div className="p-5">
             <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { id: 'CASH', icon: Banknote, label: 'Cash' },
                  { id: 'CARD', icon: CreditCard, label: 'Card' },
                  { id: 'UPI', icon: QrCode, label: 'UPI' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`py-3 rounded-xl flex flex-col items-center gap-2 border transition-all font-bold ${
                      paymentMethod === method.id 
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)] scale-[1.02]' 
                      : 'bg-bg-color border-border-color text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    <method.icon size={20} />
                    <span className="text-xs">{method.label}</span>
                  </button>
                ))}
             </div>

             <AnimatePresence mode="wait">
               {paymentMethod === 'CASH' && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="space-y-4 mb-5 overflow-hidden"
                 >
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Amount Received</label>
                     <div className="relative group">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 font-black text-lg">₹</span>
                       <input
                         type="number"
                         value={amountReceived}
                         onChange={(e) => setAmountReceived(e.target.value)}
                         className="w-full bg-bg-color border border-border-color rounded-xl pl-9 pr-4 py-3 text-xl font-black text-text-color outline-none focus:border-cyan-500 focus:ring-2 ring-cyan-500/20 transition-all"
                       />
                     </div>
                   </div>
                   <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
                     <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Change Due</span>
                     <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                       <AnimatedNumber value={Math.max(0, change)} />
                     </span>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             <motion.button
               whileTap={cart.length > 0 ? { scale: 0.97 } : {}}
               onClick={handleCompleteSale}
               disabled={cart.length === 0 || isProcessing}
               className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-lg shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden"
             >
               {isProcessing ? (
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               ) : (
                 <>
                   Checkout <AnimatedNumber value={grandTotal} />
                 </>
               )}
             </motion.button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default POS;
