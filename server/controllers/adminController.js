const mongoose = require('mongoose');
const crypto = require('crypto');
const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const LoginEvent = require('../models/LoginEvent');
const Complaint = require('../models/Complaint');
const ActivityLog = require('../models/ActivityLog');
const Announcement = require('../models/Announcement');
const Settings = require('../models/Settings');

// @desc    Platform Admin Executive Overview & Metrics
// @route   GET /api/admin/overview
// @access  Platform Admin Only
const getOverview = async (req, res) => {
  try {
    // 1. Stores breakdown by status
    const storeStatusCounts = await Store.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const storeCounts = {
      TOTAL: 0,
      PENDING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      REJECTED: 0,
    };
    storeStatusCounts.forEach((s) => {
      if (storeCounts[s._id] !== undefined) {
        storeCounts[s._id] = s.count;
      }
      storeCounts.TOTAL += s.count;
    });

    // 2. Staff counts across platform
    const staffCount = await User.countDocuments({
      role: { $in: ['STORE_OWNER', 'STORE_ADMIN', 'CASHIER', 'ADMIN', 'cashier', 'store_admin'] },
    });
    const platformAdminCount = await User.countDocuments({
      $or: [{ role: 'PLATFORM_ADMIN' }, { isPlatformAdmin: true }],
    });

    // 3. Products count across all active stores
    const totalProducts = await Product.countDocuments();

    // 4. Complaints breakdown
    const complaintCounts = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const complaintSummary = {
      TOTAL: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    complaintCounts.forEach((c) => {
      if (complaintSummary[c._id] !== undefined) {
        complaintSummary[c._id] = c.count;
      }
      complaintSummary.TOTAL += c.count;
    });

    // 5. Recent store registration requests
    const recentStores = await Store.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('ownerUser', 'name email phone lastLoginAt');

    // 6. Recent security / login events
    const recentLogins = await LoginEvent.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name email role')
      .populate('store', 'name storeCode');

    // 7. Recent platform activity audit
    const recentActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('actor', 'name email role')
      .populate('store', 'name storeCode');

    // 8. Active announcements count
    const activeAnnouncementsCount = await Announcement.countDocuments({ isActive: true });

    return res.json({
      success: true,
      data: {
        stores: storeCounts,
        users: {
          staffTotal: staffCount,
          platformAdmins: platformAdminCount,
          total: staffCount + platformAdminCount,
        },
        products: {
          totalCatalogItems: totalProducts,
        },
        complaints: complaintSummary,
        recentStores,
        recentLogins,
        recentActivity,
        activeAnnouncementsCount,
        system: {
          status: 'HEALTHY',
          database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
          timestamp: new Date().toISOString(),
          uptimeSeconds: Math.floor(process.uptime()),
        },
      },
    });
  } catch (error) {
    console.error('getOverview error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate platform overview',
    });
  }
};

// @desc    List all Supermarket Stores with search & filters
// @route   GET /api/admin/stores
// @access  Platform Admin Only
const getStores = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { storeCode: { $regex: q, $options: 'i' } },
        { city: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('ownerUser', 'name email phone lastLoginAt isActive');

    // Aggregate staff and product counts for these stores
    const storeIds = stores.map((s) => s._id);
    const [staffCounts, productCounts] = await Promise.all([
      User.aggregate([
        { $match: { store: { $in: storeIds } } },
        { $group: { _id: '$store', count: { $sum: 1 } } },
      ]),
      Product.aggregate([
        { $match: { store: { $in: storeIds } } },
        { $group: { _id: '$store', count: { $sum: 1 } } },
      ]),
    ]);

    const staffMap = {};
    staffCounts.forEach((sc) => {
      staffMap[sc._id.toString()] = sc.count;
    });

    const productMap = {};
    productCounts.forEach((pc) => {
      productMap[pc._id.toString()] = pc.count;
    });

    const enhancedStores = stores.map((s) => {
      const sObj = s.toObject();
      sObj.staffCount = staffMap[s._id.toString()] || 0;
      sObj.productCount = productMap[s._id.toString()] || 0;
      return sObj;
    });

    return res.json({
      success: true,
      count: enhancedStores.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: enhancedStores,
    });
  } catch (error) {
    console.error('getStores error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list stores',
    });
  }
};

// @desc    Get detailed Supermarket Store Profile by ID
// @route   GET /api/admin/stores/:id
// @access  Platform Admin Only
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('ownerUser', 'name email phone lastLoginAt createdAt isActive')
      .populate('reviewedBy', 'name email');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Supermarket not found',
      });
    }

    const [staffCount, productCount, complaintsCount, settings] = await Promise.all([
      User.countDocuments({ store: store._id }),
      Product.countDocuments({ store: store._id }),
      Complaint.countDocuments({ store: store._id }),
      Settings.findOne({ store: store._id }),
    ]);

    const storeObj = store.toObject();
    storeObj.staffCount = staffCount;
    storeObj.productCount = productCount;
    storeObj.complaintsCount = complaintsCount;
    storeObj.settings = settings;

    return res.json({
      success: true,
      data: storeObj,
    });
  } catch (error) {
    console.error('getStoreById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve store profile',
    });
  }
};

