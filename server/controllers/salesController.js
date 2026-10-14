const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');
const Batch = require('../models/Batch');

const memorySales = [];

// Helper to generate sequential transaction ID per store
const generateTxnId = async (storeId) => {
  const count = await Sale.countDocuments({ store: storeId });
  return `TXN-${String(count + 1).padStart(5, '0')}`;
};

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

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  const validMethods = ['CASH', 'CARD', 'UPI'];
  if (!validMethods.includes(paymentMethod)) {
    res.status(400);
    throw new Error(`Payment method must be one of: ${validMethods.join(', ')}`);
  }

  const txnId = await generateTxnId(storeId);
  let subtotal = 0;
  const processedItems = [];
  const stockMovements = [];

  // Deduct inventory sequentially
  for (const item of items) {
    const product = await Product.findOne({
      _id: item._id || item.product,
      store: storeId,
      isActive: true,
    });

    if (!product) {
      res.status(400);
      throw new Error(`Product not found or inactive in this supermarket: ${item.name || item.barcode}`);
    }

    if (product.stock < item.qty) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.qty}`);
    }

    // Atomic update on product stock
    const stockBefore = product.stock;
    product.stock -= item.qty;
    await product.save();
    const stockAfter = product.stock;

    const itemTotal = product.price * item.qty;
    subtotal += itemTotal;

    processedItems.push({
      product: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: item.qty,
      price: product.price,
      total: itemTotal,
    });

    stockMovements.push({
      store: storeId,
      product: product._id,
      type: 'SALE',
      quantityChange: -item.qty,
      stockBefore,
      stockAfter,
      reference: txnId,
      performedByUser: req.user._id,
      performedBy: req.user.name || 'Cashier',
    });

    // FEFO Batch Depletion for products with batch tracking
    try {
      const batches = await Batch.find({
        store: storeId,
        product: product._id,
        remainingQuantity: { $gt: 0 },
        status: 'ACTIVE',
      }).sort({ expiryDate: 1 });

      let qtyToDeduct = item.qty;
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

  // Fetch store tax settings
  let taxRate = 5;
  const storeSettings = await Settings.findOne({ store: storeId });
  if (storeSettings && storeSettings.taxRatePercent !== undefined) {
    taxRate = storeSettings.taxRatePercent;
  }

  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const finalTotal = Math.max(0, subtotal + tax - (Number(discount) || 0));
  const received = Number(amountReceived) || finalTotal;
  const change = Math.max(0, received - finalTotal);

  // Save Sale record
  const sale = await Sale.create({
    store: storeId,
    transactionId: txnId,
    receiptNo: txnId,
    items: processedItems,
    subtotal,
    tax,
    taxRate,
    discount: Number(discount) || 0,
    total: finalTotal,
    paymentMethod,
    amountReceived: received,
    changeGiven: change,
    status: 'COMPLETED',
    cashierUser: req.user._id,
    cashierName: req.user.name || 'Cashier',
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

  const { search, page = 1, limit = 20, startDate, endDate, status } = req.query;
  const query = { store: storeId };

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (search && search.trim()) {
    query.transactionId = { $regex: search.trim(), $options: 'i' };
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

  return res.json({
    success: true,
    count: sales.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
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

  const sale = await Sale.findById(req.params.id)
    .populate('items.product', 'name barcode image')
    .populate('cashierUser', 'name email');

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
        performedBy: req.user.name || 'Admin',
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

module.exports = {
  createSale,
  getSales,
  getSaleById,
  refundSale,
  memorySales,
};
