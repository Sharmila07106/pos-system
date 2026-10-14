const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getApplicationStatus,
} = require('../controllers/onboardingController');

// Public onboarding routes
router.post('/apply', submitApplication);
router.get('/status/:identifier', getApplicationStatus);

module.exports = router;
