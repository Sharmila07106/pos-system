const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const Batch = require('../models/Batch');
const Store = require('../models/Store');
const User = require('../models/User');

const memorySales = [];

// Helper to generate sequential transaction ID per store
const generateTxnId = async (storeId) => {
  const count = await Sale.countDocuments({ store: storeId });
  return `TXN-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Create a new sale (checkout)
// @desc    Create a new sale (checkout)
// @route   POST /api/sales
// @access  Private (Store Staff Only - Platform Admin Forbidden)
const createSale = asyncHandler(async (req, res) => {
  // Strict guard: Platform admins cannot execute store checkout
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin)) {
    res.status(403);
    throw new Error('Platform administrators cannot perform store checkout operations.');
  }

  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Active supermarket store context required for billing');
  }

  const { items, discount = 0, paymentMethod, amountReceived } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  const validMethods = ['CASH', 'CARD', 'UPI'];
  if (!validMethods.includes(paymentMethod)) {
    res.status(400);
    throw new Error(`Payment method must be one of: ${validMethods.join(', ')}`);
  }

  // Idempotency check: prevent duplicate billing on repeated clicks or network retry
  const clientKey = req.body.idempotencyKey || req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (clientKey) {
    const existingSale = await Sale.findOne({ store: storeId, idempotencyKey: clientKey });
    if (existingSale) {
      return res.status(200).json({
        success: true,
        message: 'Sale already processed',
        data: existingSale,
        isDuplicate: true,
      });
    }
  }

  // First pass: Validate all products and stock availability before making any DB changes
  const productIds = items.map((it) => it._id || it.product);
  const dbProducts = await Product.find({
    _id: { $in: productIds },
    store: storeId,
    isActive: true,
  });

  const productMap = new Map();
  dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

  for (const item of items) {
    const pId = (item._id || item.product || '').toString();
    const product = productMap.get(pId);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found or inactive in this supermarket: ${item.name || item.barcode || pId}`);
    }

    const requestedQty = Number(item.qty || item.quantity) || 1;
    if (requestedQty <= 0) {
      res.status(400);
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    if (product.stock < requestedQty) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${requestedQty}`);
    }
  }

  // Atomic decrement pass: Conditionally decrement stock with rollback on any failure
  const decrementedItems = [];
  let deductionFailed = false;
  let failureReason = '';

  for (const item of items) {
    const pId = (item._id || item.product).toString();
    const requestedQty = Number(item.qty || item.quantity) || 1;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: pId, store: storeId, isActive: true, stock: { $gte: requestedQty } },
      { $inc: { stock: -requestedQty } },
      { new: true }
    );

    if (!updatedProduct) {
      deductionFailed = true;
      const currentProd = await Product.findOne({ _id: pId, store: storeId });
      failureReason = `Insufficient stock for "${currentProd?.name || 'Item'}". Available: ${currentProd?.stock ?? 0}, Requested: ${requestedQty}`;
      break;
    }

    decrementedItems.push({
      product: updatedProduct,
      qty: requestedQty,
      stockBefore: updatedProduct.stock + requestedQty,
      stockAfter: updatedProduct.stock,
    });
  }

  // If any item failed atomic decrement, rollback all previous items in this sale
  if (deductionFailed) {
    for (const dec of decrementedItems) {
      await Product.updateOne(
        { _id: dec.product._id, store: storeId },
        { $inc: { stock: dec.qty } }
      ).catch((err) => console.error('Stock decrement rollback error:', err));
    }
    res.status(400);
    throw new Error(failureReason || 'Failed to complete checkout due to insufficient stock');
  }

  const txnId = await generateTxnId(storeId);
  let subtotal = 0;
  const processedItems = [];
  const stockMovements = [];

  // Strictly recompute prices from DB records (never trust client prices)
  for (const dec of decrementedItems) {
    const dbPrice = dec.product.price;
    const itemTotal = Number((dbPrice * dec.qty).toFixed(2));
    subtotal += itemTotal;

    processedItems.push({
      product: dec.product._id,
      name: dec.product.name,
      barcode: dec.product.barcode,
      quantity: dec.qty,
      price: dbPrice,
      total: itemTotal,
    });

    stockMovements.push({
      store: storeId,
      product: dec.product._id,
      type: 'SALE',
      quantityChange: -dec.qty,
      stockBefore: dec.stockBefore,
      stockAfter: dec.stockAfter,
      reference: txnId,
      performedByUser: req.user._id,
      performedBy: req.user.name || 'Cashier',
    });

    // FEFO Batch Depletion for products with batch tracking
    if (mongoose.Types.ObjectId.isValid(dec.product._id)) {
      try {
        const batches = await Batch.find({
          store: storeId,
          product: dec.product._id,
          remainingQuantity: { $gt: 0 },
          status: 'ACTIVE',
        }).sort({ expiryDate: 1 });

        let qtyToDeduct = dec.qty;
        for (const b of batches) {
          if (qtyToDeduct <= 0) break;
          const deduct = Math.min(b.remainingQuantity, qtyToDeduct);
          b.remainingQuantity -= deduct;
          if (b.remainingQuantity === 0) {
            b.status = 'DEPLETED';
          }
          await b.save();
          qtyToDeduct -= deduct;
        }
      } catch (batchErr) {
        console.warn('Batch depletion warning:', batchErr.message);
      }
    }
  }

  // Fetch store tax settings & snapshot
  let taxRate = 5;
  let storeDoc = null;
  if (mongoose.Types.ObjectId.isValid(storeId)) {
    try {
      storeDoc = await Store.findById(storeId);
      if (storeDoc && storeDoc.taxRatePercent !== undefined) {
        taxRate = storeDoc.taxRatePercent;
      }
    } catch (err) {
      console.warn('Store fetch error in sale:', err.message);
    }
  }

  const discountAmount = Math.max(0, Number(discount) || 0);
  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal + tax - discountAmount).toFixed(2)));
  const received = paymentMethod === 'CASH' ? Math.max(finalTotal, Number(amountReceived) || finalTotal) : finalTotal;
  const change = Math.max(0, Number((received - finalTotal).toFixed(2)));

  const storeSnapshot = storeDoc
    ? {
        name: storeDoc.name,
        address: `${storeDoc.address || ''}, ${storeDoc.city || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        phone: storeDoc.phone || '',
        gstin: storeDoc.gstin || '',
        receiptFooter: storeDoc.receiptFooter || 'Thank you for shopping with us! Visit again.',
      }
    : undefined;

  // Save Sale record
  const sale = await Sale.create({
    store: storeId,
    transactionId: txnId,
    receiptNo: txnId,
    idempotencyKey: clientKey || undefined,
    items: processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    tax,
    taxRate,
    discount: discountAmount,
    total: finalTotal,
    paymentMethod,
    amountReceived: received,
    changeGiven: change,
    status: 'COMPLETED',
    cashierUser: req.user._id,
    cashierName: req.user.name || 'Cashier',
    storeSnapshot,
  });

  // Record stock movements in parallel
  if (stockMovements.length > 0) {
    await StockMovement.insertMany(stockMovements).catch((err) =>
      console.warn('Stock movement record warning:', err.message)
    );
  }

  return res.status(201).json({
    success: true,
    message: 'Sale completed successfully',
    data: sale,
  });
});

