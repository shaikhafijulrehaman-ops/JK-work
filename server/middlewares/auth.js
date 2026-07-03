const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT Access Token from cookies or Authorization header
 */
exports.protect = (req, res, next) => {
  let token = null;

  // 1. Check HttpOnly cookies first
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  // 2. Fallback to Authorization Header (Bearer Token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You are not logged in. Please log in to gain access.'
    });
  }

  try {
    // Verify Access Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user payload to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your login token has expired or is invalid. Please log in again.'
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * @param  {...string} roles - Permitted roles (USER, WORKER, ADMIN)
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to perform this action.'
      });
    }
    next();
  };
};
