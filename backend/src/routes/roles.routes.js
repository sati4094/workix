const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all roles
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = 'SELECT * FROM roles WHERE 1=1';
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND org_id = $${params.length}`;
  }
  
  query += ` ORDER BY is_system_role DESC, name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get role by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT r.*,
           (SELECT COUNT(*) FROM account_roles WHERE role_id = r.id) as users_count
    FROM roles r
    WHERE r.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create role
router.post('/', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { org_id, name, description } = req.body;
  
  const result = await pool.query(`
    INSERT INTO roles (org_id, name, description, is_system_role)
    VALUES ($1, $2, $3, false)
    RETURNING *
  `, [org_id, name, description]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update role
router.patch('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Check if role is system role (cannot be updated)
  const checkResult = await pool.query('SELECT is_system_role FROM roles WHERE id = $1', [id]);
  if (checkResult.rows.length > 0 && checkResult.rows[0].is_system_role) {
    return res.status(403).json({ success: false, message: 'Cannot update system roles' });
  }
  
  const allowedFields = ['name', 'description'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE roles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete role
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if role is system role (cannot be deleted)
  const checkResult = await pool.query('SELECT is_system_role FROM roles WHERE id = $1', [id]);
  if (checkResult.rows.length > 0 && checkResult.rows[0].is_system_role) {
    return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
  }
  
  // Check if role has users
  const usersResult = await pool.query('SELECT COUNT(*) FROM account_roles WHERE role_id = $1', [id]);
  if (parseInt(usersResult.rows[0].count) > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cannot delete role with assigned users' 
    });
  }
  
  const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }
  
  res.json({ success: true, message: 'Role deleted successfully' });
}));

module.exports = router;
