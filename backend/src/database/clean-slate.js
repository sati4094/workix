const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'workix',
});

async function cleanDatabase() {
  console.log('🧹 Cleaning database for fresh migration...\n');
  
  const tablesToDrop = [
    'audit_logs',
    'user_sessions',
    'user_facility_access',
    'user_permissions',
    'role_permissions',
    'permissions',
    'users',
    'system_roles',
    'sites',
    'portfolios',
    'organizations',
    'work_orders',
    'assets',
    'clients'
  ];
  
  try {
    for (const table of tablesToDrop) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped table: ${table}`);
    }
    
    console.log('\n✅ Database cleaned successfully!');
    console.log('You can now run: node src/database/migrate-enterprise.js\n');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  } finally {
    await pool.end();
  }
}

cleanDatabase();
