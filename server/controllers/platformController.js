const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StoreApplication = require('../models/StoreApplication');
const Store = require('../models/Store');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
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

      const store = await Store.create({
        name: app.businessName,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        storeCode,
        owner: owner._id,
        ownerUser: owner._id,
        businessEmail: app.email,
        phone: app.phone,
        address: app.address,
        city: app.city,
        storeType: app.storeType,
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

  return res.json({
    success: true,
    message: `Application status updated to ${newStatus}.`,
    data: app,
  });
});

// @desc    Get all stores registered on platform
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

  if (mongoose.connection.readyState === 1) {
    try {
      totalStores = await Store.countDocuments();
      activeStores = await Store.countDocuments({ status: { $in: ['APPROVED', 'ACTIVE'] } });
      pendingApplications = await Store.countDocuments({ status: 'PENDING' });
      totalApplications = totalStores;
    } catch (e) {}
  }

  return res.json({
    success: true,
    data: {
      totalStores,
      activeStores,
      pendingApplications,
      totalApplications,
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

module.exports = {
  getApplications,
  getApplicationById,
  reviewApplication,
  getStores,
  updateStoreStatus,
  getPlatformStats,
  getAuditLogs,
  memoryStores,
  memoryAuditLogs,
};
