const express = require('express');
const router = express.Router();
const { createSale, getSales } = require('../controllers/salesController');

// Dummy auth for now
const protect = (req, res, next) => {
  req.user = { _id: '123', name: 'Admin', role: 'ADMIN' };
  next();
};

router.route('/')
  .post(protect, createSale)
  .get(protect, getSales);

module.exports = router;
