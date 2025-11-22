const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get all work order templates
exports.getTemplates = async (req, res) => {
  try {
    const { category, is_active, priority } = req.query;
    
    let query = `
      SELECT t.*, u.name as created_by_name
      FROM work_order_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND t.category = $${paramCount++}`;
      params.push(category);
    }
    
    if (is_active !== undefined) {
      query += ` AND t.is_active = $${paramCount++}`;
      params.push(is_active === 'true');
    }
    
    if (priority) {
      query += ` AND t.priority = $${paramCount++}`;
      params.push(priority);
    }
    
    query += ' ORDER BY t.name ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
};

// Get single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, u.name as created_by_name
       FROM work_order_templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template', error: error.message });
  }
};

// Create new template
exports.createTemplate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      name,
      description,
      category,
      priority,
      estimated_hours,
      default_checklist,
      required_parts,
      instructions,
      safety_notes,
      attachments,
      is_active
    } = req.body;
    
    const userId = req.user?.id;
    
    await client.query('BEGIN');
    
    const result = await client.query(
      `INSERT INTO work_order_templates (
        name, description, category, priority, estimated_hours,
        default_checklist, required_parts, instructions, safety_notes,
        attachments, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name,
        description,
        category,
        priority,
        estimated_hours,
        default_checklist ? JSON.stringify(default_checklist) : null,
        required_parts ? JSON.stringify(required_parts) : null,
        instructions,
        safety_notes,
        attachments ? JSON.stringify(attachments) : null,
        is_active !== false,
        userId
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info(`Template created: ${result.rows[0].id} by user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating template:', error);
    res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
  } finally {
    client.release();
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      priority,
      estimated_hours,
      default_checklist,
      required_parts,
      instructions,
      safety_notes,
      attachments,
      is_active
    } = req.body;
    
    await client.query('BEGIN');
    
    // Check if template exists
    const checkResult = await client.query(
      'SELECT id FROM work_order_templates WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    const result = await client.query(
      `UPDATE work_order_templates SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        estimated_hours = COALESCE($5, estimated_hours),
        default_checklist = COALESCE($6, default_checklist),
        required_parts = COALESCE($7, required_parts),
        instructions = COALESCE($8, instructions),
        safety_notes = COALESCE($9, safety_notes),
        attachments = COALESCE($10, attachments),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *`,
      [
        name,
        description,
        category,
        priority,
        estimated_hours,
        default_checklist ? JSON.stringify(default_checklist) : null,
        required_parts ? JSON.stringify(required_parts) : null,
        instructions,
        safety_notes,
        attachments ? JSON.stringify(attachments) : null,
        is_active,
        id
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info(`Template updated: ${id}`);
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
  } finally {
    client.release();
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists
    const checkResult = await pool.query(
      'SELECT id FROM work_order_templates WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    
    await pool.query('DELETE FROM work_order_templates WHERE id = $1', [id]);
    
    logger.info(`Template deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template', error: error.message });
  }
};

// Get template categories
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category
       FROM work_order_templates
       WHERE category IS NOT NULL
       ORDER BY category ASC`
    );
    
    res.json({
      success: true,
      data: result.rows.map(r => r.category)
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};
