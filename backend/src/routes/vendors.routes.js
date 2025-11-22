const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all vendors
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, vendor_type, search, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = 'SELECT * FROM vendors WHERE is_active = true';
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND org_id = $${params.length}`;
  }
  
  if (vendor_type) {
    params.push(vendor_type);
    query += ` AND vendor_type = $${params.length}`;
  }
  
  if (search) {
    params.push(`%${search}%`);
    query += ` AND vendor_name ILIKE $${params.length}`;
  }
  
  query += ` ORDER BY vendor_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get vendor by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query('SELECT * FROM vendors WHERE id = $1 AND is_active = true', [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create vendor
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    org_id, vendor_name, vendor_type, email, phone, website,
    address_line_1, address_line_2, city, state, country, postal_code,
    tax_id, payment_terms
  } = req.body;
  
  
  const result = await pool.query(`
    INSERT INTO vendors (
      org_id, vendor_name, vendor_type, email, phone, website,
      address_line_1, address_line_2, city, state, country, postal_code,
      tax_id, payment_terms
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    org_id, vendor_name, vendor_type, email, phone, website,
    address_line_1, address_line_2, city, state, country, postal_code,
    tax_id, payment_terms
  ]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update vendor
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = [
    'vendor_name', 'vendor_type', 'email', 'phone', 'website',
    'address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code',
    'tax_id', 'payment_terms', 'rating'
  ];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE vendors SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Delete vendor
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE vendors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }
  
  res.json({ success: true, message: 'Vendor deleted successfully' });
}));

module.exports = router;
