const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Store = require('../models/Store');
const Settings = require('../models/Settings');
const LoginEvent = require('../models/LoginEvent');
const ActivityLog = require('../models/ActivityLog');
const Invitation = require('../models/Invitation');
const AuditLog = require('../models/AuditLog');

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

// Helper to generate a unique Store Code
const generateStoreCode = async (name) => {
  const clean = (name || 'STORE')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
  const basePrefix = clean.length >= 3 ? clean : 'STORE';
  
  for (let i = 0; i < 10; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${basePrefix}-${randomSuffix}`;
    const exists = await Store.findOne({ storeCode: candidate });
    if (!exists) return candidate;
  }
  return `${basePrefix}-${Date.now().toString().slice(-4)}`;
};

// @desc    Register a new Supermarket & Store Owner (Public, starts PENDING)
// @route   POST /api/auth/register-store
// @access  Public
const registerStore = async (req, res) => {
  try {
    const {
      ownerName,
      email,
      password,
      storeName,
      phone,
      address,
      city,
      businessType,
      gstin,
    } = req.body;

    // 1. Validate Owner Name
    if (!ownerName || typeof ownerName !== 'string' || ownerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Owner name is required (minimum 2 characters)',
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

    // 3. Validate Password
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one letter and one number',
      });
    }

    // 4. Validate Supermarket Name
    if (!storeName || typeof storeName !== 'string' || storeName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Supermarket name is required (minimum 2 characters)',
      });
    }

    // 5. Check if email is already taken
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // 6. Generate unique Store Code
    const storeCode = await generateStoreCode(storeName);

    // 7. Create Store with strict PENDING status (requires platform admin approval)
    const newStore = await Store.create({
      name: storeName.trim(),
      storeCode,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      city: city ? city.trim() : '',
      businessType: businessType || 'Supermarket',
      gstin: gstin ? gstin.trim() : '',
      status: 'PENDING',
      statusReason: 'Awaiting Platform Admin review and activation',
      requestedAt: new Date(),
    });

    // 8. Create Store Owner User
    const newUser = await User.create({
      name: ownerName.trim(),
      email: cleanEmail,
      password,
      role: 'STORE_OWNER',
      store: newStore._id,
      status: 'Active',
      isActive: true,
    });

    // Link owner to Store
    newStore.ownerUser = newUser._id;
    await newStore.save();

    // 9. Initialize Store Settings
    await Settings.create({
      store: newStore._id,
      storeName: newStore.name,
      address: newStore.address,
      phone: newStore.phone,
      taxRatePercent: 5,
      currency: 'INR',
      receiptFooter: `Thank you for shopping at ${newStore.name}!`,
    });

    // 10. Record Activity Log
    await ActivityLog.create({
      actor: newUser._id,
      actorName: newUser.name,
      actorRole: 'STORE_OWNER',
      store: newStore._id,
      action: 'STORE_REGISTRATION_SUBMITTED',
      targetType: 'Store',
      targetId: newStore._id.toString(),
      details: {
        storeName: newStore.name,
        storeCode: newStore.storeCode,
        email: cleanEmail,
      },
      ipAddress: req.ip || '',
    }).catch(() => {});

    // Generate JWT token so owner can log in to check status
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Supermarket registration submitted successfully! Your application is under review by Platform Admin.',
      token,
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        store: {
          _id: newStore._id,
          name: newStore.name,
          storeCode: newStore.storeCode,
          status: newStore.status,
          statusReason: newStore.statusReason,
          requestedAt: newStore.requestedAt,
        },
      },
    });
  } catch (error) {
    console.error('registerStore error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A store with this name or code already exists',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during supermarket registration',
    });
  }
};

// @desc    Register standard user (legacy / direct registration)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required (minimum 2 characters)',
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one letter and one number',
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'ADMIN' : 'CASHIER';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: assignedRole,
      status: 'Active',
      isActive: true,
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
    console.error('registerUser error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
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
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientUserAgent = req.headers['user-agent'] || '';

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user in MongoDB
    const user = await User.findOne({ email: cleanEmail }).populate('store');

    if (!user) {
      // Record failed login audit event
      await LoginEvent.create({
        user: null,
        role: 'GUEST',
        type: 'FAILED',
        ip: clientIp,
        userAgent: clientUserAgent,
        metadata: { attemptedEmail: cleanEmail, reason: 'User not found' },
      }).catch(() => {});

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await LoginEvent.create({
        user: user._id,
        store: user.store?._id || user.store || null,
        role: user.role,
        type: 'FAILED',
        ip: clientIp,
        userAgent: clientUserAgent,
        metadata: { attemptedEmail: cleanEmail, reason: 'Incorrect password' },
      }).catch(() => {});

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check account status
    if (user.isActive === false || user.status === 'Disabled') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact your administrator.',
      });
    }

    // Record successful login audit event
    await LoginEvent.create({
      user: user._id,
      store: user.store?._id || user.store || null,
      role: user.role,
      type: 'LOGIN',
      ip: clientIp,
      userAgent: clientUserAgent,
    }).catch(() => {});

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

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
        isPlatformAdmin: user.role === 'PLATFORM_ADMIN' || user.isPlatformAdmin === true,
        store: user.store || null,
        status: user.status,
        preferences: user.preferences,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('loginUser error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Logout user & record audit event
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const clientUserAgent = req.headers['user-agent'] || '';

    if (req.user) {
      await LoginEvent.create({
        user: req.user._id,
        store: req.user.store?._id || req.user.store || null,
        role: req.user.role,
        type: 'LOGOUT',
        ip: clientIp,
        userAgent: clientUserAgent,
      }).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('logoutUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during logout',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('store');
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
        isPlatformAdmin: user.role === 'PLATFORM_ADMIN' || user.isPlatformAdmin === true,
        store: user.store || null,
        status: user.status,
        preferences: user.preferences,
        mustChangePassword: user.mustChangePassword,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user',
    });
  }
};

// @desc    Get user preferences
// @route   GET /api/auth/preferences or /api/me/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    return res.json({
      success: true,
      data: user?.preferences || {},
    });
  } catch (error) {
    console.error('getPreferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving preferences',
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/auth/preferences or /api/me/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const { themeAccent, sidebarStyle, density, fontScale } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) user.preferences = {};
    if (themeAccent !== undefined) user.preferences.themeAccent = themeAccent;
    if (sidebarStyle !== undefined) user.preferences.sidebarStyle = sidebarStyle;
    if (density !== undefined) user.preferences.density = density;
    if (fontScale !== undefined) user.preferences.fontScale = fontScale;

    await user.save();

    return res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences,
    });
  } catch (error) {
    console.error('updatePreferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating preferences',
    });
  }
};

// @desc    Verify invitation token and return details
// @route   GET /api/auth/invitation/:token
// @access  Public
const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invitation.findOne({ token }).populate('store', 'name storeCode city');

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
        storeName: invite.store?.name || 'Supermarket',
        storeCode: invite.store?.storeCode || '',
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

    const invite = await Invitation.findOne({ token });
    if (!invite || invite.status !== 'PENDING' || new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, expired, or previously used invitation token.',
      });
    }

    let user = await User.findOne({ email: invite.email });
    if (user) {
      user.password = password;
      user.role = invite.role;
      user.store = invite.store;
      user.status = 'Active';
      user.isActive = true;
      await user.save();
    } else {
      user = await User.create({
        name: invite.name,
        email: invite.email,
        password,
        role: invite.role,
        store: invite.store,
        status: 'Active',
        isActive: true,
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
    }).catch(() => {});

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
  } catch (error) {
    console.error('activateStaff error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate staff account',
    });
  }
};

module.exports = {
  registerStore,
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getPreferences,
  updatePreferences,
  getInvitationDetails,
  activateStaff,
};
