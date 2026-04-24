const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { sendResponse } = require('../utils/response');
const { requireAuth, requireRole } = require('../middleware/authProxy');

const router = express.Router();

const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, { errors: errors.array() }, 'Validation error');
  }
  next();
};

async function verifyRestaurantAndItems(restaurantId, items) {
  const restaurantRes = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/restaurants/${restaurantId}`);

  if (!restaurantRes.data.success) {
    throw new Error('Restaurant verification failed');
  }

  const menuRes = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/restaurants/${restaurantId}/menu`);
  const menu = menuRes.data.data;

  const menuById = new Map(menu.map((item) => [String(item._id), item]));

  const normalizedItems = items.map((item) => {
    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem || menuItem.isAvailable === false) {
      throw new Error(`Invalid or unavailable menu item: ${item.menuItemId}`);
    }

    return {
      menuItemId: item.menuItemId,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price
    };
  });

  return normalizedItems;
}

async function publishOrderEvent(eventType, payload) {
  if (!process.env.NOTIFICATION_SERVICE_URL) return;

  try {
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/notifications/order-events`, {
      eventType,
      payload
    });
  } catch (error) {
    console.warn('Failed to publish order event:', error.message);
  }
}

router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

router.post(
  '/orders',
  requireAuth,
  requireRole(['customer']),
  validate([
    body('restaurantId').isString().notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isString().notEmpty(),
    body('items.*.quantity').isInt({ min: 1 })
  ]),
  async (req, res, next) => {
    try {
      const { restaurantId, items } = req.body;

      const normalizedItems = await verifyRestaurantAndItems(restaurantId, items);
      const totalAmount = normalizedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const order = await Order.create({
        customerId: req.user.userId,
        restaurantId,
        items: normalizedItems,
        totalAmount,
        status: 'pending'
      });

      await publishOrderEvent('order_created', { orderId: order._id, status: order.status });

      return sendResponse(res, 201, true, order, 'Order placed successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId }).sort({ createdAt: -1 });
    return sendResponse(res, 200, true, orders, 'Orders fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.get(
  '/orders/ready',
  requireAuth,
  requireRole(['delivery_driver', 'admin']),
  async (req, res, next) => {
    try {
      const orders = await Order.find({ status: 'ready' }).sort({ createdAt: -1 });
      return sendResponse(res, 200, true, orders, 'Ready orders fetched successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/orders/restaurant/:restaurantId',
  requireAuth,
  requireRole(['restaurant_owner']),
  async (req, res, next) => {
    try {
      const orders = await Order.find({ restaurantId: req.params.restaurantId }).sort({ createdAt: -1 });
      return sendResponse(res, 200, true, orders, 'Restaurant orders fetched successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/orders/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendResponse(res, 404, false, {}, 'Order not found');
    }

    const isOwner = req.user.role === 'restaurant_owner';
    const isDriver = req.user.role === 'delivery_driver';
    const isCustomer = req.user.userId === order.customerId;

    if (!isOwner && !isDriver && !isCustomer && req.user.role !== 'admin') {
      return sendResponse(res, 403, false, {}, 'Forbidden');
    }

    return sendResponse(res, 200, true, order, 'Order fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.put(
  '/orders/:id/status',
  requireAuth,
  requireRole(['restaurant_owner', 'delivery_driver', 'admin']),
  validate([body('status').isIn(ORDER_STATUS_FLOW)]),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return sendResponse(res, 404, false, {}, 'Order not found');
      }

      const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
      const newIndex = ORDER_STATUS_FLOW.indexOf(status);

      if (newIndex < currentIndex) {
        return sendResponse(res, 400, false, {}, 'Cannot move order status backwards');
      }

      order.status = status;
      await order.save();

      await publishOrderEvent('order_status_updated', {
        orderId: order._id,
        status: order.status
      });

      return sendResponse(res, 200, true, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
