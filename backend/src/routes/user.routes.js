const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// All routes require authentication
router.use(verifyToken);

// Get all users (admin/manager only)
router.get('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (role) {
    conditions.push(`role = $${paramCount++}`);
    values.push(role);
  }
  if (status) {
    conditions.push(`status = $${paramCount++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total FROM users ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT id, email, name, role, status, phone, team, profile_picture_url, created_at, last_login_at
     FROM users ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      users: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get user by ID
router.get('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, email, name, role, status, phone, team, profile_picture_url, created_at, updated_at, last_login_at
     FROM users WHERE id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, data: { user: result.rows[0] } });
}));

// Update user (admin only)
router.patch('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, status, phone, team } = req.body;

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

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, email, name, role, status, phone, team, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({ success: true, message: 'User updated successfully', data: { user: result.rows[0] } });
}));

// Delete user (admin only - soft delete)
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
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

