import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  Printer, 
  Barcode, 
  RefreshCw, 
  Tag, 
  X,
  Package,
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api from '../services/api';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleteData, setSaleCompleteData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [imageErrorMap, setImageErrorMap] = useState({});

  const searchInputRef = useRef(null);
  const { width, height } = useWindowSize();

  // Load products & FEFO batches from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, batchRes] = await Promise.allSettled([
        api.get('/products?activeOnly=true&limit=100'),
        api.get('/inventory/batches')
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data) {
        setProducts(prodRes.value.data.data);
      }
      if (batchRes.status === 'fulfilled' && batchRes.value?.data?.data) {
        setBatches(batchRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Could not load products catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          toast('Cart cleared', { icon: '🗑️' });
        }
      } else if (e.key === 'Escape' && saleCompleteData) {
        setSaleCompleteData(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, saleCompleteData]);

  // Handle image load error
  const handleImageError = (productId) => {
    setImageErrorMap(prev => ({ ...prev, [productId]: true }));
  };

  // Derive categories list with product counts
  const categories = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, count: counts[name] }));
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  // Handle barcode search on Enter
  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const term = search.trim();
      const localMatch = products.find(p => p.barcode === term || p.name.toLowerCase() === term.toLowerCase());
      if (localMatch) {
        addToCart(localMatch);
        setSearch('');
        return;
      }

      try {
        const { data } = await api.get(`/products/barcode/${term}`);
        if (data?.data) {
          addToCart(data.data);
          setSearch('');
          toast.success(`Added ${data.data.name}`);
        }
      } catch (error) {
        toast.error('Product not found for barcode: ' + term);
      }
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error(`Only ${product.stock} units available in stock!`);
          return prev;
        }
        return prev.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [{ ...product, qty: 1 }, ...prev];
    });

    if (navigator.vibrate) navigator.vibrate(40);
  };

  // Stepper update
  const updateQty = (id, delta) => {
    const product = products.find(p => p._id === id);
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        if (product && newQty > product.stock) {
          toast.error(`Maximum stock reached (${product.stock})`);
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  // Remove single line
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% GST / VAT
  const discount = 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);
  const change = (Number(amountReceived) || 0) - grandTotal;

  // Checkout submission
  const handleCompleteSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (paymentMethod === 'CASH' && (Number(amountReceived) < grandTotal)) {
      return toast.error('Insufficient amount received');
    }

    setIsProcessing(true);
    try {
      const payload = {
        items: cart.map(item => ({ 
          _id: item._id, 
          qty: item.qty, 
          name: item.name, 
          price: item.price,
          barcode: item.barcode 
        })),
        discount,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : grandTotal
      };

      const { data } = await api.post('/sales', payload);
      setSaleCompleteData(data.data);
      setCart([]);
      setAmountReceived('');
      fetchProducts(); // Refresh stock
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick denomination chip handler
  const setCashQuickAmount = (val) => {
    if (val === 'EXACT') {
      setAmountReceived(String(Math.ceil(grandTotal)));
    } else {
      const current = Number(amountReceived) || 0;
      setAmountReceived(String(current + val));
    }
  };

  // Print receipt function
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 items-start relative z-10 pb-16">
      
      {/* ========================================================== */}
      {/* LEFT COLUMN: Search, Category Chips & Products Grid        */}
      {/* ========================================================== */}
      <div className="flex-1 min-w-0 w-full flex flex-col gap-6">
        
        {/* Top Scan Bar */}
        <div className="bg-white border border-[#E3E8F0] rounded-[18px] p-3 shadow-sm flex items-center gap-3 transition-all focus-within:border-[#0FA38F] focus-within:ring-2 focus-within:ring-[#0FA38F]/20">
          <div className="pl-2 text-[#8B96AB]">
            <Search size={22} strokeWidth={1.75} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleBarcodeSearch}
            placeholder="Scan barcode or search product name / category... [F2]"
            className="w-full bg-transparent text-base md:text-lg text-[#0B1B3A] placeholder-[#8B96AB] outline-none font-medium"
            autoFocus
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="p-1 rounded-lg hover:bg-[#EEF2F8] text-[#8B96AB] hover:text-[#0B1B3A] transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#EEF2F8] text-[#53607A] text-xs font-bold rounded-lg border border-[#E3E8F0]">
            <Barcode size={14} className="text-[#0FA38F]" />
            <span>F2 Scan</span>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#0FA38F] text-white border-[#0FA38F] shadow-[0_2px_8px_rgba(15,163,143,0.3)]'
                    : 'bg-white text-[#53607A] border-[#E3E8F0] hover:bg-[#EEF2F8] hover:text-[#0B1B3A]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#EEF2F8] text-[#8B96AB]'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Catalog Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white border border-[#E3E8F0] rounded-[18px] p-4 animate-pulse flex flex-col gap-3">
                <div className="aspect-square bg-[#EEF2F8] rounded-xl w-full"></div>
                <div className="h-4 bg-[#EEF2F8] rounded w-3/4"></div>
                <div className="h-4 bg-[#EEF2F8] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E3E8F0] rounded-[18px] p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2F8] text-[#8B96AB] flex items-center justify-center mb-4">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-[#0B1B3A] mb-1">No products found</h3>
            <p className="text-sm text-[#8B96AB] max-w-sm mb-4">
              No matching products in category "{selectedCategory}" or search term "{search}".
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearch(''); }}
              className="px-4 py-2 rounded-xl bg-[#0FA38F] text-white text-xs font-bold hover:bg-[#0B8A78] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = !isOutOfStock && p.stock <= (p.lowStockThreshold || 5);
              const hasImage = p.image && !imageErrorMap[p._id];

              return (
                <motion.div
                  key={p._id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`bg-white border rounded-[18px] p-4 flex flex-col justify-between transition-all select-none shadow-[0_1px_2px_rgba(11,27,58,0.04)] ${
                    isOutOfStock 
                      ? 'opacity-60 cursor-not-allowed border-[#E3E8F0]' 
                      : 'cursor-pointer border-[#E3E8F0] hover:border-[#0FA38F]/40 hover:shadow-[0_8px_24px_rgba(11,27,58,0.08)] group'
                  }`}
                >
                  {/* Image container with accurate product photo */}
                  <div className="aspect-square bg-[#F4F7FB] rounded-xl mb-3 flex items-center justify-center relative overflow-hidden p-2 border border-[#EEF2F8]">
                    {hasImage ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        onError={() => handleImageError(p._id)}
                        className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                        <span className="w-12 h-12 rounded-xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-extrabold text-lg mb-1">
                          {p.name.charAt(0)}
                        </span>
                        <span className="text-[10px] font-bold text-[#8B96AB] uppercase tracking-wider">{p.category}</span>
                      </div>
                    )}

                    {/* Stock Status Pill */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#FCA5A5]/40 shadow-xs">
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF1E3] text-[#FF8A1F] border border-[#FF8A1F]/30 shadow-xs">
                          Low ({p.stock})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]/40 shadow-xs">
                          {p.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 mb-2">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block">
                        {p.category}
                      </span>
                      {(() => {
                        const b = batches.find(item => (item.product?._id === p._id || item.product === p._id) && item.remainingQuantity > 0);
                        if (b && b.daysToExpiry !== undefined && b.daysToExpiry <= 7) {
                          return (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30" title={`Expiring on ${new Date(b.expiryDate).toLocaleDateString()}`}>
                              <Clock size={9} /> {b.daysToExpiry <= 0 ? 'Exp' : `${b.daysToExpiry}d`}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <h3 className="font-bold text-[#0B1B3A] text-sm truncate leading-snug" title={p.name}>
                      {p.name}
                    </h3>
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#EEF2F8]">
                    <div className="text-[#0FA38F] font-extrabold text-base md:text-lg tabular-nums">
                      ₹{p.price.toFixed(2)}
                    </div>
                    
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) addToCart(p);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isOutOfStock
                          ? 'bg-[#EEF2F8] text-[#8B96AB] cursor-not-allowed'
                          : 'bg-[#E2F6F3] text-[#0FA38F] hover:bg-[#0FA38F] hover:text-white shadow-xs group-hover:scale-105 active:scale-95'
                      }`}
                      title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* RIGHT COLUMN: Current Order, Cart & Billing Summary        */}
      {/* ========================================================== */}
      <div className="w-full xl:w-[420px] 2xl:w-[460px] flex-shrink-0 xl:sticky xl:top-4 bg-white border border-[#E3E8F0] rounded-[18px] shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)] flex flex-col">
        
        {/* Cart Header */}
        <div className="p-5 border-b border-[#E3E8F0] flex items-center justify-between bg-[#F4F7FB]/50 rounded-t-[18px]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center">
              <ShoppingBag size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-extrabold text-[#0B1B3A] text-base leading-tight">Current Order</h2>
              <p className="text-[11px] font-semibold text-[#8B96AB]">
                {cart.reduce((sum, item) => sum + item.qty, 0)} item{cart.reduce((sum, item) => sum + item.qty, 0) === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-bold text-[#E5484D] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              title="Clear Cart [F8]"
            >
              <Trash2 size={13} />
              <span>Clear (F8)</span>
            </button>
          )}
        </div>

        {/* Cart Items List (Clean internal scroll, never locks outer page) */}
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-2.5 divide-y divide-[#EEF2F8]/60">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[#8B96AB]">
                <div className="w-14 h-14 rounded-2xl bg-[#F4F7FB] flex items-center justify-center mb-3 text-[#CBD5E1]">
                  <ShoppingBag size={28} strokeWidth={1.5} />
                </div>
                <p className="font-bold text-[#53607A] text-sm">Cart is empty</p>
                <p className="text-xs text-[#8B96AB] mt-1 max-w-[220px]">
                  Scan a barcode or click any product to begin billing
                </p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="pt-2.5 first:pt-0 flex items-center gap-3"
                >
                  {/* Thumbnail / Initial */}
                  <div className="w-11 h-11 rounded-xl bg-[#F4F7FB] border border-[#E3E8F0] flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                    {item.image && !imageErrorMap[item._id] ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                        onError={() => handleImageError(item._id)}
                      />
                    ) : (
                      <span className="font-extrabold text-[#0FA38F] text-xs">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Name and price */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#0B1B3A] text-xs sm:text-sm truncate leading-snug">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-[#8B96AB]">
                        ₹{item.price.toFixed(2)} each
                      </span>
                      {(() => {
                        const b = batches.find(batchItem => (batchItem.product?._id === item._id || batchItem.product === item._id) && batchItem.remainingQuantity > 0);
                        if (b) {
                          return (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E2F6F3] text-[#0FA38F] font-bold">
                              FEFO {b.batchNumber}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center bg-[#F4F7FB] rounded-lg border border-[#E3E8F0] p-0.5">
                    <button
                      onClick={() => updateQty(item._id, -1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#53607A] hover:bg-white hover:text-[#0B1B3A] transition-colors"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#0B1B3A] tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item._id, 1)}
                      className="w-6 h-6 flex items-center justify-center rounded text-[#53607A] hover:bg-white hover:text-[#0B1B3A] transition-colors"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[64px]">
                    <div className="font-extrabold text-xs sm:text-sm text-[#0B1B3A] tabular-nums">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="p-1 rounded-lg text-[#8B96AB] hover:text-[#E5484D] hover:bg-[#FEE2E2]/40 transition-colors ml-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Billing Calculations & Payment Controls */}
        <div className="border-t border-[#E3E8F0] bg-[#F4F7FB]/40 p-5 rounded-b-[18px] space-y-4">
          
          {/* Subtotal, Tax, and Grand Total */}
          <div className="space-y-1.5 text-xs font-medium">
            <div className="flex justify-between text-[#53607A]">
              <span>Subtotal</span>
              <span className="tabular-nums font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#53607A]">
              <span>Tax (5% GST)</span>
              <span className="tabular-nums font-bold">₹{tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-[#E3E8F0] flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-[#0B1B3A]">Total Amount</span>
              <span className="text-2xl font-black text-[#0FA38F] tabular-nums">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tiles */}
          <div>
            <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'UPI', label: 'UPI QR', icon: QrCode },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 border font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-[#E2F6F3] border-[#0FA38F] text-[#0FA38F] shadow-[0_2px_8px_rgba(15,163,143,0.2)]'
                        : 'bg-white border-[#E3E8F0] text-[#53607A] hover:bg-[#EEF2F8] hover:text-[#0B1B3A]'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tender Input & Quick Chips */}
          {paymentMethod === 'CASH' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-1"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider">
                    Amount Received
                  </label>
                  <span className="text-[11px] font-bold text-[#53607A]">
                    Due: ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-[#0FA38F] text-base">₹</span>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder={String(Math.ceil(grandTotal))}
                    className="w-full bg-white border border-[#E3E8F0] rounded-xl pl-8 pr-3 py-2.5 text-base font-extrabold text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all tabular-nums"
                  />
                </div>
              </div>

              {/* Quick Denomination Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCashQuickAmount('EXACT')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#E3E8F0] text-[11px] font-bold text-[#53607A] hover:border-[#0FA38F] hover:text-[#0FA38F] transition-colors"
                >
                  Exact (₹{Math.ceil(grandTotal)})
                </button>
                {[100, 500, 2000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashQuickAmount(val)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#E3E8F0] text-[11px] font-bold text-[#53607A] hover:border-[#0FA38F] hover:text-[#0FA38F] transition-colors"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              {/* Live Change Due Display */}
              <div className="flex justify-between items-center bg-[#FFF1E3] border border-[#FF8A1F]/30 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-bold text-[#B45309]">Change Due</span>
                <span className="text-lg font-black text-[#D97706] tabular-nums">
                  ₹{Math.max(0, change).toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}

          {/* Complete Sale Action Button */}
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && Number(amountReceived) < grandTotal)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm md:text-base shadow-[0_4px_14px_rgba(15,163,143,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Complete Sale</span>
                <span className="tabular-nums">• ₹{grandTotal.toFixed(2)}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUCCESS RECEIPT MODAL                                      */}
      {/* ========================================================== */}
      {saleCompleteData && (
        <div className="fixed inset-0 z-50 bg-[#0B1B3A]/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={350} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-[#0B1B3A] my-auto relative print:shadow-none"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b border-[#E3E8F0]">
              <div className="w-12 h-12 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-extrabold text-[#0B1B3A]">FreshMart Supermarket</h2>
              <p className="text-xs text-[#8B96AB] mt-0.5">StoreFlow POS • Scan. Bill. Grow.</p>
              <div className="mt-2 text-xs font-semibold text-[#53607A] bg-[#F4F7FB] py-1 px-2 rounded-md inline-block">
                Txn: {saleCompleteData.transactionId}
              </div>
            </div>

            {/* Receipt Items */}
            <div className="py-4 space-y-2 max-h-48 overflow-y-auto text-xs border-b border-[#E3E8F0]">
              {saleCompleteData.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-semibold text-[#0B1B3A] truncate max-w-[180px]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-bold tabular-nums">
                    ₹{(item.total || item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 space-y-1.5 text-xs border-b border-[#E3E8F0]">
              <div className="flex justify-between text-[#53607A]">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">₹{saleCompleteData.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#53607A]">
                <span>Tax</span>
                <span className="tabular-nums font-semibold">₹{saleCompleteData.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#0B1B3A] pt-1">
                <span>Total Paid</span>
                <span className="text-[#0FA38F] tabular-nums">₹{saleCompleteData.total?.toFixed(2)}</span>
              </div>
              {saleCompleteData.changeGiven > 0 && (
                <div className="flex justify-between text-xs text-[#D97706] font-bold pt-1">
                  <span>Change Given</span>
                  <span className="tabular-nums">₹{saleCompleteData.changeGiven?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2.5 print:hidden">
              <button
                onClick={() => setSaleCompleteData(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
              >
                New Sale
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-[#0B1B3A] hover:bg-[#12274F] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default POS;
