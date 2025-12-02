const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all buildings
router.get('/', asyncHandler(async (req, res) => {
  const { site_id, page = 1, limit = 50, search } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = 'SELECT b.*, s.name as site_name, s.site_code FROM buildings b LEFT JOIN sites s ON b.site_id = s.id WHERE b.is_active = true';
  const params = [];
  
  if (site_id) {
    params.push(site_id);
    query += ` AND b.site_id = $${params.length}`;
  }
  
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (b.name ILIKE $${params.length} OR b.building_code ILIKE $${params.length})`;
  }
  
  const countQuery = query.replace('SELECT b.*, s.name as site_name, s.site_code', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);
  
  query += ` ORDER BY b.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

// Get building by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT b.*, s.name as site_name, s.site_code,
           (SELECT COUNT(*) FROM floors WHERE building_id = b.id) as floors_count
    FROM buildings b
    LEFT JOIN sites s ON b.site_id = s.id
    WHERE b.id = $1 AND b.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Building not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create building
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { site_id, name, building_code, floor_count, gross_area, occupancy_type, year_built, description } = req.body;
  
  const result = await pool.query(`
    INSERT INTO buildings (site_id, name, building_code, floor_count, gross_area, occupancy_type, year_built, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [site_id, name, building_code, floor_count, gross_area, occupancy_type, year_built, description]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update building
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['name', 'building_code', 'floor_count', 'gross_area', 'occupancy_type', 'year_built', 'description'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE buildings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Building not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete building (soft delete)
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE buildings SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Building not found' });
  }
  
  res.json({ success: true, message: 'Building deleted successfully' });
}));

module.exports = router;
