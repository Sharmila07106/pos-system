const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

const Product = require('../models/Product');
const { getSuggestedProductImage } = require('../utils/productImage');

async function backfill() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/storeflow';
  console.log(`Connecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  const products = await Product.find({});
  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;
  for (const product of products) {
    let changed = false;
    if (!product.imageUrl || product.imageUrl === '') {
      const suggested = getSuggestedProductImage(product.name, product.category);
      product.imageUrl = suggested;
      changed = true;
    }
    if (!product.image || product.image === '') {
      product.image = product.imageUrl;
      changed = true;
    }
    if (changed) {
      await product.save();
      updatedCount++;
      console.log(`✔ Backfilled [${product.name}] (${product.category}) -> ${product.imageUrl}`);
    } else {
      console.log(`- Product [${product.name}] already has image: ${product.imageUrl}`);
    }
  }

  console.log(`Finished! Backfilled ${updatedCount} products.`);
  await mongoose.disconnect();
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
