const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all permissions
router.get(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { category } = req.query;
    
    let permQuery = `
      SELECT id, name, slug, resource, action, description, category
      FROM permissions
      ORDER BY category, name
    `;
    
    const params = [];
    if (category && category !== 'all') {
      permQuery = `
        SELECT id, name, slug, resource, action, description, category
        FROM permissions
        WHERE category = $1
        ORDER BY name
      `;
      params.push(category);
    }

    const permissions = await query(permQuery, params);

    res.json({
      success: true,
      count: permissions.rows.length,
      data: permissions.rows
    });
  })
);

// Get permission categories
router.get(
  '/categories',
  verifyToken,
  asyncHandler(async (req, res) => {
    const categories = await query(
      `SELECT DISTINCT category FROM permissions ORDER BY category`
    );

    res.json({
      success: true,
      data: categories.rows.map(row => row.category)
    });
  })
);

// Get role-permission matrix (all roles and their permissions)
router.get(
  '/matrix',
  verifyToken,
  asyncHandler(async (req, res) => {
    // Get user's role to determine access level
    const currentUser = await query(
      `SELECT sr.slug, sr.level FROM users u 
       JOIN system_roles sr ON u.system_role_id = sr.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    const userRole = currentUser.rows[0];

    // Get roles based on access level
    let rolesQuery = `SELECT id, name, slug, level FROM system_roles WHERE is_active = true`;
    
    if (userRole.slug === 'superadmin') {
      rolesQuery += ` ORDER BY level ASC`;
    } else if (userRole.slug === 'admin') {
      rolesQuery += ` AND level >= 3 AND level <= 7 ORDER BY level ASC`;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const roles = await query(rolesQuery);
    const permissions = await query(
      `SELECT id, name, slug, resource, action, description, category FROM permissions ORDER BY category, name`
    );

    // Get all role_permissions
    const rolePermissions = await query(
      `SELECT system_role_id, permission_id, granted FROM role_permissions`
    );

    // Build matrix
    const matrix = {};
    rolePermissions.rows.forEach(rp => {
      if (!matrix[rp.system_role_id]) {
        matrix[rp.system_role_id] = {};
      }
      matrix[rp.system_role_id][rp.permission_id] = rp.granted;
    });

    res.json({
      success: true,
      data: {
        roles: roles.rows,
        permissions: permissions.rows,
        rolePermissions: matrix,
        userRole: {
          slug: userRole.slug,
          level: userRole.level
        }
      }
    });
  })
);

module.exports = router;
