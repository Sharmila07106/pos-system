import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Receipt, Printer, X, Calendar, IndianRupee, CreditCard, Banknote, QrCode } from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/ui/GlassCard';

const ReceiptModal = ({ isOpen, onClose, sale }) => {
  if (!sale) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="w-full max-w-sm relative"
          >
            {/* Close Button */}
            <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full backdrop-blur-md border border-white/20">
              <X size={20} />
            </button>

            {/* Receipt Body */}
            <div className="bg-white text-slate-900 w-full rounded-t-xl rounded-b-sm p-6 shadow-2xl relative">
              {/* Jagged bottom effect via CSS */}
              <div className="absolute -bottom-2 left-0 w-full h-4 bg-[radial-gradient(circle,transparent,transparent_50%,#fff_50%,#fff_100%)] bg-[length:10px_10px] bg-repeat-x" style={{ backgroundPosition: '0 100%' }}></div>
              
              <div className="text-center mb-6 border-b border-slate-200 pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-3">N</div>
                <h3 className="font-bold text-2xl tracking-tighter">NovaPOS</h3>
                <p className="text-xs text-slate-500">Scan. Pay. Grow.</p>
                <div className="mt-4 text-xs text-slate-500 flex flex-col gap-1">
                  <span>Txn: {sale.transactionId}</span>
                  <span>Date: {new Date(sale.createdAt).toLocaleString()}</span>
                  <span>Cashier: {sale.cashierName || 'Admin'}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {sale.items.map(item => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="flex-1">{item.quantity}x {item.name}</span>
                    <span className="font-medium">₹{item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>₹{sale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({sale.taxRate}%)</span>
                  <span>₹{sale.tax.toFixed(2)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{sale.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg mt-2 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>₹{sale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 mt-4 pt-4 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-700">{sale.paymentMethod}</span>
                </div>
                {sale.paymentMethod === 'CASH' && (
                  <>
                    <div className="flex justify-between">
                      <span>Amount Received</span>
                      <span>₹{sale.amountReceived?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change Given</span>
                      <span>₹{sale.changeGiven?.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-8 pt-4">
                 <button className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30">
                   <Printer size={18} /> Print Receipt
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data } = await api.get('/sales');
        setSales(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filteredSales = sales.filter(s => 
    s.transactionId.toLowerCase().includes(search.toLowerCase()) || 
    s.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'CASH': return <Banknote size={16} className="text-emerald-500" />;
      case 'CARD': return <CreditCard size={16} className="text-blue-500" />;
      case 'UPI': return <QrCode size={16} className="text-violet-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      
      <ReceiptModal 
        isOpen={!!selectedSale} 
        onClose={() => setSelectedSale(null)} 
        sale={selectedSale} 
      />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black text-text-color tracking-tight">Sales History</h1>
          <p className="text-slate-500 font-medium">View past transactions and receipts</p>
        </div>
      </motion.div>

      <GlassCard className="rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-border-color bg-black/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search by Transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-text-color outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-black/20 border border-border-color text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-2">
              <Calendar size={16} /> Today
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/20 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color bg-black/5">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="inline-block w-10 h-10 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                    <div className="text-slate-400 font-medium">Loading sales history...</div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center text-slate-400 font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredSales.map((sale, i) => (
                    <motion.tr 
                      key={sale._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-cyan-500">{sale.transactionId}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(sale.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium">{sale.items.length} items</td>
                      <td className="px-6 py-4 font-black text-text-color flex items-center gap-1">
                        ₹{sale.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${sale.paymentMethod === 'CASH' ? 'bg-emerald-500/20' : sale.paymentMethod === 'CARD' ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
                            {getPaymentIcon(sale.paymentMethod)}
                          </div>
                          <span className="font-bold text-slate-300 text-xs">{sale.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors font-medium inline-flex items-center gap-1 opacity-50 group-hover:opacity-100"
                        >
                          <Receipt size={16} /> View
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default SalesHistory;
