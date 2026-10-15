const express = require('express');
const router = express.Router();
const ProductImage = require('../models/ProductImage');

// @desc    Serve product image directly from MongoDB
// @route   GET /api/images/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      return res.status(404).json({ success: false, message: 'Invalid image ID' });
    }

    const imageDoc = await ProductImage.findById(id);
    if (!imageDoc || !imageDoc.data) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Set immutable cache headers for fast CDN and browser delivery
    res.setHeader('Content-Type', imageDoc.contentType || 'image/jpeg');
    res.setHeader('Content-Length', imageDoc.size || imageDoc.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return res.end(imageDoc.data);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
