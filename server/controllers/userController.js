const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');

// Export empty arrays for backward compatibility if any legacy test imports them
const memoryStaff = [];
const memoryInvitations = [];

// @desc    Get all staff members and invitations for the current store
// @route   GET /api/users
// @access  Store Owner / Admin Only
const getUsers = async (req, res) => {
  try {
    const storeId = req.storeId;
    let query = {};

    if (req.user.role !== 'PLATFORM_ADMIN') {
      if (!storeId) {
        return res.json({
          success: true,
          count: 0,
          data: [],
          invitations: [],
        });
      }
      query.store = storeId;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('store', 'name storeCode')
      .sort({ createdAt: -1 });

    let invitations = [];
    if (storeId) {
      invitations = await Invitation.find({ store: storeId }).sort({ createdAt: -1 });
    }

    return res.json({
      success: true,
      count: users.length,
      data: users,
      invitations,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve staff users',
    });
  }
};

// @desc    Invite new staff member with secure single-use token
// @route   POST /api/users/invite
// @access  Store Owner / Admin Only
const inviteStaff = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required',
      });
    }

    const allowedRoles = ['INVENTORY_MANAGER', 'CASHIER', 'STORE_OWNER'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours
    const storeId = req.storeId;

    if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No supermarket store context found for invitation',
      });
    }

    // Check if user is already registered in DB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `A user with email "${cleanEmail}" is already registered.`,
      });
    }

    // Check existing pending invitation
    const existingInvite = await Invitation.findOne({
      email: cleanEmail,
      store: storeId,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: `A pending invitation has already been sent to "${cleanEmail}".`,
        invitation: existingInvite,
        activationLink: `/activate-staff?token=${existingInvite.token}`,
      });
    }

    const invitation = await Invitation.create({
      store: storeId,
      email: cleanEmail,
      name: name.trim(),
      role,
      token,
      expiresAt,
      invitedBy: req.user._id,
    });

    // Audit Log
    await AuditLog.create({
      store: storeId,
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'STAFF_INVITED',
      entity: 'Invitation',
      entityId: invitation._id.toString(),
      details: { email: cleanEmail, role, name: name.trim() },
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Invitation generated successfully for ${name} (${role})`,
      data: invitation,
      activationLink: `/activate-staff?token=${token}`,
    });
  } catch (error) {
    console.error('inviteStaff error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate staff invitation',
    });
  }
};

// @desc    Resend / renew staff invitation
// @route   POST /api/users/invite/:id/resend
// @access  Store Owner / Admin Only
const resendInvitation = async (req, res) => {
  try {
    const newToken = crypto.randomBytes(24).toString('hex');
    const newExpiresAt = new Date(Date.now() + 48 * 3600 * 1000);

    const invite = await Invitation.findById(req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    // Check store scope
    if (req.user.role !== 'PLATFORM_ADMIN' && invite.store?.toString() !== req.storeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this invitation' });
    }

    invite.token = newToken;
    invite.expiresAt = newExpiresAt;
    invite.status = 'PENDING';
    await invite.save();

    return res.json({
      success: true,
      message: 'Invitation renewed with fresh activation link',
      data: invite,
      activationLink: `/activate-staff?token=${newToken}`,
    });
  } catch (error) {
    console.error('resendInvitation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to renew invitation' });
  }
};

// @desc    Revoke a pending staff invitation
// @route   DELETE /api/users/invite/:id
// @access  Store Owner / Admin Only
const revokeInvitation = async (req, res) => {
  try {
    const invite = await Invitation.findById(req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (req.user.role !== 'PLATFORM_ADMIN' && invite.store?.toString() !== req.storeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this invitation' });
    }

    invite.status = 'REVOKED';
    await invite.save();

    return res.json({
      success: true,
      message: 'Staff invitation revoked successfully',
    });
  } catch (error) {
    console.error('revokeInvitation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke invitation' });
  }
};

// @desc    Create staff directly (Admin shortcut)
// @route   POST /api/users
// @access  Store Owner / Admin Only
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const storeId = req.storeId;

    if (!storeId && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No supermarket store context found for user creation',
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Disallow elevating to PLATFORM_ADMIN via store user creation
    const allowedRoles = ['INVENTORY_MANAGER', 'CASHIER', 'STORE_OWNER', 'ADMIN'];
    const assignedRole = allowedRoles.includes(role) ? role : 'CASHIER';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: assignedRole,
      store: storeId || null,
      status: 'Active',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
};

// @desc    Update user details, role or status
// @route   PUT /api/users/:id
// @access  Store Owner / Admin Only
const updateUser = async (req, res) => {
  try {
    const { name, role, status, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store scope check
    if (req.user.role !== 'PLATFORM_ADMIN' && user.store?.toString() !== req.storeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to user from another store' });
    }

    // Prevent admin/owner from disabling or demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
      if (status && status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'You cannot disable your own administrator account',
        });
      }
      if (role && !['ADMIN', 'STORE_OWNER', 'PLATFORM_ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot demote your own administrator role',
        });
      }
    }

    // Disallow promoting to PLATFORM_ADMIN from store endpoint
    if (role === 'PLATFORM_ADMIN' && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot assign Platform Administrator role',
      });
    }

    if (name) user.name = name.trim();
    if (role && ['STORE_OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'CASHIER'].includes(role)) user.role = role;
    if (status && ['Active', 'Disabled'].includes(status)) {
      user.status = status;
      user.isActive = status === 'Active';
    }
    if (password) user.password = password;

    await user.save();

    return res.json({
      success: true,
      message: 'Staff updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Store Owner / Admin Only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store scope check
    if (req.user.role !== 'PLATFORM_ADMIN' && user.store?.toString() !== req.storeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to user from another store' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Staff user deleted successfully',
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  inviteStaff,
  resendInvitation,
  revokeInvitation,
  memoryStaff,
  memoryInvitations,
};
