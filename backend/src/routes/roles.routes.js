const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, requirePermissions } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all system roles
router.get(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    // SuperAdmin sees all roles (L0-L7)
    // Admin sees L3-L7 only
    const currentUser = await query(
      `SELECT sr.slug, sr.level FROM users u 
       JOIN system_roles sr ON u.system_role_id = sr.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    const userRole = currentUser.rows[0];
    
    let rolesQuery = `
      SELECT id, name, slug, description, level, color, scope, 
             is_workix_role, is_org_admin, can_manage_users,
             can_manage_facilities, can_assign_work_orders
      FROM system_roles 
      WHERE is_active = true
    `;

    // Filter based on user's access level
    if (userRole.slug === 'superadmin') {
      // SuperAdmin sees all (L0-L7)
      rolesQuery += ` ORDER BY level ASC`;
    } else if (userRole.slug === 'admin') {
      // Admin sees L3-L7 only
      rolesQuery += ` AND level >= 3 AND level <= 7 ORDER BY level ASC`;
    } else {
      // Others see only their own role
      rolesQuery += ` AND slug = $1 ORDER BY level ASC`;
    }

    const roles = await query(
      rolesQuery,
      userRole.slug !== 'superadmin' && userRole.slug !== 'admin' ? [userRole.slug] : []
    );

    res.json({
      success: true,
      count: roles.rows.length,
      data: roles.rows,
      userRole: {
        slug: userRole.slug,
        level: userRole.level
      }
    });
  })
);

// Get specific role details
router.get(
  '/:roleId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const role = await query(
      `SELECT id, name, slug, description, level, color, scope,
              is_workix_role, is_org_admin, can_manage_users,
              can_manage_facilities, can_assign_work_orders,
              can_approve_work_orders, can_view_all_orgs, can_impersonate
       FROM system_roles WHERE id = $1`,
      [req.params.roleId]
    );

    if (role.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role.rows[0]
    });
  })
);

// Get permissions for a specific role
router.get(
  '/:roleId/permissions',
  verifyToken,
  asyncHandler(async (req, res) => {
    const permissions = await query(
      `SELECT p.id, p.name, p.slug, p.resource, p.action, p.description, p.category,
              COALESCE(rp.granted, false) as granted
       FROM permissions p
       LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.system_role_id = $1
       ORDER BY p.category, p.name`,
      [req.params.roleId]
    );

    res.json({
      success: true,
      count: permissions.rows.length,
      data: permissions.rows
    });
  })
);

// Update role permission (grant/revoke)
router.put(
  '/:roleId/permissions/:permissionId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { granted } = req.body;
    const { roleId, permissionId } = req.params;

    // Check if the current user has permission to manage this role level
    const currentUser = await query(
      `SELECT sr.slug, sr.level FROM users u 
       JOIN system_roles sr ON u.system_role_id = sr.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    const targetRole = await query(
      `SELECT level FROM system_roles WHERE id = $1`,
      [roleId]
    );

    if (targetRole.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const userRole = currentUser.rows[0];
    const targetLevel = targetRole.rows[0].level;

    // SuperAdmin can manage L0-L7, Admin can manage L3-L7
    if (userRole.slug !== 'superadmin') {
      if (userRole.slug === 'admin' && (targetLevel < 3 || targetLevel > 7)) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage roles at level 3 to 7'
        });
      } else if (userRole.slug !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to manage role permissions'
        });
      }
    }

    // Insert or update role_permissions
    await query(
      `INSERT INTO role_permissions (system_role_id, permission_id, granted)
       VALUES ($1, $2, $3)
       ON CONFLICT (system_role_id, permission_id)
       DO UPDATE SET granted = $3`,
      [roleId, permissionId, granted]
    );

    res.json({
      success: true,
      message: `Permission ${granted ? 'granted' : 'revoked'} successfully`
    });
  })
);

module.exports = router;
