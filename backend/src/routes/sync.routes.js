const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');
const { verifyToken } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

// ============================================================================
// GET INCREMENTAL UPDATES
// ============================================================================

// Get work orders updated since timestamp
router.get('/work-orders', verifyToken, asyncHandler(async (req, res) => {
  const { updated_since, limit = 50 } = req.query;
  
  if (!updated_since) {
    throw new AppError('updated_since parameter is required', 400);
  }

  const query = `
    SELECT 
      wo.id,
      wo.work_order_number,
      wo.title,
      wo.description,
      wo.priority,
      wo.status,
      wo.source,
      wo.work_type,
      wo.category,
      wo.assigned_to,
      wo.site_id,
      wo.building_id,
      wo.floor_id,
      wo.space_id,
      wo.created_at,
      wo.updated_at,
      wo.due_date,
      wo.completed_at,
      wo.created_by,
      wo.last_modified_at,
      wo.last_modified_by,
      wo.sync_version,
      wo.deleted,
      u.name as assigned_to_name,
      s.name as site_name,
      b.name as building_name,
      f.name as floor_name,
      sp.name as space_name
    FROM work_orders wo
    LEFT JOIN users u ON CAST(wo.assigned_to AS TEXT) = CAST(u.id AS TEXT)
    LEFT JOIN sites s ON CAST(wo.site_id AS TEXT) = CAST(s.id AS TEXT)
    LEFT JOIN buildings b ON CAST(wo.building_id AS TEXT) = CAST(b.id AS TEXT)
    LEFT JOIN floors f ON CAST(wo.floor_id AS TEXT) = CAST(f.id AS TEXT)
    LEFT JOIN spaces sp ON CAST(wo.space_id AS TEXT) = CAST(sp.id AS TEXT)
    WHERE wo.last_modified_at > $1
    ORDER BY wo.last_modified_at ASC
    LIMIT $2
  `;

  const result = await pool.query(query, [updated_since, limit]);

  res.json({
    success: true,
    data: {
      work_orders: result.rows,
      has_more: result.rows.length === parseInt(limit),
      last_sync: result.rows.length > 0 
        ? result.rows[result.rows.length - 1].last_modified_at 
        : updated_since
    }
  });
}));

// Get activities updated since timestamp
router.get('/activities', verifyToken, asyncHandler(async (req, res) => {
  const { updated_since, work_order_id, limit = 100 } = req.query;
  
  if (!updated_since) {
    throw new AppError('updated_since parameter is required', 400);
  }

  let query = `
    SELECT 
      a.id,
      a.work_order_id,
      a.activity_type,
      a.description,
      a.created_by,
      a.created_at,
      a.ai_enhanced,
      a.original_text,
      a.last_modified_at,
      a.sync_version,
      a.deleted,
      u.name as created_by_name
    FROM activities a
    LEFT JOIN users u ON a.created_by = u.id::text
    WHERE a.last_modified_at > $1
  `;

  const params = [updated_since];
  
  if (work_order_id) {
    query += ' AND a.work_order_id = $' + (params.length + 1);
    params.push(work_order_id);
  }

  query += ' ORDER BY a.last_modified_at ASC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      activities: result.rows,
      has_more: result.rows.length === parseInt(limit),
      last_sync: result.rows.length > 0 
        ? result.rows[result.rows.length - 1].last_modified_at 
        : updated_since
    }
  });
}));

// ============================================================================
// BULK UPSERT (PUSH FROM CLIENT)
// ============================================================================

