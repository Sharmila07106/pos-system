import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, PackageMinus, History, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import GlassCard from '../components/ui/GlassCard';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('adjust');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [adjustData, setAdjustData] = useState({ productId: '', type: 'RESTOCK', quantityChange: '', reference: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, movRes] = await Promise.all([
        api.get(`/products?search=${search}`),
        api.get('/inventory/movements')
      ]);
      setProducts(prodRes.data.data);
      setMovements(movRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchData, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustData.productId || !adjustData.quantityChange) return toast.error('Please fill required fields');
    
    try {
      const change = adjustData.type === 'ADJUSTMENT' && adjustData.quantityChange > 0 
        ? -adjustData.quantityChange // if they want to reduce via adjustment
        : adjustData.quantityChange;

      await api.post('/inventory/adjust', {
        ...adjustData,
        quantityChange: change
      });
      toast.success('Stock updated successfully!');
      setAdjustData({ productId: '', type: 'RESTOCK', quantityChange: '', reference: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">Inventory</h1>
          <p className="text-slate-500 font-medium">Manage stock levels and view movement history</p>
        </div>
      </motion.div>

      <div className="flex gap-4 border-b border-border-color pb-px">
        <button 
          onClick={() => setActiveTab('adjust')}
          className={`pb-3 px-2 font-bold text-sm transition-colors relative ${activeTab === 'adjust' ? 'text-cyan-500' : 'text-slate-500 hover:text-text-color'}`}
        >
          Stock Management
          {activeTab === 'adjust' && <motion.div layoutId="tab-indicator" className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_#00e5ff]" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 font-bold text-sm transition-colors relative ${activeTab === 'history' ? 'text-cyan-500' : 'text-slate-500 hover:text-text-color'}`}
        >
          Movement History
          {activeTab === 'history' && <motion.div layoutId="tab-indicator" className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_#00e5ff]" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'adjust' ? (
          <motion.div key="adjust" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid md:grid-cols-3 gap-6">
            
            {/* Quick Adjustment Form */}
            <GlassCard className="p-6 md:col-span-1 h-fit shadow-xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><PackageMinus size={20} className="text-cyan-500"/> Adjust Stock</h2>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Select Product</label>
                  <select required value={adjustData.productId} onChange={e=>setAdjustData({...adjustData, productId: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-xl px-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium">
                    <option value="" className="bg-bg-color">-- Select Product --</option>
                    {products.map(p => <option key={p._id} value={p._id} className="bg-bg-color">{p.name} (Stock: {p.stock})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Type</label>
                  <select value={adjustData.type} onChange={e=>setAdjustData({...adjustData, type: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-xl px-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium">
                    <option value="RESTOCK" className="bg-bg-color">Restock (+)</option>
                    <option value="ADJUSTMENT" className="bg-bg-color">Loss / Adjustment (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Quantity</label>
                  <input required type="number" min="1" value={adjustData.quantityChange} onChange={e=>setAdjustData({...adjustData, quantityChange: e.target.value})} className="w-full bg-black/20 border border-border-color rounded-xl px-4 py-3 outline-none focus:border-cyan-500 text-sm font-bold" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Reference (Optional)</label>
                  <input value={adjustData.reference} onChange={e=>setAdjustData({...adjustData, reference: e.target.value})} placeholder="e.g. PO-1234, Damaged" className="w-full bg-black/20 border border-border-color rounded-xl px-4 py-3 outline-none focus:border-cyan-500 text-sm font-medium" />
                </div>
                <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]">
                  Update Stock
                </button>
              </form>
            </GlassCard>

            {/* Current Stock Table */}
            <GlassCard className="p-0 md:col-span-2 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-border-color bg-black/10 flex items-center">
                <div className="relative w-full max-w-sm group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
                  <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-2 text-sm text-text-color outline-none focus:ring-2 focus:ring-cyan-500/50" />
                </div>
              </div>
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/20 text-slate-400 uppercase text-xs font-bold">
                    <tr><th className="px-6 py-4">Product</th><th className="px-6 py-4">Barcode</th><th className="px-6 py-4">Current Stock</th><th className="px-6 py-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border-color bg-black/5">
                    {products.map(p => (
                      <motion.tr key={p._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold">{p.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{p.barcode}</td>
                        <td className="px-6 py-4 font-black">{p.stock}</td>
                        <td className="px-6 py-4">
                          {p.stock <= p.lowStockThreshold ? <span className="text-orange-500">Low Stock</span> : <span className="text-emerald-500">Good</span>}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlassCard className="p-0 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-border-color bg-black/10 flex items-center gap-2">
                <History className="text-violet-500" size={20} /> <h2 className="font-bold text-lg">Recent Movements</h2>
              </div>
              <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-black/20 text-slate-400 uppercase text-xs font-bold">
                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Change</th><th className="px-6 py-4">Balance</th><th className="px-6 py-4">Reference</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border-color bg-black/5">
                    {movements.map((m, i) => (
                      <motion.tr key={m._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-slate-400">{new Date(m.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold">{m.product?.name || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${m.type === 'SALE' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : m.type === 'RESTOCK' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black flex items-center gap-1">
                          {m.quantityChange > 0 ? <ArrowUpRight size={16} className="text-emerald-500"/> : <ArrowDownRight size={16} className="text-orange-500"/>}
                          <span className={m.quantityChange > 0 ? 'text-emerald-500' : 'text-orange-500'}>{Math.abs(m.quantityChange)}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-300">{m.stockAfter}</td>
                        <td className="px-6 py-4 text-slate-400">{m.reference}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;
