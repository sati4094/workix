const { query, transaction } = require('../database/connection');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

// Get all work orders with filters and pagination
exports.getAllWorkOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    priority,
    assigned_to,
    site_id,
    source,
    sort = 'created_at',
    order = 'DESC',
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const values = [];
  let paramCount = 1;

  // Build WHERE clause
  if (status) {
    conditions.push(`wo.status = $${paramCount++}`);
    values.push(status);
  }
  if (priority) {
    conditions.push(`wo.priority = $${paramCount++}`);
    values.push(priority);
  }
  if (assigned_to) {
    conditions.push(`wo.assigned_to = $${paramCount++}`);
    values.push(assigned_to);
  }
  if (site_id) {
    conditions.push(`wo.site_id = $${paramCount++}`);
    values.push(site_id);
  }
  if (source) {
    conditions.push(`wo.source = $${paramCount++}`);
    values.push(source);
  }

  // Role-based filtering
  if (req.user.role === 'technician') {
    conditions.push(`wo.assigned_to = $${paramCount++}`);
    values.push(req.user.id);
  } else if (req.user.role === 'client') {
    // Enterprises can only see their own work orders
    conditions.push(`wo.enterprise_id IN (SELECT id FROM enterprises WHERE contact_email = $${paramCount++})`);
    values.push(req.user.email);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort column
  const allowedSortColumns = ['created_at', 'updated_at', 'priority', 'status', 'due_date'];
  const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total 
     FROM work_orders wo
     LEFT JOIN sites s ON wo.site_id = s.id
     LEFT JOIN portfolios p ON s.portfolio_id = p.id
     ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].total);

  // Get work orders
  const result = await query(
    `SELECT 
      wo.*,
      s.name as site_name,
      s.address as site_address,
      s.facility_code as site_code,
      b.name as building_name,
      b.building_code,
      p.name as portfolio_name,
      e.name as enterprise_name,
      e.id as enterprise_id,
      assigned_user.name as assigned_technician_name,
      assigned_user.phone as assigned_technician_phone,
      reported_user.name as reported_by_name,
      (SELECT COUNT(*) FROM work_order_activities WHERE work_order_id = wo.id) as activity_count,
      (SELECT json_agg(json_build_object('id', a.id, 'name', a.name, 'asset_tag', a.asset_tag, 'category', a.category))
       FROM assets a WHERE a.id = wo.asset_id) as assets
     FROM work_orders wo
     LEFT JOIN sites s ON wo.site_id = s.id
     LEFT JOIN buildings b ON wo.building_id = b.id
     LEFT JOIN portfolios p ON s.portfolio_id = p.id
     LEFT JOIN enterprises e ON wo.enterprise_id = e.id
     LEFT JOIN users assigned_user ON wo.assigned_to = assigned_user.id
     LEFT JOIN users reported_user ON wo.requested_by = reported_user.id
     ${whereClause}
     ORDER BY wo.${sortColumn} ${sortOrder}
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      work_orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Get single work order by ID
exports.getWorkOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      wo.*,
      s.name as site_name,
      s.address as site_address,
      s.contact_person as site_contact_person,
      s.contact_phone as site_contact_phone,
      b.name as building_name,
      b.building_code,
      p.name as project_name,
      e.name as enterprise_name,
      e.name as client_name,
      e.contact_person as client_contact_person,
      e.contact_phone as client_contact_phone,
      assigned_user.name as assigned_technician_name,
      assigned_user.phone as assigned_technician_phone,
      assigned_user.email as assigned_technician_email,
      reported_user.name as reported_by_name,
      (SELECT json_agg(json_build_object(
        'id', a.id, 
        'name', a.name, 
        'asset_tag', a.asset_tag, 
        'category', a.category,
        'model', a.model,
        'manufacturer', a.manufacturer
      ))
       FROM assets a
       JOIN work_order_assets woa ON a.id = woa.asset_id
       WHERE woa.work_order_id = wo.id) as assets,
      (SELECT json_agg(json_build_object(
        'id', woa.id,
        'activity_type', woa.activity_type,
        'description', woa.description,
        'ai_enhanced', woa.ai_enhanced,
        'pictures', woa.pictures,
        'parts_used', woa.parts_used,
        'created_by', u.name,
        'created_at', woa.created_at
      ) ORDER BY woa.created_at DESC)
       FROM work_order_activities woa
       LEFT JOIN users u ON woa.created_by = u.id
       WHERE woa.work_order_id = wo.id) as activities
     FROM work_orders wo
     LEFT JOIN sites s ON wo.site_id = s.id
     LEFT JOIN buildings b ON wo.building_id = b.id
     LEFT JOIN portfolios p ON s.portfolio_id = p.id
     LEFT JOIN enterprises e ON wo.enterprise_id = e.id
     LEFT JOIN users assigned_user ON wo.assigned_to = assigned_user.id
     LEFT JOIN users reported_user ON wo.requested_by = reported_user.id
     WHERE wo.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  const workOrder = result.rows[0];

  // Check permissions
  if (req.user.role === 'technician' && workOrder.assigned_to !== req.user.id) {
    throw new AppError('You do not have permission to view this work order', 403);
  }

  res.status(200).json({
    success: true,
    data: { work_order: workOrder },
  });
});

// Create new work order
exports.createWorkOrder = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    source = 'manual',
    priority,
    site_id,
    enterprise_id,
    building_id,
    building,
    location,
    asset_ids,
    assigned_to,
    performance_deviation_details,
    customer_complaint_details,
    reference_pictures,
    due_date,
    scheduled_date,
    estimated_hours,
  } = req.body;

  // Only admins, managers, and analysts can create work orders
  if (!['admin', 'manager', 'analyst'].includes(req.user.role)) {
    throw new AppError('You do not have permission to create work orders', 403);
  }

  // Verify site exists
  const siteResult = await query('SELECT id, project_id FROM sites WHERE id = $1', [site_id]);
  if (siteResult.rows.length === 0) {
    throw new AppError('Site not found', 404);
  }

  // Verify assigned technician if provided
  if (assigned_to) {
    const technicianResult = await query(
      "SELECT id FROM users WHERE id = $1 AND (role = 'technician' OR role = 'manager') AND status = 'active'",
      [assigned_to]
    );
    if (technicianResult.rows.length === 0) {
      throw new AppError('Assigned user not found or inactive', 404);
    }
  }

  // Parse dates to ensure proper format
  const parsedDueDate = due_date ? new Date(due_date).toISOString() : null;
  const parsedScheduledDate = scheduled_date ? new Date(scheduled_date).toISOString() : null;

  const result = await transaction(async (client) => {
    // Insert work order
    const woResult = await client.query(
      `INSERT INTO work_orders (
        title, description, source, priority, site_id, reported_by, assigned_to,
        building_id, floor_id, space_id,
        performance_deviation_details, customer_complaint_details, reference_pictures,
        due_date, scheduled_start, estimated_hours, org_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        title,
        description,
        source,
        priority,
        site_id,
        req.user.id,
        assigned_to || null,
        req.body.building_id || null,
        req.body.floor_id || null,
        req.body.space_id || null,
        performance_deviation_details ? JSON.stringify(performance_deviation_details) : null,
        customer_complaint_details ? JSON.stringify(customer_complaint_details) : null,
        reference_pictures ? JSON.stringify(reference_pictures) : null,
        parsedDueDate,
        parsedScheduledDate,
        estimated_hours || null,
        req.user.org_id || 7,
      ]
    );

    const workOrder = woResult.rows[0];

    // Link assets to work order
    if (asset_ids && asset_ids.length > 0) {
      for (const assetId of asset_ids) {
        await client.query(
          'INSERT INTO work_order_assets (work_order_id, asset_id) VALUES ($1, $2)',
          [workOrder.id, assetId]
        );
      }
    }

    // Create initial activity
    await client.query(
      `INSERT INTO work_order_activities (work_order_id, activity_type, description, created_by)
       VALUES ($1, $2, $3, $4)`,
      [workOrder.id, 'status_change', `Work order created with status: ${workOrder.status}`, req.user.id]
    );

    return workOrder;
  });

  // Invalidate cache
  await cache.delPattern('work_orders:*');

  logger.info(`Work order created: ${result.id} by user: ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: 'Work order created successfully',
    data: { work_order: result },
  });
});

// Update work order
exports.updateWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if work order exists
  const existingWO = await query('SELECT * FROM work_orders WHERE id = $1', [id]);
  if (existingWO.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  const workOrder = existingWO.rows[0];

  // Permission check
  if (req.user.role === 'technician' && workOrder.assigned_to !== req.user.id) {
    throw new AppError('You can only update work orders assigned to you', 403);
  }

  // Build update query
  const updateFields = [];
  const values = [];
  let paramCount = 1;

  const allowedFields = ['title', 'description', 'priority', 'status', 'assigned_to', 'due_date', 'estimated_hours', 'actual_hours'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = $${paramCount++}`);
      values.push(updates[field]);
    }
  }

  if (updateFields.length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  // Add timestamps based on status changes
  if (updates.status === 'acknowledged' && !workOrder.acknowledged_at) {
    updateFields.push(`acknowledged_at = CURRENT_TIMESTAMP`);
  }
  if (updates.status === 'in_progress' && !workOrder.started_at) {
    updateFields.push(`started_at = CURRENT_TIMESTAMP`);
  }
  if (updates.status === 'completed' && !workOrder.completed_at) {
    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
  }

  values.push(id);

  const result = await transaction(async (client) => {
    // Update work order
    const updateResult = await client.query(
      `UPDATE work_orders SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    // Log status change activity
    if (updates.status && updates.status !== workOrder.status) {
      await client.query(
        `INSERT INTO work_order_activities (work_order_id, activity_type, description, created_by)
         VALUES ($1, $2, $3, $4)`,
        [id, 'status_change', `Status changed from ${workOrder.status} to ${updates.status}`, req.user.id]
      );
    }

    return updateResult.rows[0];
  });

  // Invalidate cache
  await cache.delPattern('work_orders:*');

  logger.info(`Work order updated: ${id} by user: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Work order updated successfully',
    data: { work_order: result },
  });
});

