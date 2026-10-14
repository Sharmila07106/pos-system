const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');

// In-memory staff and invitations fallback
const memoryStaff = [
  {
    _id: 'usr_owner_sharmila',
    name: 'Sharmila (Store Owner)',
    email: 'admin@freshmart.com',
    role: 'STORE_OWNER',
    status: 'Active',
    store: 'store_demo_freshmart',
    storeName: 'FreshMart Supermarket',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    _id: 'usr_inv_karthik',
    name: 'Karthik (Inventory Manager)',
    email: 'inventory@freshmart.com',
    role: 'INVENTORY_MANAGER',
    status: 'Active',
    store: 'store_demo_freshmart',
    storeName: 'FreshMart Supermarket',
    createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
  {
    _id: 'usr_cashier_priya',
    name: 'Priya (Head Cashier)',
    email: 'cashier@freshmart.com',
    role: 'CASHIER',
    status: 'Active',
    store: 'store_demo_freshmart',
    storeName: 'FreshMart Supermarket',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  }
];

const memoryInvitations = [
  {
    _id: 'inv_demo_01',
    name: 'Suresh Kumar',
    email: 'suresh@freshmart.com',
    role: 'CASHIER',
    token: 'inv_tok_99182374618293746182937461829374',
    status: 'PENDING',
    store: 'store_demo_freshmart',
    storeName: 'FreshMart Supermarket',
    expiresAt: new Date(Date.now() + 3600000 * 48).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

// @desc    Get all staff members and invitations for the current store
// @route   GET /api/users
// @access  Store Owner / Admin Only
const getUsers = async (req, res) => {
  try {
    const storeId = req.storeId;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (storeId && req.user.role !== 'PLATFORM_ADMIN') {
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
    }

    // Memory fallback
    let staffList = memoryStaff;
    let inviteList = memoryInvitations;

    if (storeId && req.user.role !== 'PLATFORM_ADMIN') {
      staffList = staffList.filter((u) => u.store === storeId || !u.store);
      inviteList = inviteList.filter((i) => i.store === storeId || !i.store);
    }

    res.json({
      success: true,
      count: staffList.length,
      data: staffList,
      invitations: inviteList,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
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

    if (!['INVENTORY_MANAGER', 'CASHIER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either INVENTORY_MANAGER or CASHIER',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours
    const storeId = req.storeId || req.user.store || 'store_demo_freshmart';

    if (mongoose.connection.readyState === 1) {
      // Check if user already active in this store
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
      });

      return res.status(201).json({
        success: true,
        message: `Invitation generated successfully for ${name} (${role})`,
        data: invitation,
        activationLink: `/activate-staff?token=${token}`,
      });
    }

    // Memory fallback
    const newInvite = {
      _id: `inv_${Date.now()}`,
      store: storeId,
      email: cleanEmail,
      name: name.trim(),
      role,
      token,
      status: 'PENDING',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    memoryInvitations.unshift(newInvite);

    res.status(201).json({
      success: true,
      message: `Invitation generated successfully for ${name} (${role})`,
      data: newInvite,
      activationLink: `/activate-staff?token=${token}`,
    });
  } catch (error) {
    console.error('inviteStaff error:', error);
    res.status(500).json({
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

    if (mongoose.connection.readyState === 1) {
      const invite = await Invitation.findById(req.params.id);
      if (!invite) {
        return res.status(404).json({ success: false, message: 'Invitation not found' });
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
    }

    const invite = memoryInvitations.find((i) => i._id === req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    invite.token = newToken;
    invite.expiresAt = newExpiresAt.toISOString();
    invite.status = 'PENDING';

    res.json({
      success: true,
      message: 'Invitation renewed with fresh activation link',
      data: invite,
      activationLink: `/activate-staff?token=${newToken}`,
    });
  } catch (error) {
    console.error('resendInvitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to renew invitation' });
  }
};

// @desc    Revoke a pending staff invitation
// @route   DELETE /api/users/invite/:id
// @access  Store Owner / Admin Only
const revokeInvitation = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const invite = await Invitation.findById(req.params.id);
      if (!invite) {
        return res.status(404).json({ success: false, message: 'Invitation not found' });
      }

      invite.status = 'REVOKED';
      await invite.save();

      return res.json({
        success: true,
        message: 'Staff invitation revoked successfully',
      });
    }

    const invite = memoryInvitations.find((i) => i._id === req.params.id);
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    invite.status = 'REVOKED';
    res.json({
      success: true,
      message: 'Staff invitation revoked successfully',
    });
  } catch (error) {
    console.error('revokeInvitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke invitation' });
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
    const storeId = req.storeId || req.user.store || 'store_demo_freshmart';

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const allowedRole = ['STORE_OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'CASHIER'].includes(role)
        ? role
        : 'CASHIER';

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: allowedRole,
        store: storeId,
        status: 'Active',
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
    }

    // Memory fallback
    const newUser = {
      _id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: role || 'CASHIER',
      store: storeId,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    memoryStaff.push(newUser);

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({
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

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Prevent admin/owner from disabling or demoting themselves
      if (user._id.toString() === req.user._id.toString()) {
        if (status && status !== 'Active') {
          return res.status(400).json({
            success: false,
            message: 'You cannot disable your own administrator account',
          });
        }
        if (role && !['ADMIN', 'STORE_OWNER'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'You cannot demote your own administrator role',
          });
        }
      }

      if (name) user.name = name.trim();
      if (role && ['STORE_OWNER', 'ADMIN', 'INVENTORY_MANAGER', 'CASHIER'].includes(role)) user.role = role;
      if (status && ['Active', 'Disabled'].includes(status)) user.status = status;
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
          updatedAt: user.updatedAt,
        },
      });
    }

    // Memory fallback
    const user = memoryStaff.find((u) => u._id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (status) user.status = status;

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({
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
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
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
    }

    const index = memoryStaff.findIndex((u) => u._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    memoryStaff.splice(index, 1);
    res.json({
      success: true,
      message: 'Staff user deleted successfully',
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({
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
