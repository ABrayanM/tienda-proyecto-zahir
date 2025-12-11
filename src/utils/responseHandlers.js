// Centralized error response handler
const errorResponse = (res, statusCode, message, error = null) => {
  // Only log error details in development, and sanitize sensitive data
  if (error && process.env.NODE_ENV !== 'production') {
    // Don't log full error objects that might contain sensitive data
    console.error('Error occurred:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
