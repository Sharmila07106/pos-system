const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const {
  protect,
  requireActiveStore,
  storeOwnerOnly,
} = require('../middleware/authMiddleware');

router.use(protect);
router.use(requireActiveStore);

router.route('/')
  .get(getSettings)
  .put(storeOwnerOnly, updateSettings);

module.exports = router;
