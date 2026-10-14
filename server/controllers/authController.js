const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'storeflow-pos-secret-key-2026',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// In-memory user store when MongoDB connection is not active
const memoryUsers = [];

// Helper to query user by email across MongoDB or memory fallback
const findUserByEmail = async (email) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await User.findOne({ email });
    } catch (err) {
      console.warn('MongoDB query fallback:', err.message);
    }
  }
  return memoryUsers.find((u) => u.email === email) || null;
};

// Helper to count total registered users
const countUsers = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await User.countDocuments();
    } catch (err) {
      console.warn('MongoDB count fallback:', err.message);
    }
  }
  return memoryUsers.length;
};

// Helper to create user across MongoDB or memory fallback
const saveUser = async ({ name, email, password, role }) => {
  if (mongoose.connection.readyState === 1) {
    return await User.create({
      name,
      email,
      password,
      role,
      status: 'Active',
    });
  }

  // Fallback in-memory user with hashed password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name,
    email,
    password: hashedPassword,
    role,
    status: 'Active',
    createdAt: new Date(),
    matchPassword: async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    },
  };
  memoryUsers.push(newUser);
  return newUser;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate Name
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 60 characters',
      });
    }

    // 2. Validate Email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // 3. Validate Password (min 8 chars, at least one letter and one number)
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const passwordLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordLetterAndNumber.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one letter and one number',
      });
    }

    // 4. Check for duplicate email (return 409)
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // 5. Determine Role: first user in DB is ADMIN, subsequent public users are CASHIER
    const userCount = await countUsers();
    const assignedRole = userCount === 0 ? 'ADMIN' : 'CASHIER';

    // 6. Create User (hashes password via bcrypt)
    const user = await saveUser({
      name: trimmedName,
      email: cleanEmail,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
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
    console.error('Registration error details:', error.message || error);

    // Handle MongoDB duplicate key error code 11000 gracefully as 409
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Handle Mongoose validation errors as 400
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Contact store administrator.',
      });
    }

    // Verify password with bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
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
    console.error('Login error details:', error.message || error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
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
    console.error('getMe error details:', error.message || error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user',
    });
  }
};

// @desc    Verify invitation token and return details
// @route   GET /api/auth/invitation/:token
// @access  Public
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const Invitation = require('../models/Invitation');
    const { memoryInvitations } = require('./userController');

    let invite = null;

    if (mongoose.connection.readyState === 1) {
      invite = await Invitation.findOne({ token }).populate('store', 'name storeCode city');
    }

    if (!invite) {
      invite = memoryInvitations.find((i) => i.token === token);
    }

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or unrecognized staff invitation token.',
      });
    }

    if (invite.status === 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been accepted. Please sign in.',
      });
    }

    if (invite.status === 'REVOKED') {
      return res.status(400).json({
        success: false,
        message: 'This invitation was revoked by the store administrator.',
      });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link has expired. Please ask your store owner to resend it.',
      });
    }

    return res.json({
      success: true,
      data: {
        name: invite.name,
        email: invite.email,
        role: invite.role,
        storeName: invite.store?.name || invite.storeName || 'FreshMart Supermarket',
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error('getInvitationDetails error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify invitation token',
    });
  }
};

// @desc    Activate staff account from invitation token
// @route   POST /api/auth/activate-staff
// @access  Public
const activateStaff = async (req, res) => {
  try {
    const { token, password } = req.body;
    const Invitation = require('../models/Invitation');
    const AuditLog = require('../models/AuditLog');
    const { memoryInvitations, memoryStaff } = require('./userController');

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token and password are required',
      });
    }

    if (password.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one letter and one number',
      });
    }

    let invite = null;

    if (mongoose.connection.readyState === 1) {
      invite = await Invitation.findOne({ token });
    }

    if (!invite) {
      invite = memoryInvitations.find((i) => i.token === token);
    }

    if (!invite || invite.status !== 'PENDING' || new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or previously used invitation token.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ email: invite.email });
      if (user) {
        user.password = password;
        user.role = invite.role;
        user.store = invite.store;
        user.status = 'Active';
        await user.save();
      } else {
        user = await User.create({
          name: invite.name,
          email: invite.email,
          password,
          role: invite.role,
          store: invite.store,
          status: 'Active',
        });
      }

      invite.status = 'ACCEPTED';
      invite.acceptedAt = new Date();
      await invite.save();

      await AuditLog.create({
        store: invite.store,
        actor: user._id,
        actorName: user.name,
        actorRole: user.role,
        action: 'STAFF_ACTIVATED',
        entity: 'User',
        entityId: user._id.toString(),
        details: { email: user.email, role: user.role },
      });

      const authToken = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: `Account activated successfully! Welcome to StoreFlow, ${user.name}.`,
        token: authToken,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          store: invite.store,
          status: user.status,
        },
      });
    }

    // Memory fallback
    invite.status = 'ACCEPTED';
    invite.acceptedAt = new Date().toISOString();

    const newUser = {
      _id: `usr_${Date.now()}`,
      name: invite.name,
      email: invite.email,
      role: invite.role,
      store: invite.store || 'store_demo_freshmart',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    memoryStaff.push(newUser);
    const authToken = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: `Account activated successfully! Welcome to StoreFlow, ${newUser.name}.`,
      token: authToken,
      data: newUser,
    });
  } catch (error) {
    console.error('activateStaff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate staff account',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getInvitationDetails,
  activateStaff,
};
