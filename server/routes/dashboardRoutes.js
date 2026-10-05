const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Dummy auth for now
const protect = (req, res, next) => {
  req.user = { _id: '123', name: 'Admin', role: 'ADMIN' };
  next();
};

router.route('/stats').get(protect, getDashboardStats);

module.exports = router;
