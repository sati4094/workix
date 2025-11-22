const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkTables() {
  try {
    const result = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    
    console.log('Existing tables:');
    result.rows.forEach(row => console.log('- ' + row.tablename));
    
    // Check for missing tables
    const requiredTables = [
      'work_order_templates',
      'sla_policies',
      'inventory_items',
      'work_order_inventory',
      'work_order_attachments',
      'notifications'
    ];
    
    const existingTables = result.rows.map(r => r.tablename);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\nMissing tables:');
      missingTables.forEach(t => console.log('- ' + t));
    } else {
      console.log('\n✅ All required tables exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
