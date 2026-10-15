const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  submitApplication,
  getApplicationStatus,
} = require('../controllers/onboardingController');

// Rate limiting for public onboarding endpoints (15 min window, 30 requests max per IP)
const onboardingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again in 15 minutes',
  },
});

// Public onboarding routes
router.post('/apply', onboardingLimiter, submitApplication);
router.get('/status/:identifier', onboardingLimiter, getApplicationStatus);

module.exports = router;
