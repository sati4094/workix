const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

// Get all clients (redirected to enterprises)
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const countResult = await query('SELECT COUNT(*) as total FROM enterprises');
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT e.*, u.name as created_by_name,
      (SELECT COUNT(*) FROM sites WHERE enterprise_id = e.id) as total_sites,
      (SELECT COUNT(*) FROM buildings b JOIN sites s ON b.site_id = s.id WHERE s.enterprise_id = e.id) as total_buildings,
      (SELECT COUNT(*) FROM assets a JOIN sites s ON a.site_id = s.id WHERE s.enterprise_id = e.id) as total_assets
     FROM enterprises e
     LEFT JOIN users u ON e.created_by = u.id
     ORDER BY e.name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      clients: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get client by ID (redirected to enterprises)
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT e.*,
      (SELECT COUNT(*) FROM sites WHERE enterprise_id = e.id) as total_sites,
      (SELECT COUNT(*) FROM buildings b JOIN sites s ON b.site_id = s.id WHERE s.enterprise_id = e.id) as total_buildings,
      (SELECT COUNT(*) FROM assets a JOIN sites s ON a.site_id = s.id WHERE s.enterprise_id = e.id) as total_assets
     FROM enterprises e
     WHERE e.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Client not found', 404);
  }

  res.status(200).json({ success: true, data: { client: result.rows[0] } });
}));

// Create client
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, contact_person, contact_email, contact_phone, address, city, state, postal_code, country, notes } = req.body;

  if (!name) {
    throw new AppError('Client name is required', 400);
  }

  const result = await query(
    `INSERT INTO enterprises (name, contact_person, contact_email, contact_phone, address, city, state, postal_code, country, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [name, contact_person, contact_email, contact_phone, address, city, state, postal_code, country || 'USA', notes, req.user.id]
  );

  res.status(201).json({ success: true, message: 'Client created successfully', data: { client: result.rows[0] } });
}));

// Update client
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'contact_person', 'contact_email', 'contact_phone', 'address', 'city', 'state', 'postal_code', 'country', 'notes'];

  const updates = [];
  const values = [];
  let paramCount = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${paramCount++}`);
      values.push(req.body[field]);
    }
  });

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE enterprises SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Client not found', 404);
  }

  res.status(200).json({ success: true, message: 'Client updated successfully', data: { client: result.rows[0] } });
}));

// Delete client
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM enterprises WHERE id = $1 RETURNING id', [req.params.id]);

  if (result.rows.length === 0) {
    throw new AppError('Client not found', 404);
  }

  res.status(200).json({ success: true, message: 'Client deleted successfully' });
}));

module.exports = router;