// @desc    Review & Update Store Status (ACTIVE, REJECTED, SUSPENDED, PENDING)
// @route   PUT /api/admin/stores/:id/status
// @access  Platform Admin Only
const updateStoreStatus = async (req, res) => {
  try {
    const { status, statusReason, notes } = req.body;

    const validStatuses = ['PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Supermarket not found',
      });
    }

    const previousStatus = store.status;
    store.status = status;
    if (statusReason !== undefined) store.statusReason = statusReason;
    if (notes !== undefined) store.notes = notes;
    store.reviewedAt = new Date();
    store.reviewedBy = req.user._id;

    await store.save();

    // If activating store, ensure store owner is active
    if (status === 'ACTIVE' && store.ownerUser) {
      await User.updateOne(
        { _id: store.ownerUser },
        { $set: { status: 'Active', isActive: true } }
      );
    }

    // Record Activity Log
    await ActivityLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      store: store._id,
      action: 'STORE_STATUS_UPDATED',
      targetType: 'Store',
      targetId: store._id.toString(),
      details: {
        storeName: store.name,
        previousStatus,
        newStatus: status,
        reason: statusReason || '',
      },
      ipAddress: req.ip || '',
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Store "${store.name}" status updated from ${previousStatus} to ${status}`,
      data: store,
    });
  } catch (error) {
    console.error('updateStoreStatus error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update store status',
    });
  }
};

// @desc    Update Store Admin Notes
// @route   PUT /api/admin/stores/:id/notes
// @access  Platform Admin Only
const updateStoreNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Supermarket not found' });
    }

    store.notes = notes || '';
    await store.save();

    return res.json({
      success: true,
      message: 'Store notes updated successfully',
      data: store,
    });
  } catch (error) {
    console.error('updateStoreNotes error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update store notes',
    });
  }
};

// @desc    Get all users across platform with search & role filters
// @route   GET /api/admin/users
// @access  Platform Admin Only
const getUsers = async (req, res) => {
  try {
    const { search, role, status, storeId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (storeId) filter.store = storeId;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('store', 'name storeCode city status');

    return res.json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list users',
    });
  }
};

// @desc    Toggle User Active / Disabled status
// @route   PUT /api/admin/users/:id/status
// @access  Platform Admin Only
const updateUserStatus = async (req, res) => {
  try {
    const { status, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Guard: Prevent disabling self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own Platform Admin account',
      });
    }

    const newActive = isActive !== undefined ? !!isActive : status === 'Active';
    user.isActive = newActive;
    user.status = newActive ? 'Active' : 'Disabled';
    await user.save();

    await ActivityLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      store: user.store,
      action: newActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role, status: user.status },
      ipAddress: req.ip || '',
    }).catch(() => {});

    return res.json({
      success: true,
      message: `User ${user.name} is now ${user.status}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user status',
    });
  }
};

