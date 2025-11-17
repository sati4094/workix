const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { validate, schemas } = require('../middlewares/validation');

router.use(verifyToken);

// Get all assets
router.get('/', asyncHandler(async (req, res) => {
  const { site_id, type, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (site_id) {
    conditions.push(`a.site_id = $${paramCount++}`);
    values.push(site_id);
  }
  if (type) {
    conditions.push(`a.type = $${paramCount++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`a.status = $${paramCount++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total FROM assets a ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT a.*, s.name as site_name, p.name as project_name
     FROM assets a
     JOIN sites s ON a.site_id = s.id
     JOIN projects p ON s.project_id = p.id
     ${whereClause}
     ORDER BY a.name ASC
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      assets: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get asset by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT a.*, s.name as site_name, s.address as site_address,
      p.name as project_name, c.name as client_name
     FROM assets a
     JOIN sites s ON a.site_id = s.id
     JOIN projects p ON s.project_id = p.id
     JOIN clients c ON p.client_id = c.id
     WHERE a.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Asset not found', 404);
  }

  res.status(200).json({ success: true, data: { asset: result.rows[0] } });
}));

// Create asset
router.post('/', validate(schemas.assetCreate), restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    site_id, asset_tag, name, type, manufacturer, model, serial_number, capacity, capacity_unit,
    commissioning_date, warranty_expiry_date, performance_baseline, specifications, location_details, status
  } = req.body;

  const result = await query(
    `INSERT INTO assets (site_id, asset_tag, name, type, manufacturer, model, serial_number, capacity, capacity_unit,
      commissioning_date, warranty_expiry_date, performance_baseline, specifications, location_details, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [site_id, asset_tag, name, type, manufacturer, model, serial_number, capacity, capacity_unit,
      commissioning_date, warranty_expiry_date,
      performance_baseline ? JSON.stringify(performance_baseline) : null,
      specifications ? JSON.stringify(specifications) : null,
      location_details, status || 'operational', req.user.id]
  );

  res.status(201).json({ success: true, message: 'Asset created successfully', data: { asset: result.rows[0] } });
}));

// Update asset
router.patch('/:id', restrictTo('admin', 'manager', 'technician'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'manufacturer', 'model', 'serial_number', 'capacity', 'capacity_unit',
    'commissioning_date', 'warranty_expiry_date', 'location_details', 'status', 'qr_code_url', 'manual_url'];

  const updates = [];
  const values = [];
  let paramCount = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${paramCount++}`);
      values.push(req.body[field]);
    }
  });

  if (req.body.performance_baseline !== undefined) {
    updates.push(`performance_baseline = $${paramCount++}`);
    values.push(JSON.stringify(req.body.performance_baseline));
  }

  if (req.body.specifications !== undefined) {
    updates.push(`specifications = $${paramCount++}`);
    values.push(JSON.stringify(req.body.specifications));
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE assets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Asset not found', 404);
  }

  res.status(200).json({ success: true, message: 'Asset updated successfully', data: { asset: result.rows[0] } });
}));

module.exports = router;

