const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all asset categories
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = `
    SELECT ac.*,
           (SELECT COUNT(*) FROM asset_types WHERE category_id = ac.id) as types_count
    FROM asset_categories ac
    WHERE 1=1
  `;
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND ac.org_id = $${params.length}`;
  }
  
  query += ` ORDER BY ac.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get category by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT ac.*,
           (SELECT json_agg(json_build_object(
             'id', at.id,
             'name', at.name,
             'description', at.description
           ))
           FROM asset_types at
           WHERE at.category_id = ac.id) as types
    FROM asset_categories ac
    WHERE ac.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create category
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { org_id, name, description, parent_category_id } = req.body;
  
  const result = await pool.query(`
    INSERT INTO asset_categories (org_id, name, description, parent_category_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [org_id, name, description, parent_category_id]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update category
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
    `UPDATE asset_categories SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete category
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if category has types
  const typesResult = await pool.query('SELECT COUNT(*) FROM asset_types WHERE category_id = $1', [id]);
  if (parseInt(typesResult.rows[0].count) > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cannot delete category with existing types' 
    });
  }
  
  const result = await pool.query('DELETE FROM asset_categories WHERE id = $1 RETURNING *', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }
  
  res.json({ success: true, message: 'Category deleted successfully' });
}));

module.exports = router;
