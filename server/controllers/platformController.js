const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StoreApplication = require('../models/StoreApplication');
const Store = require('../models/Store');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Complaint = require('../models/Complaint');
const PlatformSettings = require('../models/PlatformSettings');
const { memoryApplications } = require('./onboardingController');

// Clean empty fallback arrays (No hardcoded demo stores)
const memoryStores = [];
const memoryAuditLogs = [];

// Helper to create store code
const generateStoreCode = () => {
  return `STR-${Math.floor(1000 + Math.random() * 9000)}`;
};

// @desc    Get all applications (with optional status filter)
// @route   GET /api/platform/applications
// @access  Platform Admin Only
const getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'ALL' ? { status } : {};

  if (mongoose.connection.readyState === 1) {
    try {
      const apps = await StoreApplication.find(filter).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: apps.length,
        data: apps,
      });
    } catch (err) {
      console.warn('MongoDB getApplications error:', err.message);
    }
  }

  let list = memoryApplications;
  if (status && status !== 'ALL') {
    list = list.filter((a) => a.status === status);
  }

  return res.json({
    success: true,
    count: list.length,
    data: list,
  });
});

// @desc    Get single application by ID
// @route   GET /api/platform/applications/:id
// @access  Platform Admin Only
const getApplicationById = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const app = await StoreApplication.findById(req.params.id);
      if (app) return res.json({ success: true, data: app });
    } catch (err) {
      console.warn('MongoDB getApplicationById error:', err.message);
    }
  }

  const app = memoryApplications.find(
    (a) => a._id === req.params.id || a.applicationId === req.params.id
  );

  if (!app) {
    res.status(404);
    throw new Error('Application not found');
  }

  return res.json({ success: true, data: app });
});

// @desc    Review application (Approve, Reject, or Request Changes)
// @route   PUT /api/platform/applications/:id/review
// @access  Platform Admin Only
const reviewApplication = asyncHandler(async (req, res) => {
  const { action, reviewNotes } = req.body;

  if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(action)) {
    res.status(400);
    throw new Error('Invalid action. Must be APPROVE, REJECT, or REQUEST_CHANGES.');
  }

  const reviewerName = req.user?.name || 'Platform Administrator';
  let app = null;

  if (mongoose.connection.readyState === 1) {
    try {
      app = await StoreApplication.findById(req.params.id);
    } catch (err) {
      console.warn('MongoDB reviewApplication lookup error:', err.message);
    }
  }

  if (!app) {
    app = memoryApplications.find(
      (a) => a._id === req.params.id || a.applicationId === req.params.id
    );
  }

  if (!app) {
    res.status(404);
    throw new Error('Application record not found');
  }

  if (action === 'APPROVE') {
    const slug = app.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const storeCode = generateStoreCode();

    if (mongoose.connection.readyState === 1) {
      let owner = await User.findOne({ email: app.email });
      if (!owner) {
        owner = await User.create({
          name: app.ownerName,
          email: app.email,
          password: 'StoreFlow@2026',
          role: 'STORE_OWNER',
          phone: app.phone,
          status: 'Active',
          isActive: true,
        });
      } else {
        owner.role = 'STORE_OWNER';
        owner.status = 'Active';
        owner.isActive = true;
        await owner.save();
      }

      const storeEmail = app.email || app.businessEmail || (owner && owner.email) || '';
      const storePhone = app.phone || (owner && owner.phone) || '';

      const store = await Store.create({
        name: app.businessName,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        storeCode,
        owner: owner._id,
        ownerUser: owner._id,
        email: storeEmail,
        businessEmail: storeEmail,
        phone: storePhone,
        address: app.address || '',
        city: app.city || '',
        storeType: app.storeType || 'Supermarket',
        status: 'ACTIVE',
        reviewedAt: new Date(),
        reviewedBy: req.user?._id,
      });

      owner.store = store._id;
      await owner.save();

      app.status = 'APPROVED';
      app.reviewNotes = reviewNotes || 'Application verified and store activated.';
      app.reviewedBy = req.user?._id;
      app.reviewedAt = new Date();
      app.createdStore = store._id;
      await app.save();

      await AuditLog.create({
        store: store._id,
        actor: req.user?._id,
        actorName: reviewerName,
        actorRole: 'PLATFORM_ADMIN',
        action: 'STORE_APPROVED',
        entity: 'StoreApplication',
        entityId: app.applicationId,
        details: { storeCode: store.storeCode, businessName: store.name },
      }).catch(() => {});

      return res.json({
        success: true,
        message: `Supermarket "${app.businessName}" has been successfully approved and activated!`,
        data: { application: app, store },
      });
    }
  }

  const newStatus = action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';
  app.status = newStatus;
  app.reviewNotes = reviewNotes || `Application status changed to ${newStatus}.`;
  app.reviewedAt = new Date().toISOString();

  if (mongoose.connection.readyState === 1 && typeof app.save === 'function') {
    await app.save();
  }

  await AuditLog.create({
    actor: req.user?._id,
    actorName: reviewerName,
    actorRole: 'PLATFORM_ADMIN',
    action: action === 'REJECT' ? 'STORE_REJECTED' : 'CHANGES_REQUESTED',
    entity: 'StoreApplication',
    entityId: app.applicationId,
    details: { reason: reviewNotes },
  }).catch(() => {});

  return res.json({
    success: true,
    message: `Application status updated to ${newStatus}.`,
    data: app,
  });
});

