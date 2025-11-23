const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

// Get all projects
router.get('/', asyncHandler(async (req, res) => {
  const { enterprise_id, client_id, status, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];
  let paramCount = 1;

  // Support both enterprise_id and client_id for backward compatibility
  if (enterprise_id || client_id) {
    conditions.push(`p.enterprise_id = $${paramCount++}`);
    values.push(enterprise_id || client_id);
  }
  if (status) {
    conditions.push(`p.status = $${paramCount++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total FROM projects p ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].total);

  const result = await query(
    `SELECT p.*, e.name as enterprise_name, e.name as client_name, u.name as project_manager_name,
      0 as site_count
     FROM projects p
     LEFT JOIN enterprises e ON p.enterprise_id = e.id
     LEFT JOIN users u ON p.project_manager_id = u.id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${paramCount++} OFFSET $${paramCount++}`,
    [...values, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: {
      projects: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get project by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, e.name as enterprise_name, e.name as client_name, e.contact_person, e.contact_phone,
      u.name as project_manager_name,
      '[]'::json as sites
     FROM projects p
     LEFT JOIN enterprises e ON p.enterprise_id = e.id
     LEFT JOIN users u ON p.project_manager_id = u.id
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json({ success: true, data: { project: result.rows[0] } });
}));

// Create project
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const {
    name, enterprise_id, client_id, contract_number, contract_start_date, contract_end_date,
    contract_value, project_manager_id, description, performance_baseline, status
  } = req.body;

  const actualEnterpriseId = enterprise_id || client_id;
  if (!name || !actualEnterpriseId) {
    throw new AppError('Project name and enterprise are required', 400);
  }

  const result = await query(
    `INSERT INTO projects (name, enterprise_id, contract_number, contract_start_date, contract_end_date,
      contract_value, project_manager_id, description, performance_baseline, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [name, actualEnterpriseId, contract_number, contract_start_date, contract_end_date, contract_value,
      project_manager_id, description, performance_baseline ? JSON.stringify(performance_baseline) : null,
      status || 'active', req.user.id]
  );

  res.status(201).json({ success: true, message: 'Project created successfully', data: { project: result.rows[0] } });
}));

// Update project
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = ['name', 'contract_number', 'contract_start_date', 'contract_end_date', 'contract_value',
    'project_manager_id', 'description', 'status'];

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

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Project not found', 404);
  }

  res.status(200).json({ success: true, message: 'Project updated successfully', data: { project: result.rows[0] } });
}));

module.exports = router;

