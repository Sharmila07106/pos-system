const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  refundSale,
  exportSalesCsv,
  getDailyClosingReport,
} = require('../controllers/salesController');
const {
  protect,
  requireActiveStore,
  forbidPlatformAdmin,
} = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireActiveStore);

router.get('/export.csv', exportSalesCsv);
router.get('/daily-closing', getDailyClosingReport);

router.route('/')
  .post(forbidPlatformAdmin, createSale)
  .get(getSales);

router.route('/:id')
  .get(getSaleById);

router.route('/:id/refund')
  .post(refundSale);

module.exports = router;