// @desc    Get all registered stores with owner details
// @route   GET /api/platform/stores
// @access  Platform Admin Only
const getStores = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const stores = await Store.find()
        .populate('owner', 'name email')
        .populate('ownerUser', 'name email')
        .sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: stores.length,
        data: stores,
      });
    } catch (err) {
      console.warn('MongoDB getStores error:', err.message);
    }
  }

  return res.json({
    success: true,
    count: memoryStores.length,
    data: memoryStores,
  });
});

// @desc    Update store operational status (Suspend / Reactivate)
// @route   PUT /api/platform/stores/:id/status
// @access  Platform Admin Only
const updateStoreStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const validStatuses = ['APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'PENDING'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const store = await Store.findById(req.params.id);
  if (!store) {
    res.status(404);
    throw new Error('Supermarket not found');
  }

  const normalizedStatus = status === 'APPROVED' ? 'ACTIVE' : status;
  store.status = normalizedStatus;
  store.reviewedAt = new Date();
  store.reviewedBy = req.user?._id;
  if (reason) store.statusReason = reason;

  await store.save();

  if (normalizedStatus === 'ACTIVE' && store.ownerUser) {
    await User.updateOne(
      { _id: store.ownerUser },
      { $set: { status: 'Active', isActive: true } }
    ).catch(() => {});
  }

  await AuditLog.create({
    store: store._id,
    actor: req.user?._id,
    actorName: req.user?.name || 'Platform Admin',
    actorRole: 'PLATFORM_ADMIN',
    action:
      normalizedStatus === 'SUSPENDED'
        ? 'STORE_SUSPENDED'
        : normalizedStatus === 'REJECTED'
        ? 'STORE_REJECTED'
        : 'STORE_ACTIVATED',
    entity: 'Store',
    entityId: store._id.toString(),
    details: { reason: reason || 'Platform policy review' },
  }).catch(() => {});

  return res.json({
    success: true,
    message: `Store operational status updated to ${store.status}.`,
    data: store,
  });
});

// @desc    Get platform aggregate stats
// @route   GET /api/platform/stats
// @access  Platform Admin Only
const getPlatformStats = asyncHandler(async (req, res) => {
  let totalStores = 0;
  let activeStores = 0;
  let pendingApplications = 0;
  let totalApplications = 0;
  let openComplaints = 0;

  if (mongoose.connection.readyState === 1) {
    try {
      totalStores = await Store.countDocuments();
      activeStores = await Store.countDocuments({ status: { $in: ['APPROVED', 'ACTIVE'] } });
      pendingApplications = await StoreApplication.countDocuments({ status: 'PENDING' });
      totalApplications = await StoreApplication.countDocuments();
      openComplaints = await Complaint.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } });
    } catch (e) {}
  }

  return res.json({
    success: true,
    data: {
      totalStores,
      activeStores,
      pendingApplications,
      totalApplications,
      openComplaints,
      platformVersion: '2.0.0-multi-tenant',
      systemHealth: 'OPERATIONAL',
    },
  });
});

// @desc    Get audit trail logs
// @route   GET /api/platform/audit-logs
// @access  Platform Admin Only
const getAuditLogs = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
      return res.json({ success: true, count: logs.length, data: logs });
    } catch (err) {
      console.warn('MongoDB getAuditLogs error:', err.message);
    }
  }
  return res.json({ success: true, count: memoryAuditLogs.length, data: memoryAuditLogs });
});

