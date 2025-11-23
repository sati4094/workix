const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all floors
router.get('/', asyncHandler(async (req, res) => {
  const { building_id, page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = `SELECT f.*, b.name as building_name, b.site_id, s.name as site_name 
               FROM floors f 
               LEFT JOIN buildings b ON f.building_id = b.id 
               LEFT JOIN sites s ON b.site_id = s.id 
               WHERE f.is_active = true`;
  const params = [];
  
  if (building_id) {
    params.push(building_id);
    query += ` AND f.building_id = $${params.length}`;
  }
  
  query += ` ORDER BY f.floor_number LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get floor by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT f.*, b.name as building_name, b.site_id, s.name as site_name,
           (SELECT COUNT(*) FROM spaces WHERE floor_id = f.id) as spaces_count
    FROM floors f
    LEFT JOIN buildings b ON f.building_id = b.id
    LEFT JOIN sites s ON b.site_id = s.id
    WHERE f.id = $1 AND f.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Floor not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create floor
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { building_id, name, floor_number, area } = req.body;
  
  const result = await pool.query(`
    INSERT INTO floors (building_id, name, floor_number, area)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [building_id, name, floor_number, area]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update floor
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['name', 'floor_number', 'area'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE floors SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Floor not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete floor
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE floors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Floor not found' });
  }
  
  res.json({ success: true, message: 'Floor deleted successfully' });
}));

module.exports = router;
