const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

// Using dummy middleware until real auth is plugged in for this phase
const protect = (req, res, next) => {
  req.user = { role: 'ADMIN' }; // dummy user
  next();
};
const authorize = (...roles) => (req, res, next) => next();

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorize('ADMIN'), updateSettings);

module.exports = router;