// ============================================================================
// ANALYTICS & CHARTS ENDPOINTS (Real MongoDB Aggregations)
// ============================================================================

// @desc    Applications submitted per month (last 6 months)
// @route   GET /api/platform/analytics/applications-trend
// @access  Platform Admin Only
const getApplicationsTrend = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  if (mongoose.connection.readyState === 1) {
    try {
      const results = await StoreApplication.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const label = `${monthNames[m - 1]} ${y}`;
        const match = results.find((r) => r._id.year === y && r._id.month === m);
        data.push({
          month: label,
          applications: match ? match.count : 0,
        });
      }

      return res.json({ success: true, data });
    } catch (err) {
      console.warn('MongoDB getApplicationsTrend error:', err.message);
    }
  }

  return res.json({ success: true, data: [] });
});

// @desc    Applications status breakdown
// @route   GET /api/platform/analytics/status-breakdown
// @access  Platform Admin Only
const getStatusBreakdown = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const results = await StoreApplication.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const counts = {
        PENDING: 0,
        APPROVED: 0,
        CHANGES_REQUESTED: 0,
        REJECTED: 0,
      };

      let total = 0;
      results.forEach((r) => {
        if (counts[r._id] !== undefined) {
          counts[r._id] = r.count;
        }
        total += r.count;
      });

      const chartData = [
        { name: 'Pending', value: counts.PENDING, color: '#F59E0B' },
        { name: 'Approved', value: counts.APPROVED, color: '#0FA38F' },
        { name: 'Changes Requested', value: counts.CHANGES_REQUESTED, color: '#3B82F6' },
        { name: 'Rejected', value: counts.REJECTED, color: '#EF4444' },
      ].filter((item) => item.value > 0);

      return res.json({
        success: true,
        data: {
          breakdown: counts,
          chartData,
          total,
        },
      });
    } catch (err) {
      console.warn('MongoDB getStatusBreakdown error:', err.message);
    }
  }

  return res.json({
    success: true,
    data: {
      breakdown: { PENDING: 0, APPROVED: 0, CHANGES_REQUESTED: 0, REJECTED: 0 },
      chartData: [],
      total: 0,
    },
  });
});

// @desc    Cumulative registered stores growth per month (last 6 months)
// @route   GET /api/platform/analytics/stores-growth
// @access  Platform Admin Only
const getStoresGrowth = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  if (mongoose.connection.readyState === 1) {
    try {
      const priorStoresCount = await Store.countDocuments({ createdAt: { $lt: sixMonthsAgo } });

      const monthlyAdds = await Store.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = [];
      let runningTotal = priorStoresCount;

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const label = `${monthNames[m - 1]} ${y}`;
        const match = monthlyAdds.find((r) => r._id.year === y && r._id.month === m);
        const added = match ? match.count : 0;
        runningTotal += added;
        data.push({
          month: label,
          newStores: added,
          totalStores: runningTotal,
        });
      }

      return res.json({ success: true, data });
    } catch (err) {
      console.warn('MongoDB getStoresGrowth error:', err.message);
    }
  }

  return res.json({ success: true, data: [] });
});

// @desc    Complaints by status summary
// @route   GET /api/platform/analytics/complaints-summary
// @access  Platform Admin Only
const getComplaintsSummary = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const results = await Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const counts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
      };

      let total = 0;
      results.forEach((r) => {
        if (counts[r._id] !== undefined) {
          counts[r._id] = r.count;
        }
        total += r.count;
      });

      const chartData = [
        { name: 'Open', value: counts.OPEN, color: '#EF4444' },
        { name: 'In Progress', value: counts.IN_PROGRESS, color: '#F59E0B' },
        { name: 'Resolved', value: counts.RESOLVED, color: '#0FA38F' },
        { name: 'Closed', value: counts.CLOSED, color: '#6B7280' },
      ].filter((item) => item.value > 0);

      return res.json({
        success: true,
        data: {
          breakdown: counts,
          chartData,
          total,
        },
      });
    } catch (err) {
      console.warn('MongoDB getComplaintsSummary error:', err.message);
    }
  }

  return res.json({
    success: true,
    data: {
      breakdown: { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
      chartData: [],
      total: 0,
    },
  });
});

