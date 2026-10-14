const express = require('express');
const router = express.Router();
const {
  raiseComplaint,
  getStoreComplaints,
  getStoreComplaintById,
  replyStoreComplaint,
  getActiveAnnouncements,
} = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

// All support routes require authentication (works even if store is PENDING/SUSPENDED)
router.use(protect);

router.post('/complaints', raiseComplaint);
router.get('/complaints', getStoreComplaints);
router.get('/complaints/:id', getStoreComplaintById);
router.post('/complaints/:id/messages', replyStoreComplaint);
router.get('/announcements', getActiveAnnouncements);

module.exports = router;
