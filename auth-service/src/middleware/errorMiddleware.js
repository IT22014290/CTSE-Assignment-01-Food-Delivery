const { sendResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  return sendResponse(
    res,
    statusCode,
    false,
    {},
    err.message || 'Internal server error'
  );
}

module.exports = { errorHandler };
