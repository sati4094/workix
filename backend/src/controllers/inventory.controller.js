const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get all inventory items
exports.getInventoryItems = async (req, res) => {
  try {
    const { category, is_active, low_stock } = req.query;
    
    let query = 'SELECT * FROM inventory_items WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }
    
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount++}`;
      params.push(is_active === 'true');
    }
    
    if (low_stock === 'true') {
      query += ' AND quantity_on_hand <= reorder_level';
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory items', error: error.message });
  }
};

// Get single inventory item
exports.getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory item', error: error.message });
  }
};

// Create inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const {
      part_number,
      name,
      description,
      category,
      manufacturer,
      unit_of_measure,
      unit_cost,
      quantity_on_hand,
      reorder_level,
      reorder_quantity,
      location,
      barcode,
      notes,
      is_active
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO inventory_items (
        part_number, name, description, category, manufacturer,
        unit_of_measure, unit_cost, quantity_on_hand, reorder_level,
        reorder_quantity, location, barcode, notes, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        part_number, name, description, category, manufacturer,
        unit_of_measure || 'EA', unit_cost || 0, quantity_on_hand || 0,
        reorder_level || 0, reorder_quantity || 0, location, barcode,
        notes, is_active !== false
      ]
    );
    
    logger.info(`Inventory item created: ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating inventory item:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Part number already exists' });
    }
    
    res.status(500).json({ success: false, message: 'Failed to create inventory item', error: error.message });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const updates = req.body;
    
    await client.query('BEGIN');
    
    const checkResult = await client.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    const oldItem = checkResult.rows[0];
    
    const result = await client.query(
      `UPDATE inventory_items SET
        part_number = COALESCE($1, part_number),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        manufacturer = COALESCE($5, manufacturer),
        unit_of_measure = COALESCE($6, unit_of_measure),
        unit_cost = COALESCE($7, unit_cost),
        quantity_on_hand = COALESCE($8, quantity_on_hand),
        reorder_level = COALESCE($9, reorder_level),
        reorder_quantity = COALESCE($10, reorder_quantity),
        location = COALESCE($11, location),
        barcode = COALESCE($12, barcode),
        notes = COALESCE($13, notes),
        is_active = COALESCE($14, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *`,
      [
        updates.part_number, updates.name, updates.description,
        updates.category, updates.manufacturer, updates.unit_of_measure,
        updates.unit_cost, updates.quantity_on_hand, updates.reorder_level,
        updates.reorder_quantity, updates.location, updates.barcode,
        updates.notes, updates.is_active, id
      ]
    );
    
    // Track quantity changes
    if (updates.quantity_on_hand !== undefined && updates.quantity_on_hand !== oldItem.quantity_on_hand) {
      const quantityChange = updates.quantity_on_hand - oldItem.quantity_on_hand;
      
      await client.query(
        `INSERT INTO inventory_transactions (
          inventory_item_id, transaction_type, quantity, unit_cost, reference_type, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id,
          'adjustment',
          quantityChange,
          oldItem.unit_cost,
          'adjustment',
          `Quantity adjusted from ${oldItem.quantity_on_hand} to ${updates.quantity_on_hand}`,
          req.user?.id
        ]
      );
    }
    
    await client.query('COMMIT');
    
    logger.info(`Inventory item updated: ${id}`);
    
    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error updating inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to update inventory item', error: error.message });
  } finally {
    client.release();
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkResult = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);
    
    logger.info(`Inventory item deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting inventory item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inventory item', error: error.message });
  }
};

// Get parts usage for a work order
exports.getPartsUsage = async (req, res) => {
  try {
    const { work_order_id } = req.query;
    
    let query = `
      SELECT p.*, i.part_number, i.name as part_name, u.name as used_by_name
      FROM parts_usage p
      LEFT JOIN inventory_items i ON p.inventory_item_id = i.id
      LEFT JOIN users u ON p.used_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (work_order_id) {
      query += ' AND p.work_order_id = $1';
      params.push(work_order_id);
    }
    
    query += ' ORDER BY p.used_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching parts usage:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch parts usage', error: error.message });
  }
};

// Record parts usage
exports.recordPartsUsage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { work_order_id, inventory_item_id, quantity_used, unit_cost, notes } = req.body;
    const userId = req.user?.id;
    
    await client.query('BEGIN');
    
    // Check inventory item exists and has enough stock
    const itemResult = await client.query(
      'SELECT * FROM inventory_items WHERE id = $1',
      [inventory_item_id]
    );
    
    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    const item = itemResult.rows[0];
    
    if (item.quantity_on_hand < quantity_used) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${item.quantity_on_hand}, Required: ${quantity_used}`
      });
    }
    
    // Record parts usage
    const usageResult = await client.query(
      `INSERT INTO parts_usage (
        work_order_id, inventory_item_id, quantity_used, unit_cost, notes, used_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [work_order_id, inventory_item_id, quantity_used, unit_cost || item.unit_cost, notes, userId]
    );
    
    // Update inventory quantity
    await client.query(
      'UPDATE inventory_items SET quantity_on_hand = quantity_on_hand - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity_used, inventory_item_id]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO inventory_transactions (
        inventory_item_id, transaction_type, quantity, unit_cost, reference_type, reference_id, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        inventory_item_id,
        'usage',
        -quantity_used,
        unit_cost || item.unit_cost,
        'work_order',
        work_order_id,
        `Used in work order`,
        userId
      ]
    );
    
    await client.query('COMMIT');
    
    logger.info(`Parts usage recorded for WO ${work_order_id}`);
    
    res.status(201).json({
      success: true,
      message: 'Parts usage recorded successfully',
      data: usageResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error recording parts usage:', error);
    res.status(500).json({ success: false, message: 'Failed to record parts usage', error: error.message });
  } finally {
    client.release();
  }
};

// Get inventory transactions
exports.getInventoryTransactions = async (req, res) => {
  try {
    const { inventory_item_id, transaction_type } = req.query;
    
    let query = `
      SELECT t.*, i.part_number, i.name as item_name, u.name as created_by_name
      FROM inventory_transactions t
      LEFT JOIN inventory_items i ON t.inventory_item_id = i.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (inventory_item_id) {
      query += ` AND t.inventory_item_id = $${paramCount++}`;
      params.push(inventory_item_id);
    }
    
    if (transaction_type) {
      query += ` AND t.transaction_type = $${paramCount++}`;
      params.push(transaction_type);
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching inventory transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory transactions', error: error.message });
  }
};

// Get inventory categories
exports.getInventoryCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM inventory_items WHERE category IS NOT NULL ORDER BY category'
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
