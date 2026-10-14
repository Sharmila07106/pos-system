const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const StoreApplication = require('../models/StoreApplication');
const Store = require('../models/Store');
const AuditLog = require('../models/AuditLog');

// In-memory store applications fallback for offline/development mode
const memoryApplications = [
  {
    _id: 'app_demo_01',
    applicationId: 'APP-10001',
    businessName: 'GreenMart Organics',
    ownerName: 'Venkatesh Rao',
    email: 'owner@greenmart.com',
    phone: '+91 98401 23456',
    address: '45, Anna Salai, T. Nagar',
    city: 'Chennai',
    storeType: 'Supermarket',
    storeSize: 'Medium (1000-3000 sq ft)',
    branchesCount: 2,
    registrationNumber: 'GSTIN33AAACG1234F1Z5',
    status: 'PENDING',
    reviewNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    _id: 'app_demo_02',
    applicationId: 'APP-10002',
    businessName: 'FreshBasket Hypermarket',
    ownerName: 'Ananya Sharma',
    email: 'ananya@freshbasket.in',
    phone: '+91 98840 98765',
    address: '12, OMR IT Highway, Perungudi',
    city: 'Chennai',
    storeType: 'Hypermarket',
    storeSize: 'Large (>3000 sq ft)',
    branchesCount: 1,
    registrationNumber: 'GSTIN33AABCF9876K1Z9',
    status: 'APPROVED',
    reviewNotes: 'Verified supermarket registration and authorized owner identity.',
    reviewedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

// Helper to generate unique application ID
const generateApplicationId = () => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `APP-${randomNum}`;
};

// @desc    Submit supermarket onboarding application
// @route   POST /api/onboarding/apply
// @access  Public
const submitApplication = asyncHandler(async (req, res) => {
  const {
    businessName,
    ownerName,
    email,
    phone,
    address,
    city,
    storeType,
    storeSize,
    branchesCount,
    registrationNumber,
    notes,
  } = req.body;

  if (!businessName || !ownerName || !email || !phone || !address || !city) {
    res.status(400);
    throw new Error('Please fill in all required business and owner contact fields.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const appId = generateApplicationId();

  if (mongoose.connection.readyState === 1) {
    try {
      // Check for existing pending application with same email
      const existing = await StoreApplication.findOne({
        email: normalizedEmail,
        status: { $in: ['PENDING', 'UNDER_REVIEW'] }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: `An application with email ${normalizedEmail} is already pending review (ID: ${existing.applicationId}).`,
          applicationId: existing.applicationId,
        });
      }

      const application = await StoreApplication.create({
        applicationId: appId,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        storeType: storeType || 'Supermarket',
        storeSize: storeSize || 'Medium (1000-3000 sq ft)',
        branchesCount: Number(branchesCount) || 1,
        registrationNumber: registrationNumber ? registrationNumber.trim() : '',
        notes: notes ? notes.trim() : '',
        status: 'PENDING',
      });

      return res.status(201).json({
        success: true,
        message: 'Your supermarket registration application has been submitted successfully for review.',
        applicationId: application.applicationId,
        data: application,
      });
    } catch (err) {
      console.warn('MongoDB application submit fallback:', err.message);
    }
  }

  // Memory fallback
  const newApp = {
    _id: `app_${Date.now()}`,
    applicationId: appId,
    businessName: businessName.trim(),
    ownerName: ownerName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    address: address.trim(),
    city: city.trim(),
    storeType: storeType || 'Supermarket',
    storeSize: storeSize || 'Medium (1000-3000 sq ft)',
    branchesCount: Number(branchesCount) || 1,
    registrationNumber: registrationNumber || '',
    notes: notes || '',
    status: 'PENDING',
    reviewNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryApplications.unshift(newApp);

  res.status(201).json({
    success: true,
    message: 'Your supermarket registration application has been submitted successfully for review.',
    applicationId: newApp.applicationId,
    data: newApp,
  });
});

// @desc    Track application status by Application ID or Email
// @route   GET /api/onboarding/status/:identifier
// @access  Public
const getApplicationStatus = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const term = identifier.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const app = await StoreApplication.findOne({
        $or: [
          { applicationId: term.toUpperCase() },
          { email: term }
        ]
      }).sort({ createdAt: -1 });

      if (app) {
        return res.json({
          success: true,
          data: app,
        });
      }
    } catch (err) {
      console.warn('MongoDB application status fallback:', err.message);
    }
  }

  const found = memoryApplications.find(
    (a) => a.applicationId.toLowerCase() === term || a.email.toLowerCase() === term
  );

  if (!found) {
    res.status(404);
    throw new Error(`No application found for reference "${identifier}".`);
  }

  res.json({
    success: true,
    data: found,
  });
});

module.exports = {
  submitApplication,
  getApplicationStatus,
  memoryApplications,
};
