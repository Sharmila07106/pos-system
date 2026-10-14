const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');
const ActivityLog = require('../models/ActivityLog');

// Generate unique ticket number
const generateTicketNo = async () => {
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const candidate = `TK-${num}`;
    const exists = await Complaint.findOne({ ticketNo: candidate });
    if (!exists) return candidate;
  }
  return `TK-${Date.now().toString().slice(-6)}`;
};

// @desc    Raise a support ticket / complaint from store
// @route   POST /api/support/complaints
// @access  Private (Store Staff / Owner)
const raiseComplaint = async (req, res) => {
  try {
    const { subject, category, priority, description, attachments = [] } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const validCategories = ['BILLING', 'INVENTORY', 'HARDWARE', 'ACCOUNT', 'COMPLIANCE', 'OTHER'];
    const selectedCategory = validCategories.includes(category) ? category : 'OTHER';

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const selectedPriority = validPriorities.includes(priority) ? priority : 'MEDIUM';

    const ticketNo = await generateTicketNo();
    const storeId = req.storeId || req.user.store?._id || req.user.store || null;

    const complaint = await Complaint.create({
      ticketNo,
      store: storeId,
      raisedBy: req.user._id,
      subject: subject.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      description: description.trim(),
      status: 'OPEN',
      messages: [
        {
          sender: req.user._id,
          senderRole: req.user.role,
          message: description.trim(),
          attachments,
          createdAt: new Date(),
        },
      ],
      statusHistory: [
        {
          status: 'OPEN',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: 'Ticket created',
        },
      ],
    });

    await ActivityLog.create({
      actor: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      store: storeId,
      action: 'COMPLAINT_CREATED',
      targetType: 'Complaint',
      targetId: complaint._id.toString(),
      details: { ticketNo, subject: complaint.subject, priority: complaint.priority },
      ipAddress: req.ip || '',
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Support ticket #${ticketNo} created successfully`,
      data: complaint,
    });
  } catch (error) {
    console.error('raiseComplaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit support ticket',
    });
  }
};

// @desc    Get tickets for current store
// @route   GET /api/support/complaints
// @access  Private (Store Staff / Owner)
const getStoreComplaints = async (req, res) => {
  try {
    const storeId = req.storeId || req.user.store?._id || req.user.store;
    const { status, category, priority, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (req.user.role !== 'PLATFORM_ADMIN') {
      if (!storeId) {
        return res.json({ success: true, count: 0, total: 0, data: [] });
      }
      filter.store = storeId;
    }

    if (status && status !== 'ALL') filter.status = status;
    if (category && category !== 'ALL') filter.category = category;
    if (priority && priority !== 'ALL') filter.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
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
    console.error('getStoreComplaints error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to list complaints',
    });
  }
};

// @desc    Get detailed complaint by ID for store
// @route   GET /api/support/complaints/:id
// @access  Private (Store Staff / Owner)
const getStoreComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('store', 'name storeCode')
      .populate('raisedBy', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Tenant check
    if (
      req.user.role !== 'PLATFORM_ADMIN' &&
      complaint.store?._id?.toString() !== req.storeId &&
      complaint.store?.toString() !== req.storeId
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this ticket' });
    }

    return res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error('getStoreComplaintById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve ticket',
    });
  }
};

// @desc    Reply to complaint thread from store
// @route   POST /api/support/complaints/:id/messages
// @access  Private (Store Staff / Owner)
const replyStoreComplaint = async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Tenant check
    if (
      req.user.role !== 'PLATFORM_ADMIN' &&
      complaint.store?.toString() !== req.storeId
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this ticket' });
    }

    complaint.messages.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
      attachments,
      createdAt: new Date(),
    });

    if (complaint.status === 'RESOLVED') {
      complaint.status = 'IN_PROGRESS';
      complaint.statusHistory.push({
        status: 'IN_PROGRESS',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: 'Ticket reopened with new store message',
      });
    }

    await complaint.save();

    return res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: complaint,
    });
  } catch (error) {
    console.error('replyStoreComplaint error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to reply to ticket',
    });
  }
};

// @desc    Get active announcements for store staff
// @route   GET /api/support/announcements
// @access  Private
const getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      startsAt: { $lte: now },
      $or: [{ endsAt: null }, { endsAt: { $gte: now } }],
    };

    if (req.user.role !== 'PLATFORM_ADMIN') {
      filter.targetAudience = { $in: ['ALL', 'STORES', 'STAFF'] };
    }

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error('getActiveAnnouncements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve announcements',
    });
  }
};

module.exports = {
  raiseComplaint,
  getStoreComplaints,
  getStoreComplaintById,
  replyStoreComplaint,
  getActiveAnnouncements,
};
