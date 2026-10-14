const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Empty memory fallback for tests / backward compatibility
const memoryProducts = [];

// @desc    Get all products for the current supermarket store
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { search, category, activeOnly, page = 1, limit = 50 } = req.query;

  const storeId = req.storeId;
  const isPlatformAdmin = req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin);

  if (!isPlatformAdmin && !storeId) {
    return res.json({
      success: true,
      count: 0,
      total: 0,
      page: Number(page),
      pages: 0,
      data: [],
    });
  }

  let query = {};
  if (!isPlatformAdmin) {
    query.store = storeId;
  }

  if (req.user && req.user.role === 'CASHIER') {
    query.isActive = true;
  } else if (activeOnly === 'true') {
    query.isActive = true;
  }

  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { barcode: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 50);
  const skip = (pageNum - 1) * limitNum;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return res.json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: products,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const isPlatformAdmin = req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin);
  if (!isPlatformAdmin && product.store?.toString() !== req.storeId) {
    res.status(403);
    throw new Error('Unauthorized access to product from another store');
  }

  return res.json({ success: true, data: product });
});

// @desc    Get product by barcode (scoped to store)
// @route   GET /api/products/barcode/:barcode
// @access  Private
const getProductByBarcode = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Store context required to scan barcode');
  }

  const product = await Product.findOne({
    barcode: req.params.barcode.trim(),
    store: storeId,
    isActive: true,
  });

  if (!product) {
    res.status(404);
    throw new Error('Product not found or inactive in this supermarket');
  }

  return res.json({ success: true, data: product });
});

// @desc    Get all distinct categories for store
// @route   GET /api/products/categories/all
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  const query = { isActive: true };
  if (storeId) {
    query.store = storeId;
  }

  const categories = await Product.distinct('category', query);
  return res.json({ success: true, data: categories });
});

// @desc    Create product in current store
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const storeId = req.storeId;
  if (!storeId) {
    res.status(403);
    throw new Error('Store context required to create product');
  }

  const {
    name,
    barcode,
    category,
    price,
    stock,
    lowStockThreshold,
    image,
    supplier,
    expiryDate,
    sku,
    costPrice,
  } = req.body;

  const productExists = await Product.findOne({
    store: storeId,
    barcode: barcode.trim(),
  });

  if (productExists) {
    res.status(400);
    throw new Error('Product with this barcode already exists in your supermarket');
  }

  const product = await Product.create({
    store: storeId,
    name: name.trim(),
    barcode: barcode.trim(),
    category: category.trim(),
    price,
    stock: stock || 0,
    lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 5,
    supplier: supplier ? supplier.trim() : '',
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    sku: sku ? sku.trim() : '',
    costPrice: costPrice !== undefined ? Number(costPrice) : 0,
    image: image || '',
  });

  return res.status(201).json({ success: true, data: product });
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

  const isPlatformAdmin = req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin);
  if (!isPlatformAdmin && product.store?.toString() !== req.storeId) {
    res.status(403);
    throw new Error('Unauthorized access to product from another store');
  }

  if (req.body.barcode && req.body.barcode.trim() !== product.barcode) {
    const barcodeExists = await Product.findOne({
      store: product.store,
      barcode: req.body.barcode.trim(),
      _id: { $ne: product._id },
    });
    if (barcodeExists) {
      res.status(400);
      throw new Error('Barcode already in use by another product in this supermarket');
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  return res.json({ success: true, data: updatedProduct });
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const isPlatformAdmin = req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin);
  if (!isPlatformAdmin && product.store?.toString() !== req.storeId) {
    res.status(403);
    throw new Error('Unauthorized access to product from another store');
  }

  product.isActive = false;
  await product.save();

  return res.json({ success: true, message: 'Product deactivated successfully' });
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
  return res.json({ success: true, data: imageUrl });
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
  memoryProducts,
};
