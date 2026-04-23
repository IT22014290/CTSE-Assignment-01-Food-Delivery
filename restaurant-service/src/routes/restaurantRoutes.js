const express = require('express');
const { body, validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
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

router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

router.get('/restaurants', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const query = {};

    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    const restaurants = await Restaurant.find(query).sort({ createdAt: -1 });
    return sendResponse(res, 200, true, restaurants, 'Restaurants fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.get('/restaurants/:id', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return sendResponse(res, 404, false, {}, 'Restaurant not found');
    }
    return sendResponse(res, 200, true, restaurant, 'Restaurant fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/restaurants',
  requireAuth,
  requireRole(['restaurant_owner']),
  validate([
    body('name').isString().trim().notEmpty(),
    body('category').isString().trim().notEmpty(),
    body('address').isString().trim().notEmpty(),
    body('description').optional().isString().trim()
  ]),
  async (req, res, next) => {
    try {
      const restaurant = await Restaurant.create({
        ...req.body,
        ownerId: req.user.userId
      });

      return sendResponse(res, 201, true, restaurant, 'Restaurant created successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/restaurants/:id',
  requireAuth,
  requireRole(['restaurant_owner']),
  validate([
    body('name').optional().isString().trim().notEmpty(),
    body('category').optional().isString().trim().notEmpty(),
    body('address').optional().isString().trim().notEmpty(),
    body('description').optional().isString().trim()
  ]),
  async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);

      if (!restaurant) {
        return sendResponse(res, 404, false, {}, 'Restaurant not found');
      }

      if (restaurant.ownerId !== req.user.userId) {
        return sendResponse(res, 403, false, {}, 'You can only update your own restaurant');
      }

      Object.assign(restaurant, req.body);
      await restaurant.save();

      return sendResponse(res, 200, true, restaurant, 'Restaurant updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.get('/restaurants/:id/menu', async (req, res, next) => {
  try {
    const items = await MenuItem.find({ restaurantId: req.params.id });
    return sendResponse(res, 200, true, items, 'Menu fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/restaurants/:id/menu',
  requireAuth,
  requireRole(['restaurant_owner']),
  validate([
    body('name').isString().trim().notEmpty(),
    body('category').isString().trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('description').optional().isString().trim()
  ]),
  async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);

      if (!restaurant) {
        return sendResponse(res, 404, false, {}, 'Restaurant not found');
      }

      if (restaurant.ownerId !== req.user.userId) {
        return sendResponse(res, 403, false, {}, 'You can only manage your own restaurant menu');
      }

      const item = await MenuItem.create({
        ...req.body,
        restaurantId: req.params.id
      });

      return sendResponse(res, 201, true, item, 'Menu item created successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/restaurants/:id/menu/:itemId',
  requireAuth,
  requireRole(['restaurant_owner']),
  validate([
    body('name').optional().isString().trim().notEmpty(),
    body('category').optional().isString().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional().isString().trim(),
    body('isAvailable').optional().isBoolean()
  ]),
  async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);

      if (!restaurant) {
        return sendResponse(res, 404, false, {}, 'Restaurant not found');
      }

      if (restaurant.ownerId !== req.user.userId) {
        return sendResponse(res, 403, false, {}, 'You can only manage your own restaurant menu');
      }

      const item = await MenuItem.findOneAndUpdate(
        { _id: req.params.itemId, restaurantId: req.params.id },
        req.body,
        { new: true }
      );

      if (!item) {
        return sendResponse(res, 404, false, {}, 'Menu item not found');
      }

      return sendResponse(res, 200, true, item, 'Menu item updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/restaurants/:id/menu/:itemId',
  requireAuth,
  requireRole(['restaurant_owner']),
  async (req, res, next) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);

      if (!restaurant) {
        return sendResponse(res, 404, false, {}, 'Restaurant not found');
      }

      if (restaurant.ownerId !== req.user.userId) {
        return sendResponse(res, 403, false, {}, 'You can only manage your own restaurant menu');
      }

      const item = await MenuItem.findOneAndDelete({
        _id: req.params.itemId,
        restaurantId: req.params.id
      });

      if (!item) {
        return sendResponse(res, 404, false, {}, 'Menu item not found');
      }

      return sendResponse(res, 200, true, item, 'Menu item deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
