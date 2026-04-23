const axios = require('axios');
const { sendResponse } = require('../utils/response');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return sendResponse(res, 401, false, {}, 'Authorization header is required');
    }

    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/auth/validate-token`, {
      headers: {
        Authorization: authHeader
      }
    });

    req.user = response.data.data.user;
    next();
  } catch (error) {
    return sendResponse(res, 401, false, {}, 'Unauthorized');
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendResponse(res, 403, false, {}, 'Forbidden: insufficient role');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
