const express = require('express');
const router = express.Router();
const {
  getOverview,
  getStores,
  getStoreById,
  updateStoreStatus,
  updateStoreNotes,
  getUsers,
  updateUserStatus,
  resetUserPassword,
  getLoginEvents,
  getActivityLogs,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  addComplaintMessage,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/adminController');
const { protect, platformAdminOnly } = require('../middleware/authMiddleware');

// Platform Administrator only routes
router.use(protect);
router.use(platformAdminOnly);

// Platform Overview
router.get('/overview', getOverview);

// Store Management & Approvals
router.get('/stores', getStores);
router.get('/stores/:id', getStoreById);
router.put('/stores/:id/status', updateStoreStatus);
router.put('/stores/:id/notes', updateStoreNotes);

// User & Staff Management Across Stores
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);

// Security & Audit Logs
router.get('/login-events', getLoginEvents);
router.get('/activity', getActivityLogs);

// Complaints & Support Desk
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintById);
router.put('/complaints/:id/status', updateComplaintStatus);
router.put('/complaints/:id/assign', assignComplaint);
router.post('/complaints/:id/messages', addComplaintMessage);

const {
  getPlatformSummaryReport,
  getSupermarketsReport,
  getStaffAccessReport,
  getComplaintsReport,
  getSingleStoreReport,
} = require('../controllers/reportController');

// Announcements Broadcast
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

// PDF Reports Download
router.get('/reports/platform-summary.pdf', getPlatformSummaryReport);
router.get('/reports/supermarkets.pdf', getSupermarketsReport);
router.get('/reports/staff-access.pdf', getStaffAccessReport);
router.get('/reports/complaints.pdf', getComplaintsReport);
router.get('/reports/stores/:id.pdf', getSingleStoreReport);

module.exports = router;
