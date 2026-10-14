import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Receipt, 
  Printer, 
  X, 
  Calendar, 
  IndianRupee, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Download, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/ui/GlassCard';

const DailyClosingModal = ({ isOpen, onClose, date, onDateChange, data, loading, storeDetails }) => {
  if (!isOpen) return null;
  const store = data?.store || storeDetails || {};

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/70 backdrop-blur-sm overflow-y-auto">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #zreport-modal-printable, #zreport-modal-printable * {
              visibility: visible !important;
            }
            #zreport-modal-printable {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              margin: 0 !important;
              padding: 10px !important;
              background: #fff !important;
              color: #000 !important;
              font-size: 11px !important;
            }
          }
        `}</style>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 text-[#0B1B3A] my-auto space-y-4 relative"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0] print:hidden">
            <div>
              <h3 className="text-base font-black text-[#0B1B3A]">Daily Closing (Z-Report)</h3>
              <p className="text-[11px] text-[#8B96AB]">End of day register summary</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F7FB] hover:bg-[#E3E8F0] text-[#53607A] flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Date Picker (print hidden) */}
          <div className="flex items-center gap-2 print:hidden">
            <label className="text-xs font-bold text-[#53607A]">Report Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-medium focus:ring-2 focus:ring-[#0FA38F] outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#8B96AB] space-y-2">
              <RefreshCw size={24} className="animate-spin text-[#0FA38F]" />
              <p className="text-xs">Generating Z-Report...</p>
            </div>
          ) : data ? (
            /* Printable Slip Area */
            <div
              id="zreport-modal-printable"
              className="bg-[#FAFCFF] border border-[#E3E8F0] rounded-xl p-4 font-mono text-xs text-[#0B1B3A] space-y-3"
            >
              <div className="text-center space-y-0.5 border-b border-dashed border-[#CBD5E1] pb-2">
                <h2 className="font-black text-sm tracking-wide">{(store.name || 'FRESHMART SUPERMARKET').toUpperCase()}</h2>
                {store.address && <p className="text-[10px] text-[#53607A]">{store.address}</p>}
                {store.gstin && <p className="text-[10px] text-[#53607A]">GSTIN: {store.gstin}</p>}
                <div className="pt-1 font-bold text-[11px] text-[#0FA38F]">*** DAILY CLOSING (Z-REPORT) ***</div>
                <div className="text-[10px] text-[#8B96AB]">
                  Date: {data.date} | Gen: {new Date(data.generatedAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Transactions count */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#CBD5E1] pb-2">
                <div className="flex justify-between">
                  <span>Completed Bills:</span>
                  <span className="font-bold">{data.totalSalesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items Sold:</span>
                  <span className="font-bold">{data.itemsSold}</span>
                </div>
                {data.refundedCount > 0 && (
                  <div className="flex justify-between text-[#DC2626]">
                    <span>Refunded/Voided Bills:</span>
                    <span className="font-bold">{data.refundedCount} (-₹{data.refundedAmount.toFixed(2)})</span>
                  </div>
                )}
              </div>

              {/* Tender Breakdown */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#CBD5E1] pb-2">
                <div className="font-bold text-[10px] uppercase text-[#8B96AB]">Tender Settlement</div>
                <div className="flex justify-between">
                  <span>Cash Drawer:</span>
                  <span className="tabular-nums font-bold">₹{data.cashTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Card Settlement:</span>
                  <span className="tabular-nums font-bold">₹{data.cardTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI / QR Code:</span>
                  <span className="tabular-nums font-bold">₹{data.upiTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Taxes & Deductions */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-[#CBD5E1] pb-2">
                <div className="font-bold text-[10px] uppercase text-[#8B96AB]">Taxes & Deductions</div>
                <div className="flex justify-between">
                  <span>GST Collected:</span>
                  <span className="tabular-nums">₹{data.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discounts Given:</span>
                  <span className="tabular-nums">-₹{data.totalDiscount.toFixed(2)}</span>
                </div>
              </div>

              {/* Revenue Totals */}
              <div className="space-y-1 text-xs pt-0.5">
                <div className="flex justify-between font-bold">
                  <span>Gross Revenue:</span>
                  <span className="tabular-nums">₹{data.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#0FA38F] pt-1 border-t border-dashed border-[#CBD5E1]">
                  <span>NET REVENUE:</span>
                  <span className="tabular-nums">₹{data.netRevenue.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-[#8B96AB] border-t border-dashed border-[#CBD5E1]">
                StoreFlow Supermarket POS - End of Day Audit
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#8B96AB]">
              No sales data found for the selected date.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 print:hidden">
            <button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="flex-1 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(15,163,143,0.3)] transition-all"
            >
              <Printer size={15} />
              <span>Print Z-Report</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ThermalReceiptModal = ({ isOpen, onClose, sale, storeDetails }) => {
  const [receiptWidth, setReceiptWidth] = useState('80mm');

  if (!isOpen || !sale) return null;

  const store = sale.storeSnapshot || storeDetails || {};

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textLines = [
      '==========================================',
      (store.name || 'FRESHMART SUPERMARKET').toUpperCase().padStart(25 + ((store.name || '').length / 2), ' '),
      (store.address || '').padStart(20 + ((store.address || '').length / 2), ' '),
      store.phone ? `Phone: ${store.phone}`.padStart(25, ' ') : '',
      store.gstin ? `GSTIN: ${store.gstin}`.padStart(25, ' ') : '',
      '------------------------------------------',
      `Bill No: ${sale.transactionId || sale.receiptNo}`,
      `Date: ${new Date(sale.createdAt).toLocaleDateString()}`,
      `Time: ${new Date(sale.createdAt).toLocaleTimeString()}`,
      `Cashier: ${sale.cashierName || sale.cashierUser?.name || 'Staff'}`,
      `Status: ${sale.status}`,
      sale.status === 'REFUNDED' && sale.refundReason ? `Refund Reason: ${sale.refundReason}` : '',
      '------------------------------------------',
      'ITEM             QTY    RATE     TOTAL',
      '------------------------------------------',
      ...(sale.items || []).map(it => {
        const name = (it.name || 'Item').padEnd(16).substring(0, 16);
        const qty = String(it.quantity || it.qty).padStart(3);
        const rate = (it.price || 0).toFixed(2).padStart(8);
        const total = ((it.total || (it.price * (it.quantity || it.qty))) || 0).toFixed(2).padStart(9);
        return `${name} ${qty} ${rate} ${total}`;
      }),
      '------------------------------------------',
      `Subtotal:                    ₹${(sale.subtotal || 0).toFixed(2)}`,
      sale.discount > 0 ? `Discount:                   -₹${sale.discount.toFixed(2)}` : '',
      `GST (${sale.taxRate || 5}%):               ₹${(sale.tax || 0).toFixed(2)}`,
      '------------------------------------------',
      `TOTAL AMOUNT:                ₹${(sale.total || 0).toFixed(2)}`,
      `Payment Mode:                ${sale.paymentMethod}`,
      sale.paymentMethod === 'CASH' && sale.amountReceived ? `Amount Received:             ₹${sale.amountReceived.toFixed(2)}` : '',
      sale.changeGiven > 0 ? `Change Returned:             ₹${sale.changeGiven.toFixed(2)}` : '',
      '------------------------------------------',
      (store.receiptFooter || 'Thank you for shopping with us! Visit again.').padStart(25, ' '),
      '=========================================='
    ].filter(Boolean).join('\n');

    const blob = new Blob([textLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${sale.transactionId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/70 backdrop-blur-sm overflow-y-auto">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #thermal-modal-printable, #thermal-modal-printable * {
              visibility: visible !important;
            }
            #thermal-modal-printable {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: ${receiptWidth === '58mm' ? '58mm' : '80mm'} !important;
              margin: 0 !important;
              padding: 10px !important;
              background: #fff !important;
              color: #000 !important;
              font-size: ${receiptWidth === '58mm' ? '10px' : '12px'} !important;
            }
          }
        `}</style>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 text-[#0B1B3A] my-auto space-y-4 relative"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0] print:hidden">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-[#0FA38F]" />
              <span className="font-extrabold text-sm text-[#0B1B3A]">Thermal Bill Receipt</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-[#F4F7FB] rounded-lg p-0.5 border border-[#E3E8F0]">
                <button
                  onClick={() => setReceiptWidth('58mm')}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    receiptWidth === '58mm' ? 'bg-white text-[#0FA38F] shadow-xs' : 'text-[#8B96AB]'
                  }`}
                >
                  58mm
                </button>
                <button
                  onClick={() => setReceiptWidth('80mm')}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    receiptWidth === '80mm' ? 'bg-white text-[#0FA38F] shadow-xs' : 'text-[#8B96AB]'
                  }`}
                >
                  80mm
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F4F7FB] text-[#8B96AB] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Thermal Slip */}
          <div
            id="thermal-modal-printable"
            className={`bg-[#FAFAFA] border border-dashed border-[#CBD5E1] rounded-xl p-4 font-mono text-xs text-[#0B1B3A] space-y-2.5 mx-auto ${
              receiptWidth === '58mm' ? 'max-w-[280px]' : 'max-w-full'
            }`}
          >
            <div className="text-center space-y-0.5">
              <h3 className="font-black text-sm uppercase">
                {store.name || 'FreshMart Supermarket'}
              </h3>
              <p className="text-[11px] text-[#53607A]">{store.address || 'Chennai, Tamil Nadu'}</p>
              {store.phone && <p className="text-[10px] text-[#53607A]">Phone: {store.phone}</p>}
              {store.gstin && <p className="text-[10px] font-bold text-[#53607A]">GSTIN: {store.gstin}</p>}
            </div>

            <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Bill: {sale.transactionId}</span>
                <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: {sale.cashierName || sale.cashierUser?.name || 'Staff'}</span>
                <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Status:</span>
                <span className={sale.status === 'REFUNDED' ? 'text-[#E5484D]' : 'text-[#16A34A]'}>
                  {sale.status}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 space-y-1">
              <div className="flex justify-between font-bold text-[10px] border-b border-dashed border-[#CBD5E1] pb-1">
                <span className="flex-1">Item</span>
                <span className="w-8 text-center">Qty</span>
                <span className="w-12 text-right">Price</span>
                <span className="w-14 text-right">Total</span>
              </div>
              {(sale.items || []).map((item, idx) => (
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

            <div className="border-t border-dashed border-[#CBD5E1] pt-1.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">₹{(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-[#16A34A] font-bold">
                  <span>Discount</span>
                  <span className="tabular-nums">-₹{sale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({sale.taxRate || 5}% GST)</span>
                <span className="tabular-nums">₹{(sale.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-[#CBD5E1]">
                <span>TOTAL</span>
                <span className="tabular-nums">₹{(sale.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] pt-0.5">
                <span>Payment Mode: {sale.paymentMethod}</span>
                {sale.amountReceived && (
                  <span>Recd: ₹{(sale.amountReceived || sale.total).toFixed(2)}</span>
                )}
              </div>
              {sale.changeGiven > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-[#D97706]">
                  <span>Change Given</span>
                  <span className="tabular-nums">₹{sale.changeGiven.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-[#CBD5E1] pt-2 text-center text-[10px] text-[#53607A]">
              <p>{store.receiptFooter || 'Thank you for shopping with us! Visit again.'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 print:hidden">
            <button
              onClick={handleDownloadTxt}
              className="p-2.5 rounded-xl border border-[#E3E8F0] text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
              title="Download text slip"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-xl bg-[#0FA38F] hover:bg-[#0B8A78] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_2px_10px_rgba(15,163,143,0.3)] transition-all"
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const SalesHistory = () => {
  const { user } = useAuth();
  const isStoreAdmin = ['store_admin', 'store_owner', 'admin'].includes((user?.role || '').toLowerCase());

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalBills: 0, completedBills: 0, refundedBills: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  // Daily Closing (Z-Report) Modal state
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingDate, setClosingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [closingData, setClosingData] = useState(null);
  const [loadingClosing, setLoadingClosing] = useState(false);

  const fetchDailyClosing = async (dateStr) => {
    setLoadingClosing(true);
    try {
      const { data } = await api.get(`/sales/daily-closing?date=${dateStr}`);
      if (data?.data) {
        setClosingData(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to generate closing report');
    } finally {
      setLoadingClosing(false);
    }
  };

  const handleOpenDailyClosing = () => {
    setShowClosingModal(true);
    fetchDailyClosing(closingDate);
  };

  const handleClosingDateChange = (newDate) => {
    setClosingDate(newDate);
    fetchDailyClosing(newDate);
  };

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Void confirmation state (for Store Admin)
  const [saleToRefund, setSaleToRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Derive dates from filter selection
  const computedDateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === 'TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { start: today.toISOString(), end: '' };
    }
    if (dateFilter === 'YESTERDAY') {
      const yStart = new Date();
      yStart.setDate(yStart.getDate() - 1);
      yStart.setHours(0, 0, 0, 0);
      const yEnd = new Date();
      yEnd.setDate(yEnd.getDate() - 1);
      yEnd.setHours(23, 59, 59, 999);
      return { start: yStart.toISOString(), end: yEnd.toISOString() };
    }
    if (dateFilter === 'WEEK') {
      const week = new Date();
      week.setDate(week.getDate() - 7);
      week.setHours(0, 0, 0, 0);
      return { start: week.toISOString(), end: '' };
    }
    if (dateFilter === 'MONTH') {
      const month = new Date();
      month.setDate(1);
      month.setHours(0, 0, 0, 0);
      return { start: month.toISOString(), end: '' };
    }
    if (dateFilter === 'CUSTOM') {
      return {
        start: startDate ? new Date(startDate).toISOString() : '',
        end: endDate ? new Date(endDate).toISOString() : '',
      };
    }
    return { start: '', end: '' };
  }, [dateFilter, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (paymentFilter !== 'ALL') params.append('paymentMethod', paymentFilter);
      if (computedDateRange.start) params.append('startDate', computedDateRange.start);
      if (computedDateRange.end) params.append('endDate', computedDateRange.end);
      params.append('limit', '100');

      const { data } = await api.get(`/sales?${params.toString()}`);
      if (data?.data) {
        setSales(data.data);
      }
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to load sales history:', error);
      toast.error(error.response?.data?.message || 'Could not load sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, dateFilter, startDate, endDate, statusFilter, paymentFilter]);

  // CSV Export handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (paymentFilter !== 'ALL') params.append('paymentMethod', paymentFilter);
    if (computedDateRange.start) params.append('startDate', computedDateRange.start);
    if (computedDateRange.end) params.append('endDate', computedDateRange.end);

    window.open(`/api/sales/export.csv?${params.toString()}`, '_blank');
    toast.success('Downloading Sales CSV Report');
  };

  // Direct Refund by Store Admin
  const handleConfirmRefund = async (e) => {
    e.preventDefault();
    if (!saleToRefund) return;

    setIsRefunding(true);
    try {
      const { data } = await api.post(`/sales/${saleToRefund._id}/refund`, {
        reason: refundReason.trim() || 'Store Admin Refund'
      });
      toast.success(data.message || 'Sale refunded and stock restored');
      setSaleToRefund(null);
      setRefundReason('');
      fetchSales();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setIsRefunding(false);
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'CASH': return <Banknote size={15} className="text-[#10B981]" />;
      case 'CARD': return <CreditCard size={15} className="text-[#0284C7]" />;
      case 'UPI': return <QrCode size={15} className="text-[#8B5CF6]" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 relative z-10 pb-16 font-sans">
      
      {/* Thermal Receipt Modal */}
      <ThermalReceiptModal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        sale={selectedSale}
        storeDetails={user?.store}
      />

      {/* Daily Closing (Z-Report) Modal */}
      <DailyClosingModal
        isOpen={showClosingModal}
        onClose={() => setShowClosingModal(false)}
        date={closingDate}
        onDateChange={handleClosingDateChange}
        data={closingData}
        loading={loadingClosing}
        storeDetails={user?.store}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B1B3A] tracking-tight">
            {isStoreAdmin ? 'Sales History & Audits' : 'My Sales Transactions'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8B96AB] mt-0.5">
            {isStoreAdmin 
              ? 'Complete multi-register transactional records, thermal receipts, and revenue summaries'
              : 'Review your registered customer bills and reprint receipts'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleOpenDailyClosing}
            className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F4F7FB] text-[#0B1B3A] text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            title="Generate End of Day Z-Report"
          >
            <FileText size={16} className="text-[#0FA38F]" />
            <span>Daily Closing (Z-Report)</span>
          </button>

          {isStoreAdmin && (
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-[#0B1B3A] hover:bg-[#12274F] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Filtered KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8B96AB] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Filtered Revenue</span>
            <IndianRupee size={16} className="text-[#0FA38F]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1B3A] tabular-nums">
            ₹{(summary.totalRevenue || 0).toFixed(2)}
          </div>
          <p className="text-[10px] text-[#8B96AB] mt-0.5">From completed sales</p>
        </div>

        <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8B96AB] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bills</span>
            <TrendingUp size={16} className="text-[#0284C7]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1B3A] tabular-nums">
            {summary.totalBills || 0}
          </div>
          <p className="text-[10px] text-[#8B96AB] mt-0.5">{summary.completedBills || 0} completed</p>
        </div>

        <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8B96AB] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Bill Value</span>
            <ShoppingBag size={16} className="text-[#8B5CF6]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1B3A] tabular-nums">
            ₹{summary.completedBills > 0 ? ((summary.totalRevenue || 0) / summary.completedBills).toFixed(2) : '0.00'}
          </div>
          <p className="text-[10px] text-[#8B96AB] mt-0.5">Per completed transaction</p>
        </div>

        <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#8B96AB] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Refunded Bills</span>
            <RotateCcw size={16} className="text-[#E5484D]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#E5484D] tabular-nums">
            {summary.refundedBills || 0}
          </div>
          <p className="text-[10px] text-[#8B96AB] mt-0.5">Inventory returned</p>
        </div>
      </div>

      {/* Main Filter & Transaction Container */}
      <div className="bg-white border border-[#E3E8F0] rounded-[22px] shadow-sm overflow-hidden">
        
        {/* Filter Controls Row */}
        <div className="p-4 border-b border-[#E3E8F0] bg-[#F4F7FB]/50 flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bill no or cashier..."
              className="w-full bg-white border border-[#E3E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[#0B1B3A] placeholder-[#8B96AB] outline-none focus:border-[#0FA38F]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            {/* Date Quick Selector */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E3E8F0] rounded-xl text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">This Month</option>
              <option value="CUSTOM">Custom Date</option>
            </select>

            {dateFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-[#E3E8F0] rounded-xl text-xs font-bold text-[#0B1B3A] outline-none"
                />
                <span className="text-xs text-[#8B96AB]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-[#E3E8F0] rounded-xl text-xs font-bold text-[#0B1B3A] outline-none"
                />
              </div>
            )}

            {/* Payment Method Selector */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E3E8F0] rounded-xl text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
            >
              <option value="ALL">All Modes</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
            </select>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E3E8F0] rounded-xl text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            <button
              onClick={fetchSales}
              className="p-2 rounded-xl bg-white border border-[#E3E8F0] text-[#53607A] hover:bg-[#EEF2F8] transition-colors"
              title="Refresh sales list"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#F8FAFC] border-b border-[#E3E8F0] text-[#53607A] uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Bill Number</th>
                <th className="px-5 py-3.5">Date & Time</th>
                <th className="px-5 py-3.5">Cashier</th>
                <th className="px-5 py-3.5 text-center">Items</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F8]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-[#8B96AB]">
                    <div className="w-8 h-8 border-2 border-[#0FA38F] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-20 text-center text-[#8B96AB]">
                    <Receipt size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
                    <p className="font-bold text-[#53607A]">No transactions found</p>
                    <p className="text-[11px] text-[#8B96AB] mt-0.5">Try adjusting your filters or date range</p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const isRefunded = sale.status === 'REFUNDED';
                  return (
                    <tr
                      key={sale._id}
                      className="hover:bg-[#F4F7FB]/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <td className="px-5 py-4 font-mono font-extrabold text-[#0B1B3A]">
                        {sale.transactionId}
                      </td>
                      <td className="px-5 py-4 text-[#53607A]">
                        <div>{new Date(sale.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#8B96AB]">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#0B1B3A]">
                        {sale.cashierName || sale.cashierUser?.name || 'Staff'}
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-[#53607A]">
                        {sale.items?.length || 0}
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F7FB] border border-[#E3E8F0] font-bold text-[11px]">
                          {getPaymentIcon(sale.paymentMethod)}
                          <span>{sale.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isRefunded 
                            ? 'bg-[#FEE2E2] text-[#E5484D] border-[#FCA5A5]/40' 
                            : 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]/40'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-sm tabular-nums text-[#0B1B3A]">
                        <span className={isRefunded ? 'line-through text-[#8B96AB]' : ''}>
                          ₹{sale.total?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSale(sale);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#E2F6F3] text-[#0FA38F] hover:bg-[#0FA38F] hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Receipt size={13} />
                            <span>Receipt</span>
                          </button>

                          {isStoreAdmin && !isRefunded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSaleToRefund(sale);
                                setRefundReason('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FEE2E2]/60 text-[#E5484D] hover:bg-[#E5484D] hover:text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                              title="Refund / Void Bill"
                            >
                              <RotateCcw size={13} />
                              <span>Void</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Admin Void Confirmation Dialog */}
      <AnimatePresence>
        {saleToRefund && (
          <div className="fixed inset-0 z-50 bg-[#0B1B3A]/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl max-w-sm w-full p-6 text-[#0B1B3A] space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#E3E8F0]">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#E5484D] flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1B3A]">Void Sale & Restore Stock</h3>
                  <p className="text-xs text-[#8B96AB]">Transaction: {saleToRefund.transactionId}</p>
                </div>
              </div>

              <p className="text-xs text-[#53607A] leading-relaxed">
                As Store Administrator, confirming this void will mark bill <strong>{saleToRefund.transactionId}</strong> as <strong>REFUNDED</strong> and immediately return <strong>{saleToRefund.items?.reduce((s, it) => s + (it.quantity || it.qty), 0)} items</strong> back to active store inventory.
              </p>

              <form onSubmit={handleConfirmRefund} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-[#8B96AB] uppercase tracking-wider block mb-1">
                    Refund Reason
                  </label>
                  <input
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g., Customer return / wrong bill"
                    className="w-full bg-[#F4F7FB] border border-[#E3E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#0B1B3A] outline-none focus:border-[#0FA38F]"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSaleToRefund(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[#E3E8F0] font-bold text-xs text-[#53607A] hover:bg-[#F4F7FB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRefunding}
                    className="flex-1 py-2.5 rounded-xl bg-[#E5484D] hover:bg-[#DC2626] text-white font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
                  >
                    {isRefunding ? 'Refunding...' : 'Confirm Void'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SalesHistory;