// @desc    Top 5 cities by number of stores
// @route   GET /api/platform/analytics/stores-by-city
// @access  Platform Admin Only
const getStoresByCity = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const results = await Store.aggregate([
        {
          $group: {
            _id: { $ifNull: [{ $trim: { input: '$city' } }, 'Unspecified'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      const data = results.map((r) => ({
        city: r._id || 'Unspecified',
        stores: r.count,
      }));

      return res.json({ success: true, data });
    } catch (err) {
      console.warn('MongoDB getStoresByCity error:', err.message);
    }
  }

  return res.json({ success: true, data: [] });
});

// ============================================================================
// STAFF, COMPLAINTS & APPEARANCE CONTROLLER METHODS
// ============================================================================

// @desc    Get all staff across supermarkets with search and store filter
// @route   GET /api/platform/staff
// @access  Platform Admin Only
const getPlatformStaff = asyncHandler(async (req, res) => {
  const { storeId, role, search } = req.query;

  let query = {};
  if (storeId && storeId !== 'ALL' && mongoose.Types.ObjectId.isValid(storeId)) {
    query.store = storeId;
  }
  if (role && role !== 'ALL') {
    query.role = { $regex: new RegExp(`^${role}$`, 'i') };
  }
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const staffUsers = await User.find(query)
        .populate('store', 'name storeCode city address')
        .select('-password')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: staffUsers.length,
        data: staffUsers,
      });
    } catch (err) {
      console.warn('MongoDB getPlatformStaff error:', err.message);
    }
  }

  return res.json({ success: true, count: 0, data: [] });
});

// @desc    Get all complaints raised by supermarkets
// @route   GET /api/platform/complaints
// @access  Platform Admin Only
const getPlatformComplaints = asyncHandler(async (req, res) => {
  const { status, storeId } = req.query;

  let query = {};
  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (storeId && storeId !== 'ALL' && mongoose.Types.ObjectId.isValid(storeId)) {
    query.store = storeId;
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const complaints = await Complaint.find(query)
        .populate('store', 'name storeCode phone city')
        .populate('raisedBy', 'name email role')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (err) {
      console.warn('MongoDB getPlatformComplaints error:', err.message);
    }
  }

  return res.json({ success: true, count: 0, data: [] });
});

// @desc    Update complaint status
// @route   PUT /api/platform/complaints/:id/status
// @access  Platform Admin Only
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint ticket not found');
  }

  const oldStatus = complaint.status;
  complaint.status = status;

  if (status === 'RESOLVED' || status === 'CLOSED') {
    complaint.resolvedAt = new Date();
  }

  complaint.statusHistory.push({
    from: oldStatus,
    to: status,
    by: req.user?._id,
    byName: req.user?.name || 'Platform Admin',
    note: note || `Status updated to ${status}`,
    at: new Date(),
  });

  await complaint.save();

  return res.json({
    success: true,
    message: `Ticket #${complaint.ticketNo} status updated to ${status}`,
    data: complaint,
  });
});

// @desc    Get appearance accent settings
// @route   GET /api/platform/appearance
// @access  Platform Admin Only
const getAppearance = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      let settings = await PlatformSettings.findOne({ key: 'GLOBAL_PLATFORM_CONFIG' });
      if (!settings) {
        settings = await PlatformSettings.create({
          key: 'GLOBAL_PLATFORM_CONFIG',
          accentColor: '#0FA38F',
          presetName: 'Teal Elegance',
        });
      }
      return res.json({ success: true, data: settings });
    } catch (err) {
      console.warn('MongoDB getAppearance error:', err.message);
    }
  }

  return res.json({
    success: true,
    data: {
      accentColor: '#0FA38F',
      presetName: 'Teal Elegance',
    },
  });
});

// @desc    Update appearance accent settings
// @route   PUT /api/platform/appearance
// @access  Platform Admin Only
const updateAppearance = asyncHandler(async (req, res) => {
  const { accentColor, presetName } = req.body;

  if (!accentColor || !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
    res.status(400);
    throw new Error('Valid 6-digit hex color is required (e.g. #0FA38F)');
  }

  let settings = await PlatformSettings.findOne({ key: 'GLOBAL_PLATFORM_CONFIG' });
  if (!settings) {
    settings = new PlatformSettings({ key: 'GLOBAL_PLATFORM_CONFIG' });
  }

  settings.accentColor = accentColor;
  if (presetName) settings.presetName = presetName;
  settings.updatedBy = req.user?._id;
  await settings.save();

  return res.json({
    success: true,
    message: 'Appearance settings updated successfully',
    data: settings,
  });
});

module.exports = {
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
  memoryStores,
  memoryAuditLogs,
};
