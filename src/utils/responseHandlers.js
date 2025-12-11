// Centralized error response handler
const errorResponse = (res, statusCode, message, error = null) => {
  if (error && process.env.NODE_ENV !== 'production') {
    console.error('Error details:', error);
  }
  return res.status(statusCode).json({ 
    success: false, 
    message 
  });
};

// Centralized success response handler
const successResponse = (res, data = {}, message = null) => {
  const response = { success: true, ...data };
  if (message) {
    response.message = message;
  }
  return res.json(response);
};

// Async error wrapper to avoid try-catch in every route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorResponse,
  successResponse,
  asyncHandler
};
