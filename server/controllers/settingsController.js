const Settings = require('../models/Settings');
const Store = require('../models/Store');
const asyncHandler = require('express-async-handler');

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private
const getSettings = asyncHandler(async (req, res) => {
  const storeId = req.storeId || req.user.store?._id || req.user.store;

  if (!storeId) {
    return res.json({
      success: true,
      data: {
        storeName: 'StoreFlow POS',
        address: '',
        phone: '',
        taxRatePercent: 5,
        currency: 'INR',
        receiptFooter: 'Thank you for shopping with us!',
      },
    });
  }

  let settings = await Settings.findOne({ store: storeId });
  if (!settings) {
    const store = await Store.findById(storeId);
    settings = await Settings.create({
      store: storeId,
      storeName: store?.name || 'Supermarket Store',
      address: store?.address || '',
      phone: store?.phone || '',
      taxRatePercent: 5,
      currency: 'INR',
      receiptFooter: `Thank you for shopping at ${store?.name || 'our store'}!`,
    });
  }

  return res.json({ success: true, data: settings });
});

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private (Store Owner / Admin Only)
const updateSettings = asyncHandler(async (req, res) => {
  const storeId = req.storeId || req.user.store?._id || req.user.store;

  if (!storeId) {
    res.status(403);
    throw new Error('Supermarket store context required to update settings');
  }

  let settings = await Settings.findOne({ store: storeId });
  if (!settings) {
    settings = new Settings({ store: storeId });
  }

  if (req.body.storeName !== undefined) settings.storeName = req.body.storeName;
  if (req.body.address !== undefined) settings.address = req.body.address;
  if (req.body.phone !== undefined) settings.phone = req.body.phone;
  if (req.body.taxRatePercent !== undefined) settings.taxRatePercent = req.body.taxRatePercent;
  if (req.body.currency !== undefined) settings.currency = req.body.currency;
  if (req.body.receiptFooter !== undefined) settings.receiptFooter = req.body.receiptFooter;
  if (req.body.lowStockThresholdGlobal !== undefined) settings.lowStockThresholdGlobal = req.body.lowStockThresholdGlobal;
  const updatedSettings = await settings.save();

  // Keep Store model in sync for receipt snapshots
  if (req.body.taxRatePercent !== undefined || req.body.receiptFooter !== undefined) {
    await Store.findByIdAndUpdate(storeId, {
      ...(req.body.taxRatePercent !== undefined && { taxRatePercent: req.body.taxRatePercent }),
      ...(req.body.receiptFooter !== undefined && { receiptFooter: req.body.receiptFooter }),
    }).catch(() => {});
  }

  return res.json({ success: true, data: updatedSettings });
});

module.exports = { getSettings, updateSettings };
