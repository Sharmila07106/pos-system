const asyncHandler = require('express-async-handler');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');

// @desc    Get all stock movements (history)
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = asyncHandler(async (req, res) => {
  const movements = await StockMovement.find()
    .populate('product', 'name barcode')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: movements
  });
});

// @desc    Add manual stock adjustment
// @route   POST /api/inventory/adjust
// @access  Private
const adjustStock = asyncHandler(async (req, res) => {
  const { productId, type, quantityChange, reference } = req.body;

  if (!productId || !type || !quantityChange) {
    res.status(400);
    throw new Error('Please provide product, type, and quantity');
  }

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
    product: productId,
    type,
    quantityChange: change,
    stockBefore,
    stockAfter,
    reference: reference || 'Manual Adjustment',
    performedBy: req.user?.name || 'Admin'
  });

  res.status(201).json({
    success: true,
    data: movement
  });
});

module.exports = { getStockMovements, adjustStock };
