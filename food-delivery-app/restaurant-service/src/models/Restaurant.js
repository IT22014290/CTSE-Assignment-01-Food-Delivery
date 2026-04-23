const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    ownerId: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
