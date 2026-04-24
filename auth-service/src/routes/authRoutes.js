const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendResponse } = require('../utils/response');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: {},
    message: 'Too many login attempts, please try again later.'
  }
});

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, { errors: errors.array() }, 'Validation error');
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

router.get('/health', (req, res) => {
  return res.json({ status: 'ok' });
});

router.post(
  '/auth/register',
  validate([
    body('name').isString().trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['customer', 'restaurant_owner', 'delivery_driver', 'admin'])
  ]),
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return sendResponse(res, 409, false, {}, 'User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'customer'
      });

      const token = generateToken(user);

      return sendResponse(
        res,
        201,
        true,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        },
        'User registered successfully'
      );
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/auth/login',
  loginLimiter,
  validate([body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return sendResponse(res, 401, false, {}, 'Invalid credentials');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendResponse(res, 401, false, {}, 'Invalid credentials');
      }

      const token = generateToken(user);

      return sendResponse(
        res,
        200,
        true,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        },
        'Login successful'
      );
    } catch (error) {
      next(error);
    }
  }
);

router.post('/auth/logout', (req, res) => {
  return sendResponse(res, 200, true, {}, 'Logout successful');
});

router.get('/auth/validate-token', requireAuth, async (req, res) => {
  return sendResponse(
    res,
    200,
    true,
    {
      user: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role
      }
    },
    'Token is valid'
  );
});

router.get('/auth/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return sendResponse(res, 404, false, {}, 'User not found');
    }

    return sendResponse(res, 200, true, user, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
});

router.put(
  '/auth/profile',
  requireAuth,
  validate([
    body('name').optional().isString().trim().isLength({ min: 2 }),
    body('password').optional().isString().isLength({ min: 6 })
  ]),
  async (req, res, next) => {
    try {
      const { name, password } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (password) updates.password = await bcrypt.hash(password, 10);

      const user = await User.findByIdAndUpdate(req.user.userId, updates, {
        new: true
      }).select('-password');

      return sendResponse(res, 200, true, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
