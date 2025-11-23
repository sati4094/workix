/**
 * Execute SQL Schema Migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Running SQL schema migration...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '004_enterprise_migration_corrected.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const result = await client.query(sql);
    
    console.log('\n✅ Schema migration completed successfully!\n');
    
    // Show verification results
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Verification Results:');
      result.rows.forEach(row => {
        console.log(`  ${row.table_name}: ${row.count} records`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Ready for data migration!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
