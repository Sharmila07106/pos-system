const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplicationById,
  reviewApplication,
  getStores,
  updateStoreStatus,
  getPlatformStats,
} = require('../controllers/platformController');
const { protect, platformAdminOnly } = require('../middleware/authMiddleware');

// Platform Administrator routes - protected by JWT and Platform Admin role
router.use(protect);
router.use(platformAdminOnly);

router.get('/stats', getPlatformStats);
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id/review', reviewApplication);
router.get('/stores', getStores);
router.put('/stores/:id/status', updateStoreStatus);

module.exports = router;
