const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Delivery = require('../models/Delivery');
const { sendResponse } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/authProxy');

const router = express.Router();

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, { errors: errors.array() }, 'Validation error');
  }
  next();
};

async function updateOrderStatus(orderId, authHeader, status) {
  try {
    await axios.put(
      `${process.env.ORDER_SERVICE_URL}/orders/${orderId}/status`,
      { status },
      {
        headers: {
          Authorization: authHeader
        }
      }
    );
  } catch (error) {
    console.warn('Failed to update order status:', error.message);
  }
}

router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

router.post(
  '/delivery/assign',
  requireAuth,
  requireRole(['admin']),
  validate([body('orderId').isString().notEmpty(), body('driverId').isString().notEmpty()]),
  async (req, res, next) => {
    try {
      const { orderId, driverId } = req.body;

      const existing = await Delivery.findOne({ orderId });
      if (existing) {
        return sendResponse(res, 409, false, {}, 'Order already assigned');
      }

      const delivery = await Delivery.create({
        orderId,
        driverId,
        status: 'assigned'
      });

      return sendResponse(res, 201, true, delivery, 'Driver assigned successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/delivery/available',
  requireAuth,
  requireRole(['delivery_driver', 'admin']),
  async (req, res, next) => {
    try {
      const ordersRes = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/orders/ready`,
        { headers: { Authorization: req.headers.authorization } }
      );
      const readyOrders = ordersRes.data.data || [];

      const assignedOrderIds = await Delivery.distinct('orderId');
      const assignedSet = new Set(assignedOrderIds.map(String));

      const unassigned = readyOrders.filter((o) => !assignedSet.has(String(o._id)));

      // Enrich with restaurant details for pickup info
      const available = await Promise.all(
        unassigned.map(async (order) => {
          const enriched = { ...order };
          try {
            const restRes = await axios.get(
              `${process.env.RESTAURANT_SERVICE_URL}/restaurants/${order.restaurantId}`
            );
            enriched.restaurant = restRes.data.data;
          } catch {}
          return enriched;
        })
      );

      return sendResponse(res, 200, true, available, 'Available orders fetched');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/delivery/:orderId/location',
  requireAuth,
  requireRole(['delivery_driver']),
  validate([
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('status').optional().isIn(['picked_up', 'in_transit', 'delivered'])
  ]),
  async (req, res, next) => {
    try {
      const { latitude, longitude, status } = req.body;

      const delivery = await Delivery.findOne({ orderId: req.params.orderId, driverId: req.user.userId });

      if (!delivery) {
        return sendResponse(res, 404, false, {}, 'Active delivery not found');
      }

      delivery.currentLocation = {
        latitude,
        longitude,
        updatedAt: new Date()
      };

      if (status) {
        delivery.status = status;
      }

      await delivery.save();

      if (status === 'picked_up') {
        await updateOrderStatus(req.params.orderId, req.headers.authorization, 'picked_up');
      }

      if (status === 'delivered') {
        await updateOrderStatus(req.params.orderId, req.headers.authorization, 'delivered');
      }

      return sendResponse(res, 200, true, delivery, 'Delivery location updated');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/delivery/driver/active',
  requireAuth,
  requireRole(['delivery_driver']),
  async (req, res, next) => {
    try {
      const deliveries = await Delivery.find({
        driverId: req.user.userId,
        status: { $in: ['assigned', 'picked_up', 'in_transit'] }
      }).sort({ updatedAt: -1 });

      // Enrich each delivery with full order + restaurant details
      const enriched = await Promise.all(
        deliveries.map(async (delivery) => {
          const d = delivery.toObject();
          try {
            const orderRes = await axios.get(
              `${process.env.ORDER_SERVICE_URL}/orders/${delivery.orderId}`,
              { headers: { Authorization: req.headers.authorization } }
            );
            d.order = orderRes.data.data;
            if (d.order?.restaurantId) {
              try {
                const restRes = await axios.get(
                  `${process.env.RESTAURANT_SERVICE_URL}/restaurants/${d.order.restaurantId}`
                );
                d.restaurant = restRes.data.data;
              } catch {}
            }
          } catch {}
          return d;
        })
      );

      return sendResponse(res, 200, true, enriched, 'Active deliveries fetched successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/delivery/:orderId', async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });

    if (!delivery) {
      return sendResponse(res, 404, false, {}, 'Delivery record not found');
    }

    return sendResponse(res, 200, true, delivery, 'Delivery tracking fetched successfully');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
