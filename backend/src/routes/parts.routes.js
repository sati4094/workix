const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all parts
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, category, search, low_stock, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = 'SELECT * FROM parts WHERE is_active = true';
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND org_id = $${params.length}`;
  }
  
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }
  
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (part_name ILIKE $${params.length} OR part_number ILIKE $${params.length} OR description ILIKE $${params.length})`;
  }
  
  if (low_stock === 'true') {
    query += ` AND id IN (
      SELECT part_id FROM part_stock 
      WHERE quantity <= (SELECT reorder_level FROM parts WHERE id = part_id)
    )`;
  }
  
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  query += ` ORDER BY part_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get low stock parts
router.get('/low-stock', asyncHandler(async (req, res) => {
  const { org_id } = req.query;
  
  let query = `
    SELECT p.*, 
           COALESCE(SUM(ps.quantity), 0) as total_stock,
           p.reorder_level,
           p.reorder_quantity
    FROM parts p
    LEFT JOIN part_stock ps ON p.id = ps.part_id
    WHERE p.is_active = true
  `;
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND p.org_id = $${params.length}`;
  }
  
  query += `
    GROUP BY p.id
    HAVING COALESCE(SUM(ps.quantity), 0) <= p.reorder_level
    ORDER BY (p.reorder_level - COALESCE(SUM(ps.quantity), 0)) DESC
  `;
  
  const result = await pool.query(query, params);
  
  res.json({ success: true, data: result.rows });
}));

// Get part by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT p.*,
           (SELECT json_agg(json_build_object(
             'storeroom_id', ps.storeroom_id,
             'storeroom_name', sr.name,
             'quantity', ps.quantity,
             'min_quantity', ps.min_quantity,
             'max_quantity', ps.max_quantity
           ))
           FROM part_stock ps
           LEFT JOIN storerooms sr ON ps.storeroom_id = sr.id
           WHERE ps.part_id = p.id) as stock_locations
    FROM parts p
    WHERE p.id = $1 AND p.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Part not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create part
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    org_id, part_number, part_name, description, category, manufacturer,
    model_number, unit_of_measure, unit_cost, reorder_level, reorder_quantity
  } = req.body;
  
  
  const result = await pool.query(`
    INSERT INTO parts (
      org_id, part_number, part_name, description, category, manufacturer,
      model_number, unit_of_measure, unit_cost, reorder_level, reorder_quantity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [org_id, part_number, part_name, description, category, manufacturer,
      model_number, unit_of_measure, unit_cost, reorder_level, reorder_quantity]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update part
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = [
    'part_name', 'description', 'category', 'manufacturer', 'model_number',
    'unit_of_measure', 'unit_cost', 'reorder_level', 'reorder_quantity'
  ];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE parts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Part not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete part
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE parts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Part not found' });
  }
  
  res.json({ success: true, message: 'Part deleted successfully' });
}));

module.exports = router;
