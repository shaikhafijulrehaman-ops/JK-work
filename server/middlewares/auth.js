const jwt = require('jsonwebtoken');
const db = require('../db');

/**
 * Middleware to verify JWT Access Token from cookies or Authorization header
 */
exports.protect = async (req, res, next) => {
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
    
    // Verify user exists in the database and is not soft-deleted
    const user = await db.user.findFirst({
      where: { id: decoded.userId, isDeleted: false }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Your user profile could not be verified in the database. Please register or log in again.'
      });
    }

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
