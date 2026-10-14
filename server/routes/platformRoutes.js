const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplicationById,
  reviewApplication,
  getStores,
  updateStoreStatus,
  getPlatformStats,
  getAuditLogs,
  getApplicationsTrend,
  getStatusBreakdown,
  getStoresGrowth,
  getComplaintsSummary,
  getStoresByCity,
  getPlatformStaff,
  getPlatformComplaints,
  updateComplaintStatus,
  getAppearance,
  updateAppearance,
} = require('../controllers/platformController');
const {
  getPlatformSummaryReport,
  getSupermarketsReport,
  getStaffAccessReport,
  getComplaintsReport,
} = require('../controllers/reportController');
const { protect, platformAdminOnly } = require('../middleware/authMiddleware');

// Platform Administrator routes - protected by JWT and Platform Admin role
router.use(protect);
router.use(platformAdminOnly);

// Stats & Audits
router.get('/stats', getPlatformStats);
router.get('/audit-logs', getAuditLogs);

// Store Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id/review', reviewApplication);

// Registered Stores & Tenancy
router.get('/stores', getStores);
router.put('/stores/:id/status', updateStoreStatus);

// Analytics & Aggregations
router.get('/analytics/applications-trend', getApplicationsTrend);
router.get('/analytics/status-breakdown', getStatusBreakdown);
router.get('/analytics/stores-growth', getStoresGrowth);
router.get('/analytics/complaints-summary', getComplaintsSummary);
router.get('/analytics/stores-by-city', getStoresByCity);

// Staff Roster
router.get('/staff', getPlatformStaff);

// Complaints Desk
router.get('/complaints', getPlatformComplaints);
router.put('/complaints/:id/status', updateComplaintStatus);

// Appearance Customization
router.get('/appearance', getAppearance);
router.put('/appearance', updateAppearance);

// PDF Executive Reports
router.get('/reports/summary.pdf', getPlatformSummaryReport);
router.get('/reports/stores.pdf', getSupermarketsReport);
router.get('/reports/staff.pdf', getStaffAccessReport);
router.get('/reports/complaints.pdf', getComplaintsReport);

module.exports = router;