// @desc    Get sales history (scoped strictly to store)
// @route   GET /api/sales
// @access  Private (Store Staff Only)
const getSales = asyncHandler(async (req, res) => {
  // Platform admins are forbidden from viewing store item-level receipts
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin)) {
    return res.status(403).json({
      success: false,
      message: 'Platform administrators cannot view individual store receipts.',
    });
  }

  const storeId = req.storeId;
  if (!storeId) {
    return res.json({ success: true, count: 0, total: 0, data: [] });
  }

  const userRole = (req.user?.role || '').toLowerCase();
  if (userRole === 'inventory_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Inventory managers cannot access sales history or revenue data.',
    });
  }

  const { search, page = 1, limit = 20, startDate, endDate, status, paymentMethod } = req.query;
  const query = { store: storeId };

  // Cashier can only see their own transactions/bills
  if (userRole === 'cashier' && req.user?._id) {
    query.cashierUser = req.user._id;
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (paymentMethod && paymentMethod !== 'ALL') {
    query.paymentMethod = paymentMethod.toUpperCase();
  }

  if (search && search.trim()) {
    query.$or = [
      { transactionId: { $regex: search.trim(), $options: 'i' } },
      { receiptNo: { $regex: search.trim(), $options: 'i' } },
      { cashierName: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 20);
  const skip = (pageNum - 1) * limitNum;

  const total = await Sale.countDocuments(query);
  const sales = await Sale.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('cashierUser', 'name email');

  // Summary aggregates for filtered query
  let summary = { totalRevenue: 0, totalBills: total, completedBills: 0, refundedBills: 0 };
  try {
    const summaryAgg = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$total', 0] },
          },
          completedBills: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
          refundedBills: {
            $sum: { $cond: [{ $eq: ['$status', 'REFUNDED'] }, 1, 0] },
          },
        },
      },
    ]);
    if (summaryAgg && summaryAgg.length > 0) {
      summary = {
        totalRevenue: summaryAgg[0].totalRevenue || 0,
        totalBills: total,
        completedBills: summaryAgg[0].completedBills || 0,
        refundedBills: summaryAgg[0].refundedBills || 0,
      };
    }
  } catch (err) {
    console.warn('Sales summary aggregate warning:', err.message);
  }

  return res.json({
    success: true,
    count: sales.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    summary,
    data: sales,
  });
});

