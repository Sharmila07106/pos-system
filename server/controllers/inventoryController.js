const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const WasteRecord = require('../models/WasteRecord');

// Export empty arrays for backward compatibility if any legacy code imports them
const memoryBatches = [];
const memoryWaste = [];

// @desc    Get all batches for store (with filters)
// @route   GET /api/inventory/batches
// @access  Private
const getBatches = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
    return res.json({ success: true, count: 0, data: [] });
  }

  const { product, status, expiringDays } = req.query;
  const filter = {};
  if (req.user.role !== 'PLATFORM_ADMIN') {
    filter.store = storeId;
  }

  if (product) filter.product = product;
  if (status && status !== 'ALL') filter.status = status;

  if (expiringDays) {
    const cutoff = new Date(Date.now() + Number(expiringDays) * 24 * 3600 * 1000);
    filter.expiryDate = { $lte: cutoff };
    filter.status = 'ACTIVE';
    filter.remainingQuantity = { $gt: 0 };
  }

  const batches = await Batch.find(filter)
    .populate('product', 'name barcode category price')
    .sort({ expiryDate: 1 });

  return res.json({
    success: true,
    count: batches.length,
    data: batches,
  });
});

// @desc    Receive a new inventory batch
// @route   POST /api/inventory/batches
// @access  Private
const receiveBatch = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Supermarket store context required');
  }

  const { productId, batchNumber, receivedQuantity, costPrice, supplier, expiryDate } = req.body;

  if (!productId || !batchNumber || !receivedQuantity || !expiryDate) {
    res.status(400);
    throw new Error('Product, batch number, received quantity, and expiry date are required');
  }

  const qty = Number(receivedQuantity);
  if (qty <= 0) {
    res.status(400);
    throw new Error('Received quantity must be greater than zero');
  }

  const product = await Product.findOne({ _id: productId, store: storeId });
  if (!product) {
    res.status(404);
    throw new Error('Product not found in this supermarket');
  }

  const batch = await Batch.create({
    store: storeId,
    product: product._id,
    batchNumber: batchNumber.trim().toUpperCase(),
    receivedQuantity: qty,
    remainingQuantity: qty,
    costPrice: Number(costPrice) || 0,
    supplier: supplier ? supplier.trim() : '',
    expiryDate: new Date(expiryDate),
    status: 'ACTIVE',
  });

  // Update product stock
  const stockBefore = product.stock;
  product.stock += qty;
  await product.save();
  const stockAfter = product.stock;

  // Record StockMovement
  await StockMovement.create({
    store: storeId,
    product: product._id,
    batch: batch._id,
    type: 'RESTOCK',
    quantityChange: qty,
    stockBefore,
    stockAfter,
    reference: `BATCH-${batch.batchNumber}`,
    performedByUser: req.user._id,
    performedBy: req.user.name || 'Staff',
  }).catch(() => {});

  return res.status(201).json({
    success: true,
    message: `Batch ${batch.batchNumber} received. Stock updated for ${product.name}.`,
    data: batch,
  });
});

// @desc    Record product waste / spoilage / expiry loss
// @route   POST /api/inventory/waste
// @access  Private
const recordWaste = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Supermarket store context required');
  }

  const { productId, batchId, quantity, reason, notes } = req.body;

  if (!productId || !quantity || !reason) {
    res.status(400);
    throw new Error('Product, wasted quantity, and reason are required');
  }

  const qty = Number(quantity);
  if (qty <= 0) {
    res.status(400);
    throw new Error('Wasted quantity must be greater than zero');
  }

  const product = await Product.findOne({ _id: productId, store: storeId });
  if (!product) {
    res.status(404);
    throw new Error('Product not found in this supermarket');
  }

  if (product.stock < qty) {
    res.status(400);
    throw new Error(`Cannot waste more than available stock (${product.stock})`);
  }

  let batchNumber = '';
  if (batchId) {
    const batch = await Batch.findOne({ _id: batchId, store: storeId });
    if (batch) {
      batchNumber = batch.batchNumber;
      batch.remainingQuantity = Math.max(0, batch.remainingQuantity - qty);
      if (batch.remainingQuantity === 0) batch.status = 'DEPLETED';
      await batch.save();
    }
  }

  const costImpact = Number((qty * (product.costPrice || product.price * 0.7)).toFixed(2));

  const waste = await WasteRecord.create({
    store: storeId,
    product: product._id,
    productName: product.name,
    batch: batchId || null,
    batchNumber,
    quantity: qty,
    reason,
    costImpact,
    notes: notes ? notes.trim() : '',
    recordedBy: req.user._id,
    recordedByName: req.user.name || 'Staff',
  });

  // Deduct product stock
  const stockBefore = product.stock;
  product.stock -= qty;
  await product.save();
  const stockAfter = product.stock;

  // Record StockMovement
  await StockMovement.create({
    store: storeId,
    product: product._id,
    batch: batchId || null,
    type: 'WASTE',
    quantityChange: -qty,
    stockBefore,
    stockAfter,
    reference: `WASTE-${reason}`,
    performedByUser: req.user._id,
    performedBy: req.user.name || 'Staff',
  }).catch(() => {});

  return res.status(201).json({
    success: true,
    message: `Waste recorded for ${product.name} (-${qty} units)`,
    data: waste,
  });
});

