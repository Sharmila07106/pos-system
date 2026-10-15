const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Helper to extract MongoDB image document ID from imageUrl string (/api/images/<id>)
function extractImageId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/api\/images\/([a-fA-F0-9]{24})/);
  return match ? match[1] : null;
}

// Empty memory fallback for backward compatibility
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

  const body = req.body || {};
  const name = body.name ? body.name.trim() : '';
  const barcode = body.barcode ? body.barcode.trim() : '';
  const category = body.category ? body.category.trim() : 'General';
  const price = body.price !== undefined ? Number(body.price) : 0;
  const stock = body.stock !== undefined ? Number(body.stock) : 0;
  const lowStockThreshold = body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : 5;
  const supplier = body.supplier ? body.supplier.trim() : '';
  const expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
  const sku = body.sku ? body.sku.trim() : '';
  const costPrice = body.costPrice !== undefined ? Number(body.costPrice) : 0;
  
  if (!name) {
    res.status(400);
    throw new Error('Product name is required');
  }

  if (!barcode) {
    res.status(400);
    throw new Error('Barcode is required');
  }

  const productExists = await Product.findOne({
    store: storeId,
    barcode,
  });

  if (productExists) {
    res.status(400);
    throw new Error('Product with this barcode already exists in your supermarket');
  }

  let resolvedImage = body.imageUrl || body.image || '';

  // Store uploaded image directly in MongoDB
  if (req.file) {
    const imageDoc = await ProductImage.create({
      store: storeId,
      filename: req.file.originalname || `${barcode}.jpg`,
      contentType: req.file.mimetype || 'image/jpeg',
      size: req.file.size || req.file.buffer.length,
      data: req.file.buffer,
    });
    resolvedImage = `/api/images/${imageDoc._id}`;
  }

  const product = await Product.create({
    store: storeId,
    name,
    barcode,
    category,
    price,
    stock,
    lowStockThreshold,
    supplier,
    expiryDate,
    sku,
    costPrice,
    image: resolvedImage,
    imageUrl: resolvedImage,
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

  const body = req.body || {};
  if (body.barcode && body.barcode.trim() !== product.barcode) {
    const barcodeExists = await Product.findOne({
      store: product.store,
      barcode: body.barcode.trim(),
      _id: { $ne: product._id },
    });
    if (barcodeExists) {
      res.status(400);
      throw new Error('Barcode already in use by another product in this supermarket');
    }
  }

  const updateData = { ...body };

  // Handle image replacement in MongoDB
  if (req.file) {
    const oldImgId = extractImageId(product.imageUrl || product.image);
    if (oldImgId) {
      await ProductImage.findByIdAndDelete(oldImgId).catch(() => {});
    }

    const imageDoc = await ProductImage.create({
      store: product.store,
      product: product._id,
      filename: req.file.originalname || `${product.barcode}.jpg`,
      contentType: req.file.mimetype || 'image/jpeg',
      size: req.file.size || req.file.buffer.length,
      data: req.file.buffer,
    });

    const newUrl = `/api/images/${imageDoc._id}`;
    updateData.image = newUrl;
    updateData.imageUrl = newUrl;
  } else if (body.imageUrl !== undefined) {
    const oldImgId = extractImageId(product.imageUrl || product.image);
    const newImgId = extractImageId(body.imageUrl);
    if (oldImgId && oldImgId !== newImgId) {
      await ProductImage.findByIdAndDelete(oldImgId).catch(() => {});
    }
    updateData.imageUrl = body.imageUrl;
    updateData.image = body.imageUrl;
  } else if (body.image !== undefined) {
    const oldImgId = extractImageId(product.imageUrl || product.image);
    const newImgId = extractImageId(body.image);
    if (oldImgId && oldImgId !== newImgId) {
      await ProductImage.findByIdAndDelete(oldImgId).catch(() => {});
    }
    updateData.imageUrl = body.image;
    updateData.image = body.image;
  }

  if (updateData.price !== undefined) updateData.price = Number(updateData.price);
  if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
  if (updateData.lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(updateData.lowStockThreshold);
  if (updateData.costPrice !== undefined) updateData.costPrice = Number(updateData.costPrice);

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return res.json({ success: true, data: updatedProduct });
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const role = (req.user?.role || '').toLowerCase();
  if (role === 'cashier') {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to do this",
    });
  }

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

  // Clean up any MongoDB image associated with this product
  const imgId = extractImageId(product.imageUrl || product.image);
  if (imgId) {
    await ProductImage.findByIdAndDelete(imgId).catch(() => {});
  }

  product.isActive = false;
  await product.save();

  return res.json({ success: true, message: 'Product deactivated successfully' });
});

// @desc    Upload product image directly into MongoDB
// @route   POST /api/products/upload-image
// @access  Private/Admin
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  const imageDoc = await ProductImage.create({
    store: req.storeId || null,
    filename: req.file.originalname || `upload-${Date.now()}.jpg`,
    contentType: req.file.mimetype || 'image/jpeg',
    size: req.file.size || req.file.buffer.length,
    data: req.file.buffer,
  });

  const imageUrl = `/api/images/${imageDoc._id}`;
  return res.json({
    success: true,
    imageUrl,
    data: imageUrl,
  });
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
