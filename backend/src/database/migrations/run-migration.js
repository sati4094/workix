/**
 * Complete Migration Runner for v2 Enterprise Architecture
 * 
 * This script orchestrates the complete migration:
 * 1. Run schema migration (002_restructure_to_enterprise.sql)
 * 2. Run data migration (migrate-data-to-v2.js)
 * 3. Validate all changes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     WORKIX v2 ENTERPRISE ARCHITECTURE MIGRATION          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    // ============================================
    // STEP 1: Backup notification
    // ============================================
    console.log('⚠️  IMPORTANT: Please ensure you have a database backup before proceeding!');
    console.log('   Run: pg_dump -U postgres -d workix > backup_$(date +%Y%m%d_%H%M%S).sql\n');
    
    console.log('📋 Migration will perform the following changes:');
    console.log('   1. Rename "clients" table → "enterprises"');
    console.log('   2. Create new "buildings" table');
    console.log('   3. Update all foreign key relationships');
    console.log('   4. Create project scoping tables');
    console.log('   5. Migrate all existing data\n');
    
    // ============================================
    // STEP 2: Check if migration already ran
    // ============================================
    console.log('🔍 Checking migration status...\n');
    
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('enterprises', 'buildings', 'clients')
    `);
    
    const hasEnterprises = tables.some(t => t.table_name === 'enterprises');
    const hasBuildings = tables.some(t => t.table_name === 'buildings');
    const hasClients = tables.some(t => t.table_name === 'clients');
    
    if (hasEnterprises && hasBuildings && !hasClients) {
      console.log('✓ Migration already completed. Skipping schema changes.\n');
      await runValidation(client);
      return;
    }
    
    if (hasEnterprises && hasClients) {
      throw new Error('Partial migration detected. Please restore from backup and retry.');
    }
    
    // ============================================
    // STEP 3: Run schema migration
    // ============================================
    console.log('📝 Step 1: Running schema migration...\n');
    
    const schemaPath = path.join(__dirname, '002_restructure_to_enterprise.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await client.query(schemaSql);
    console.log('✅ Schema migration completed successfully!\n');
    
    // ============================================
    // STEP 4: Run data migration
    // ============================================
    console.log('📝 Step 2: Running data migration...\n');
    
    const { migrateData } = require('./migrate-data-to-v2');
    await migrateData();
    
    console.log('✅ Data migration completed successfully!\n');
    
    // ============================================
    // STEP 5: Final validation
    // ============================================
    await runValidation(client);
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║            MIGRATION COMPLETED SUCCESSFULLY!              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('🎉 Your Workix database is now using v2 Enterprise Architecture!\n');
    console.log('📚 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test API endpoints: /api/v1/enterprises, /api/v1/buildings');
    console.log('   3. Update frontend applications\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    console.error('\n⚠️  Please restore from backup and check the error above.\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function runValidation(client) {
  console.log('🔍 Step 3: Running validation checks...\n');
  
  // Check table structure
  const { rows: columns } = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('enterprises', 'buildings', 'work_orders', 'sites', 'assets')
    AND column_name IN ('enterprise_id', 'building_id', 'client_id')
    ORDER BY table_name, column_name
  `);
  
  console.log('Table Structure:');
  columns.forEach(col => {
    console.log(`  ${col.table_name}.${col.column_name}`);
  });
  console.log('');
  
  // Check data integrity
  const validations = [
    {
      name: 'Enterprises exist',
      query: 'SELECT COUNT(*) as count FROM enterprises WHERE deleted_at IS NULL',
      expected: '> 0'
    },
    {
      name: 'Buildings exist',
      query: 'SELECT COUNT(*) as count FROM buildings WHERE deleted_at IS NULL',
      expected: '> 0'
    },
    {
      name: 'Sites linked to enterprises',
      query: 'SELECT COUNT(*) as count FROM sites WHERE enterprise_id IS NOT NULL AND deleted_at IS NULL',
      expected: '> 0'
    },
    {
      name: 'Assets linked to buildings',
      query: 'SELECT COUNT(*) as count FROM assets WHERE building_id IS NOT NULL AND deleted_at IS NULL',
      expected: '> 0'
    },
    {
      name: 'Work orders have enterprise_id',
      query: 'SELECT COUNT(*) as count FROM work_orders WHERE enterprise_id IS NOT NULL AND deleted_at IS NULL',
      expected: '> 0'
    },
    {
      name: 'Views created',
      query: `SELECT COUNT(*) as count FROM information_schema.views 
              WHERE table_schema = 'public' 
              AND table_name IN ('view_asset_hierarchy', 'view_work_order_hierarchy', 'view_building_stats')`,
      expected: '= 3'
    }
  ];
  
  let allPassed = true;
  
  for (const validation of validations) {
    try {
      const { rows: [result] } = await client.query(validation.query);
      const count = parseInt(result.count);
      const passed = validation.expected.includes('>') ? count > 0 : 
                     validation.expected.includes('=') ? count === parseInt(validation.expected.split(' ')[1]) :
                     true;
      
      if (passed) {
        console.log(`✓ ${validation.name}: ${count}`);
      } else {
        console.log(`✗ ${validation.name}: ${count} (expected ${validation.expected})`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`✗ ${validation.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log('');
  
  if (!allPassed) {
    throw new Error('Some validation checks failed. Please review the output above.');
  }
  
  console.log('✅ All validation checks passed!\n');
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed');
      process.exit(1);
    });
}

module.exports = { runMigration };
