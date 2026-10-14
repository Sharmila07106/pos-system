const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StoreApplication = require('../models/StoreApplication');
const Store = require('../models/Store');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { memoryApplications } = require('./onboardingController');

// Memory store fallback for stores
const memoryStores = [
  {
    _id: 'store_demo_freshmart',
    name: 'FreshMart Supermarket',
    slug: 'freshmart',
    storeCode: 'STR-1001',
    businessEmail: 'admin@freshmart.com',
    phone: '+91 98400 12345',
    address: '100 Feet Road, Velachery',
    city: 'Chennai',
    storeType: 'Supermarket',
    status: 'APPROVED',
    currency: 'INR',
    taxRatePercent: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    ownerName: 'Sharmila (Store Owner)',
  },
  {
    _id: 'store_demo_greenmart',
    name: 'GreenMart Organics',
    slug: 'greenmart',
    storeCode: 'STR-1002',
    businessEmail: 'owner@greenmart.com',
    phone: '+91 98401 23456',
    address: '45, Anna Salai, T. Nagar',
    city: 'Chennai',
    storeType: 'Supermarket',
    status: 'APPROVED',
    currency: 'INR',
    taxRatePercent: 5,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    ownerName: 'Venkatesh Rao',
  }
];

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
      console.warn('MongoDB getApplications fallback:', err.message);
    }
  }

  let list = memoryApplications;
  if (status && status !== 'ALL') {
    list = list.filter((a) => a.status === status);
  }

  res.json({
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
      console.warn('MongoDB getApplicationById fallback:', err.message);
    }
  }

  const app = memoryApplications.find(
    (a) => a._id === req.params.id || a.applicationId === req.params.id
  );

  if (!app) {
    res.status(404);
    throw new Error('Application not found');
  }

  res.json({ success: true, data: app });
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
      console.warn('MongoDB reviewApplication fallback:', err.message);
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

  // Handle APPROVE action
  if (action === 'APPROVE') {
    const slug = app.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const storeCode = generateStoreCode();

    if (mongoose.connection.readyState === 1) {
      try {
        // Create or find owner User
        let owner = await User.findOne({ email: app.email });
        if (!owner) {
          owner = await User.create({
            name: app.ownerName,
            email: app.email,
            password: 'StoreFlow@2026', // Initial password
            role: 'STORE_OWNER',
            phone: app.phone,
            status: 'Active',
          });
        } else {
          owner.role = 'STORE_OWNER';
          await owner.save();
        }

        // Create Store
        const store = await Store.create({
          name: app.businessName,
          slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
          storeCode,
          owner: owner._id,
          businessEmail: app.email,
          phone: app.phone,
          address: app.address,
          city: app.city,
          storeType: app.storeType,
          status: 'APPROVED',
        });

        // Link store to owner and application
        owner.store = store._id;
        await owner.save();

        app.status = 'APPROVED';
        app.reviewNotes = reviewNotes || 'Application verified and store activated.';
        app.reviewedBy = req.user?._id;
        app.reviewedAt = new Date();
        app.createdStore = store._id;
        await app.save();

        // Audit Log
        await AuditLog.create({
          store: store._id,
          actor: req.user?._id,
          actorName: reviewerName,
          actorRole: 'PLATFORM_ADMIN',
          action: 'STORE_APPROVED',
          entity: 'StoreApplication',
          entityId: app.applicationId,
          details: { storeCode: store.storeCode, businessName: store.name },
        });

        return res.json({
          success: true,
          message: `Supermarket "${app.businessName}" has been successfully approved and activated!`,
          data: {
            application: app,
            store,
          },
        });
      } catch (err) {
        console.warn('MongoDB approve fallback:', err.message);
      }
    }

    // Memory approve fallback
    app.status = 'APPROVED';
    app.reviewNotes = reviewNotes || 'Application verified and store activated.';
    app.reviewedAt = new Date().toISOString();

    const newStore = {
      _id: `store_${Date.now()}`,
      name: app.businessName,
      slug: slug || 'newstore',
      storeCode,
      businessEmail: app.email,
      phone: app.phone,
      address: app.address,
      city: app.city,
      storeType: app.storeType,
      status: 'APPROVED',
      currency: 'INR',
      taxRatePercent: 5,
      createdAt: new Date().toISOString(),
      ownerName: app.ownerName,
    };

    memoryStores.push(newStore);

    return res.json({
      success: true,
      message: `Supermarket "${app.businessName}" has been successfully approved and activated!`,
      data: {
        application: app,
        store: newStore,
      },
    });
  }

  // Handle REJECT or REQUEST_CHANGES
  const newStatus = action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';
  app.status = newStatus;
  app.reviewNotes = reviewNotes || `Application status changed to ${newStatus}.`;
  app.reviewedAt = new Date().toISOString();

  if (mongoose.connection.readyState === 1 && typeof app.save === 'function') {
    try {
      await app.save();
    } catch (e) {}
  }

  res.json({
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
      const stores = await Store.find().populate('owner', 'name email').sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: stores.length,
        data: stores,
      });
    } catch (err) {
      console.warn('MongoDB getStores fallback:', err.message);
    }
  }

  res.json({
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

  if (!['APPROVED', 'SUSPENDED'].includes(status)) {
    res.status(400);
    throw new Error('Status must be APPROVED or SUSPENDED');
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const store = await Store.findById(req.params.id);
      if (store) {
        store.status = status;
        await store.save();

        await AuditLog.create({
          store: store._id,
          actor: req.user?._id,
          actorName: req.user?.name || 'Platform Admin',
          actorRole: 'PLATFORM_ADMIN',
          action: status === 'SUSPENDED' ? 'STORE_SUSPENDED' : 'STORE_REACTIVATED',
          entity: 'Store',
          entityId: store._id.toString(),
          details: { reason: reason || 'Platform policy review' },
        });

        return res.json({
          success: true,
          message: `Store operational status updated to ${status}.`,
          data: store,
        });
      }
    } catch (err) {
      console.warn('MongoDB updateStoreStatus fallback:', err.message);
    }
  }

  const store = memoryStores.find((s) => s._id === req.params.id);
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  store.status = status;
  res.json({
    success: true,
    message: `Store operational status updated to ${status}.`,
    data: store,
  });
});

// @desc    Get platform aggregate stats
// @route   GET /api/platform/stats
// @access  Platform Admin Only
const getPlatformStats = asyncHandler(async (req, res) => {
  let totalStores = memoryStores.length;
  let activeStores = memoryStores.filter((s) => s.status === 'APPROVED').length;
  let pendingApplications = memoryApplications.filter((a) => a.status === 'PENDING').length;
  let totalApplications = memoryApplications.length;

  if (mongoose.connection.readyState === 1) {
    try {
      totalStores = await Store.countDocuments();
      activeStores = await Store.countDocuments({ status: 'APPROVED' });
      pendingApplications = await StoreApplication.countDocuments({ status: 'PENDING' });
      totalApplications = await StoreApplication.countDocuments();
    } catch (e) {}
  }

  res.json({
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

module.exports = {
  getApplications,
  getApplicationById,
  reviewApplication,
  getStores,
  updateStoreStatus,
  getPlatformStats,
  memoryStores,
};
