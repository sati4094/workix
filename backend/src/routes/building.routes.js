const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

// Get all buildings
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, site_id, enterprise_id, search } = req.query;
  const offset = (page - 1) * limit;

  let countQuery = 'SELECT COUNT(*) as total FROM buildings b INNER JOIN sites s ON b.site_id = s.id WHERE 1=1';
  let dataQuery = `
    SELECT 
      b.*,
      s.name as site_name,
      s.site_code,
      e.name as enterprise_name,
      e.enterprise_code,
      e.id as enterprise_id,
      COUNT(DISTINCT a.id) as asset_count,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'pending') as open_work_orders
    FROM buildings b
    INNER JOIN sites s ON b.site_id = s.id
    LEFT JOIN enterprises e ON s.enterprise_id = e.id
    LEFT JOIN assets a ON a.building_id = b.id
    LEFT JOIN work_orders wo ON wo.building_id = b.id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramCount = 1;

  if (site_id) {
    const siteCondition = ` AND b.site_id = $${paramCount}`;
    countQuery += siteCondition;
    dataQuery += siteCondition;
    queryParams.push(site_id);
    paramCount++;
  }

  if (enterprise_id) {
    const enterpriseCondition = ` AND s.enterprise_id = $${paramCount}`;
    countQuery += enterpriseCondition;
    dataQuery += enterpriseCondition;
    queryParams.push(enterprise_id);
    paramCount++;
  }

  if (search) {
    const searchCondition = ` AND (b.name ILIKE $${paramCount} OR b.building_code ILIKE $${paramCount})`;
    countQuery += searchCondition;
    dataQuery += searchCondition;
    queryParams.push(`%${search}%`);
    paramCount++;
  }

  const countResult = await query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total);

  dataQuery += ` GROUP BY b.id, s.name, s.site_code, e.name, e.enterprise_code, e.id ORDER BY s.name, b.name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  queryParams.push(limit, offset);

  const result = await query(dataQuery, queryParams);

  res.status(200).json({
    success: true,
    data: {
      buildings: result.rows,
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        pages: Math.ceil(total / limit) 
      },
    },
  });
}));

// Get building by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const buildingResult = await query(
    `SELECT 
      b.*,
      s.name as site_name,
      s.site_code,
      s.address as site_address,
      e.name as enterprise_name,
      e.enterprise_code,
      e.id as enterprise_id,
      COUNT(DISTINCT a.id) as total_assets,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'pending') as open_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'in_progress') as in_progress_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'completed') as completed_work_orders
    FROM buildings b
    INNER JOIN sites s ON b.site_id = s.id
    LEFT JOIN enterprises e ON s.enterprise_id = e.id
    LEFT JOIN assets a ON a.building_id = b.id
    LEFT JOIN work_orders wo ON wo.building_id = b.id
    WHERE b.id = $1
    GROUP BY b.id, s.name, s.site_code, s.address, e.name, e.enterprise_code, e.id`,
    [req.params.id]
  );

  if (buildingResult.rows.length === 0) {
    throw new AppError('Building not found', 404);
  }

  // Get assets in this building
  const assetsResult = await query(
    `SELECT 
      a.id,
      a.name,
      a.asset_tag,
      a.type::text as category,
      a.status,
      COUNT(woa.work_order_id) as work_order_count
    FROM assets a
    LEFT JOIN work_order_assets woa ON woa.asset_id = a.id
    WHERE a.building_id = $1
    GROUP BY a.id
    ORDER BY a.name ASC`,
    [req.params.id]
  );

  const building = {
    ...buildingResult.rows[0],
    assets: assetsResult.rows,
  };

  res.status(200).json({ success: true, data: { building } });
}));

