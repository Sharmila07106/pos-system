const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const WasteRecord = require('../models/WasteRecord');
const { memoryProducts } = require('./productController');

// In-memory demo batches for resilient offline / non-MongoDB state
const now = Date.now();
const DAY = 24 * 3600 * 1000;

const memoryBatches = [
  {
    _id: 'batch_demo_milk_01',
    store: 'store_demo_freshmart',
    product: 'prod_demo_01', // Milk
    productName: 'Full Cream Milk 500ml',
    batchNumber: 'BAT-MLK-2026A',
    receivedQuantity: 50,
    remainingQuantity: 18,
    costPrice: 24,
    supplier: 'Aavin Dairy Ltd',
    receivedDate: new Date(now - 2 * DAY).toISOString(),
    expiryDate: new Date(now + 2 * DAY).toISOString(), // Expiring in 2 days!
    status: 'ACTIVE',
  },
  {
    _id: 'batch_demo_bread_01',
    store: 'store_demo_freshmart',
    product: 'prod_demo_02', // Bread
    productName: 'Farm Fresh Brown Bread',
    batchNumber: 'BAT-BRD-8821',
    receivedQuantity: 30,
    remainingQuantity: 8,
    costPrice: 28,
    supplier: 'Daily Bakehouse',
    receivedDate: new Date(now - 1 * DAY).toISOString(),
    expiryDate: new Date(now + 4 * DAY).toISOString(), // Expiring in 4 days!
    status: 'ACTIVE',
  },
  {
    _id: 'batch_demo_rice_01',
    store: 'store_demo_freshmart',
    product: 'prod_demo_03', // Rice
    productName: 'Ponni Boiled Rice 5kg',
    batchNumber: 'BAT-RCE-1009',
    receivedQuantity: 100,
    remainingQuantity: 65,
    costPrice: 280,
    supplier: 'Sri Murugan Traders',
    receivedDate: new Date(now - 10 * DAY).toISOString(),
    expiryDate: new Date(now + 180 * DAY).toISOString(),
    status: 'ACTIVE',
  },
  {
    _id: 'batch_demo_cola_01',
    store: 'store_demo_freshmart',
    product: 'prod_demo_04', // Cola
    productName: 'Sparkling Cola 500ml',
    batchNumber: 'BAT-COL-4091',
    receivedQuantity: 80,
    remainingQuantity: 42,
    costPrice: 30,
    supplier: 'Beverages Direct',
    receivedDate: new Date(now - 15 * DAY).toISOString(),
    expiryDate: new Date(now + 120 * DAY).toISOString(),
    status: 'ACTIVE',
  }
];

const memoryWaste = [
  {
    _id: 'wst_demo_01',
    store: 'store_demo_freshmart',
    product: 'prod_demo_01',
    productName: 'Full Cream Milk 500ml',
    batchNumber: 'BAT-MLK-OLD',
    quantity: 4,
    reason: 'EXPIRED',
    costImpact: 96,
    notes: 'Discarded after 48-hour shelf life expired',
    recordedByName: 'Karthik (Inventory)',
    createdAt: new Date(now - 3 * DAY).toISOString(),
  },
  {
    _id: 'wst_demo_02',
    store: 'store_demo_freshmart',
    product: 'prod_demo_02',
    productName: 'Farm Fresh Brown Bread',
    batchNumber: 'BAT-BRD-DAMAGED',
    quantity: 2,
    reason: 'DAMAGED',
    costImpact: 56,
    notes: 'Packaging crushed in transit during shelf replenishment',
    recordedByName: 'Sharmila (Store Owner)',
    createdAt: new Date(now - 1 * DAY).toISOString(),
  }
];

// Helper to determine expiry status
const computeBatchStatus = (batch) => {
  if (batch.remainingQuantity <= 0) return 'DEPLETED';
  const exp = new Date(batch.expiryDate).getTime();
  const diffDays = (exp - Date.now()) / DAY;
  if (diffDays <= 0) return 'EXPIRED';
  if (diffDays <= 7) return 'EXPIRING_SOON';
  return 'ACTIVE';
};

