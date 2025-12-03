const jwt = require('jsonwebtoken');
const { query, pool } = require('../database/connection');
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

    const hydrateUser = async () => {
      const result = await query(
        'SELECT id, email, name, role, status, enterprise_id, site_id FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        throw new AppError('The user belonging to this token no longer exists.', 401);
      }

      user = result.rows[0];
      await cache.set(`user:${decoded.id}`, user, 3600);
    };

    if (!user || !user.role) {
      await hydrateUser();
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // Attach user to request
    req.user = user;
    
    // Note: RLS (Row-Level Security) context setting removed
    // RLS policies will use req.user.id from application context
    // SET LOCAL app.current_user_id requires transaction context per-query
    
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
    const { role } = req.user || {};

    // Allow superadmin to bypass explicit role checks to retain full access
    if (role === 'superadmin') {
      return next();
    }

    if (!roles.includes(role)) {
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

      if (!user || !user.role) {
        const result = await query(
          'SELECT id, email, name, role, status, enterprise_id, site_id FROM users WHERE id = $1',
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

// Check if user has specific permissions
const requirePermissions = (...permissionSlugs) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
      throw new AppError('Authentication required.', 401);
    }

    // SuperAdmin bypasses all permission checks
    const roleCheck = await query(
      `SELECT sr.is_workix_role, sr.slug
       FROM users u
       JOIN system_roles sr ON u.system_role_id = sr.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (roleCheck.rows.length > 0 && roleCheck.rows[0].slug === 'superadmin') {
      return next();
    }

    // Check if user has any of the required permissions through role or direct assignment
    const result = await query(
      `SELECT DISTINCT p.slug
       FROM permissions p
       WHERE p.slug = ANY($1)
       AND (
         -- Permission through role
         EXISTS (
           SELECT 1 FROM users u
           JOIN role_permissions rp ON u.system_role_id = rp.system_role_id
           WHERE u.id = $2 AND rp.permission_id = p.id AND rp.granted = true
         )
         -- Or direct user permission
         OR EXISTS (
           SELECT 1 FROM user_permissions up
           WHERE up.user_id = $2 AND up.permission_id = p.id 
           AND up.granted = true
           AND (up.expires_at IS NULL OR up.expires_at > NOW())
         )
       )`,
      [permissionSlugs, req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }

    next();
  });
};

module.exports = {
  verifyToken,
  restrictTo,
  optionalAuth,
  requirePermissions,
};