// @desc    Get waste history for store
// @route   GET /api/inventory/waste
// @access  Private
const getWasteRecords = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
    return res.json({ success: true, count: 0, data: [] });
  }

  const filter = {};
  if (req.user.role !== 'PLATFORM_ADMIN') {
    filter.store = storeId;
  }

  const wasteList = await WasteRecord.find(filter)
    .populate('product', 'name barcode category')
    .sort({ createdAt: -1 });

  return res.json({
    success: true,
    count: wasteList.length,
    data: wasteList,
  });
});

// @desc    Get stock movements audit log
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
    return res.json({ success: true, count: 0, data: [] });
  }

  const { type, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (req.user.role !== 'PLATFORM_ADMIN') {
    filter.store = storeId;
  }

  if (type && type !== 'ALL') {
    filter.type = type;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const total = await StockMovement.countDocuments(filter);
  const movements = await StockMovement.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('product', 'name barcode category')
    .populate('performedByUser', 'name email');

  return res.json({
    success: true,
    count: movements.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: movements,
  });
});

// @desc    Perform manual stock adjustment
// @route   POST /api/inventory/adjust
// @access  Private (Store Owner / Inventory Manager Only)
const adjustStock = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Supermarket store context required');
  }

  const { productId, newStock, reason } = req.body;

  if (!productId || newStock === undefined || !reason) {
    res.status(400);
    throw new Error('Product ID, new stock level, and adjustment reason are required');
  }

  const nextStock = Number(newStock);
  if (nextStock < 0) {
    res.status(400);
    throw new Error('Stock quantity cannot be negative');
  }

  const product = await Product.findOne({ _id: productId, store: storeId });
  if (!product) {
    res.status(404);
    throw new Error('Product not found in this supermarket');
  }

  const stockBefore = product.stock;
  const change = nextStock - stockBefore;
  product.stock = nextStock;
  await product.save();

  await StockMovement.create({
    store: storeId,
    product: product._id,
    type: 'ADJUSTMENT',
    quantityChange: change,
    stockBefore,
    stockAfter: nextStock,
    reference: `ADJUST: ${reason}`,
    performedByUser: req.user._id,
    performedBy: req.user.name || 'Staff',
  }).catch(() => {});

  return res.json({
    success: true,
    message: `Stock for ${product.name} adjusted from ${stockBefore} to ${nextStock}`,
    data: product,
  });
});

// @desc    Get expiry alerts summary
// @route   GET /api/inventory/expiry-alerts
// @access  Private
const getExpiryAlerts = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
    return res.json({ success: true, count: 0, data: [] });
  }

  const { days = 7 } = req.query;
  const threshold = new Date(Date.now() + Number(days) * 24 * 3600 * 1000);

  const filter = {
    expiryDate: { $lte: threshold },
    remainingQuantity: { $gt: 0 },
    status: 'ACTIVE',
  };

  if (req.user.role !== 'PLATFORM_ADMIN') {
    filter.store = storeId;
  }

  const alerts = await Batch.find(filter)
    .populate('product', 'name barcode category price')
    .sort({ expiryDate: 1 });

  return res.json({
    success: true,
    count: alerts.length,
    data: alerts,
  });
});

module.exports = {
  getBatches,
  receiveBatch,
  recordWaste,
  getWasteRecords,
  getStockMovements,
  adjustStock,
  getExpiryAlerts,
  memoryBatches,
  memoryWaste,
};
