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

      let user = null;

      if (mongoose.connection.readyState === 1) {
        user = await User.findById(decoded.id).select('-password').populate('store');
      }

      // Memory fallback if MongoDB not connected
      if (!user) {
        user = {
          _id: decoded.id || 'usr_demo_admin',
          name: decoded.name || 'Store Admin',
          email: decoded.email || 'admin@storeflow.com',
          role: decoded.role || 'STORE_OWNER',
          isPlatformAdmin: decoded.isPlatformAdmin || decoded.role === 'PLATFORM_ADMIN',
          status: 'Active',
          store: decoded.storeId || 'store_demo_freshmart'
        };
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      if (user.status === 'Disabled') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been disabled. Contact store administrator.',
        });
      }

      req.user = user;
      req.storeId = user.store?._id ? user.store._id.toString() : (user.store ? user.store.toString() : null);

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

// Flexible role checker middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, please sign in',
      });
    }

    // Platform admin always has access
    if (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin) {
      return next();
    }

    // Allow role synonym: ADMIN and STORE_OWNER are treated as equivalent store authority
    const userRole = req.user.role;
    const hasRole = allowedRoles.includes(userRole) || 
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

// Platform Administrator only
const platformAdminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'PLATFORM_ADMIN' || req.user.isPlatformAdmin)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: StoreFlow Platform Administrator privileges required',
  });
};

// Store Owner or Store Administrator only
const storeOwnerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'STORE_OWNER' || req.user.role === 'ADMIN' || req.user.isPlatformAdmin)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied: Supermarket Owner or Store Administrator privileges required',
  });
};

// Legacy adminOnly backward compatibility
const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STORE_OWNER' || req.user.role === 'PLATFORM_ADMIN')) {
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

  // Check store status in MongoDB if active
  if (mongoose.connection.readyState === 1 && req.user.store && req.user.store.status) {
    if (req.user.store.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Operational access is suspended for this supermarket. Please contact StoreFlow Platform Admin.',
      });
    }
    if (req.user.store.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Your supermarket registration application is pending review and approval.',
      });
    }
  }

  next();
};

module.exports = {
  protect,
  requireRole,
  platformAdminOnly,
  storeOwnerOnly,
  adminOnly,
  requireActiveStore,
};
