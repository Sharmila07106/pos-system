const express = require('express');
const router = express.Router();
const {
  getStockMovements,
  adjustStock,
  getBatches,
  receiveBatch,
  recordWaste,
  getWasteRecords,
  getWasteAnalytics,
  getExpiryAlerts,
} = require('../controllers/inventoryController');
const {
  protect,
  requireActiveStore,
} = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireActiveStore);

// Movements & adjustments
router.route('/movements').get(getStockMovements);
router.route('/adjust').post(adjustStock);

// Batches & FEFO inventory tracking
router.route('/batches')
  .get(getBatches)
  .post(receiveBatch);

router.route('/expiry-alerts').get(getExpiryAlerts);

// Food waste tracking & analytics
router.route('/waste')
  .get(getWasteRecords)
  .post(recordWaste);

router.route('/waste/analytics').get(getWasteAnalytics);

module.exports = router;
