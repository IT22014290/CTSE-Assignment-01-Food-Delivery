const sendResponse = (res, statusCode, success, data, message) => {
  return res.status(statusCode).json({
    success,
    data,
    message
  });
};//hello

module.exports = { sendResponse };
