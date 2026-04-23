const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    driverId: { type: String, required: true },
    status: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'delivered'],
      default: 'assigned'
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
