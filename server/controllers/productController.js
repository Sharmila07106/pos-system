const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { products: seedProductsList } = require('../utils/seedProducts');

// In-memory product storage fallback when MongoDB connection is inactive
const memoryProducts = seedProductsList.map((p, idx) => ({
  _id: `prod_${idx + 1}`,
  name: p.name,
  barcode: p.barcode,
  category: p.category,
  price: p.price,
  stock: p.stock,
  lowStockThreshold: p.lowStockThreshold || 5,
  image: p.image || '',
  isActive: p.isActive !== false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, activeOnly, page = 1, limit = 50 } = req.query;

  if (mongoose.connection.readyState === 1) {
    try {
      let query = {};
      
      if (req.user && req.user.role === 'CASHIER') {
        query.isActive = true;
      } else if (activeOnly === 'true') {
        query.isActive = true;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ];
      }

      if (category && category !== 'All') {
        query.category = category;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      return res.json({
        success: true,
        count: products.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        data: products
      });
    } catch (err) {
      console.warn('MongoDB query fallback to memory products:', err.message);
    }
  }

  // Resilient memory products fallback
  let list = memoryProducts.filter(p => {
    if ((req.user && req.user.role === 'CASHIER') || activeOnly === 'true') {
      if (!p.isActive) return false;
    }
    if (category && category !== 'All') {
      if (p.category.toLowerCase() !== category.toLowerCase()) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      if (!matchName && !matchBarcode) return false;
    }
    return true;
  });

  const total = list.length;
  const skip = (Number(page) - 1) * Number(limit);
  const paged = list.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    count: paged.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
    data: paged
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const product = await Product.findById(req.params.id);
      if (product) return res.json({ success: true, data: product });
    } catch (err) {
      console.warn('MongoDB getProductById fallback:', err.message);
    }
  }

  const product = memoryProducts.find(p => p._id === req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

// @desc    Get product by barcode
// @route   GET /api/products/barcode/:barcode
// @access  Private
const getProductByBarcode = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const product = await Product.findOne({ barcode: req.params.barcode, isActive: true });
      if (product) return res.json({ success: true, data: product });
    } catch (err) {
      console.warn('MongoDB getProductByBarcode fallback:', err.message);
    }
  }

  const product = memoryProducts.find(p => p.barcode === req.params.barcode && p.isActive);
  if (!product) {
    res.status(404);
    throw new Error('Product not found or inactive');
  }
  res.json({ success: true, data: product });
});

// @desc    Get all categories
// @route   GET /api/products/categories/all
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const categories = await Product.distinct('category', { isActive: true });
      return res.json({ success: true, data: categories });
    } catch (err) {
      console.warn('MongoDB getCategories fallback:', err.message);
    }
  }

  const categories = Array.from(new Set(memoryProducts.filter(p => p.isActive).map(p => p.category)));
  res.json({ success: true, data: categories });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, barcode, category, price, stock, lowStockThreshold, image } = req.body;
  
  const productExists = await Product.findOne({ barcode });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this barcode already exists');
  }

  const product = await Product.create({
    name, barcode, category, price, stock, lowStockThreshold, image
  });

  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (req.body.barcode && req.body.barcode !== product.barcode) {
    const barcodeExists = await Product.findOne({ barcode: req.body.barcode });
    if (barcodeExists) {
      res.status(400);
      throw new Error('Barcode already in use by another product');
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({ success: true, data: updatedProduct });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Ideally, check if product has sales. If yes, soft delete (isActive = false).
  // For now, we'll do a soft delete to be safe for inventory history.
  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product deactivated (soft deleted)' });
});

// @desc    Upload product image
// @route   POST /api/products/upload-image
// @access  Private/Admin
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, data: imageUrl });
});

module.exports = {
  getProducts,
  getProductById,
  getProductByBarcode,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  memoryProducts
};
