const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { AppError, asyncHandler } = require('./errorHandler');
const { cache } = require('../config/redis');

// Verify JWT token
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You are not logged in. Please log in to access this resource.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists in cache first
    let user = await cache.get(`user:${decoded.id}`);

    if (!user) {
      // Fetch from database
      const result = await query(
        'SELECT id, email, name, role, status FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('The user belonging to this token no longer exists.', 401);
      }

      user = result.rows[0];

      // Cache user data for 1 hour
      await cache.set(`user:${decoded.id}`, user, 3600);
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token. Please log in again.', 401);
    } else if (error.name === 'TokenExpiredError') {
      throw new AppError('Your token has expired. Please log in again.', 401);
    }
    throw error;
  }
});

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }
    next();
  };
};

// Optional authentication (doesn't throw error if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = await cache.get(`user:${decoded.id}`);
      
      if (!user) {
        const result = await query(
          'SELECT id, email, name, role, status FROM users WHERE id = $1',
          [decoded.id]
        );
        if (result.rows.length > 0) {
          user = result.rows[0];
          await cache.set(`user:${decoded.id}`, user, 3600);
        }
      }

      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (error) {
      // Silently fail for optional auth
    }
  }

  next();
});

module.exports = {
  verifyToken,
  restrictTo,
  optionalAuth,
};

