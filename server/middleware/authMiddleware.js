const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');

// Protect routes - requires valid JWT Bearer token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'storeflow-pos-secret-key-2026'
      );

      if (!decoded?.id) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload',
        });
      }

      let user = null;
      if (mongoose.connection.readyState === 1) {
        user = await User.findById(decoded.id).select('-password').populate('store');
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists in database',
        });
      }

      if (user.isActive === false || user.status === 'Disabled') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact your administrator.',
        });
      }

      // Throttled lastActiveAt update (at most once every 60 seconds)
      const now = Date.now();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
      if (now - lastActive > 60000) {
        User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date(now) } })
          .exec()
          .catch(() => {});
      }

      req.user = user;
      req.storeId = user.store?._id
        ? user.store._id.toString()
        : user.store
        ? user.store.toString()
        : null;

      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no authentication token provided',
    });
  }
};

// Strict Platform Administrator only
const platformAdminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin === true)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: StoreFlow Platform Administrator privileges required',
  });
};

// Forbid Platform Admin from executing checkout / POS sales
const forbidPlatformAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin === true)) {
    return res.status(403).json({
      success: false,
      message: 'Platform administrators cannot perform direct store checkout or sales operations.',
    });
  }
  return next();
};

// Store Owner or Store Administrator only
const storeOwnerOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'STORE_OWNER' ||
      req.user.role === 'ADMIN' ||
      req.user.role === 'PLATFORM_ADMIN' ||
      req.user.isPlatformAdmin)
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Supermarket Owner or Store Administrator privileges required',
  });
};

// Flexible role checker middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please sign in',
      });
    }

    // Platform admin has broad administrative access across general management endpoints
    if (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin) {
      return next();
    }

    const userRole = req.user.role;
    const hasRole =
      allowedRoles.includes(userRole) ||
      (allowedRoles.includes('ADMIN') && userRole === 'STORE_OWNER') ||
      (allowedRoles.includes('STORE_OWNER') && userRole === 'ADMIN');

    if (hasRole) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: Requires one of [${allowedRoles.join(', ')}] permissions`,
    });
  };
};

// Legacy adminOnly backward compatibility
const adminOnly = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'ADMIN' ||
      req.user.role === 'STORE_OWNER' ||
      req.user.role === 'PLATFORM_ADMIN')
  ) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrator privileges required',
  });
};

// Store Scope & Operational Status Middleware
const requireActiveStore = async (req, res, next) => {
  // Platform admins are exempt from store operational lockdown
  if (req.user?.role === 'PLATFORM_ADMIN' || req.user?.isPlatformAdmin) {
    return next();
  }

  if (!req.storeId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not assigned to an active supermarket store.',
    });
  }

  // Check store status in MongoDB
  const store = req.user.store;
  if (store && store.status) {
    if (store.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        code: 'STORE_SUSPENDED',
        message: 'Operational access is suspended for this supermarket. Please contact StoreFlow Platform Admin.',
      });
    }
    if (store.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        code: 'STORE_PENDING',
        message: 'Your supermarket registration application is pending review and approval.',
      });
    }
    if (store.status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        code: 'STORE_REJECTED',
        message: 'Your supermarket registration application has been rejected.',
      });
    }
    if (store.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'STORE_INACTIVE',
        message: 'Supermarket is not currently active.',
      });
    }
  }

  return next();
};

module.exports = {
  protect,
  requireRole,
  platformAdminOnly,
  forbidPlatformAdmin,
  storeOwnerOnly,
  adminOnly,
  requireActiveStore,
};