// Bulk upsert work orders
router.post('/work-orders', verifyToken, asyncHandler(async (req, res) => {
  const { work_orders } = req.body;
  
  if (!Array.isArray(work_orders) || work_orders.length === 0) {
    throw new AppError('work_orders array is required', 400);
  }

  const client = await pool.connect();
  const results = {
    inserted: 0,
    updated: 0,
    conflicts: [],
    errors: []
  };

  try {
    await client.query('BEGIN');

    for (const wo of work_orders) {
      try {
        // Check if work order exists
        const existingQuery = `
          SELECT id, sync_version, last_modified_at 
          FROM work_orders 
          WHERE id = $1
        `;
        const existing = await client.query(existingQuery, [wo.id]);

        if (existing.rows.length === 0) {
          // Insert new work order
          const insertQuery = `
            INSERT INTO work_orders (
              id, work_order_number, title, description, priority, status,
              source, work_type, category, assigned_to, site_id, building_id,
              floor_id, space_id, created_at, updated_at, due_date, 
              completed_at, created_by, last_modified_at, last_modified_by,
              sync_version, deleted
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
              $15, $16, $17, $18, $19, $20, $21, $22, $23
            )
            RETURNING *
          `;
          
          await client.query(insertQuery, [
            wo.id,
            wo.work_order_number,
            wo.title,
            wo.description,
            wo.priority,
            wo.status,
            wo.source,
            wo.work_type,
            wo.category,
            wo.assigned_to,
            wo.site_id,
            wo.building_id,
            wo.floor_id,
            wo.space_id,
            wo.created_at,
            wo.updated_at || Date.now(),
            wo.due_date,
            wo.completed_at,
            wo.created_by || req.user.id,
            wo.last_modified_at || Date.now(),
            req.user.id,
            wo.sync_version || 1,
            wo.deleted || false
          ]);
          
          results.inserted++;
        } else {
          const serverRecord = existing.rows[0];
          
          // Check for conflicts
          if (wo.sync_version && serverRecord.sync_version !== wo.sync_version) {
            // Conflict: client version doesn't match server
            if (wo.last_modified_at < serverRecord.last_modified_at) {
              // Server is newer - reject client update
              results.conflicts.push({
                id: wo.id,
                reason: 'Server has newer version',
                server_version: serverRecord.sync_version,
                client_version: wo.sync_version,
                server_last_modified: serverRecord.last_modified_at,
                client_last_modified: wo.last_modified_at
              });
              continue;
            }
          }

          // Update existing work order
          const updateQuery = `
            UPDATE work_orders SET
              title = $2,
              description = $3,
              priority = $4,
              status = $5,
              work_type = $6,
              category = $7,
              assigned_to = $8,
              building_id = $9,
              floor_id = $10,
              space_id = $11,
              updated_at = $12,
              due_date = $13,
              completed_at = $14,
              last_modified_at = $15,
              last_modified_by = $16,
              sync_version = sync_version + 1,
              deleted = $17
            WHERE id = $1
            RETURNING *
          `;
          
          await client.query(updateQuery, [
            wo.id,
            wo.title,
            wo.description,
            wo.priority,
            wo.status,
            wo.work_type,
            wo.category,
            wo.assigned_to,
            wo.building_id,
            wo.floor_id,
            wo.space_id,
            Date.now(),
            wo.due_date,
            wo.completed_at,
            Date.now(),
            req.user.id,
            wo.deleted || false
          ]);
          
          results.updated++;
        }
      } catch (error) {
        results.errors.push({
          id: wo.id,
          error: error.message
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Bulk upsert activities
router.post('/activities', verifyToken, asyncHandler(async (req, res) => {
  const { activities } = req.body;
  
  if (!Array.isArray(activities) || activities.length === 0) {
    throw new AppError('activities array is required', 400);
  }

  const client = await pool.connect();
  const results = {
    inserted: 0,
    updated: 0,
    conflicts: [],
    errors: []
  };

  try {
    await client.query('BEGIN');

    for (const activity of activities) {
      try {
        // Check if activity exists
        const existingQuery = `
          SELECT id, sync_version, last_modified_at 
          FROM activities 
          WHERE id = $1
        `;
        const existing = await client.query(existingQuery, [activity.id]);

        if (existing.rows.length === 0) {
          // Insert new activity
          const insertQuery = `
            INSERT INTO activities (
              id, work_order_id, activity_type, description, created_by,
              created_at, ai_enhanced, original_text, last_modified_at,
              sync_version, deleted
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
          `;
          
          await client.query(insertQuery, [
            activity.id,
            activity.work_order_id,
            activity.activity_type,
            activity.description,
            activity.created_by || req.user.id,
            activity.created_at || Date.now(),
            activity.ai_enhanced || false,
            activity.original_text,
            activity.last_modified_at || Date.now(),
            activity.sync_version || 1,
            activity.deleted || false
          ]);
          
          results.inserted++;
        } else {
          const serverRecord = existing.rows[0];
          
          // Check for conflicts
          if (activity.sync_version && serverRecord.sync_version !== activity.sync_version) {
            if (activity.last_modified_at < serverRecord.last_modified_at) {
              results.conflicts.push({
                id: activity.id,
                reason: 'Server has newer version'
              });
              continue;
            }
          }

          // Update existing activity
          const updateQuery = `
            UPDATE activities SET
              description = $2,
              last_modified_at = $3,
              sync_version = sync_version + 1,
              deleted = $4
            WHERE id = $1
            RETURNING *
          `;
          
          await client.query(updateQuery, [
            activity.id,
            activity.description,
            Date.now(),
            activity.deleted || false
          ]);
          
          results.updated++;
        }
      } catch (error) {
        results.errors.push({
          id: activity.id,
          error: error.message
        });
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// ============================================================================
// SYNC STATUS
// ============================================================================

// Get sync metadata
router.get('/status', verifyToken, asyncHandler(async (req, res) => {
  const workOrdersCount = await pool.query(
    'SELECT COUNT(*) as count FROM work_orders WHERE deleted = FALSE'
  );
  
  // Activities table may not exist
  let activitiesCount = { rows: [{ count: '0' }] };
  let lastActivityUpdate = { rows: [{ last_update: null }] };
  try {
    activitiesCount = await pool.query(
      'SELECT COUNT(*) as count FROM activities WHERE deleted = FALSE'
    );
    lastActivityUpdate = await pool.query(
      'SELECT MAX(last_modified_at) as last_update FROM activities'
    );
  } catch (error) {
    // Table doesn't exist, use defaults
  }

  const lastWorkOrderUpdate = await pool.query(
    'SELECT MAX(last_modified_at) as last_update FROM work_orders'
  );

  res.json({
    success: true,
    data: {
      work_orders: {
        count: parseInt(workOrdersCount.rows[0].count),
        last_update: lastWorkOrderUpdate.rows[0].last_update
      },
      activities: {
        count: parseInt(activitiesCount.rows[0].count),
        last_update: lastActivityUpdate.rows[0].last_update
      },
      server_time: Date.now()
    }
  });
}));

module.exports = router;
