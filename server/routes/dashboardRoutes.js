const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const {
  protect,
  requireActiveStore,
} = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireActiveStore);

router.route('/stats').get(getDashboardStats);

module.exports = router;