// Create building
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { 
    site_id,
    name, 
    building_code,
    description,
    floors,
    total_area_sqft,
    construction_year,
    building_type,
    location_notes,
    map_coordinates,
    status
  } = req.body;

  if (!site_id || !name) {
    throw new AppError('Site ID and building name are required', 400);
  }

  // Verify site exists
  const siteCheck = await query(
    'SELECT id FROM sites WHERE id = $1',
    [site_id]
  );

  if (siteCheck.rows.length === 0) {
    throw new AppError('Site not found', 404);
  }

  // Check for duplicate building code within site
  if (building_code) {
    const duplicateCheck = await query(
      'SELECT id FROM buildings WHERE site_id = $1 AND building_code = $2',
      [site_id, building_code]
    );

    if (duplicateCheck.rows.length > 0) {
      throw new AppError('A building with this code already exists at this site', 409);
    }
  }

  const result = await query(
    `INSERT INTO buildings (
      site_id,
      name, 
      building_code,
      description,
      floors,
      total_area_sqft,
      construction_year,
      building_type,
      location_notes,
      map_coordinates,
      status,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      site_id,
      name,
      building_code,
      description,
      floors || 1,
      total_area_sqft,
      construction_year,
      building_type,
      location_notes,
      map_coordinates ? JSON.stringify(map_coordinates) : null,
      status || 'active',
      req.user.id
    ]
  );

  res.status(201).json({ 
    success: true, 
    message: 'Building created successfully', 
    data: { building: result.rows[0] } 
  });
}));

// Update building
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = [
    'name', 
    'building_code',
    'description',
    'floors',
    'total_area_sqft',
    'construction_year',
    'building_type',
    'location_notes',
    'map_coordinates',
    'status'
  ];

  const updates = [];
  const values = [];
  let paramCount = 1;

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'map_coordinates' && req.body[field]) {
        updates.push(`${field} = $${paramCount++}`);
        values.push(JSON.stringify(req.body[field]));
      } else {
        updates.push(`${field} = $${paramCount++}`);
        values.push(req.body[field]);
      }
    }
  });

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  updates.push(`updated_by = $${paramCount++}`);
  values.push(req.user.id);
  values.push(id);

  const result = await query(
    `UPDATE buildings SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Building not found', 404);
  }

  res.status(200).json({ 
    success: true, 
    message: 'Building updated successfully', 
    data: { building: result.rows[0] } 
  });
}));

// Soft delete building
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  // Check if building has assets
  const assetCheck = await query(
    'SELECT COUNT(*) as count FROM assets WHERE building_id = $1',
    [req.params.id]
  );

  if (parseInt(assetCheck.rows[0].count) > 0) {
    throw new AppError('Cannot delete building with existing assets. Please reassign or delete assets first.', 400);
  }

  const result = await query(
    `UPDATE buildings 
    SET deleted_at = CURRENT_TIMESTAMP, updated_by = $1 
    WHERE id = $2 
    RETURNING id, name`,
    [req.user.id, req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Building not found', 404);
  }

  res.status(200).json({ 
    success: true, 
    message: `Building "${result.rows[0].name}" deleted successfully` 
  });
}));

// Get building statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const statsResult = await query(
    `SELECT 
      COUNT(DISTINCT a.id) as total_assets,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'operational') as operational_assets,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'maintenance') as maintenance_assets,
      COUNT(DISTINCT wo.id) as total_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'pending') as open_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'in_progress') as in_progress_work_orders,
      COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'completed' AND wo.completed_at >= NOW() - INTERVAL '30 days') as completed_last_30_days,
      AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.started_at))/3600) FILTER (WHERE wo.status = 'completed' AND wo.completed_at IS NOT NULL) as avg_completion_hours
    FROM buildings b
    LEFT JOIN assets a ON a.building_id = b.id
    LEFT JOIN work_orders wo ON wo.building_id = b.id
    WHERE b.id = $1
    GROUP BY b.id`,
    [req.params.id]
  );

  if (statsResult.rows.length === 0) {
    throw new AppError('Building not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { stats: statsResult.rows[0] }
  });
}));

module.exports = router;
