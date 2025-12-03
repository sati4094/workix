const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { applyEnterpriseScope } = require('../utils/accessScope');
const { replaceTagsForEntity } = require('../utils/tagAssignments');

const MANAGEMENT_ROLES = ['superadmin', 'supertech', 'admin', 'manager'];
const ELEVATED_ROLES = ['superadmin', 'supertech', 'admin'];

// All routes require authentication
router.use(verifyToken);

// Get all users (management roles only)
router.get('/', restrictTo(...MANAGEMENT_ROLES), asyncHandler(async (req, res) => {
  const { role, status, enterprise_id, site_id, page = 1, limit = 50 } = req.query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 50;
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values = [];

  if (role) {
    conditions.push(`u.role = $${values.length + 1}`);
    values.push(role);
  }
  if (status) {
    conditions.push(`u.status = $${values.length + 1}`);
    values.push(status);
  }
  if (enterprise_id) {
    conditions.push(`u.enterprise_id = $${values.length + 1}`);
    values.push(enterprise_id);
  }
  if (site_id) {
    conditions.push(`u.site_id = $${values.length + 1}`);
    values.push(site_id);
  }

  applyEnterpriseScope({ user: req.user, conditions, values, alias: 'u' });

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as total FROM users u ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.phone,
        u.team,
        u.profile_picture_url,
        u.created_at,
        u.last_login_at,
        u.enterprise_id,
        e.name AS enterprise_name,
        u.site_id,
        s.name AS site_name,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
            FROM user_tags ut
            JOIN tags t ON t.id = ut.tag_id
            WHERE ut.user_id = u.id
          ),
          '[]'::json
        ) AS tags
     FROM users u
     LEFT JOIN enterprises e ON u.enterprise_id = e.id
     LEFT JOIN sites s ON u.site_id = s.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  const result = await query(dataQuery, [...values, parsedLimit, offset]);

  res.status(200).json({
    success: true,
    data: {
      users: result.rows,
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    },
  });
}));

// Get user by ID
router.get('/:id', restrictTo(...MANAGEMENT_ROLES), asyncHandler(async (req, res) => {
  const conditions = ['u.id = $1'];
  const values = [req.params.id];
  applyEnterpriseScope({ user: req.user, conditions, values, alias: 'u' });
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const result = await query(
    `SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.phone,
        u.team,
        u.profile_picture_url,
        u.created_at,
        u.updated_at,
        u.last_login_at,
        u.enterprise_id,
        e.name AS enterprise_name,
        u.site_id,
        s.name AS site_name,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
            FROM user_tags ut
            JOIN tags t ON t.id = ut.tag_id
            WHERE ut.user_id = u.id
          ),
          '[]'::json
        ) AS tags
     FROM users u
     LEFT JOIN enterprises e ON u.enterprise_id = e.id
     LEFT JOIN sites s ON u.site_id = s.id
     ${whereClause}`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, data: { user: result.rows[0] } });
}));

// Update user (elevated roles only)
router.patch('/:id', restrictTo(...ELEVATED_ROLES), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, status, phone, team, enterprise_id, site_id, tag_ids } = req.body;

  const normalizedEnterpriseId = enterprise_id === '' ? null : enterprise_id;
  const normalizedSiteId = site_id === '' ? null : site_id;

  const existingUser = await query('SELECT enterprise_id, site_id FROM users WHERE id = $1', [id]);
  if (existingUser.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  if (!['superadmin', 'supertech'].includes(req.user.role)) {
    if (!req.user.enterprise_id || existingUser.rows[0].enterprise_id !== req.user.enterprise_id) {
      throw new AppError('You do not have permission to update users outside your enterprise.', 403);
    }
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (role) {
    updates.push(`role = $${paramCount++}`);
    values.push(role);
  }
  if (status) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }
  if (team !== undefined) {
    updates.push(`team = $${paramCount++}`);
    values.push(team);
  }
  if (normalizedEnterpriseId !== undefined) {
    updates.push(`enterprise_id = $${paramCount++}`);
    values.push(normalizedEnterpriseId);
  }
  if (normalizedSiteId !== undefined) {
    updates.push(`site_id = $${paramCount++}`);
    values.push(normalizedSiteId);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  if (normalizedSiteId) {
    const siteCheck = await query('SELECT enterprise_id FROM sites WHERE id = $1', [normalizedSiteId]);
    if (siteCheck.rows.length === 0) {
      throw new AppError('Site not found', 404);
    }
    if (normalizedEnterpriseId && siteCheck.rows[0].enterprise_id && siteCheck.rows[0].enterprise_id !== normalizedEnterpriseId) {
      throw new AppError('Selected site does not belong to the chosen enterprise.', 400);
    }
  }

  values.push(id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, email, name, role, status, phone, team, enterprise_id, site_id, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  if (tag_ids !== undefined) {
    await replaceTagsForEntity({
      entity: 'user',
      entityId: id,
      tagIds: tag_ids,
      userId: req.user?.id,
    });
  }

  const tagQuery = await query(
    `SELECT t.id, t.label, t.color
     FROM user_tags ut
     JOIN tags t ON t.id = ut.tag_id
     WHERE ut.user_id = $1
     ORDER BY t.label ASC`,
    [id]
  );

  res.status(200).json({ success: true, message: 'User updated successfully', data: { user: { ...result.rows[0], tags: tagQuery.rows } } });
}));

// Delete user (elevated roles only - soft delete)
router.delete('/:id', restrictTo(...ELEVATED_ROLES), asyncHandler(async (req, res) => {
  const result = await query(
    "UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, message: 'User deactivated successfully' });
}));

module.exports = router;

