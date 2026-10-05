const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  res.json({ success: true, data: settings });
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  
  settings.storeName = req.body.storeName || settings.storeName;
  settings.address = req.body.address || settings.address;
  settings.phone = req.body.phone || settings.phone;
  settings.taxRatePercent = req.body.taxRatePercent !== undefined ? req.body.taxRatePercent : settings.taxRatePercent;
  settings.currency = req.body.currency || settings.currency;
  settings.receiptFooter = req.body.receiptFooter || settings.receiptFooter;
  
  const updatedSettings = await settings.save();
  res.json({ success: true, data: updatedSettings });
});

module.exports = { getSettings, updateSettings };
