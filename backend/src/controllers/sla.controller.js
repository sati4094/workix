const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get all SLA policies
exports.getSLAPolicies = async (req, res) => {
  try {
    const { priority, is_active } = req.query;
    
    let query = 'SELECT * FROM sla_policies WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (priority) {
      query += ` AND priority = $${paramCount++}`;
      params.push(priority);
    }
    
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount++}`;
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY priority DESC, name ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching SLA policies:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SLA policies', error: error.message });
  }
};

// Get single SLA policy
exports.getSLAPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM sla_policies WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'SLA policy not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching SLA policy:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SLA policy', error: error.message });
  }
};

// Create SLA policy
exports.createSLAPolicy = async (req, res) => {
  try {
    const {
      name,
      description,
      priority,
      response_time_hours,
      resolution_time_hours,
      escalation_enabled,
      escalation_1_hours,
      escalation_1_notify,
      escalation_2_hours,
      escalation_2_notify,
      escalation_3_hours,
      escalation_3_notify,
      business_hours_only,
      is_active
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sla_policies (
        name, description, priority, response_time_hours, resolution_time_hours,
        escalation_enabled, escalation_1_hours, escalation_1_notify,
        escalation_2_hours, escalation_2_notify, escalation_3_hours, escalation_3_notify,
        business_hours_only, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        name, description, priority, response_time_hours, resolution_time_hours,
        escalation_enabled !== false,
        escalation_1_hours,
        escalation_1_notify ? JSON.stringify(escalation_1_notify) : null,
        escalation_2_hours,
        escalation_2_notify ? JSON.stringify(escalation_2_notify) : null,
        escalation_3_hours,
        escalation_3_notify ? JSON.stringify(escalation_3_notify) : null,
        business_hours_only || false,
        is_active !== false
      ]
    );
    
    logger.info(`SLA policy created: ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'SLA policy created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating SLA policy:', error);
    res.status(500).json({ success: false, message: 'Failed to create SLA policy', error: error.message });
  }
};

// Update SLA policy
exports.updateSLAPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const checkResult = await pool.query('SELECT id FROM sla_policies WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'SLA policy not found' });
    }
    
    const result = await pool.query(
      `UPDATE sla_policies SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        response_time_hours = COALESCE($4, response_time_hours),
        resolution_time_hours = COALESCE($5, resolution_time_hours),
        escalation_enabled = COALESCE($6, escalation_enabled),
        escalation_1_hours = COALESCE($7, escalation_1_hours),
        escalation_2_hours = COALESCE($8, escalation_2_hours),
        escalation_3_hours = COALESCE($9, escalation_3_hours),
        business_hours_only = COALESCE($10, business_hours_only),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        updates.name,
        updates.description,
        updates.priority,
        updates.response_time_hours,
        updates.resolution_time_hours,
        updates.escalation_enabled,
        updates.escalation_1_hours,
        updates.escalation_2_hours,
        updates.escalation_3_hours,
        updates.business_hours_only,
        updates.is_active,
        id
      ]
    );
    
    logger.info(`SLA policy updated: ${id}`);
    
    res.json({
      success: true,
      message: 'SLA policy updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating SLA policy:', error);
    res.status(500).json({ success: false, message: 'Failed to update SLA policy', error: error.message });
  }
};

// Delete SLA policy
exports.deleteSLAPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await pool.query('SELECT id FROM sla_policies WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'SLA policy not found' });
    }
    
    await pool.query('DELETE FROM sla_policies WHERE id = $1', [id]);
    
    logger.info(`SLA policy deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'SLA policy deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting SLA policy:', error);
    res.status(500).json({ success: false, message: 'Failed to delete SLA policy', error: error.message });
  }
};

// Get SLA violations
exports.getSLAViolations = async (req, res) => {
  try {
    const { work_order_id, violation_type, escalation_level } = req.query;
    
    let query = `
      SELECT v.*, w.wo_number, w.title as work_order_title, s.name as sla_policy_name
      FROM sla_violations v
      LEFT JOIN work_orders w ON v.work_order_id = w.id
      LEFT JOIN sla_policies s ON v.sla_policy_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (work_order_id) {
      query += ` AND v.work_order_id = $${paramCount++}`;
      params.push(work_order_id);
    }
    
    if (violation_type) {
      query += ` AND v.violation_type = $${paramCount++}`;
      params.push(violation_type);
    }
    
    if (escalation_level !== undefined) {
      query += ` AND v.escalation_level = $${paramCount++}`;
      params.push(parseInt(escalation_level));
    }
    
    query += ' ORDER BY v.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching SLA violations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch SLA violations', error: error.message });
  }
};
