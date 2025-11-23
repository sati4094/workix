// Migration script to add sync metadata columns to work_orders and activities tables
require('dotenv').config();
const { pool } = require('./src/database/connection');

async function addSyncColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding sync metadata columns...\n');

    // Add columns to work_orders table
    console.log('Adding columns to work_orders...');
    await client.query(`
      ALTER TABLE work_orders 
      ADD COLUMN IF NOT EXISTS last_modified_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
      ADD COLUMN IF NOT EXISTS last_modified_by TEXT,
      ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE
    `);

    // Add columns to activities table (if it exists)
    const checkActivities = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'activities'
      );
    `);
    
    if (checkActivities.rows[0].exists) {
      console.log('Adding columns to activities...');
      await client.query(`
        ALTER TABLE activities 
        ADD COLUMN IF NOT EXISTS last_modified_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
        ADD COLUMN IF NOT EXISTS sync_version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE
      `);
    } else {
      console.log('⏭️  Skipping activities table (does not exist)');
    }

    // Create indexes for sync queries
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wo_last_modified ON work_orders(last_modified_at) WHERE deleted = FALSE
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wo_sync_version ON work_orders(sync_version) WHERE deleted = FALSE
    `);
    
    if (checkActivities.rows[0].exists) {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_last_modified ON activities(last_modified_at) WHERE deleted = FALSE
      `);
    }

    // Update existing records with last_modified_at
    console.log('Updating existing records...');
    await client.query(`
      UPDATE work_orders 
      SET last_modified_at = EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000
      WHERE last_modified_at IS NULL AND updated_at IS NOT NULL
    `);
    
    if (checkActivities.rows[0].exists) {
      await client.query(`
        UPDATE activities 
        SET last_modified_at = EXTRACT(EPOCH FROM created_at)::BIGINT * 1000
        WHERE last_modified_at IS NULL AND created_at IS NOT NULL
      `);
    }

    console.log('\n✅ Sync columns added successfully!');
    console.log('\nAdded columns:');
    console.log('  - last_modified_at: Timestamp in milliseconds for incremental sync');
    console.log('  - last_modified_by: User who last modified the record');
    console.log('  - sync_version: Version number for conflict detection');
    console.log('  - deleted: Soft delete flag for sync');
  } catch (error) {
    console.error('❌ Error adding sync columns:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addSyncColumns();
