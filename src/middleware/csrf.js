const crypto = require('crypto');

/**
 * Simple CSRF token middleware
 * Note: This is a basic implementation. For production, consider using
 * a more robust solution like @fastify/csrf-protection or similar modern alternatives
 */

// Generate a CSRF token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to generate and attach CSRF token to session
const csrfProtection = (req, res, next) => {
  // Only apply to non-GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  try {
    // For API requests, check the origin header
    const origin = req.get('origin');
    const host = req.get('host');
    
    // If there's an origin header, validate it matches our host
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({ 
            success: false, 
            message: 'CSRF validation failed: Invalid origin' 
          });
        }
      } catch (urlError) {
        // Malformed origin header
        return res.status(403).json({ 
          success: false, 
          message: 'CSRF validation failed: Invalid origin format' 
        });
      }
    }

    // For browser-based requests, ensure referrer is from same origin
    const referer = req.get('referer');
    if (referer) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) {
          return res.status(403).json({ 
            success: false, 
            message: 'CSRF validation failed: Invalid referer' 
          });
        }
      } catch (urlError) {
        // Malformed referer header
        return res.status(403).json({ 
          success: false, 
          message: 'CSRF validation failed: Invalid referer format' 
        });
      }
    }

    next();
  } catch (error) {
    // Catch any unexpected errors
    console.error('CSRF middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during CSRF validation' 
    });
  }
};

// Middleware to initialize CSRF token in session
const initCsrfToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

module.exports = {
  generateToken,
  csrfProtection,
  initCsrfToken
};
