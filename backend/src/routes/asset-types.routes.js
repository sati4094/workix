const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all asset types
router.get('/', asyncHandler(async (req, res) => {
  const { category_id, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = `
    SELECT at.*, ac.name as category_name
    FROM asset_types at
    LEFT JOIN asset_categories ac ON at.category_id = ac.id
    WHERE 1=1
  `;
  const params = [];
  
  if (category_id) {
    params.push(category_id);
    query += ` AND at.category_id = $${params.length}`;
  }
  
  query += ` ORDER BY at.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get type by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT at.*, ac.name as category_name,
           (SELECT COUNT(*) FROM assets WHERE type_id = at.id) as assets_count
    FROM asset_types at
    LEFT JOIN asset_categories ac ON at.category_id = ac.id
    WHERE at.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Asset type not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create asset type
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { category_id, name, description } = req.body;
  
  const result = await pool.query(`
    INSERT INTO asset_types (category_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [category_id, name, description]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update asset type
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['name', 'description'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE asset_types SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Asset type not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete asset type
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query('DELETE FROM asset_types WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Asset type not found' });
  }
  
  res.json({ success: true, message: 'Asset type deleted successfully' });
}));

module.exports = router;
