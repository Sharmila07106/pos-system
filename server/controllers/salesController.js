const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');

// In-memory sales fallback
const memorySales = [];
const { memoryProducts } = require('./productController');

// Helper to generate transaction ID
const generateTxnId = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const count = await Sale.countDocuments();
      return `TXN-${String(count + 1).padStart(5, '0')}`;
    } catch (err) {
      console.warn('MongoDB generateTxnId fallback:', err.message);
    }
  }
  return `TXN-${String(memorySales.length + 1).padStart(5, '0')}`;
};

// @desc    Create a new sale (checkout)
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
  const { items, discount, paymentMethod, amountReceived } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in cart');
  }

  // If MongoDB is connected and replica/transactions available
  if (mongoose.connection.readyState === 1) {
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      let subtotal = 0;
      const processedItems = [];
      const stockMovements = [];
      const txnId = await generateTxnId();

      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          { 
            _id: item._id, 
            isActive: true, 
            stock: { $gte: item.qty }
          },
          { $inc: { stock: -item.qty } },
          { new: true, session }
        );

        if (!product) {
          throw new Error(`Insufficient stock or invalid product for: ${item.name}`);
        }

        const itemTotal = product.price * item.qty;
        subtotal += itemTotal;

        processedItems.push({
          product: product._id,
          name: product.name,
          barcode: product.barcode,
          quantity: item.qty,
          price: product.price,
          total: itemTotal
        });

        stockMovements.push({
          product: product._id,
          type: 'SALE',
          quantityChange: -item.qty,
          stockBefore: product.stock + item.qty,
          stockAfter: product.stock,
          reference: txnId,
          performedBy: req.user?.name || 'Admin'
        });
      }

      let settings = await Settings.findOne({}).session(session);
      if (!settings) settings = { taxRatePercent: 5 };

      const tax = subtotal * (settings.taxRatePercent / 100);
      const validDiscount = Math.min(Number(discount) || 0, subtotal);
      const total = subtotal + tax - validDiscount;

      if (paymentMethod === 'CASH' && (Number(amountReceived) || 0) < total) {
        throw new Error('Amount received is less than total');
      }

      const changeGiven = paymentMethod === 'CASH' ? (Number(amountReceived) - total) : 0;

      const sale = new Sale({
        transactionId: txnId,
        items: processedItems,
        subtotal,
        tax,
        taxRate: settings.taxRatePercent,
        discount: validDiscount,
        total,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : total,
        changeGiven,
        cashier: req.user?._id || 'Admin',
        cashierName: req.user?.name || 'Admin'
      });

      await sale.save({ session });
      await StockMovement.insertMany(stockMovements, { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        data: sale
      });
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
          session.endSession();
        } catch (e) {}
      }
      console.warn('MongoDB sale failed or disconnected, falling back to memory checkout:', error.message);
    }
  }

  // Resilient memory sale processing
  let subtotal = 0;
  const processedItems = [];
  const txnId = await generateTxnId();

  for (const item of items) {
    const product = memoryProducts.find(p => p._id === item._id || p.barcode === item.barcode);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.name}`);
    }
    if (product.stock < item.qty) {
      res.status(400);
      throw new Error(`Insufficient stock for: ${item.name} (Available: ${product.stock})`);
    }

    product.stock -= item.qty;
    const itemTotal = product.price * item.qty;
    subtotal += itemTotal;

    processedItems.push({
      _id: product._id,
      product: product._id,
      name: product.name,
      barcode: product.barcode,
      quantity: item.qty,
      price: product.price,
      total: itemTotal
    });
  }

  const tax = subtotal * 0.05;
  const validDiscount = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal + tax - validDiscount;

  if (paymentMethod === 'CASH' && (Number(amountReceived) || 0) < total) {
    res.status(400);
    throw new Error('Amount received is less than total');
  }

  const changeGiven = paymentMethod === 'CASH' ? (Number(amountReceived) - total) : 0;

  const saleRecord = {
    _id: `sale_${Date.now()}`,
    transactionId: txnId,
    items: processedItems,
    subtotal,
    tax,
    taxRate: 5,
    discount: validDiscount,
    total,
    paymentMethod,
    amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : total,
    changeGiven: Math.max(0, changeGiven),
    cashierName: req.user?.name || 'Sharmila',
    createdAt: new Date().toISOString()
  };

  memorySales.unshift(saleRecord);

  res.status(201).json({
    success: true,
    data: saleRecord
  });
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const sales = await Sale.find().sort({ createdAt: -1 });
      return res.json({ success: true, data: sales });
    } catch (err) {
      console.warn('MongoDB getSales fallback:', err.message);
    }
  }
  res.json({
    success: true,
    data: memorySales
  });
});

module.exports = { createSale, getSales };