// @desc    Get all batches for a store
// @route   GET /api/inventory/batches
// @access  Private
const getBatches = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  const { productId, status } = req.query;

  if (mongoose.connection.readyState === 1) {
    try {
      let query = {};
      if (storeId && req.user?.role !== 'PLATFORM_ADMIN') query.store = storeId;
      if (productId) query.product = productId;

      const batches = await Batch.find(query)
        .populate('product', 'name barcode category price')
        .sort({ expiryDate: 1 });

      const enriched = batches.map((b) => {
        const obj = b.toObject();
        obj.computedStatus = computeBatchStatus(b);
        const daysToExpiry = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY);
        obj.daysToExpiry = daysToExpiry;
        return obj;
      });

      return res.json({
        success: true,
        count: enriched.length,
        data: enriched,
      });
    } catch (err) {
      console.warn('MongoDB getBatches fallback:', err.message);
    }
  }

  // Memory fallback
  let list = memoryBatches.map((b) => {
    const daysToExpiry = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / DAY);
    return {
      ...b,
      computedStatus: computeBatchStatus(b),
      daysToExpiry,
    };
  });

  if (productId) {
    list = list.filter((b) => b.product === productId);
  }
  if (status && status !== 'ALL') {
    list = list.filter((b) => b.computedStatus === status || b.status === status);
  }

  res.json({
    success: true,
    count: list.length,
    data: list,
  });
});

// @desc    Receive new batch of goods
// @route   POST /api/inventory/batches
// @access  Private (Store Owner, Admin, Inventory Manager)
const receiveBatch = asyncHandler(async (req, res) => {
  const { productId, batchNumber, receivedQuantity, costPrice, supplier, expiryDate } = req.body;
  const storeId = req.storeId || req.user?.store || 'store_demo_freshmart';
  const qty = Number(receivedQuantity);

  if (!productId || !batchNumber || !qty || qty <= 0 || !expiryDate) {
    res.status(400);
    throw new Error('Please provide productId, batchNumber, valid positive quantity, and expiryDate');
  }

  if (new Date(expiryDate).getTime() <= Date.now()) {
    res.status(400);
    throw new Error('Cannot receive an already expired batch! Expiry date must be in the future.');
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }

      const batch = await Batch.create({
        store: storeId,
        product: product._id,
        batchNumber: batchNumber.trim().toUpperCase(),
        receivedQuantity: qty,
        remainingQuantity: qty,
        costPrice: Number(costPrice) || 0,
        supplier: supplier || '',
        expiryDate: new Date(expiryDate),
        status: 'ACTIVE',
      });

      // Update product stock atomically
      const stockBefore = product.stock;
      product.stock += qty;
      await product.save();

      // Record Stock Movement
      await StockMovement.create({
        store: storeId,
        product: product._id,
        type: 'PURCHASE',
        quantityChange: qty,
        stockBefore,
        stockAfter: product.stock,
        reference: `Batch ${batch.batchNumber}`,
        performedBy: req.user?.name || 'Inventory Manager',
      });

      return res.status(201).json({
        success: true,
        message: `Batch ${batch.batchNumber} received successfully! Added ${qty} units to live stock.`,
        data: batch,
      });
    } catch (err) {
      console.warn('MongoDB receiveBatch fallback:', err.message);
    }
  }

  // Memory fallback
  const prod = memoryProducts.find((p) => p._id === productId);
  if (prod) {
    prod.stock = (prod.stock || 0) + qty;
  }

  const newBatch = {
    _id: `batch_${Date.now()}`,
    store: storeId,
    product: productId,
    productName: prod ? prod.name : 'Supermarket Item',
    batchNumber: batchNumber.trim().toUpperCase(),
    receivedQuantity: qty,
    remainingQuantity: qty,
    costPrice: Number(costPrice) || 0,
    supplier: supplier || 'Local Vendor',
    receivedDate: new Date().toISOString(),
    expiryDate: new Date(expiryDate).toISOString(),
    status: 'ACTIVE',
  };

  memoryBatches.unshift(newBatch);

  res.status(201).json({
    success: true,
    message: `Batch ${newBatch.batchNumber} received successfully! Added ${qty} units to live stock.`,
    data: newBatch,
  });
});

