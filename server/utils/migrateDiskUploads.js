const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');

/**
 * One-time migration: migrates any legacy files stored in server/uploads/ into MongoDB
 * and updates Product.imageUrl and Product.image to point to /api/images/<id>
 */
async function migrateDiskUploads() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) return;

  const products = await Product.find({
    $or: [
      { imageUrl: { $regex: /^\/uploads\// } },
      { image: { $regex: /^\/uploads\// } },
    ],
  });

  if (products.length === 0) return;

  console.log(`[MIGRATION] Found ${products.length} products with legacy disk uploads. Migrating to MongoDB...`);

  for (const product of products) {
    const rawPath = (product.imageUrl || product.image || '').replace(/^\/uploads\//, '');
    const diskPath = path.join(uploadsDir, rawPath);

    if (fs.existsSync(diskPath)) {
      try {
        const fileBuffer = fs.readFileSync(diskPath);
        const ext = path.extname(diskPath).toLowerCase();
        const mimeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
        };
        const contentType = mimeMap[ext] || 'image/jpeg';

        const imageDoc = await ProductImage.create({
          store: product.store,
          product: product._id,
          filename: path.basename(diskPath),
          contentType,
          size: fileBuffer.length,
          data: fileBuffer,
        });

        const newUrl = `/api/images/${imageDoc._id}`;
        product.imageUrl = newUrl;
        product.image = newUrl;
        await product.save();

        console.log(`[MIGRATED] ${product.name} -> ${newUrl}`);
      } catch (err) {
        console.warn(`[MIGRATION ERROR] Could not migrate ${diskPath}:`, err.message);
      }
    }
  }

  console.log('[MIGRATION] Disk uploads migration completed.');
}

module.exports = { migrateDiskUploads };
