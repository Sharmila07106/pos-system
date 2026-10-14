const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'GLOBAL_PLATFORM_CONFIG',
      unique: true,
      index: true,
    },
    accentColor: {
      type: String,
      default: '#0FA38F',
      trim: true,
    },
    presetName: {
      type: String,
      default: 'Teal Elegance',
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
