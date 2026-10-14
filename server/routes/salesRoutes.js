const express = require('express');
const router = express.Router();
const { createSale, getSales } = require('../controllers/salesController');
const {
  protect,
  requireActiveStore,
  forbidPlatformAdmin,
} = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireActiveStore);

router.route('/')
  .post(forbidPlatformAdmin, createSale)
  .get(getSales);

module.exports = router;