// @desc    Record food waste / damage / expiry
// @route   POST /api/inventory/waste
// @access  Private (Store Owner, Admin, Inventory Manager)
const recordWaste = asyncHandler(async (req, res) => {
  const { productId, batchId, quantity, reason, notes } = req.body;
  const storeId = req.storeId || req.user?.store || 'store_demo_freshmart';
  const qty = Number(quantity);

  if (!productId || !qty || qty <= 0 || !reason) {
    res.status(400);
    throw new Error('Please provide product, valid positive quantity, and waste reason');
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }

      let costPrice = product.price * 0.7; // default estimation if batch cost absent
      let batchNumber = '';

      if (batchId) {
        const batch = await Batch.findById(batchId);
        if (batch) {
          batchNumber = batch.batchNumber;
          if (batch.costPrice > 0) costPrice = batch.costPrice;
          batch.remainingQuantity = Math.max(0, batch.remainingQuantity - qty);
          if (batch.remainingQuantity === 0) batch.status = 'DEPLETED';
          await batch.save();
        }
      }

      const costImpact = Math.round(costPrice * qty * 100) / 100;

      // Update product stock
      const stockBefore = product.stock;
      product.stock = Math.max(0, product.stock - qty);
      await product.save();

      // Create Waste Record
      const waste = await WasteRecord.create({
        store: storeId,
        product: product._id,
        productName: product.name,
        batch: batchId || undefined,
        batchNumber,
        quantity: qty,
        reason,
        costImpact,
        notes: notes || '',
        recordedBy: req.user?._id || new mongoose.Types.ObjectId(),
        recordedByName: req.user?.name || 'Inventory Staff',
      });

      // Create Stock Movement
      await StockMovement.create({
        store: storeId,
        product: product._id,
        type: 'DAMAGE',
        quantityChange: -qty,
        stockBefore,
        stockAfter: product.stock,
        reference: `Waste: ${reason}`,
        performedBy: req.user?.name || 'Inventory Staff',
      });

      return res.status(201).json({
        success: true,
        message: `Waste recorded: ${qty} units removed. Cost impact: ₹${costImpact}`,
        data: waste,
      });
    } catch (err) {
      console.warn('MongoDB recordWaste fallback:', err.message);
    }
  }

  // Memory fallback
  const prod = memoryProducts.find((p) => p._id === productId);
  if (prod) {
    prod.stock = Math.max(0, (prod.stock || 0) - qty);
  }

  let batchNum = 'BAT-GEN';
  let unitCost = prod ? prod.price * 0.7 : 30;

  if (batchId) {
    const b = memoryBatches.find((item) => item._id === batchId);
    if (b) {
      batchNum = b.batchNumber;
      if (b.costPrice) unitCost = b.costPrice;
      b.remainingQuantity = Math.max(0, b.remainingQuantity - qty);
      if (b.remainingQuantity === 0) b.status = 'DEPLETED';
    }
  }

  const costImpact = Math.round(unitCost * qty * 100) / 100;

  const newWaste = {
    _id: `wst_${Date.now()}`,
    store: storeId,
    product: productId,
    productName: prod ? prod.name : 'Supermarket Item',
    batchNumber: batchNum,
    quantity: qty,
    reason,
    costImpact,
    notes: notes || '',
    recordedByName: req.user?.name || 'Inventory Staff',
    createdAt: new Date().toISOString(),
  };

  memoryWaste.unshift(newWaste);

  res.status(201).json({
    success: true,
    message: `Waste recorded: ${qty} units removed. Cost impact: ₹${costImpact}`,
    data: newWaste,
  });
});

