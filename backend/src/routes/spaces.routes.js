const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all spaces
router.get('/', asyncHandler(async (req, res) => {
  const { floor_id, space_type, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = `SELECT s.*, f.name as floor_name, f.floor_number, b.name as building_name, b.site_id, si.name as site_name 
               FROM spaces s 
               LEFT JOIN floors f ON s.floor_id = f.id 
               LEFT JOIN buildings b ON f.building_id = b.id 
               LEFT JOIN sites si ON b.site_id = si.id 
               WHERE s.is_active = true`;
  const params = [];
  
  if (floor_id) {
    params.push(floor_id);
    query += ` AND s.floor_id = $${params.length}`;
  }
  
  if (space_type) {
    params.push(space_type);
    query += ` AND s.space_type = $${params.length}`;
  }
  
  query += ` ORDER BY s.name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get space by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT s.*, f.name as floor_name, f.floor_number, b.name as building_name, b.site_id, si.name as site_name
    FROM spaces s
    LEFT JOIN floors f ON s.floor_id = f.id
    LEFT JOIN buildings b ON f.building_id = b.id
    LEFT JOIN sites si ON b.site_id = si.id
    WHERE s.id = $1 AND s.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Space not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create space
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { floor_id, name, space_type, area, capacity } = req.body;
  
  const result = await pool.query(`
    INSERT INTO spaces (floor_id, name, space_type, area, capacity)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [floor_id, name, space_type, area, capacity]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update space
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['name', 'space_type', 'area', 'capacity'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE spaces SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Space not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete space
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE spaces SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Space not found' });
  }
  
  res.json({ success: true, message: 'Space deleted successfully' });
}));

module.exports = router;