// @desc    Get single sale by ID
// @route   GET /api/sales/:id
// @access  Private (Store Staff Only)
const getSaleById = asyncHandler(async (req, res) => {
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin)) {
    return res.status(403).json({
      success: false,
      message: 'Platform administrators cannot view individual store receipts.',
    });
  }

  let query = Sale.findById(req.params.id)
    .populate('items.product', 'name barcode image category')
    .populate('cashierUser', 'name email');
  if (query && typeof query.populate === 'function') {
    try {
      const q3 = query.populate('store', 'name address phone city gstin receiptFooter taxRatePercent');
      if (q3) query = q3;
    } catch (_) {}
  }
  const sale = await query;

  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  if (sale.store?.toString() !== req.storeId) {
    res.status(403);
    throw new Error('Unauthorized access to receipt from another store');
  }

  return res.json({ success: true, data: sale });
});

// @desc    Refund sale
// @route   POST /api/sales/:id/refund
// @access  Private (Store Owner / Admin Only)
const refundSale = asyncHandler(async (req, res) => {
  const userRole = (req.user?.role || '').toLowerCase();
  const isStoreAdmin =
    ['store_admin', 'store_owner', 'admin'].includes(userRole) ||
    req.user?.isPlatformAdmin;

  let approverName = req.user?.name || 'Admin';

  if (!isStoreAdmin) {
    const { adminEmail, adminPassword } = req.body;
    if (!adminEmail || !adminPassword) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Voiding or refunding a bill requires store admin privileges or store admin approval.',
      });
    }

    const adminUser = await User.findOne({
      email: adminEmail.toLowerCase().trim(),
      store: req.storeId,
    });

    if (
      !adminUser ||
      !['store_admin', 'store_owner', 'admin'].includes((adminUser.role || '').toLowerCase())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Invalid store admin credentials for refund approval.',
      });
    }

    const isMatch = await adminUser.matchPassword(adminPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect store admin password.',
      });
    }

    approverName = `${adminUser.name} (Approved for ${req.user?.name || 'Cashier'})`;
  }

  const storeId = req.storeId;
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  if (sale.store?.toString() !== storeId) {
    res.status(403);
    throw new Error('Unauthorized access to receipt from another store');
  }

  if (sale.status === 'REFUNDED') {
    res.status(400);
    throw new Error('Sale has already been refunded');
  }

  // Restore inventory
  for (const item of sale.items) {
    const product = await Product.findOne({ _id: item.product, store: storeId });
    if (product) {
      const stockBefore = product.stock;
      product.stock += item.quantity;
      await product.save();

      await StockMovement.create({
        store: storeId,
        product: product._id,
        type: 'REFUND',
        quantityChange: item.quantity,
        stockBefore,
        stockAfter: product.stock,
        reference: `REFUND-${sale.transactionId}`,
        performedByUser: req.user._id,
        performedBy: approverName,
      }).catch(() => {});
    }
  }

  sale.status = 'REFUNDED';
  sale.refundReason = req.body.reason || 'Customer returned items';
  await sale.save();

  return res.json({
    success: true,
    message: 'Sale refunded successfully and inventory restored',
    data: sale,
  });
});

// @desc    Export filtered sales to CSV
// @route   GET /api/sales/export.csv
// @access  Private (Store Staff Only)
const exportSalesCsv = asyncHandler(async (req, res) => {
  const userRole = (req.user?.role || '').toLowerCase();
  if (userRole === 'inventory_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Inventory managers cannot export sales data.',
    });
  }

  const storeId = req.storeId;
  if (!storeId) {
    return res.status(400).send('Store context required');
  }

  const { search, startDate, endDate, status, paymentMethod } = req.query;
  const query = { store: storeId };

  if (userRole === 'cashier' && req.user?._id) {
    query.cashierUser = req.user._id;
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (paymentMethod && paymentMethod !== 'ALL') {
    query.paymentMethod = paymentMethod.toUpperCase();
  }

  if (search && search.trim()) {
    query.$or = [
      { transactionId: { $regex: search.trim(), $options: 'i' } },
      { receiptNo: { $regex: search.trim(), $options: 'i' } },
      { cashierName: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const sales = await Sale.find(query).sort({ createdAt: -1 });

  const headers = [
    'Transaction ID',
    'Receipt No',
    'Date',
    'Time',
    'Cashier',
    'Items Count',
    'Subtotal',
    'Discount',
    'Tax',
    'Total',
    'Payment Method',
    'Status',
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = sales.map((s) => {
    const d = new Date(s.createdAt);
    return [
      escapeCsv(s.transactionId),
      escapeCsv(s.receiptNo || s.transactionId),
      escapeCsv(d.toLocaleDateString('en-GB')),
      escapeCsv(d.toLocaleTimeString()),
      escapeCsv(s.cashierName || 'Cashier'),
      s.items?.length || 0,
      (s.subtotal || 0).toFixed(2),
      (s.discount || 0).toFixed(2),
      (s.tax || 0).toFixed(2),
      (s.total || 0).toFixed(2),
      escapeCsv(s.paymentMethod),
      escapeCsv(s.status),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="storeflow-sales.csv"');
  return res.status(200).send(csvContent);
});

module.exports = {
  createSale,
  getSales,
  getSaleById,
  refundSale,
  exportSalesCsv,
  memorySales,
};
