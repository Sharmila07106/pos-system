const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  registerStore,
  registerUser,
  loginUser,
  googleAuth,
  logoutUser,
  getMe,
  getPreferences,
  updatePreferences,
  getInvitationDetails,
  activateStaff,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rate limiting for public auth endpoints (15 min window, 40 requests max per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
});

router.post('/register-store', authLimiter, registerStore);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/logout', protect, logoutUser);
router.get('/invitation/:token', getInvitationDetails);
router.post('/activate-staff', activateStaff);
router.get('/me', protect, getMe);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
