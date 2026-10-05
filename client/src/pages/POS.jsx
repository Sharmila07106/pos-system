import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const POS = () => {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const searchInputRef = useRef(null);

  // Quick Products demo (would be fetched from API in full implementation)
  const quickProducts = [
    { _id: '1', name: 'Organic Milk 1L', price: 65, category: 'Dairy' },
    { _id: '2', name: 'Whole Wheat Bread', price: 40, category: 'Bakery' },
    { _id: '3', name: 'Classic Chips', price: 20, category: 'Snacks' },
    { _id: '4', name: 'Cola 2L', price: 90, category: 'Beverages' },
  ];

  // Hotkeys
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
        toast.error('Product not found');
      }
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        // Assume unlimited stock for UI mock, in real life check product.stock
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
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

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% tax from settings
  const discount = 0;
  const grandTotal = subtotal + tax - discount;
  const change = (Number(amountReceived) || 0) - grandTotal;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (paymentMethod === 'CASH' && (Number(amountReceived) < grandTotal)) {
      return toast.error('Insufficient amount received');
    }

    try {
      const payload = {
        items: cart.map(item => ({
          _id: item._id,
          qty: item.qty
        })),
        discount,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : grandTotal
      };

      const { data } = await api.post('/sales', payload);
      
      toast.success('Sale Completed Successfully!');
      // Typically you would open receipt modal here with data.data (the sale object)
      console.log('Sale Object:', data.data);
      
      setCart([]);
      setAmountReceived('');
    } catch (error) {
      // Error is handled by api interceptor
      console.error(error);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      
      {/* LEFT: Products Area */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#0a0f25]/50 flex items-center relative">
          <Search className="absolute left-6 text-slate-400" size={20} />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeSearch}
            placeholder="Scan barcode or search product... [F2]"
            className="w-full bg-transparent pl-12 pr-4 py-3 text-lg text-white placeholder-slate-500 outline-none"
            autoFocus
          />
        </div>

        <div className="glass-card flex-1 rounded-2xl border border-white/5 bg-[#0a0f25]/30 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Snacks', 'Beverages', 'Dairy', 'Fruits', 'Personal Care'].map(cat => (
              <button key={cat} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${cat === 'All' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
            {quickProducts.map(p => (
              <div 
                key={p._id} 
                onClick={() => addToCart(p)}
                className="bg-[#030712]/50 border border-white/5 rounded-xl p-4 cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,229,255,0.15)] hover:border-cyan-500/30 transition-all group"
              >
                <div className="aspect-square bg-white/5 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                  <ShoppingBag size={32} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <h3 className="font-medium text-slate-200 text-sm truncate">{p.name}</h3>
                <div className="mt-1 font-bold text-cyan-400">₹{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart & Payment */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        
        {/* Cart */}
        <div className="glass-card flex-1 rounded-2xl border border-white/5 bg-[#0a0f25]/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#030712]/30">
            <h2 className="font-bold text-lg text-white">Cart <span className="text-slate-400 font-normal text-sm ml-2">({cart.length} items)</span></h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <ShoppingBag size={48} className="opacity-20" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/5">
                    <ShoppingBag size={20} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{item.name}</div>
                    <div className="text-cyan-400 font-medium text-sm">₹{item.price}</div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#030712] rounded-lg border border-white/5">
                    <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-l-lg transition-colors"><Minus size={14} /></button>
                    <span className="w-6 text-center font-medium text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-r-lg transition-colors"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors ml-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Billing */}
          <div className="p-5 border-t border-white/5 bg-[#030712]/50 space-y-3">
             <div className="flex justify-between text-sm text-slate-400">
               <span>Subtotal</span>
               <span>₹{subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-slate-400">
               <span>Tax (5%)</span>
               <span>₹{tax.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-green-400">
               <span>Discount</span>
               <span>- ₹{discount.toFixed(2)}</span>
             </div>
             <div className="pt-3 border-t border-white/10 flex justify-between items-end">
               <span className="text-lg font-medium text-slate-200">Grand Total</span>
               <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                 ₹{grandTotal.toFixed(2)}
               </span>
             </div>
          </div>
        </div>

        {/* Payment */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0a0f25]/50 p-5">
           <h3 className="font-medium text-white mb-4">Payment Method</h3>
           <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { id: 'CASH', icon: Banknote, label: 'Cash' },
                { id: 'CARD', icon: CreditCard, label: 'Card' },
                { id: 'UPI', icon: QrCode, label: 'UPI' }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-3 rounded-xl flex flex-col items-center gap-2 border transition-all ${
                    paymentMethod === method.id 
                    ? 'bg-blue-600/20 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]' 
                    : 'bg-[#030712]/50 border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <method.icon size={20} />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
           </div>

           {paymentMethod === 'CASH' && (
             <div className="space-y-4 mb-5">
               <div>
                 <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">Amount Received</label>
                 <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                   <input
                     type="number"
                     value={amountReceived}
                     onChange={(e) => setAmountReceived(e.target.value)}
                     className="w-full bg-[#030712] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-lg font-bold text-white outline-none focus:border-cyan-500 transition-colors"
                   />
                 </div>
               </div>
               <div>
                 <label className="text-xs font-medium text-slate-400 uppercase mb-1 block">Change</label>
                 <div className="w-full bg-[#030712]/50 border border-white/5 rounded-xl px-4 py-3 text-lg font-bold text-orange-400">
                   ₹{Math.max(0, change).toFixed(2)}
                 </div>
               </div>
             </div>
           )}

           <button
             onClick={handleCompleteSale}
             disabled={cart.length === 0}
             className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-lg shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
           >
             Complete Sale
           </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
