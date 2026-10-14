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
  AlertTriangle,
  Receipt,
  Download,
  ShieldAlert,
  Wifi,
  WifiOff,
  History,
  RotateCcw,
  Percent,
  Check,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const POS = () => {
  const { user } = useAuth();
  const { width, height } = useWindowSize();

  // Navigation Tabs: 'terminal' | 'bills'
  const [activeTab, setActiveTab] = useState('terminal');

  // Products & Batches
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [imageErrorMap, setImageErrorMap] = useState({});

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const searchInputRef = useRef(null);

  // Cart State
  const [cart, setCart] = useState([]);

  // Discount State
  const [discountType, setDiscountType] = useState('FLAT'); // 'FLAT' | 'PERCENT'
  const [discountValue, setDiscountValue] = useState('');

  // Payment / Tender Modal State
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardAuthCode, setCardAuthCode] = useState('');

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [receiptWidth, setReceiptWidth] = useState('80mm'); // '58mm' | '80mm'
  const [showConfetti, setShowConfetti] = useState(false);

  // Offline Mode & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('storeflow_pos_offline_sales');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Today's Bills State
  const [todayBills, setTodayBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // Held Bills State (Hold & Resume queue)
  const [heldBills, setHeldBills] = useState(() => {
    try {
      const saved = localStorage.getItem('storeflow_pos_held_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('storeflow_pos_held_bills', JSON.stringify(heldBills));
    } catch (_) {}
  }, [heldBills]);

  const handleHoldBill = () => {
    if (cart.length === 0) return toast.error('Cart is empty. Nothing to hold.');
    const newHeld = {
      id: `hold-${Date.now()}`,
      createdAt: new Date().toISOString(),
      cart: [...cart],
      discountType,
      discountValue,
      itemCount: cart.reduce((s, it) => s + it.qty, 0),
      subtotal: cart.reduce((s, it) => s + it.price * it.qty, 0),
    };
    setHeldBills((prev) => [newHeld, ...prev]);
    setCart([]);
    setDiscountValue('');
    toast.success('Bill held. Register ready for the next customer.');
  };

  const handleResumeBill = (held) => {
    if (cart.length > 0) {
      if (!window.confirm('Current cart is not empty. Replacing it with this held bill?')) return;
    }
    setCart(held.cart);
    setDiscountType(held.discountType || 'FLAT');
    setDiscountValue(held.discountValue || '');
    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    setShowHeldBillsModal(false);
    toast.success('Held bill resumed!');
  };

  const handleDiscardHeldBill = (heldId) => {
    setHeldBills((prev) => prev.filter((h) => h.id !== heldId));
    toast('Held bill discarded', { icon: '🗑️' });
  };

  // Void / Admin Approval Modal State
  const [billToVoid, setBillToVoid] = useState(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored. Online mode active.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast('Operating offline. Bills will be queued locally.', { icon: '📡' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save offline queue whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('storeflow_pos_offline_sales', JSON.stringify(offlineQueue));
    } catch (err) {
      console.error('Failed to save offline queue:', err);
    }
  }, [offlineQueue]);

  // Load products & FEFO batches from API or local cache
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, batchRes] = await Promise.allSettled([
        api.get('/products?activeOnly=true&limit=200'),
        api.get('/inventory/batches')
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.data) {
        const prodData = prodRes.value.data.data;
        setProducts(prodData);
        // Cache to localStorage for offline resilience
        try {
          localStorage.setItem('storeflow_pos_products_cache', JSON.stringify(prodData));
        } catch (_) {}
      } else {
        // Fallback to cache if network fails
        const cached = localStorage.getItem('storeflow_pos_products_cache');
        if (cached) {
          setProducts(JSON.parse(cached));
          toast('Loaded cached product catalog', { icon: '📦' });
        }
      }

      if (batchRes.status === 'fulfilled' && batchRes.value?.data?.data) {
        setBatches(batchRes.value.data.data);
      }
    } catch (err) {
      console.warn('Network issue fetching products, checking cache:', err.message);
      const cached = localStorage.getItem('storeflow_pos_products_cache');
      if (cached) {
        setProducts(JSON.parse(cached));
        toast('Using offline product catalog', { icon: '📦' });
      } else {
        toast.error('Could not load products catalogue');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch today's bills for this cashier
  const fetchTodayBills = async () => {
    try {
      setLoadingBills(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await api.get(`/sales?startDate=${today.toISOString()}&limit=100`);
      if (data?.data) {
        setTodayBills(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch today bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bills') {
      fetchTodayBills();
    }
  }, [activeTab]);

  // Keep search bar auto-focused
  const focusSearch = () => {
    if (!showTenderModal && !receiptData && !billToVoid && activeTab === 'terminal') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  useEffect(() => {
    focusSearch();
  }, [cart, showTenderModal, receiptData, activeTab]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Focus Search
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('terminal');
        focusSearch();
      }
      // F4: Hold Current Bill or View Held Bills
      else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          handleHoldBill();
        } else if (heldBills.length > 0) {
          setShowHeldBillsModal((prev) => !prev);
        } else {
          toast('No items to hold or held bills to resume', { icon: 'ℹ️' });
        }
      }
      // F8: Clear Cart
      else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setCart([]);
          setDiscountValue('');
          toast('Cart cleared', { icon: '🗑️' });
          focusSearch();
        }
      }
      // F9: Open Tender Modal
      else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !showTenderModal) {
          openTenderModal();
        }
      }
      // Escape: Close modals
      else if (e.key === 'Escape') {
        if (receiptData) {
          setReceiptData(null);
          setShowConfetti(false);
          focusSearch();
        } else if (showHeldBillsModal) {
          setShowHeldBillsModal(false);
          focusSearch();
        } else if (showTenderModal) {
          setShowTenderModal(false);
          focusSearch();
        } else if (billToVoid) {
          setBillToVoid(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, showTenderModal, receiptData, billToVoid, activeTab]);

  // Category counts
  const categories = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, count: counts[name] }));
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search]);

  // Handle barcode scanner input on Enter
  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      const term = search.trim();

      // 1. Check local catalog first by exact barcode, SKU, or name
      const localMatch = products.find(p => 
        p.barcode === term || 
        p.sku === term ||
        p.name.toLowerCase() === term.toLowerCase()
      );

      if (localMatch) {
        addToCart(localMatch);
        setSearch('');
        return;
      }

      // 2. Query backend by barcode if online
      if (isOnline) {
        try {
          const { data } = await api.get(`/products/barcode/${encodeURIComponent(term)}`);
          if (data?.data) {
            addToCart(data.data);
            setSearch('');
            toast.success(`Scanned ${data.data.name}`);
            return;
          }
        } catch (_) {}
      }

      toast.error(`Product not found for: "${term}"`);
      setSearch('');
    }
  };

  // Add Item to Cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" is out of stock!`);
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

    if (navigator.vibrate) navigator.vibrate(30);
    focusSearch();
  };

  // Stepper update
  const updateQty = (id, delta) => {
    const product = products.find(p => p._id === id);
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        if (product && newQty > product.stock) {
          toast.error(`Maximum available stock reached (${product.stock})`);
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  // Remove single item
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item._id !== id));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = Number(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'PERCENT') {
      const computed = (subtotal * val) / 100;
      return Math.min(subtotal, Number(computed.toFixed(2)));
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const taxRate = 5; // 5% GST
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Number(((taxableAmount * taxRate) / 100).toFixed(2));
  const grandTotal = Math.max(0, Number((taxableAmount + tax).toFixed(2)));
  const change = Math.max(0, (Number(amountReceived) || 0) - grandTotal);

  // Open Tender Modal
  const openTenderModal = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add products to bill.');
      return;
    }
    setAmountReceived(String(Math.ceil(grandTotal)));
    setShowTenderModal(true);
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

  // Handle Checkout Execution
  const handleCompleteSale = async () => {
    if (cart.length === 0) return toast.error('Cart is empty');
    if (paymentMethod === 'CASH' && (Number(amountReceived) < grandTotal)) {
      return toast.error('Received amount cannot be less than total due');
    }

    setIsProcessing(true);
    const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const payload = {
      idempotencyKey,
      items: cart.map(item => ({
        _id: item._id,
        name: item.name,
        barcode: item.barcode,
        qty: item.qty,
        price: item.price
      })),
      discount: discountAmount,
      paymentMethod,
      amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : grandTotal,
    };

    try {
      if (isOnline) {
        const { data } = await api.post('/sales', payload);
        const completedSale = data.data;

        // Deduct local product stock immediately for responsive feel
        setProducts(prev => prev.map(p => {
          const inCart = cart.find(c => c._id === p._id);
          return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.qty) } : p;
        }));

        setReceiptData(completedSale);
        setShowConfetti(true);
        setShowTenderModal(false);
        setCart([]);
        setDiscountValue('');
        setAmountReceived('');
        fetchProducts(); // Refresh verified stock in background
        toast.success('Sale completed successfully!');
      } else {
        // OFFLINE BILLING FALLBACK: Save locally to queue
        const offlineSale = {
          _id: `offline-${Date.now()}`,
          transactionId: `TXN-OFFLINE-${Date.now().toString().slice(-5)}`,
          receiptNo: `TXN-OFFLINE-${Date.now().toString().slice(-5)}`,
          idempotencyKey,
          items: cart.map(item => ({
            product: item._id,
            name: item.name,
            barcode: item.barcode,
            quantity: item.qty,
            price: item.price,
            total: item.price * item.qty
          })),
          subtotal,
          tax,
          taxRate,
          discount: discountAmount,
          total: grandTotal,
          paymentMethod,
          amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : grandTotal,
          changeGiven: change,
          status: 'COMPLETED',
          cashierName: user?.name || 'Cashier',
          createdAt: new Date().toISOString(),
          isOffline: true,
          storeSnapshot: {
            name: user?.store?.name || 'FreshMart Supermarket',
            address: user?.store?.address || 'Main Branch',
            phone: user?.store?.phone || '',
            gstin: user?.store?.gstin || '',
            receiptFooter: 'Thank you for shopping with us! Visit again.'
          }
        };

        setOfflineQueue(prev => [offlineSale, ...prev]);
        setProducts(prev => prev.map(p => {
          const inCart = cart.find(c => c._id === p._id);
          return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.qty) } : p;
        }));

        setReceiptData(offlineSale);
        setShowTenderModal(false);
        setCart([]);
        setDiscountValue('');
        toast.success('Offline bill created and saved to sync queue');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync Queued Offline Sales
  const handleSyncOfflineSales = async () => {
    if (offlineQueue.length === 0) return;
    if (!isOnline) {
      toast.error('Cannot sync while offline. Please connect to the internet.');
      return;
    }

    setIsSyncingOffline(true);
    let syncedCount = 0;
    const remaining = [];

    for (const sale of offlineQueue) {
      try {
        const payload = {
          idempotencyKey: sale.idempotencyKey,
          items: sale.items.map(it => ({
            _id: it.product || it._id,
            qty: it.quantity || it.qty,
            price: it.price
          })),
          discount: sale.discount,
          paymentMethod: sale.paymentMethod,
          amountReceived: sale.amountReceived
        };

        await api.post('/sales', payload);
        syncedCount++;
      } catch (err) {
        console.error('Failed to sync offline sale:', err);
        remaining.push(sale);
      }
    }

    setOfflineQueue(remaining);
    setIsSyncingOffline(false);

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} offline bill${syncedCount === 1 ? '' : 's'} to server!`);
      fetchProducts();
      if (activeTab === 'bills') fetchTodayBills();
    }
    if (remaining.length > 0) {
      toast.error(`${remaining.length} bill(s) could not sync due to stock issues`);
    }
  };

  // Thermal Receipt Printing
  const handlePrintReceipt = () => {
    window.print();
  };

  // Download Receipt as Text
  const handleDownloadReceiptText = () => {
    if (!receiptData) return;
    const store = receiptData.storeSnapshot || user?.store || {};
    const textLines = [
      '==========================================',
      (store.name || 'FRESHMART SUPERMARKET').toUpperCase().padStart(25 + ((store.name || '').length / 2), ' '),
      (store.address || '').padStart(20 + ((store.address || '').length / 2), ' '),
      store.phone ? `Phone: ${store.phone}`.padStart(25, ' ') : '',
      store.gstin ? `GSTIN: ${store.gstin}`.padStart(25, ' ') : '',
      '------------------------------------------',
      `Bill No: ${receiptData.transactionId || receiptData.receiptNo}`,
      `Date: ${new Date(receiptData.createdAt || Date.now()).toLocaleDateString()}`,
      `Time: ${new Date(receiptData.createdAt || Date.now()).toLocaleTimeString()}`,
      `Cashier: ${receiptData.cashierName || user?.name || 'Staff'}`,
      '------------------------------------------',
      'ITEM             QTY    RATE     TOTAL',
      '------------------------------------------',
      ...(receiptData.items || []).map(it => {
        const name = (it.name || 'Item').padEnd(16).substring(0, 16);
        const qty = String(it.quantity || it.qty).padStart(3);
        const rate = (it.price || 0).toFixed(2).padStart(8);
        const total = ((it.total || (it.price * (it.quantity || it.qty))) || 0).toFixed(2).padStart(9);
        return `${name} ${qty} ${rate} ${total}`;
      }),
      '------------------------------------------',
      `Subtotal:                    ₹${(receiptData.subtotal || 0).toFixed(2)}`,
      receiptData.discount > 0 ? `Discount:                   -₹${receiptData.discount.toFixed(2)}` : '',
      `GST (5%):                    ₹${(receiptData.tax || 0).toFixed(2)}`,
      '------------------------------------------',
      `TOTAL AMOUNT:                ₹${(receiptData.total || 0).toFixed(2)}`,
      `Payment Mode:                ${receiptData.paymentMethod}`,
      receiptData.paymentMethod === 'CASH' ? `Amount Received:             ₹${(receiptData.amountReceived || receiptData.total).toFixed(2)}` : '',
      receiptData.changeGiven > 0 ? `Change Returned:             ₹${receiptData.changeGiven.toFixed(2)}` : '',
      '------------------------------------------',
      (store.receiptFooter || 'Thank you for shopping with us! Visit again.').padStart(25, ' '),
      '=========================================='
    ].filter(Boolean).join('\n');

    const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${receiptData.transactionId || 'bill'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Void Bill with Store Admin Approval
  const handleAuthorizeVoid = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      return toast.error('Store Admin Email and Password are required');
    }
    if (!billToVoid) return;

    setIsVoiding(true);
    try {
      const { data } = await api.post(`/sales/${billToVoid._id}/refund`, {
        adminEmail: adminEmail.trim(),
        adminPassword,
        reason: voidReason.trim() || 'Voided by cashier with store admin approval'
      });

      toast.success(data.message || 'Bill voided and inventory restored');
      setBillToVoid(null);
      setAdminEmail('');
      setAdminPassword('');
      setVoidReason('');
      fetchTodayBills();
      fetchProducts(); // Refresh restored inventory
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Void authorization failed');
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 relative z-10 pb-16 font-sans">
      
      {/* Print-specific style for Thermal Receipts */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt-printable, #thermal-receipt-printable * {
            visibility: visible !important;
          }
          #thermal-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${receiptWidth === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 8px !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
            border: none !important;
            font-size: ${receiptWidth === '58mm' ? '10px' : '12px'} !important;
          }
        }
      `}</style>

      {/* ========================================================== */}
      {/* TOP HEADER: Tabs & Offline Status Sync Bar                 */}
      {/* ========================================================== */}
      <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'terminal'
                ? 'bg-[#0FA38F] text-white shadow-[0_2px_10px_rgba(15,163,143,0.3)]'
                : 'bg-[#F4F7FB] text-[#53607A] hover:bg-[#EEF2F8] hover:text-[#0B1B3A]'
            }`}
          >
            <ShoppingBag size={16} />
            <span>POS Terminal</span>
            <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white">F2</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bills'
                ? 'bg-[#0FA38F] text-white shadow-[0_2px_10px_rgba(15,163,143,0.3)]'
                : 'bg-[#F4F7FB] text-[#53607A] hover:bg-[#EEF2F8] hover:text-[#0B1B3A]'
            }`}
          >
            <History size={16} />
            <span>Today's Bills</span>
            {todayBills.length > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                activeTab === 'bills' ? 'bg-white text-[#0FA38F]' : 'bg-[#E3E8F0] text-[#53607A]'
              }`}>
                {todayBills.length}
              </span>
            )}
          </button>
        </div>

        {/* Offline / Online Status Pill & Sync Action */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {heldBills.length > 0 && (
            <button
              onClick={() => setShowHeldBillsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] border border-[#0284C7]/30 text-[#0284C7] hover:bg-[#BAE6FD] text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs"
              title="View held bills [F4]"
            >
              <Clock size={13} />
              <span>{heldBills.length} Held Bill{heldBills.length === 1 ? '' : 's'}</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white text-[#0284C7]">F4</span>
            </button>
          )}

          {offlineQueue.length > 0 && (
            <button
              onClick={handleSyncOfflineSales}
              disabled={isSyncingOffline || !isOnline}
              className="px-3 py-1.5 rounded-xl bg-[#FFF1E3] border border-[#FF8A1F]/30 text-[#D97706] hover:bg-[#FFEDD5] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              title="Sync offline bills to server"
            >
              <RefreshCw size={13} className={isSyncingOffline ? 'animate-spin' : ''} />
              <span>{offlineQueue.length} Queued to Sync</span>
            </button>
          )}

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            isOnline 
              ? 'bg-[#DCFCE7]/60 text-[#16A34A] border-[#86EFAC]/40' 
              : 'bg-[#FEE2E2] text-[#E5484D] border-[#FCA5A5]/40 animate-pulse'
          }`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: POS TERMINAL VIEW                                   */}
      {/* ========================================================== */}
      {activeTab === 'terminal' && (
        <div className="w-full flex flex-col xl:flex-row gap-6 items-start">
          
          {/* LEFT COLUMN: Search Bar, Category Filters & Products Grid */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
            
            {/* Top Barcode Scan & Search Bar */}
            <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-3.5 shadow-sm flex items-center gap-3 transition-all focus-within:border-[#0FA38F] focus-within:ring-2 focus-within:ring-[#0FA38F]/20">
              <div className="pl-2 text-[#8B96AB]">
                <Search size={22} strokeWidth={1.75} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeSearch}
                placeholder="Scan barcode or type item name/SKU and press Enter... [F2]"
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
                <span>USB Scan Ready</span>
              </div>
            </div>

            {/* Category Filter Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
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

            {/* Products Catalogue Grid */}
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
              <div className="bg-white border border-[#E3E8F0] rounded-[20px] p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF2F8] text-[#8B96AB] flex items-center justify-center mb-4">
                  <Package size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-[#0B1B3A] mb-1">No products found</h3>
                <p className="text-sm text-[#8B96AB] max-w-sm mb-4">
                  No matching products for category "{selectedCategory}" or search "{search}".
                </p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSearch(''); }}
                  className="px-4 py-2 rounded-xl bg-[#0FA38F] text-white text-xs font-bold hover:bg-[#0B8A78] transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
                      className={`bg-white border rounded-[20px] p-3.5 sm:p-4 flex flex-col justify-between transition-all select-none shadow-[0_1px_2px_rgba(11,27,58,0.04)] ${
                        isOutOfStock 
                          ? 'opacity-60 cursor-not-allowed border-[#E3E8F0]' 
                          : 'cursor-pointer border-[#E3E8F0] hover:border-[#0FA38F]/40 hover:shadow-[0_8px_24px_rgba(11,27,58,0.08)] group'
                      }`}
                    >
                      {/* Product Visual Container */}
                      <div className="aspect-square bg-[#F4F7FB] rounded-xl mb-3 flex items-center justify-center relative overflow-hidden p-2 border border-[#EEF2F8]">
                        {hasImage ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            onError={() => setImageErrorMap(prev => ({ ...prev, [p._id]: true }))}
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

                        {/* Stock Pill Badge */}
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

                      {/* Details */}
                      <div className="flex-1 min-w-0 mb-2">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-bold text-[#8B96AB] uppercase tracking-wider block">
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
                        {p.barcode && (
                          <p className="text-[11px] font-mono text-[#8B96AB] truncate">
                            {p.barcode}
                          </p>
                        )}
                      </div>

                      {/* Price & Add Button */}
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

          {/* RIGHT COLUMN: Current Order, Cart & Live Totals */}
          <div className="w-full xl:w-[420px] 2xl:w-[450px] flex-shrink-0 xl:sticky xl:top-4 bg-white border border-[#E3E8F0] rounded-[22px] shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)] flex flex-col">
            
            {/* Cart Header */}
            <div className="p-4 sm:p-5 border-b border-[#E3E8F0] flex items-center justify-between bg-[#F4F7FB]/50 rounded-t-[22px]">
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleHoldBill}
                    className="text-xs font-bold text-[#D97706] hover:text-[#B45309] hover:bg-[#FFF1E3] px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-[#FF8A1F]/30"
                    title="Hold current order [F4]"
                  >
                    <Clock size={13} />
                    <span>Hold (F4)</span>
                  </button>
                  <button
                    onClick={() => {
                      setCart([]);
                      setDiscountValue('');
                      toast('Cart cleared', { icon: '🗑️' });
                      focusSearch();
                    }}
                    className="text-xs font-bold text-[#E5484D] hover:text-[#DC2626] hover:bg-[#FEE2E2]/60 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Clear Cart [F8]"
                  >
                    <Trash2 size={13} />
                    <span>Clear (F8)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Cart Items List */}
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
                      {/* Name & price */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[#0B1B3A] text-xs sm:text-sm truncate leading-snug">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-[#8B96AB]">
                            ₹{item.price.toFixed(2)} each
                          </span>
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

            {/* Billing Summary & Discount Inputs */}
            <div className="border-t border-[#E3E8F0] bg-[#F4F7FB]/40 p-4 sm:p-5 rounded-b-[22px] space-y-3.5">
              
              {/* Discount Input Controls */}
              <div className="bg-white border border-[#E3E8F0] rounded-xl p-2.5 flex items-center gap-2">
                <div className="flex bg-[#F4F7FB] rounded-lg p-0.5 border border-[#E3E8F0]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FLAT')}
                    className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      discountType === 'FLAT'
                        ? 'bg-white text-[#0FA38F] shadow-xs'
                        : 'text-[#8B96AB] hover:text-[#0B1B3A]'
                    }`}
                  >
                    ₹ Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`px-2 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                      discountType === 'PERCENT'
                        ? 'bg-white text-[#0FA38F] shadow-xs'
                        : 'text-[#8B96AB] hover:text-[#0B1B3A]'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
                
                <input
                  type="number"
                  min="0"
                  max={discountType === 'PERCENT' ? '100' : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENT' ? 'Discount %' : 'Discount ₹'}
                  className="flex-1 bg-transparent text-xs font-bold text-[#0B1B3A] outline-none placeholder-[#8B96AB]"
                />
                
                {discountValue && (
                  <button
                    type="button"
                    onClick={() => setDiscountValue('')}
                    className="text-[#8B96AB] hover:text-[#E5484D]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Numerical Breakdown */}
              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex justify-between text-[#53607A]">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#16A34A] font-bold">
                    <span>Discount ({discountType === 'PERCENT' ? `${discountValue}%` : 'Flat'})</span>
                    <span className="tabular-nums">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#53607A]">
                  <span>GST / Tax (5%)</span>
                  <span className="tabular-nums font-bold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-[#E3E8F0] flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-[#0B1B3A]">Total Amount</span>
                  <span className="text-2xl font-black text-[#0FA38F] tabular-nums">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Proceed to Tender Action Button */}
              <button
                type="button"
                onClick={openTenderModal}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm md:text-base shadow-[0_4px_14px_rgba(15,163,143,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Proceed to Tender</span>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/20">F9</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: TODAY'S BILLS VIEW                                  */}
      {/* ========================================================== */}
      {activeTab === 'bills' && (
        <div className="bg-white border border-[#E3E8F0] rounded-[22px] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
            <div>
              <h2 className="text-lg font-black text-[#0B1B3A]">Bills Created Today</h2>
              <p className="text-xs text-[#8B96AB]">
                Review, reprint thermal receipts, or void completed bills (with Store Admin approval)
              </p>
            </div>
            <button
              onClick={fetchTodayBills}
              className="p-2 rounded-xl bg-[#F4F7FB] hover:bg-[#EEF2F8] text-[#53607A] transition-colors"
              title="Refresh bills list"
            >
              <RefreshCw size={16} className={loadingBills ? 'animate-spin' : ''} />
            </button>
          </div>

          {loadingBills ? (
            <div className="py-12 text-center text-[#8B96AB]">Loading today's transactions...</div>
          ) : todayBills.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Receipt size={40} className="text-[#CBD5E1] mb-2" />
              <p className="text-sm font-bold text-[#53607A]">No bills created today yet</p>
              <p className="text-xs text-[#8B96AB] mt-1">Completed orders from this register will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF2F8] overflow-x-auto">
              {todayBills.map((bill) => {
                const isRefunded = bill.status === 'REFUNDED';
                return (
                  <div key={bill._id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#F4F7FB]/40 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isRefunded ? 'bg-[#FEE2E2] text-[#E5484D]' : 'bg-[#E2F6F3] text-[#0FA38F]'
                      }`}>
                        {bill.paymentMethod}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0B1B3A] text-sm font-mono">
                            {bill.transactionId}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isRefunded ? 'bg-[#FEE2E2] text-[#E5484D]' : 'bg-[#DCFCE7] text-[#16A34A]'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B96AB] mt-0.5">
                          {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {bill.items?.length || 0} line items
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-base font-black tabular-nums ${isRefunded ? 'line-through text-[#8B96AB]' : 'text-[#0B1B3A]'}`}>
                          ₹{bill.total?.toFixed(2)}
                        </div>
                        {bill.discount > 0 && (
                          <div className="text-[10px] text-[#16A34A] font-bold">
                            Save ₹{bill.discount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Reprint Receipt */}
                        <button
                          onClick={() => setReceiptData(bill)}
                          className="px-3 py-1.5 rounded-xl bg-[#F4F7FB] hover:bg-[#EEF2F8] text-[#0B1B3A] text-xs font-bold flex items-center gap-1.5 border border-[#E3E8F0] transition-colors"
                          title="Reprint Receipt"
                        >
                          <Printer size={13} />
                          <span>Reprint</span>
                        </button>

                        {/* Void Bill Action */}
                        {!isRefunded && (
                          <button
                            onClick={() => {
                              setBillToVoid(bill);
                              setAdminEmail('');
                              setAdminPassword('');
                              setVoidReason('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] text-[#E5484D] text-xs font-bold flex items-center gap-1.5 border border-[#FCA5A5]/40 transition-colors"
                            title="Void Bill (Requires Store Admin approval)"
                          >
                            <RotateCcw size={13} />
                            <span>Void Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TENDER / CHECKOUT PAYMENT MODAL (F9)                       */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showTenderModal && (
          <div className="fixed inset-0 z-50 bg-[#0B1B3A]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 text-[#0B1B3A] relative space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
                <div>
                  <h3 className="text-xl font-black text-[#0B1B3A]">Tender Payment</h3>
                  <p className="text-xs text-[#8B96AB]">Choose payment mode and finalize checkout</p>
                </div>
                <button
                  onClick={() => setShowTenderModal(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F4F7FB] text-[#8B96AB] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Total Due Banner */}
              <div className="bg-[#E2F6F3] border border-[#0FA38F]/30 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#0B8A78] tracking-wider">Amount Payable</span>
                <span className="text-3xl font-black text-[#0FA38F] tabular-nums">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'UPI', label: 'UPI QR', icon: QrCode },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`py-3 px-2 rounded-xl flex flex-col items-center gap-1.5 border font-extrabold text-xs transition-all ${
                        isSelected
                          ? 'bg-[#0FA38F] border-[#0FA38F] text-white shadow-[0_2px_10px_rgba(15,163,143,0.3)]'
                          : 'bg-white border-[#E3E8F0] text-[#53607A] hover:bg-[#F4F7FB]'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* CASH PAYMENT SECTION */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                      Cash Received
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-[#0FA38F] text-lg">₹</span>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && Number(amountReceived) >= grandTotal) {
                            handleCompleteSale();
                          }
                        }}
                        autoFocus
                        placeholder={String(Math.ceil(grandTotal))}
                        className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl pl-9 pr-3 py-3 text-lg font-black text-[#0B1B3A] outline-none focus:border-[#0FA38F] focus:ring-2 focus:ring-[#0FA38F]/20 transition-all tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Quick Denomination Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCashQuickAmount('EXACT')}
                      className="px-2.5 py-1 rounded-lg bg-[#EEF2F8] text-[11px] font-extrabold text-[#53607A] hover:bg-[#E2F6F3] hover:text-[#0FA38F] transition-colors"
                    >
                      Exact (₹{Math.ceil(grandTotal)})
                    </button>
                    {[100, 500, 2000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashQuickAmount(val)}
                        className="px-2.5 py-1 rounded-lg bg-[#EEF2F8] text-[11px] font-extrabold text-[#53607A] hover:bg-[#E2F6F3] hover:text-[#0FA38F] transition-colors"
                      >
                        +₹{val}
                      </button>
                    ))}
                  </div>

                  {/* Live Change Calculation */}
                  <div className="flex justify-between items-center bg-[#FFF1E3] border border-[#FF8A1F]/30 rounded-xl px-4 py-3">
                    <span className="text-xs font-bold text-[#B45309]">Change Due</span>
                    <span className="text-xl font-black text-[#D97706] tabular-nums">
                      ₹{change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* CARD PAYMENT SECTION */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E3E8F0] text-center space-y-2">
                    <CreditCard size={32} className="mx-auto text-[#0FA38F]" />
                    <p className="text-xs font-bold text-[#0B1B3A]">
                      Swipe, Insert or Tap Customer Card on EDC Terminal
                    </p>
                    <p className="text-[11px] text-[#8B96AB]">
                      Amount to charge: <span className="font-extrabold text-[#0B1B3A]">₹{grandTotal.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* UPI PAYMENT SECTION */}
              {paymentMethod === 'UPI' && (
                <div className="space-y-3 pt-1 text-center">
                  <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[#E3E8F0] flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `upi://pay?pa=freshmart@upi&pn=FreshMart&am=${grandTotal}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      className="w-40 h-40 rounded-xl bg-white p-2 shadow-xs border border-[#E3E8F0] mb-2"
                    />
                    <p className="text-xs font-extrabold text-[#0B1B3A]">Scan with GPay, PhonePe, Paytm</p>
                    <p className="text-[11px] font-mono text-[#8B96AB] mt-0.5">UPI ID: freshmart@upi • ₹{grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTenderModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  disabled={isProcessing || (paymentMethod === 'CASH' && Number(amountReceived) < grandTotal)}
                  className="flex-2 py-3 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-sm shadow-[0_4px_14px_rgba(15,163,143,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Complete Checkout</span>
                      <Check size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* THERMAL RECEIPT MODAL (58mm / 80mm Printable)              */}
      {/* ========================================================== */}
      <AnimatePresence>
        {receiptData && (
          <div className="fixed inset-0 z-50 bg-[#0B1B3A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 text-[#0B1B3A] my-auto space-y-4 relative"
            >
              {/* Receipt Options Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0] print:hidden">
                <div className="flex items-center gap-1.5">
                  <Receipt size={20} className="text-[#0FA38F]" />
                  <span className="font-extrabold text-sm text-[#0B1B3A]">Thermal Bill Receipt</span>
                </div>

                {/* Thermal Width Selector */}
                <div className="flex items-center bg-[#F4F7FB] rounded-lg p-0.5 border border-[#E3E8F0]">
                  <button
                    onClick={() => setReceiptWidth('58mm')}
                    className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                      receiptWidth === '58mm' ? 'bg-white text-[#0FA38F] shadow-xs' : 'text-[#8B96AB]'
                    }`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => setReceiptWidth('80mm')}
                    className={`px-2 py-1 rounded text-[10px] font-extrabold ${
                      receiptWidth === '80mm' ? 'bg-white text-[#0FA38F] shadow-xs' : 'text-[#8B96AB]'
                    }`}
                  >
                    80mm
                  </button>
                </div>
              </div>

              {/* Thermal Paper Simulation Container */}
              <div
                id="thermal-receipt-printable"
                className={`bg-[#FAFAFA] border border-dashed border-[#CBD5E1] rounded-xl p-4 font-mono text-xs text-[#0B1B3A] space-y-2.5 mx-auto ${
                  receiptWidth === '58mm' ? 'max-w-[280px]' : 'max-w-full'
                }`}
              >
                {/* Store Branding */}
                <div className="text-center space-y-0.5">
                  <h3 className="font-black text-sm text-[#0B1B3A] uppercase tracking-wide">
                    {receiptData.storeSnapshot?.name || user?.store?.name || 'FreshMart Supermarket'}
                  </h3>
                  <p className="text-[11px] text-[#53607A]">
                    {receiptData.storeSnapshot?.address || user?.store?.address || 'Main Road, Chennai'}
                  </p>
                  {(receiptData.storeSnapshot?.phone || user?.store?.phone) && (
                    <p className="text-[10px] text-[#53607A]">
                      Phone: {receiptData.storeSnapshot?.phone || user?.store?.phone}
                    </p>
                  )}
                  {(receiptData.storeSnapshot?.gstin || user?.store?.gstin) && (
                    <p className="text-[10px] font-bold text-[#53607A]">
                      GSTIN: {receiptData.storeSnapshot?.gstin || user?.store?.gstin}
                    </p>
                  )}
                </div>

                <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Bill No: {receiptData.transactionId || receiptData.receiptNo}</span>
                    <span>{new Date(receiptData.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier: {receiptData.cashierName || user?.name || 'Cashier'}</span>
                    <span>{new Date(receiptData.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 space-y-1">
                  <div className="flex justify-between font-bold text-[10px] border-b border-dashed border-[#CBD5E1] pb-1">
                    <span className="flex-1">Item</span>
                    <span className="w-8 text-center">Qty</span>
                    <span className="w-12 text-right">Price</span>
                    <span className="w-14 text-right">Total</span>
                  </div>
                  {(receiptData.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="flex-1 truncate pr-1">{item.name}</span>
                      <span className="w-8 text-center">{item.quantity || item.qty}</span>
                      <span className="w-12 text-right tabular-nums">{(item.price || 0).toFixed(2)}</span>
                      <span className="w-14 text-right tabular-nums font-bold">
                        {((item.total || item.price * (item.quantity || item.qty)) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">₹{(receiptData.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="flex justify-between text-[#16A34A] font-bold">
                      <span>Discount</span>
                      <span className="tabular-nums">-₹{receiptData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax (5% GST)</span>
                    <span className="tabular-nums">₹{(receiptData.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-[#CBD5E1]">
                    <span>TOTAL</span>
                    <span className="tabular-nums">₹{(receiptData.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pt-0.5">
                    <span>Paid Via: {receiptData.paymentMethod}</span>
                    {receiptData.amountReceived && (
                      <span>Recd: ₹{(receiptData.amountReceived || receiptData.total).toFixed(2)}</span>
                    )}
                  </div>
                  {receiptData.changeGiven > 0 && (
                    <div className="flex justify-between text-[10px] font-bold text-[#D97706]">
                      <span>Change Returned</span>
                      <span className="tabular-nums">₹{receiptData.changeGiven.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Footer Note */}
                <div className="border-t border-dashed border-[#CBD5E1] pt-2 text-center text-[10px] text-[#53607A]">
                  <p>{receiptData.storeSnapshot?.receiptFooter || 'Thank you for shopping with us! Visit again.'}</p>
                </div>
              </div>

              {/* Receipt Modal Controls */}
              <div className="flex items-center gap-2 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptData(null);
                    setShowConfetti(false);
                    focusSearch();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
                >
                  New Sale (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReceiptText}
                  className="p-2.5 rounded-xl border border-[#E3E8F0] text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
                  title="Download receipt txt"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(15,163,143,0.3)] transition-all"
                >
                  <Printer size={15} />
                  <span>Print Thermal Bill</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* STORE ADMIN APPROVAL MODAL FOR VOIDING BILLS               */}
      {/* ========================================================== */}
      <AnimatePresence>
        {billToVoid && (
          <div className="fixed inset-0 z-50 bg-[#0B1B3A]/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 text-[#0B1B3A] space-y-4 relative"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#E3E8F0]">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#E5484D] flex items-center justify-center">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1B3A]">Store Admin Approval Required</h3>
                  <p className="text-xs text-[#8B96AB]">
                    Voiding bill {billToVoid.transactionId} restores inventory
                  </p>
                </div>
              </div>

              <div className="bg-[#FFF1E3] border border-[#FF8A1F]/30 rounded-xl p-3 text-xs text-[#B45309] font-medium leading-relaxed">
                Cashiers cannot unilaterally void sales receipts. A verified Store Administrator must provide their credentials below to authorize this refund.
              </div>

              <form onSubmit={handleAuthorizeVoid} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                    Store Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@supermarket.com"
                    className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                    Store Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Store Admin password"
                    className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                    Reason for Void
                  </label>
                  <input
                    type="text"
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="e.g., Customer return / wrong item scanned"
                    className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setBillToVoid(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVoiding}
                    className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#DC2626] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(229,72,77,0.3)] transition-all disabled:opacity-50"
                  >
                    {isVoiding ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <>
                        <RotateCcw size={14} />
                        <span>Authorize & Void</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================== */}
      {/* HELD BILLS MODAL (Hold & Resume queue)                     */}
      {/* ========================================================== */}
      <AnimatePresence>
        {showHeldBillsModal && (
          <div className="fixed inset-0 z-50 bg-[#0B1B3A]/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full p-6 text-[#0B1B3A] space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0B1B3A]">Held Customer Bills</h3>
                    <p className="text-xs text-[#8B96AB]">
                      {heldBills.length} held order{heldBills.length === 1 ? '' : 's'} waiting to resume
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHeldBillsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F4F7FB] text-[#8B96AB] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {heldBills.length === 0 ? (
                <div className="py-12 text-center text-[#8B96AB]">
                  <Clock size={36} className="mx-auto mb-2 text-[#CBD5E1]" />
                  <p className="font-bold text-sm text-[#53607A]">No held bills</p>
                  <p className="text-xs text-[#8B96AB] mt-0.5">Use Hold (F4) in the cart to hold an order</p>
                </div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto space-y-2.5 divide-y divide-[#EEF2F8]/60">
                  {heldBills.map((held) => (
                    <div key={held.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-[#0B1B3A]">
                            {held.itemCount} items
                          </span>
                          <span className="text-[10px] text-[#8B96AB]">
                            Held at {new Date(held.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-[#53607A] truncate max-w-[240px] mt-0.5">
                          {held.cart.map((it) => `${it.qty}x ${it.name}`).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-xs font-black text-[#0FA38F] tabular-nums">
                            ₹{(held.subtotal || 0).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleResumeBill(held)}
                          className="px-3 py-1.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs transition-colors shadow-xs"
                        >
                          Resume
                        </button>
                        <button
                          onClick={() => handleDiscardHeldBill(held.id)}
                          className="p-1.5 rounded-xl hover:bg-[#FEE2E2] text-[#8B96AB] hover:text-[#E5484D] transition-colors"
                          title="Discard held bill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowHeldBillsModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB]"
                >
                  Close (Esc)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default POS;
