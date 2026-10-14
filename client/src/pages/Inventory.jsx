import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Layers, 
  AlertTriangle, 
  Trash2, 
  History, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldAlert, 
  TrendingDown, 
  Sparkles,
  X,
  PackagePlus,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'products' | 'waste' | 'history'
  const [loading, setLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [wasteAnalytics, setWasteAnalytics] = useState({
    totalWasteCostMonth: 0,
    totalWastedUnits: 0,
    riskOfExpiryValue: 0,
    riskBatchesCount: 0,
    recentWaste: []
  });
  const [movements, setMovements] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('ALL');

  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveData, setReceiveData] = useState({
    productId: '',
    batchNumber: '',
    receivedQuantity: '',
    costPrice: '',
    supplier: '',
    expiryDate: ''
  });
  const [receiving, setReceiving] = useState(false);

  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteData, setWasteData] = useState({
    productId: '',
    batchId: '',
    quantity: '',
    reason: 'EXPIRED',
    notes: ''
  });
  const [submittingWaste, setSubmittingWaste] = useState(false);

  // Quick Adjustment Form
  const [adjustData, setAdjustData] = useState({
    productId: '',
    type: 'RESTOCK',
    quantityChange: '',
    reference: ''
  });

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prodRes, batchRes, wasteRes, movRes] = await Promise.allSettled([
        api.get('/products'),
        api.get('/inventory/batches'),
        api.get('/inventory/waste/analytics'),
        api.get('/inventory/movements')
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value?.data?.success) {
        setProducts(prodRes.value.data.data || []);
      }
      if (batchRes.status === 'fulfilled' && batchRes.value?.data?.success) {
        setBatches(batchRes.value.data.data || []);
      }
      if (wasteRes.status === 'fulfilled' && wasteRes.value?.data?.success) {
        setWasteAnalytics(wasteRes.value.data.data || {
          totalWasteCostMonth: 0,
          totalWastedUnits: 0,
          riskOfExpiryValue: 0,
          riskBatchesCount: 0,
          recentWaste: []
        });
      }
      if (movRes.status === 'fulfilled' && movRes.value?.data?.success) {
        setMovements(movRes.value.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      toast.error('Failed to refresh inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Receive Batch
  const handleReceiveBatch = async (e) => {
    e.preventDefault();
    if (!receiveData.productId || !receiveData.batchNumber || !receiveData.receivedQuantity || !receiveData.expiryDate) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setReceiving(true);
      const res = await api.post('/inventory/batches', receiveData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Batch received and stock updated!');
        setShowReceiveModal(false);
        setReceiveData({
          productId: '',
          batchNumber: '',
          receivedQuantity: '',
          costPrice: '',
          supplier: '',
          expiryDate: ''
        });
        loadAllData();
      } else {
        toast.error(res.data?.message || 'Failed to receive batch.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to receive batch.');
    } finally {
      setReceiving(false);
    }
  };

  // Handle Record Waste
  const handleRecordWaste = async (e) => {
    e.preventDefault();
    if (!wasteData.productId || !wasteData.quantity || !wasteData.reason) {
      toast.error('Please specify product, quantity and reason.');
      return;
    }

    try {
      setSubmittingWaste(true);
      const res = await api.post('/inventory/waste', wasteData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Waste recorded successfully.');
        setShowWasteModal(false);
        setWasteData({
          productId: '',
          batchId: '',
          quantity: '',
          reason: 'EXPIRED',
          notes: ''
        });
        loadAllData();
      } else {
        toast.error(res.data?.message || 'Failed to record waste.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record waste.');
    } finally {
      setSubmittingWaste(false);
    }
  };

  // Handle Quick Adjust
  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustData.productId || !adjustData.quantityChange) {
      return toast.error('Please fill product and quantity.');
    }

    try {
      const change = adjustData.type === 'ADJUSTMENT' && Number(adjustData.quantityChange) > 0
        ? -Number(adjustData.quantityChange)
        : Number(adjustData.quantityChange);

      const res = await api.post('/inventory/adjust', {
        ...adjustData,
        quantityChange: change
      });

      if (res.data?.success) {
        toast.success('Stock adjusted successfully!');
        setAdjustData({ productId: '', type: 'RESTOCK', quantityChange: '', reference: '' });
        loadAllData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    }
  };

  // Filtered batches
  const filteredBatches = batches.filter((b) => {
    const matchesStatus = batchStatusFilter === 'ALL' || b.computedStatus === batchStatusFilter;
    const q = searchQuery.toLowerCase();
    const prodName = (b.product?.name || b.productName || '').toLowerCase();
    const batchNum = (b.batchNumber || '').toLowerCase();
    const matchesQuery = !searchQuery || prodName.includes(q) || batchNum.includes(q);
    return matchesStatus && matchesQuery;
  });

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !searchQuery || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q));
  });

  const getBatchBadge = (computedStatus) => {
    switch (computedStatus) {
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#E5484D] border border-[#E5484D]/30"><XCircle size={12} /> EXPIRED</span>;
      case 'EXPIRING_SOON':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B]/30"><AlertTriangle size={12} /> EXPIRING SOON</span>;
      case 'DEPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]"><CheckCircle2 size={12} /> DEPLETED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F] border border-[#0FA38F]/30"><CheckCircle2 size={12} /> ACTIVE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B3A] tracking-tight">
            Live Inventory & FEFO Batches
          </h1>
          <p className="text-sm font-medium text-[#53607A] mt-1">
            Real-time batch depletion, First-Expired-First-Out automation, and waste reduction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowWasteModal(true)}
            className="border-[#E5484D]/40 text-[#E5484D] hover:bg-[#FEE2E2]/50 font-bold"
          >
            <Trash2 size={16} className="mr-1.5" />
            Log Food Waste
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowReceiveModal(true)}
            className="shadow-md shadow-[#0FA38F]/20 font-bold"
          >
            <PackagePlus size={16} className="mr-1.5" />
            Receive Goods / New Batch
          </Button>
        </div>
      </div>

      {/* Expiry Risk Alert Banner */}
      {wasteAnalytics.riskBatchesCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FEF3C7] via-[#FFFBEB] to-[#FEF3C7] border border-[#F59E0B]/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D97706]/15 text-[#D97706] flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#0B1B3A]">
                {wasteAnalytics.riskBatchesCount} Batches Expiring within 7 Days
              </h4>
              <p className="text-xs text-[#53607A] mt-0.5">
                Estimated stock value at risk: <strong className="text-[#D97706]">₹{wasteAnalytics.riskOfExpiryValue}</strong>.
                FEFO priority is automatically routing these items to the POS checkout first.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('batches');
              setBatchStatusFilter('EXPIRING_SOON');
            }}
            className="border-[#D97706]/50 text-[#D97706] hover:bg-[#FEF3C7] shrink-0 font-bold text-xs"
          >
            View At-Risk Batches
          </Button>
        </div>
      )}

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Total Active Batches</div>
            <div className="text-2xl font-extrabold text-[#0B1B3A] mt-0.5">{batches.length}</div>
            <div className="text-xs text-[#0FA38F] font-semibold mt-0.5">FEFO Order Enforced</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B1B3A]/5 text-[#0B1B3A] flex items-center justify-center font-bold">
            <Boxes size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Stock at Expiry Risk</div>
            <div className="text-2xl font-extrabold text-[#D97706] mt-0.5">₹{wasteAnalytics.riskOfExpiryValue}</div>
            <div className="text-xs text-[#D97706] font-semibold mt-0.5">{wasteAnalytics.riskBatchesCount} batches expiring soon</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Waste Cost This Month</div>
            <div className="text-2xl font-extrabold text-[#E5484D] mt-0.5">₹{wasteAnalytics.totalWasteCostMonth}</div>
            <div className="text-xs text-[#53607A] font-medium mt-0.5">{wasteAnalytics.totalWastedUnits} units written off</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#E5484D] flex items-center justify-center font-bold">
            <TrendingDown size={20} />
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E3E8F0] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#53607A] uppercase tracking-wider">Live SKUs Tracked</div>
            <div className="text-2xl font-extrabold text-[#0FA38F] mt-0.5">{products.length}</div>
            <div className="text-xs text-[#0FA38F] font-semibold mt-0.5">Automated Deduction</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center font-bold">
            <Layers size={20} />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#CBD5E1] gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'batches' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Batch & Expiry Tracking ({batches.length})
          {activeTab === 'batches' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'products' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Product Stock Overview ({products.length})
          {activeTab === 'products' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />}
        </button>

        <button
          onClick={() => setActiveTab('waste')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'waste' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Food Waste & Damage Log
          {activeTab === 'waste' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'history' ? 'text-[#0FA38F]' : 'text-[#53607A] hover:text-[#0B1B3A]'
          }`}
        >
          Stock Movement Log ({movements.length})
          {activeTab === 'history' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0FA38F]" />}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" size={16} />
          <input
            type="text"
            placeholder={
              activeTab === 'batches'
                ? 'Search batch # or product...'
                : activeTab === 'products'
                ? 'Search product name or barcode...'
                : 'Search records...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-xl text-sm font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
          />
        </div>

        {activeTab === 'batches' && (
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'DEPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setBatchStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  batchStatusFilter === st
                    ? 'bg-[#0B1B3A] text-white shadow-sm'
                    : 'bg-white text-[#53607A] border border-[#CBD5E1] hover:bg-[#F8FAFC]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: BATCHES */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Batch Number</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Remaining / Received</th>
                  <th className="py-3.5 px-4">Cost Price</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Days Left</th>
                  <th className="py-3.5 px-4">FEFO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#53607A]">
                      <Boxes className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                      <p className="font-semibold">No batches found</p>
                      <p className="text-xs text-[#8B96AB] mt-1">Click &quot;Receive Goods / New Batch&quot; to stock inventory.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const prodName = b.product?.name || b.productName || 'Supermarket Item';
                    const days = b.daysToExpiry ?? Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (24 * 3600 * 1000));
                    return (
                      <tr key={b._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#0FA38F]">
                          {b.batchNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0B1B3A]">{prodName}</div>
                          <div className="text-xs text-[#53607A]">Supplier: {b.supplier || 'Local Vendor'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-[#0B1B3A]">{b.remainingQuantity}</span>
                          <span className="text-xs text-[#53607A]"> / {b.receivedQuantity} units</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-[#0B1B3A]">
                          ₹{b.costPrice || 0}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-[#0B1B3A]">
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {days <= 0 ? (
                            <span className="text-xs font-extrabold text-[#E5484D]">Expired</span>
                          ) : days <= 7 ? (
                            <span className="text-xs font-extrabold text-[#D97706]">{days} days</span>
                          ) : (
                            <span className="text-xs font-medium text-[#53607A]">{days} days</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {getBatchBadge(b.computedStatus || b.status)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Adjustment Panel */}
          <Card className="p-6 bg-white border-[#E3E8F0] h-fit">
            <h3 className="text-base font-extrabold text-[#0B1B3A] mb-4 flex items-center gap-2">
              <PackagePlus size={18} className="text-[#0FA38F]" />
              Quick Stock Adjustment
            </h3>

            <form onSubmit={handleAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#53607A] mb-1">Select Product *</label>
                <select
                  required
                  value={adjustData.productId}
                  onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Live: {p.stock} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#53607A] mb-1">Adjustment Type *</label>
                <select
                  value={adjustData.type}
                  onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                >
                  <option value="RESTOCK">Restock / Return (+)</option>
                  <option value="ADJUSTMENT">Internal Count Loss / Correction (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#53607A] mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10"
                  value={adjustData.quantityChange}
                  onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-[#53607A] mb-1">Reference / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Shelf Audit, Delivery PO-901"
                  value={adjustData.reference}
                  onChange={(e) => setAdjustData({ ...adjustData, reference: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-medium text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                />
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full font-bold">
                Apply Stock Adjustment
              </Button>
            </form>
          </Card>

          {/* Products Stock Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Barcode</th>
                    <th className="py-3.5 px-4">Live Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0] text-sm">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= (p.lowStockThreshold || 10);
                    return (
                      <tr key={p._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">{p.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#53607A]">{p.barcode}</td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0B1B3A]">{p.stock}</td>
                        <td className="py-3.5 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#D97706]">
                              <AlertTriangle size={12} /> Low Stock (&le;{p.lowStockThreshold || 10})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2F6F3] text-[#0FA38F]">
                              <CheckCircle2 size={12} /> Healthy Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FOOD WASTE LOG */}
      {activeTab === 'waste' && (
        <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E3E8F0] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0B1B3A]">Recent Food Waste & Damage Records</h3>
              <p className="text-xs text-[#53607A]">Every item marked as waste is deducted from inventory and logged for auditing.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWasteModal(true)}
              className="border-[#E5484D]/40 text-[#E5484D] hover:bg-[#FEE2E2]/50 font-bold"
            >
              + Record Waste
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Batch Number</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Cost Impact</th>
                  <th className="py-3.5 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {(wasteAnalytics.recentWaste || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#53607A]">
                      <Trash2 className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                      <p className="font-semibold">No food waste records recorded yet</p>
                    </td>
                  </tr>
                ) : (
                  wasteAnalytics.recentWaste.map((w) => (
                    <tr key={w._id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 text-xs text-[#53607A]">
                        {new Date(w.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">{w.productName}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#53607A]">
                        {w.batchNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#E5484D]">
                        -{w.quantity} units
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#E5484D] uppercase">
                          {w.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">
                        ₹{w.costImpact || 0}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#53607A]">
                        {w.recordedByName || 'Staff'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MOVEMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E3E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-xs font-bold text-[#53607A] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Qty Change</th>
                  <th className="py-3.5 px-4">Stock Balance</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0] text-sm">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#53607A]">
                      <History className="mx-auto mb-2 text-[#CBD5E1]" size={36} />
                      <p className="font-semibold">No stock movements recorded</p>
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.quantityChange > 0;
                    return (
                      <tr key={m._id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-4 text-xs text-[#53607A]">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">
                          {m.product?.name || 'Supermarket Item'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              m.type === 'SALE'
                                ? 'bg-[#E2F6F3] text-[#0FA38F]'
                                : m.type === 'RESTOCK' || m.type === 'PURCHASE'
                                ? 'bg-[#E0F2FE] text-[#0284C7]'
                                : 'bg-[#FEE2E2] text-[#E5484D]'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black">
                          <span className={isPositive ? 'text-[#0FA38F]' : 'text-[#E5484D]'}>
                            {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#0B1B3A]">
                          {m.stockAfter}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#53607A]">
                          {m.reference}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#53607A]">
                          {m.performedBy || 'Cashier'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECEIVE BATCH MODAL */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E3E8F0] shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#0B1B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0FA38F]/20 text-[#0FA38F] flex items-center justify-center">
                  <PackagePlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Receive New Goods Batch</h3>
                  <p className="text-xs text-white/70">Automatic stock increase & FEFO scheduling</p>
                </div>
              </div>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReceiveBatch} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Select Product *</label>
                <select
                  required
                  value={receiveData.productId}
                  onChange={(e) => setReceiveData({ ...receiveData, productId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                >
                  <option value="">-- Choose Product to Receive --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Current: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAT-MLK-2026"
                    value={receiveData.batchNumber}
                    onChange={(e) => setReceiveData({ ...receiveData, batchNumber: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-mono text-sm font-bold text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={receiveData.receivedQuantity}
                    onChange={(e) => setReceiveData({ ...receiveData, receivedQuantity: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-bold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Cost Price per Unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25.00"
                    value={receiveData.costPrice}
                    onChange={(e) => setReceiveData({ ...receiveData, costPrice: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={receiveData.expiryDate}
                    onChange={(e) => setReceiveData({ ...receiveData, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Supplier / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Aavin Dairy, ITC Ltd"
                  value={receiveData.supplier}
                  onChange={(e) => setReceiveData({ ...receiveData, supplier: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-medium text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={() => setShowReceiveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={receiving} className="font-bold">
                  {receiving ? 'Receiving...' : 'Confirm & Add to Stock'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD WASTE MODAL */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E3E8F0] shadow-2xl overflow-hidden">
            <div className="p-6 bg-[#0B1B3A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5484D]/20 text-[#E5484D] flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Record Waste or Damaged Goods</h3>
                  <p className="text-xs text-white/70">Stock write-off & cost impact accounting</p>
                </div>
              </div>
              <button
                onClick={() => setShowWasteModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordWaste} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Select Product *</label>
                <select
                  required
                  value={wasteData.productId}
                  onChange={(e) => setWasteData({ ...wasteData, productId: e.target.value, batchId: '' })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Live: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {wasteData.productId && (
                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Associated Batch (Optional)</label>
                  <select
                    value={wasteData.batchId}
                    onChange={(e) => setWasteData({ ...wasteData, batchId: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  >
                    <option value="">-- General Stock (No Specific Batch) --</option>
                    {batches
                      .filter((b) => b.product?._id === wasteData.productId || b.product === wasteData.productId)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.batchNumber} (Rem: {b.remainingQuantity}, Exp: {new Date(b.expiryDate).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Quantity to Write Off *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5"
                    value={wasteData.quantity}
                    onChange={(e) => setWasteData({ ...wasteData, quantity: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-bold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Reason *</label>
                  <select
                    value={wasteData.reason}
                    onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}
                    className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-semibold text-sm text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                  >
                    <option value="EXPIRED">EXPIRED (Past shelf date)</option>
                    <option value="DAMAGED">DAMAGED (Crushed / torn in transit)</option>
                    <option value="SPOILED">SPOILED (Temperature breach / decay)</option>
                    <option value="RECALLED">RECALLED (Manufacturer recall)</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-[#0B1B3A] mb-1.5">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Found on top shelf past expiration date..."
                  value={wasteData.notes}
                  onChange={(e) => setWasteData({ ...wasteData, notes: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-xl font-medium text-xs text-[#0B1B3A] focus:outline-none focus:border-[#0FA38F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={() => setShowWasteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={submittingWaste} className="font-bold bg-[#E5484D] hover:bg-[#D9383D]">
                  {submittingWaste ? 'Logging...' : 'Confirm Waste Write-off'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