// @desc    Reset User Password (generate temp password or set custom)
// @route   POST /api/admin/users/:id/reset-password
// @access  Platform Admin Only
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let tempPassword = newPassword;
    if (!tempPassword) {
      // Generate secure 10-char password with letters and numbers
      const randStr = crypto.randomBytes(4).toString('hex');
      tempPassword = `Temp${randStr}1`;
    }

    if (tempPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(tempPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one letter and number',
      });
    }

    user.password = tempPassword;
    user.mustChangePassword = true;
    await user.save();

    await ActivityLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      store: user.store,
      action: 'USER_PASSWORD_RESET',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip || '',
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Password reset successfully for ${user.email}`,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
};

// @desc    Security Access & Login Events Log
// @route   GET /api/admin/login-events
// @access  Platform Admin Only
const getLoginEvents = async (req, res) => {
  try {
    const { type, role, storeId, userId, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (type && type !== 'ALL') filter.type = type;
    if (role && role !== 'ALL') filter.role = role;
    if (storeId) filter.store = storeId;
    if (userId) filter.user = userId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await LoginEvent.countDocuments(filter);
    const events = await LoginEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email role')
      .populate('store', 'name storeCode city');

    return res.json({
      success: true,
      count: events.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: events,
    });
  } catch (error) {
    console.error('getLoginEvents error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve login events',
    });
  }
};

// @desc    Platform Audit Activity Log
// @route   GET /api/admin/activity
// @access  Platform Admin Only
const getActivityLogs = async (req, res) => {
  try {
    const { action, actorId, targetType, storeId, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (action && action !== 'ALL') filter.action = action;
    if (actorId) filter.actor = actorId;
    if (targetType) filter.targetType = targetType;
    if (storeId) filter.store = storeId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('actor', 'name email role')
      .populate('store', 'name storeCode');

    return res.json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: logs,
    });
  } catch (error) {
    console.error('getActivityLogs error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve activity logs',
    });
  }
};

// @desc    List all complaints with filters
// @route   GET /api/admin/complaints
// @access  Platform Admin Only
const getComplaints = async (req, res) => {
  try {
    const { status, category, priority, storeId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (priority && priority !== 'ALL') filter.priority = priority;
    if (storeId) filter.store = storeId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('store', 'name storeCode city phone')
      .populate('raisedBy', 'name email role')
      .populate('assignedTo', 'name email');

    return res.json({
      success: true,
      count: complaints.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: complaints,
    });
  } catch (error) {
    console.error('getComplaints error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list complaints',
    });
  }
};

// @desc    Get detailed complaint by ID
// @route   GET /api/admin/complaints/:id
// @access  Platform Admin Only
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('store', 'name storeCode city phone address')
      .populate('raisedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('messages.sender', 'name email role')
      .populate('statusHistory.changedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    return res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error('getComplaintById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve complaint',
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/admin/complaints/:id/status
// @access  Platform Admin Only
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    const prevStatus = complaint.status;
    complaint.status = status;
    if (status === 'RESOLVED' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }

    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Status changed from ${prevStatus} to ${status}`,
    });

    await complaint.save();

    await ActivityLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      store: complaint.store,
      action: 'COMPLAINT_STATUS_UPDATED',
      targetType: 'Complaint',
      targetId: complaint._id.toString(),
      details: { ticketNo: complaint.ticketNo, from: prevStatus, to: status },
      ipAddress: req.ip || '',
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Ticket #${complaint.ticketNo} status updated to ${status}`,
      data: complaint,
    });
  } catch (error) {
    console.error('updateComplaintStatus error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update complaint status',
    });
  }
};

// @desc    Assign complaint to Platform Admin staff
// @route   PUT /api/admin/complaints/:id/assign
// @access  Platform Admin Only
const assignComplaint = async (req, res) => {
  try {
    const { assignedToUserId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    complaint.assignedTo = assignedToUserId || req.user._id;
    if (complaint.status === 'OPEN') {
      complaint.status = 'IN_PROGRESS';
    }

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: `Assigned ticket to admin user ${assignedToUserId || req.user._id}`,
    });

    await complaint.save();

    return res.json({
      success: true,
      message: `Ticket #${complaint.ticketNo} assigned successfully`,
      data: complaint,
    });
  } catch (error) {
    console.error('assignComplaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign complaint',
    });
  }
};

// @desc    Add message to complaint thread (Platform Admin response)
// @route   POST /api/admin/complaints/:id/messages
// @access  Platform Admin Only
const addComplaintMessage = async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint ticket not found' });
    }

    complaint.messages.push({
      sender: req.user._id,
      senderRole: 'PLATFORM_ADMIN',
      message: message.trim(),
      attachments,
      createdAt: new Date(),
    });

    if (complaint.status === 'OPEN') {
      complaint.status = 'IN_PROGRESS';
    }

    await complaint.save();

    return res.status(201).json({
      success: true,
      message: 'Response message posted successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('addComplaintMessage error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
};

// @desc    Announcements CRUD
// @route   GET /api/admin/announcements
// @access  Platform Admin Only
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    return res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('getAnnouncements error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list announcements',
    });
  }
};

// @desc    Create Announcement
// @route   POST /api/admin/announcements
// @access  Platform Admin Only
const createAnnouncement = async (req, res) => {
  try {
    const { title, body, severity, targetAudience, startsAt, endsAt, isActive } = req.body;
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and announcement body are required',
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      body: body.trim(),
      severity: severity || 'INFO',
      targetAudience: targetAudience || 'ALL',
      startsAt: startsAt || new Date(),
      endsAt: endsAt || null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: announcement,
    });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create announcement',
    });
  }
};

// @desc    Update Announcement
// @route   PUT /api/admin/announcements/:id
// @access  Platform Admin Only
const updateAnnouncement = async (req, res) => {
  try {
    const { title, body, severity, targetAudience, startsAt, endsAt, isActive } = req.body;
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title !== undefined) announcement.title = title.trim();
    if (body !== undefined) announcement.body = body.trim();
    if (severity !== undefined) announcement.severity = severity;
    if (targetAudience !== undefined) announcement.targetAudience = targetAudience;
    if (startsAt !== undefined) announcement.startsAt = startsAt;
    if (endsAt !== undefined) announcement.endsAt = endsAt;
    if (isActive !== undefined) announcement.isActive = isActive;

    await announcement.save();

    return res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement,
    });
  } catch (error) {
    console.error('updateAnnouncement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update announcement',
    });
  }
};

// @desc    Delete Announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Platform Admin Only
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.deleteOne();

    return res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete announcement',
    });
  }
};

module.exports = {
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
};