// @desc    Get waste analytics and food-waste reduction metrics
// @route   GET /api/inventory/waste/analytics
// @access  Private
const getWasteAnalytics = asyncHandler(async (req, res) => {
  const storeId = req.storeId;

  let totalWasteCostMonth = 0;
  let totalWastedUnits = 0;
  let riskOfExpiryValue = 0;
  let riskBatchesCount = 0;
  let recentWaste = [];

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  if (mongoose.connection.readyState === 1) {
    try {
      let storeFilter = storeId && req.user?.role !== 'PLATFORM_ADMIN' ? { store: storeId } : {};

      // Sum of waste this month
      const wasteList = await WasteRecord.find({
        ...storeFilter,
        createdAt: { $gte: startOfMonth },
      }).sort({ createdAt: -1 });

      wasteList.forEach((w) => {
        totalWasteCostMonth += w.costImpact || 0;
        totalWastedUnits += w.quantity || 0;
      });

      recentWaste = await WasteRecord.find(storeFilter)
        .sort({ createdAt: -1 })
        .limit(10);

      // Value at risk of expiry (expiring in next 7 days)
      const nextWeek = new Date(Date.now() + 7 * DAY);
      const expiringBatches = await Batch.find({
        ...storeFilter,
        status: 'ACTIVE',
        remainingQuantity: { $gt: 0 },
        expiryDate: { $lte: nextWeek },
      });

      expiringBatches.forEach((b) => {
        riskBatchesCount++;
        riskOfExpiryValue += b.remainingQuantity * (b.costPrice || 25);
      });

      return res.json({
        success: true,
        data: {
          totalWasteCostMonth: Math.round(totalWasteCostMonth * 100) / 100,
          totalWastedUnits,
          riskOfExpiryValue: Math.round(riskOfExpiryValue * 100) / 100,
          riskBatchesCount,
          recentWaste,
        },
      });
    } catch (err) {
      console.warn('MongoDB getWasteAnalytics fallback:', err.message);
    }
  }

  // Memory fallback
  memoryWaste.forEach((w) => {
    totalWasteCostMonth += w.costImpact || 0;
    totalWastedUnits += w.quantity || 0;
  });

  memoryBatches.forEach((b) => {
    const days = (new Date(b.expiryDate).getTime() - Date.now()) / DAY;
    if (days >= 0 && days <= 7 && b.remainingQuantity > 0) {
      riskBatchesCount++;
      riskOfExpiryValue += b.remainingQuantity * (b.costPrice || 25);
    }
  });

  res.json({
    success: true,
    data: {
      totalWasteCostMonth: Math.round(totalWasteCostMonth * 100) / 100,
      totalWastedUnits,
      riskOfExpiryValue: Math.round(riskOfExpiryValue * 100) / 100,
      riskBatchesCount,
      recentWaste: memoryWaste.slice(0, 10),
    },
  });
});

// @desc    Get all stock movements (history)
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  let query = {};
  if (storeId && req.user?.role !== 'PLATFORM_ADMIN') query.store = storeId;

  if (mongoose.connection.readyState === 1) {
    try {
      const movements = await StockMovement.find(query)
        .populate('product', 'name barcode')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        data: movements,
      });
    } catch (err) {
      console.warn('MongoDB getStockMovements fallback:', err.message);
    }
  }

  res.json({
    success: true,
    data: [],
  });
});

// @desc    Add manual stock adjustment
// @route   POST /api/inventory/adjust
// @access  Private
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, type, quantityChange, reference } = req.body;
  const storeId = req.storeId || req.user?.store;

  if (!productId || !type || !quantityChange) {
    res.status(400);
    throw new Error('Please provide product, type, and quantity');
  }

  if (mongoose.connection.readyState === 1) {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const stockBefore = product.stock;
    const change = Number(quantityChange);

    if (type === 'ADJUSTMENT' && stockBefore + change < 0) {
      res.status(400);
      throw new Error('Adjustment cannot result in negative stock');
    }

    const stockAfter = stockBefore + change;
    product.stock = stockAfter;
    await product.save();

    const movement = await StockMovement.create({
      store: storeId,
      product: productId,
      type,
      quantityChange: change,
      stockBefore,
      stockAfter,
      reference: reference || 'Manual Adjustment',
      performedBy: req.user?.name || 'Admin',
    });

    return res.status(201).json({
      success: true,
      data: movement,
    });
  }

  // Memory fallback
  const prod = memoryProducts.find((p) => p._id === productId);
  if (prod) {
    prod.stock = Math.max(0, (prod.stock || 0) + Number(quantityChange));
  }

  res.status(201).json({
    success: true,
    data: { productId, type, quantityChange, reference },
  });
});

module.exports = {
  getStockMovements,
  adjustStock,
  getBatches,
  receiveBatch,
  recordWaste,
  getWasteAnalytics,
  memoryBatches,
  memoryWaste,
};
