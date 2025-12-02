const express = require('express');
const router = express.Router();
const { query, transaction } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

// Get all PPM plans
router.get('/plans', asyncHandler(async (req, res) => {
  const { asset_type, is_active, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (asset_type) {
    conditions.push(`asset_type = $${paramCount++}`);
    values.push(asset_type);
  }
  if (is_active !== undefined) {
    conditions.push(`is_active = $${paramCount++}`);
    values.push(is_active === 'true');
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT * FROM ppm_plans ${whereClause} ORDER BY name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({ success: true, data: { ppm_plans: result.rows } });
}));

// Create PPM plan
router.post('/plans', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, description, asset_type, frequency, tasks_checklist, estimated_duration_minutes, required_parts, instructions } = req.body;

  if (!name || !frequency || !tasks_checklist) {
    throw new AppError('Name, frequency, and tasks checklist are required', 400);
  }

  const result = await query(
    `INSERT INTO ppm_plans (name, description, asset_type, frequency, tasks_checklist, estimated_duration_minutes, required_parts, instructions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [name, description, asset_type, frequency, JSON.stringify(tasks_checklist), estimated_duration_minutes,
      required_parts ? JSON.stringify(required_parts) : null, instructions, req.user.id]
  );

  res.status(201).json({ success: true, message: 'PPM plan created successfully', data: { ppm_plan: result.rows[0] } });
}));

// Get all PPM schedules
router.get('/schedules', asyncHandler(async (req, res) => {
  const { asset_id, assigned_technician_id, status, from_date, to_date, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (asset_id) {
    conditions.push(`ps.asset_id = $${paramCount++}`);
    values.push(asset_id);
  }
  if (assigned_technician_id) {
    conditions.push(`ps.assigned_technician_id = $${paramCount++}`);
    values.push(assigned_technician_id);
  }
  if (status) {
    conditions.push(`ps.status = $${paramCount++}`);
    values.push(status);
  }
  if (from_date) {
    conditions.push(`ps.scheduled_date >= $${paramCount++}`);
    values.push(from_date);
  }
  if (to_date) {
    conditions.push(`ps.scheduled_date <= $${paramCount++}`);
    values.push(to_date);
  }

  // Technicians only see their own schedules
  if (req.user.role === 'technician') {
    conditions.push(`ps.assigned_technician_id = $${paramCount++}`);
    values.push(req.user.id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT ps.*, 
      pp.name as ppm_plan_name,
      pp.tasks_checklist,
      pp.estimated_duration_minutes,
      a.name as asset_name,
      a.asset_tag,
      a.type as asset_type,
      s.name as site_name,
      s.site_code,
      u.name as assigned_technician_name
     FROM ppm_schedules ps
     JOIN ppm_plans pp ON ps.ppm_plan_id = pp.id
     JOIN assets a ON ps.asset_id = a.id
     JOIN sites s ON a.site_id = s.id
     LEFT JOIN users u ON ps.assigned_technician_id = u.id
     ${whereClause}
     ORDER BY ps.scheduled_date ASC
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({ success: true, data: { ppm_schedules: result.rows } });
}));

// Create PPM schedule
router.post('/schedules', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { ppm_plan_id, asset_id, assigned_technician_id, scheduled_date, scheduled_time, notes } = req.body;

  if (!ppm_plan_id || !asset_id || !scheduled_date) {
    throw new AppError('PPM plan, asset, and scheduled date are required', 400);
  }

  const result = await query(
    `INSERT INTO ppm_schedules (ppm_plan_id, asset_id, assigned_technician_id, scheduled_date, scheduled_time, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [ppm_plan_id, asset_id, assigned_technician_id, scheduled_date, scheduled_time, notes]
  );

  res.status(201).json({ success: true, message: 'PPM schedule created successfully', data: { ppm_schedule: result.rows[0] } });
}));

// Update PPM schedule
router.patch('/schedules/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigned_technician_id, scheduled_date, scheduled_time, status, notes } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (assigned_technician_id !== undefined) {
    updates.push(`assigned_technician_id = $${paramCount++}`);
    values.push(assigned_technician_id);
  }
  if (scheduled_date) {
    updates.push(`scheduled_date = $${paramCount++}`);
    values.push(scheduled_date);
  }
  if (scheduled_time !== undefined) {
    updates.push(`scheduled_time = $${paramCount++}`);
    values.push(scheduled_time);
  }
  if (status) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);

    if (status === 'completed') {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    }
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramCount++}`);
    values.push(notes);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE ppm_schedules SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('PPM schedule not found', 404);
  }

  res.status(200).json({ success: true, message: 'PPM schedule updated successfully', data: { ppm_schedule: result.rows[0] } });
}));

module.exports = router;

