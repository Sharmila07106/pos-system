const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Settings = require('../models/Settings');

// Helper to generate transaction ID
const generateTxnId = async () => {
  const count = await Sale.countDocuments();
  return `TXN-${String(count + 1).padStart(5, '0')}`;
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

  // Use session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    const processedItems = [];
    const stockMovements = [];
    const txnId = await generateTxnId();

    for (const item of items) {
      // Find product and atomically check/deduct stock
      const product = await Product.findOneAndUpdate(
        { 
          _id: item._id, 
          isActive: true, 
          stock: { $gte: item.qty } // Atomic check: ensure enough stock
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

      // Record stock movement
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

    // Load settings for tax
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
      amountReceived: paymentMethod === 'CASH' ? amountReceived : total,
      changeGiven,
      cashier: req.user?._id || 'Admin',
      cashierName: req.user?.name || 'Admin'
    });

    await sale.save({ session });
    await StockMovement.insertMany(stockMovements, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: sale
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400);
    throw new Error(error.message || 'Sale failed');
  }
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    data: sales
  });
});

module.exports = { createSale, getSales };
