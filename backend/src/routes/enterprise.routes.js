const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { applyEnterpriseScope, applySiteScope } = require('../utils/accessScope');
const { replaceTagsForEntity } = require('../utils/tagAssignments');
const { v4: uuidv4 } = require('uuid');

const mapStatusToIsActive = (status) => {
  if (status === undefined || status === null) return undefined;
  return String(status).toLowerCase() === 'active';
};

router.use(verifyToken);

// Get all enterprises
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search } = req.query;
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 50;
  const offset = (parsedPage - 1) * parsedLimit;

  const conditions = [];
  const values = [];

  if (search) {
    conditions.push(
      `(e.name ILIKE $${values.length + 1} OR e.email ILIKE $${values.length + 1} OR e.industry ILIKE $${values.length + 1})`
    );
    values.push(`%${search}%`);
  }

  applyEnterpriseScope({ user: req.user, conditions, values, alias: 'e' });

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as total FROM enterprises e ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      e.*,
      NULL as created_by_name,
      COUNT(DISTINCT s.id) as total_sites,
      COUNT(DISTINCT b.id) as total_buildings,
      COUNT(DISTINCT a.id) as total_assets,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
          FROM enterprise_tags et
          JOIN tags t ON t.id = et.tag_id
          WHERE et.enterprise_id = e.id
        ),
        '[]'::json
      ) AS tags
    FROM enterprises e
    LEFT JOIN users u ON 1=0
    LEFT JOIN sites s ON s.enterprise_id = e.id
    LEFT JOIN buildings b ON b.site_id = s.id
    LEFT JOIN assets a ON a.building_id = b.id
    ${whereClause}
    GROUP BY e.id, u.name
    ORDER BY e.name ASC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

  const dataValues = [...values, parsedLimit, offset];
  const result = await query(dataQuery, dataValues);

  res.status(200).json({
    success: true,
    data: {
      enterprises: result.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    },
  });
}));

// Get enterprise by ID with full hierarchy
router.get('/:id', asyncHandler(async (req, res) => {
  const conditions = ['e.id = $1'];
  const values = [req.params.id];
  applyEnterpriseScope({ user: req.user, conditions, values, alias: 'e' });
  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const enterpriseResult = await query(
    `SELECT 
      e.*,
      NULL as created_by_name,
      COUNT(DISTINCT s.id) as total_sites,
      COUNT(DISTINCT b.id) as total_buildings,
      COUNT(DISTINCT a.id) as total_assets,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'open') as open_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'in_progress') as in_progress_work_orders,
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', t.id, 'label', t.label, 'color', t.color))
          FROM enterprise_tags et
          JOIN tags t ON t.id = et.tag_id
          WHERE et.enterprise_id = e.id
        ),
        '[]'::json
      ) AS tags
    FROM enterprises e
    LEFT JOIN users u ON 1=0
    LEFT JOIN sites s ON s.enterprise_id = e.id
    LEFT JOIN buildings b ON b.site_id = s.id
    LEFT JOIN assets a ON a.building_id = b.id
    LEFT JOIN work_orders wo ON wo.enterprise_id = e.id AND wo.deleted_at IS NULL
    ${whereClause}
    GROUP BY e.id, u.name`,
    values
  );

  if (enterpriseResult.rows.length === 0) {
    throw new AppError('Enterprise not found', 404);
  }

  const siteConditions = ['s.enterprise_id = $1'];
  const siteValues = [req.params.id];
  applySiteScope({ user: req.user, conditions: siteConditions, values: siteValues, alias: 's' });
  const siteWhereClause = `WHERE ${siteConditions.join(' AND ')}`;

  const sitesResult = await query(
    `SELECT 
      s.*,
      COUNT(DISTINCT b.id) as building_count,
      COUNT(DISTINCT a.id) as asset_count,
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
    LEFT JOIN buildings b ON b.site_id = s.id
    LEFT JOIN assets a ON a.building_id = b.id
    ${siteWhereClause}
    GROUP BY s.id
    ORDER BY s.name ASC`,
    siteValues
  );

  const projectsResult = await query(
    `SELECT p.*
    FROM projects p
    INNER JOIN project_enterprises pe ON pe.project_id = p.id
    WHERE pe.enterprise_id = $1
    ORDER BY p.start_date DESC
    LIMIT 10`,
    [req.params.id]
  );

  const enterprise = {
    ...enterpriseResult.rows[0],
    sites: sitesResult.rows,
    projects: projectsResult.rows,
  };

  res.status(200).json({ success: true, data: { enterprise } });
}));