// Add activity to work order
exports.addActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { activity_type, description, ai_enhanced, original_text, pictures, parts_used } = req.body;

  // Check if work order exists and user has permission
  const woResult = await query('SELECT assigned_to FROM work_orders WHERE id = $1', [id]);
  if (woResult.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  const workOrder = woResult.rows[0];

  if (req.user.role === 'technician' && workOrder.assigned_to !== req.user.id) {
    throw new AppError('You can only add activities to work orders assigned to you', 403);
  }

  const result = await query(
    `INSERT INTO work_order_activities 
     (work_order_id, activity_type, description, ai_enhanced, original_text, pictures, parts_used, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      id,
      activity_type,
      description,
      ai_enhanced || false,
      original_text || null,
      pictures ? JSON.stringify(pictures) : null,
      parts_used ? JSON.stringify(parts_used) : null,
      req.user.id,
    ]
  );

  // Update work order timestamp
  await query('UPDATE work_orders SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

  logger.info(`Activity added to work order: ${id} by user: ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: 'Activity added successfully',
    data: { activity: result.rows[0] },
  });
});

// Get work order activities
exports.getActivities = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      woa.*,
      u.name as created_by_name,
      u.role as created_by_role
     FROM work_order_activities woa
     LEFT JOIN users u ON woa.created_by = u.id
     WHERE woa.work_order_id = $1
     ORDER BY woa.created_at DESC`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: { activities: result.rows },
  });
});

// Delete work order (soft delete by changing status to cancelled)
exports.deleteWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Only admins and managers can delete work orders
  if (!['admin', 'manager'].includes(req.user.role)) {
    throw new AppError('You do not have permission to delete work orders', 403);
  }

  const result = await query(
    "UPDATE work_orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Work order not found', 404);
  }

  // Invalidate cache
  await cache.delPattern('work_orders:*');

  logger.info(`Work order cancelled: ${id} by user: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: 'Work order cancelled successfully',
  });
});

