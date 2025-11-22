const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all storerooms
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, site_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = 'SELECT sr.*, s.name as site_name FROM storerooms sr LEFT JOIN sites s ON sr.site_id = s.id WHERE sr.is_active = true';
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND sr.org_id = $${params.length}`;
  }
  
  if (site_id) {
    params.push(site_id);
    query += ` AND sr.site_id = $${params.length}`;
  }
  
  query += ` ORDER BY sr.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get storeroom by ID with stock
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT sr.*, s.name as site_name,
           (SELECT json_agg(json_build_object(
             'part_id', ps.part_id,
             'part_name', p.part_name,
             'part_number', p.part_number,
             'quantity', ps.quantity,
             'min_quantity', ps.min_quantity,
             'max_quantity', ps.max_quantity,
             'unit_cost', p.unit_cost
           ))
           FROM part_stock ps
           LEFT JOIN parts p ON ps.part_id = p.id
           WHERE ps.storeroom_id = sr.id) as parts_stock
    FROM storerooms sr
    LEFT JOIN sites s ON sr.site_id = s.id
    WHERE sr.id = $1 AND sr.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Storeroom not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create storeroom
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { org_id, site_id, name, location } = req.body;
  
  const result = await pool.query(`
    INSERT INTO storerooms (org_id, site_id, name, location)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [org_id, site_id, name, location]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update storeroom
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['name', 'location'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE storerooms SET ${setClause}, created_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Storeroom not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete storeroom
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE storerooms SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Storeroom not found' });
  }
  
  res.json({ success: true, message: 'Storeroom deleted successfully' });
}));

module.exports = router;
