const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Enterprise CMMS Schema Migration...\n');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-enterprise-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration file loaded successfully');
    console.log('📊 Executing migration (this may take a minute)...\n');
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Database Summary:');
    console.log('='.repeat(60));
    console.log(`Total tables: ${result.rows.length}`);
    console.log('='.repeat(60));
    
    // Group tables by category
    const categories = {
      'Core System': ['organizations', 'users', 'roles', 'permissions', 'account_roles', 'role_permissions'],
      'Location': ['sites', 'buildings', 'floors', 'spaces'],
      'Assets': ['assets', 'asset_categories', 'asset_types', 'asset_specifications'],
      'Work Orders': ['work_orders', 'work_order_assets', 'work_order_activities', 'work_order_tasks', 
                     'work_order_parts', 'work_order_labor', 'work_order_comments', 'work_order_attachments'],
      'Preventive Maintenance': ['ppm_plans', 'ppm_schedules', 'pm_templates', 'pm_template_tasks', 
                                 'pm_schedules', 'pm_executions'],
      'Inventory': ['parts', 'storerooms', 'part_stock', 'part_transactions', 'inventory_items', 'work_order_inventory'],
      'Vendors': ['vendors', 'vendor_contacts', 'vendor_contracts'],
      'Teams': ['teams', 'team_members'],
      'Integrations': ['api_clients', 'api_tokens', 'api_logs', 'connectors'],
      'Customization': ['custom_modules', 'custom_fields', 'custom_forms'],
      'Reporting': ['reports', 'dashboards'],
      'IoT': ['iot_devices', 'sensor_readings'],
      'Facilities': ['bookings', 'utility_meters', 'utility_readings'],
      'System': ['notifications', 'notification_templates', 'audit_logs', 'activity_feed', 'workflows', 'workflow_actions'],
      'Projects': ['clients', 'projects']
    };
    
    const allTables = result.rows.map(r => r.table_name);
    
    for (const [category, tables] of Object.entries(categories)) {
      const existingTables = tables.filter(t => allTables.includes(t));
      if (existingTables.length > 0) {
        console.log(`\n${category}:`);
        existingTables.forEach(table => {
          console.log(`  ✓ ${table}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Check for new features
    const newFeatures = [
      { name: 'Multi-tenancy (Organizations)', table: 'organizations' },
      { name: 'Advanced Roles & Permissions', table: 'role_permissions' },
      { name: 'Location Hierarchy (Buildings/Floors)', table: 'buildings' },
      { name: 'Asset Categories & Types', table: 'asset_categories' },
      { name: 'PM Templates', table: 'pm_templates' },
      { name: 'Parts Inventory', table: 'parts' },
      { name: 'Vendor Management', table: 'vendors' },
      { name: 'Team Management', table: 'teams' },
      { name: 'API Client Management', table: 'api_clients' },
      { name: 'Custom Modules Framework', table: 'custom_modules' },
      { name: 'IoT Device Support', table: 'iot_devices' },
      { name: 'Space Booking System', table: 'bookings' },
      { name: 'Utility Meter Tracking', table: 'utility_meters' },
      { name: 'Workflow Automation', table: 'workflows' },
    ];
    
    console.log('\n🎉 New Enterprise Features Added:');
    console.log('='.repeat(60));
    newFeatures.forEach(feature => {
      const exists = allTables.includes(feature.table);
      console.log(`${exists ? '✅' : '❌'} ${feature.name}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Next Steps:');
    console.log('  1. Update backend controllers and routes');
    console.log('  2. Create TypeScript interfaces for new entities');
    console.log('  3. Add frontend forms and components');
    console.log('  4. Test API endpoints');
    console.log('  5. Update documentation');
    console.log('\n✨ Your Workix CMMS is now ENTERPRISE-READY! ✨\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
