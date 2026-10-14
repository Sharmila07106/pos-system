const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Get dashboard statistics for current supermarket store
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Role guard: Only store admins / owners can access financial dashboard
  const userRole = (req.user?.role || '').toLowerCase();
  if (userRole === 'cashier') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Cashiers cannot view store revenue or financial dashboard.',
    });
  }
  if (userRole === 'inventory_manager') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Inventory managers cannot view store revenue or financial dashboard.',
    });
  }

  const storeId = req.storeId
    ? mongoose.Types.ObjectId.isValid(req.storeId)
      ? new mongoose.Types.ObjectId(req.storeId)
      : req.storeId
    : null;

  const isPlatformAdmin =
    req.user?.role === 'PLATFORM_SUPER_ADMIN' ||
    req.user?.role === 'PLATFORM_ADMIN' ||
    req.user?.isPlatformAdmin;

  if (!storeId && !isPlatformAdmin) {
    return res.json({
      success: true,
      data: {
        todayRevenue: 0,
        todaySalesCount: 0,
        itemsSold: 0,
        totalProducts: 0,
        lowStockCount: 0,
        stockValue: 0,
        chartData: [],
      },
    });
  }

  // Today's boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const saleMatch = { createdAt: { $gte: today }, status: 'COMPLETED' };
  if (storeId) saleMatch.store = storeId;

  // 1. Today's Revenue, Bills/Sales Count & Items Sold
  const todaySales = await Sale.aggregate([
    { $match: saleMatch },
    { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);

  const todayItemsAgg = await Sale.aggregate([
    { $match: saleMatch },
    { $unwind: '$items' },
    { $group: { _id: null, itemsSold: { $sum: '$items.quantity' } } },
  ]);

  const revenue = todaySales.length > 0 ? todaySales[0].revenue : 0;
  const salesCount = todaySales.length > 0 ? todaySales[0].count : 0;
  const itemsSold = todayItemsAgg.length > 0 ? todayItemsAgg[0].itemsSold : 0;

  // 2. Total Products Count & Low Stock Count & Stock Value
  const totalProductsMatch = { isActive: true };
  if (storeId) totalProductsMatch.store = storeId;
  const totalProducts = await Product.countDocuments(totalProductsMatch);

  const productMatch = {
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    isActive: true,
  };
  if (storeId) productMatch.store = storeId;

  const lowStockProducts = await Product.countDocuments(productMatch);

  const stockValueAgg = await Product.aggregate([
    { $match: totalProductsMatch },
    {
      $group: {
        _id: null,
        totalStockValue: {
          $sum: {
            $multiply: ['$stock', { $ifNull: ['$costPrice', '$price'] }],
          },
        },
      },
    },
  ]);
  const stockValue = stockValueAgg.length > 0 ? stockValueAgg[0].totalStockValue : 0;

  // 3. Last 7 Days Revenue (for Chart)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyMatch = { createdAt: { $gte: sevenDaysAgo }, status: 'COMPLETED' };
  if (storeId) weeklyMatch.store = storeId;

  const weeklySales = await Sale.aggregate([
    { $match: weeklyMatch },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const chartData = weeklySales.map((day) => ({
    name: day._id,
    revenue: day.revenue,
  }));

  return res.json({
    success: true,
    data: {
      todayRevenue: revenue,
      todaySalesCount: salesCount,
      itemsSold,
      totalProducts,
      lowStockCount: lowStockProducts,
      stockValue,
      chartData,
    },
  });
});

module.exports = { getDashboardStats };
