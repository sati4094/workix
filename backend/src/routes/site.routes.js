const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { applySiteScope } = require('../utils/accessScope');
const { replaceTagsForEntity } = require('../utils/tagAssignments');

router.use(verifyToken);

// Get all sites
router.get('/', asyncHandler(async (req, res) => {
  const { project_id, page = 1, limit = 50 } = req.query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 50;
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values = [];

  if (project_id) {
    conditions.push(`s.project_id = $${values.length + 1}`);
    values.push(project_id);
  }

  applySiteScope({ user: req.user, conditions, values, alias: 's' });

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as total FROM sites s ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT s.*, e.name as enterprise_name, e.id as enterprise_id,
      (SELECT COUNT(*) FROM buildings WHERE site_id = s.id) as building_count,
      (SELECT COUNT(*) FROM assets WHERE site_id = s.id) as asset_count,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
          FROM site_tags st
          JOIN tags t ON t.id = st.tag_id
          WHERE st.site_id = s.id
        ),
        '[]'::json
      ) AS tags
     FROM sites s
     LEFT JOIN enterprises e ON s.enterprise_id = e.id
     ${whereClause}
     ORDER BY s.name ASC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  const result = await query(dataQuery, [...values, parsedLimit, offset]);

  res.status(200).json({
    success: true,
    data: {
      sites: result.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    },
  });
}));

// Get site by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const conditions = ['s.id = $1'];
  const values = [req.params.id];
  applySiteScope({ user: req.user, conditions, values, alias: 's' });
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const result = await query(
    `SELECT s.*, e.name as enterprise_name, e.id as enterprise_id,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
          FROM site_tags st
          JOIN tags t ON t.id = st.tag_id
          WHERE st.site_id = s.id
        ),
        '[]'::json
      ) AS tags,
      (SELECT json_agg(json_build_object('id', b.id, 'name', b.name, 'building_code', b.building_code, 'floors', b.floors, 'status', b.status))
       FROM buildings b WHERE b.site_id = s.id) as buildings,
      (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'asset_tag', a.asset_tag, 'category', a.type::text, 'status', a.status))
       FROM assets a WHERE a.site_id = s.id) as assets
     FROM sites s
     LEFT JOIN enterprises e ON s.enterprise_id = e.id
     ${whereClause}`,
    values
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
    contact_person, contact_phone, contact_email, latitude, longitude, operating_hours, site_notes,
    tag_ids
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

  let tags = [];
  if (tag_ids !== undefined) {
    await replaceTagsForEntity({
      entity: 'site',
      entityId: result.rows[0].id,
      tagIds: tag_ids,
      userId: req.user?.id,
    });

    const tagQuery = await query(
      `SELECT t.id, t.label, t.color
       FROM site_tags st
       JOIN tags t ON t.id = st.tag_id
       WHERE st.site_id = $1
       ORDER BY t.label ASC`,
      [result.rows[0].id]
    );
    tags = tagQuery.rows;
  }

  res.status(201).json({ success: true, message: 'Site created successfully', data: { site: { ...result.rows[0], tags } } });
}));

// Update site
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'address', 'city', 'state', 'postal_code', 'country', 'contact_person',
    'contact_phone', 'contact_email', 'latitude', 'longitude', 'operating_hours', 'site_notes'];
  const { tag_ids } = req.body;

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

  if (tag_ids !== undefined) {
    await replaceTagsForEntity({
      entity: 'site',
      entityId: id,
      tagIds: tag_ids,
      userId: req.user?.id,
    });
  }

  const tagQuery = await query(
    `SELECT t.id, t.label, t.color
     FROM site_tags st
     JOIN tags t ON t.id = st.tag_id
     WHERE st.site_id = $1
     ORDER BY t.label ASC`,
    [id]
  );

  res.status(200).json({ success: true, message: 'Site updated successfully', data: { site: { ...result.rows[0], tags: tagQuery.rows } } });
}));

module.exports = router;

