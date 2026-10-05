const express = require('express');
const router = express.Router();
const { getStockMovements, adjustStock } = require('../controllers/inventoryController');

// Dummy auth for now
const protect = (req, res, next) => {
  req.user = { _id: '123', name: 'Admin', role: 'ADMIN' };
  next();
};

router.route('/movements').get(protect, getStockMovements);
router.route('/adjust').post(protect, adjustStock);

module.exports = router;
