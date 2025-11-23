const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'workix',
});

async function runMigration(filename) {
  console.log(`\n📋 Running migration: ${filename}`);
  
  const filePath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`✅ Successfully completed: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${filename}:`, error.message);
    console.error(`Full error:`, error);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting Enterprise Schema Migration...\n');
  
  const migrations = [
    '001_enterprise_schema.sql',
    '002_rls_policies.sql',
    '003_seed_data.sql',
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) successCount++;
    else break; // Stop on first error
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Completed ${successCount}/${migrations.length} migrations`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (successCount === migrations.length) {
    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 New database structure:');
    console.log('   - organizations (multi-tenant support)');
    console.log('   - portfolios (facility groups)');
    console.log('   - system_roles (8 role levels)');
    console.log('   - permissions (40+ permissions)');
    console.log('   - role_permissions (permission assignments)');
    console.log('   - user_permissions (user overrides)');
    console.log('   - user_facility_access (additional access)');
    console.log('   - user_sessions (session management)');
    console.log('   - audit_logs (comprehensive logging)');
    console.log('\n🔒 Row-Level Security enabled on all tables');
    console.log('\n👥 Default users created:');
    console.log('   - admin@workix.com (SuperAdmin)');
    console.log('   - support@workix.com (SuperTech)');
    console.log('   - admin@acme.com (Client Admin)');
  }
  
  await pool.end();
}

runAllMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
