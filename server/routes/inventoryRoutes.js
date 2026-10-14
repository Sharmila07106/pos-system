const express = require('express');
const router = express.Router();
const {
  getStockMovements,
  adjustStock,
  getBatches,
  receiveBatch,
  recordWaste,
  getWasteAnalytics,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Movements & adjustments
router.route('/movements').get(getStockMovements);
router.route('/adjust').post(adjustStock);

// Batches & FEFO inventory tracking
router.route('/batches')
  .get(getBatches)
  .post(receiveBatch);

// Food waste tracking & analytics
router.route('/waste').post(recordWaste);
router.route('/waste/analytics').get(getWasteAnalytics);

module.exports = router;
