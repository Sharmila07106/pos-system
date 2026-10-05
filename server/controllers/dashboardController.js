const asyncHandler = require('express-async-handler');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Today's boundaries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 1. Today's Revenue & Sales Count
  const todaySales = await Sale.aggregate([
    { $match: { createdAt: { $gte: today } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } }
  ]);
  
  const revenue = todaySales.length > 0 ? todaySales[0].revenue : 0;
  const salesCount = todaySales.length > 0 ? todaySales[0].count : 0;

  // 2. Low Stock Products Count
  // Find products where stock <= lowStockThreshold
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    isActive: true
  }).countDocuments();

  // 3. Last 7 Days Revenue (for Chart)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklySales = await Sale.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // Format weekly sales for charts
  const chartData = weeklySales.map(day => ({
    name: day._id,
    revenue: day.revenue
  }));

  res.json({
    success: true,
    data: {
      todayRevenue: revenue,
      todaySalesCount: salesCount,
      lowStockCount: lowStockProducts,
      chartData
    }
  });
});

module.exports = { getDashboardStats };
