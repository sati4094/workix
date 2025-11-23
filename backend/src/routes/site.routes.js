const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

// Get all sites
router.get('/', asyncHandler(async (req, res) => {
  const { project_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = project_id ? 'WHERE s.portfolio_id = $1' : '';
  const values = project_id ? [project_id] : [];

  const countResult = await query(`SELECT COUNT(*) as total FROM sites s ${conditions}`, values);
  const total = parseInt(countResult.rows[0].total);

  const paramCount = values.length + 1;
  const result = await query(
    `SELECT s.*, p.name as portfolio_name, e.name as enterprise_name, e.id as enterprise_id,
      (SELECT COUNT(*) FROM buildings WHERE site_id = s.id) as building_count,
      (SELECT COUNT(*) FROM assets WHERE site_id = s.id) as asset_count
     FROM sites s
     LEFT JOIN portfolios p ON s.portfolio_id = p.id
     LEFT JOIN enterprises e ON s.enterprise_id = e.id
     ${conditions}
     ORDER BY s.name ASC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...values, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      sites: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get site by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT s.*, p.name as portfolio_name, e.name as enterprise_name, e.id as enterprise_id,
      (SELECT json_agg(json_build_object('id', b.id, 'name', b.name, 'building_code', b.building_code, 'floors', b.floors, 'status', b.status))
       FROM buildings b WHERE b.site_id = s.id) as buildings,
      (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'asset_tag', a.asset_tag, 'category', a.category, 'status', a.status))
       FROM assets a WHERE a.site_id = s.id) as assets
     FROM sites s
     LEFT JOIN portfolios p ON s.portfolio_id = p.id
     LEFT JOIN enterprises e ON s.enterprise_id = e.id
     WHERE s.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Site not found', 404);
  }

  res.status(200).json({ success: true, data: { site: result.rows[0] } });
}));

// Create site
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    project_id, name, address, city, state, postal_code, country,
    contact_person, contact_phone, contact_email, latitude, longitude, operating_hours, site_notes
  } = req.body;

  if (!project_id || !name || !address) {
    throw new AppError('Project, name, and address are required', 400);
  }

  const result = await query(
    `INSERT INTO sites (project_id, name, address, city, state, postal_code, country,
      contact_person, contact_phone, contact_email, latitude, longitude, operating_hours, site_notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [project_id, name, address, city, state, postal_code, country || 'USA',
      contact_person, contact_phone, contact_email, latitude, longitude, operating_hours, site_notes, req.user.id]
  );

  res.status(201).json({ success: true, message: 'Site created successfully', data: { site: result.rows[0] } });
}));

// Update site
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'address', 'city', 'state', 'postal_code', 'country', 'contact_person',
    'contact_phone', 'contact_email', 'latitude', 'longitude', 'operating_hours', 'site_notes'];

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
    `UPDATE sites SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Site not found', 404);
  }

  res.status(200).json({ success: true, message: 'Site updated successfully', data: { site: result.rows[0] } });
}));

module.exports = router;