// Create enterprise
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    industry,
    website,
    contact_person,
    contact_email,
    contact_phone,
    address,
    address_line_1,
    address_line_2,
    description,
    notes,
    city,
    state,
    postal_code,
    country,
    enterprise_code,
    status,
    is_active,
    tag_ids
  } = req.body;

  if (!name) {
    throw new AppError('Enterprise name is required', 400);
  }

  // Check for duplicate name
  const duplicateCheck = await query(
    'SELECT id FROM enterprises WHERE LOWER(name) = LOWER($1)',
    [name]
  );

  if (duplicateCheck.rows.length > 0) {
    throw new AppError('An enterprise with this name already exists', 409);
  }

  const computedAddressLine1 = address_line_1 || address || null;
  const computedDescription = description || notes || null;
  const computedIsActive =
    typeof is_active === 'boolean' ? is_active : mapStatusToIsActive(status);
  const generatedCode = `ENT-${uuidv4().slice(0, 8).toUpperCase()}`;

  const result = await query(
    `INSERT INTO enterprises (
      name,
      enterprise_code,
      description,
      industry,
      email,
      phone,
      website,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      postal_code,
      contact_person,
      contact_email,
      contact_phone,
      is_active,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, COALESCE($17, true), $18)
    RETURNING *`,
    [
      name,
      (enterprise_code || '').trim() || generatedCode,
      computedDescription,
      industry,
      email,
      phone,
      website,
      computedAddressLine1,
      address_line_2 || null,
      city,
      state,
      country || 'UAE',
      postal_code,
      contact_person,
      contact_email,
      contact_phone,
      computedIsActive,
      req.user?.id || null
    ]
  );

  let tags = [];
  if (tag_ids !== undefined) {
    await replaceTagsForEntity({
      entity: 'enterprise',
      entityId: result.rows[0].id,
      tagIds: tag_ids,
      userId: req.user?.id,
    });
    const tagQuery = await query(
      `SELECT t.id, t.label, t.color
       FROM enterprise_tags et
       JOIN tags t ON t.id = et.tag_id
       WHERE et.enterprise_id = $1
       ORDER BY t.label ASC`,
      [result.rows[0].id]
    );
    tags = tagQuery.rows;
  }

  res.status(201).json({ 
    success: true, 
    message: 'Enterprise created successfully', 
    data: { enterprise: { ...result.rows[0], tags } } 
  });
}));

// Update enterprise
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    email,
    phone,
    industry,
    website,
    contact_person,
    contact_email,
    contact_phone,
    address,
    address_line_1,
    address_line_2,
    city,
    state,
    postal_code,
    country,
    description,
    notes,
    status,
    is_active,
    enterprise_code,
    tag_ids,
  } = req.body;

  const computedAddressLine1 = address_line_1 !== undefined ? address_line_1 : address;
  const computedDescription = description !== undefined ? description : notes;
  const computedIsActive =
    is_active !== undefined ? is_active : mapStatusToIsActive(status);

  const updateObject = {
    name,
    email,
    phone,
    industry,
    website,
    contact_person,
    contact_email,
    contact_phone,
    address_line_1: computedAddressLine1,
    address_line_2,
    city,
    state,
    postal_code,
    country,
    description: computedDescription,
    enterprise_code: enterprise_code?.trim(),
    is_active: computedIsActive
  };

  const updates = [];
  const values = [];
  let paramCount = 1;

  Object.entries(updateObject).forEach(([column, value]) => {
    if (value !== undefined) {
      updates.push(`${column} = $${paramCount++}`);
      values.push(value);
    }
  });

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await query(
    `UPDATE enterprises SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Enterprise not found', 404);
  }

  if (tag_ids !== undefined) {
    await replaceTagsForEntity({
      entity: 'enterprise',
      entityId: id,
      tagIds: tag_ids,
      userId: req.user?.id,
    });
  }

  const tagQuery = await query(
    `SELECT t.id, t.label, t.color
     FROM enterprise_tags et
     JOIN tags t ON t.id = et.tag_id
     WHERE et.enterprise_id = $1
     ORDER BY t.label ASC`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: 'Enterprise updated successfully',
    data: { enterprise: { ...result.rows[0], tags: tagQuery.rows } }
  });
}));

// Soft delete enterprise
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE enterprises 
    SET deleted_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING id, name`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Enterprise not found', 404);
  }

  res.status(200).json({ 
    success: true, 
    message: `Enterprise "${result.rows[0].name}" deleted successfully` 
  });
}));

// Get enterprise statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const statsResult = await query(
    `SELECT 
      COUNT(DISTINCT s.id) as total_sites,
      COUNT(DISTINCT b.id) as total_buildings,
      COUNT(DISTINCT a.id) as total_assets,
      COUNT(DISTINCT wo.id) as total_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'open') as open_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'in_progress') as in_progress_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'completed') as completed_work_orders,
      COUNT(DISTINCT p.id) as active_projects
    FROM enterprises e
    LEFT JOIN sites s ON s.enterprise_id = e.id
    LEFT JOIN buildings b ON b.site_id = s.id
    LEFT JOIN assets a ON a.building_id = b.id
    LEFT JOIN work_orders wo ON wo.enterprise_id = e.id AND wo.deleted_at IS NULL
    LEFT JOIN project_enterprises pe ON pe.enterprise_id = e.id
    LEFT JOIN projects p ON p.id = pe.project_id AND p.status = 'active'
    WHERE e.id = $1
    GROUP BY e.id`,
    [req.params.id]
  );

  if (statsResult.rows.length === 0) {
    throw new AppError('Enterprise not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { stats: statsResult.rows[0] }
  });
}));

module.exports = router;
