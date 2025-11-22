const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function runAdvancedFeatures() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running advanced features migration...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'advanced_features.sql'),
      'utf8'
    );
    
    await client.query(sql);
    
    console.log('✅ Advanced features tables created successfully!');
    console.log('  - work_order_templates');
    console.log('  - sla_policies');
    console.log('  - sla_violations');
    console.log('  - asset_relationships');
    console.log('  - inventory_items');
    console.log('  - parts_usage');
    console.log('  - inventory_transactions');
    console.log('  - work_order_attachments');
    console.log('  - asset_documents');
    console.log('  - notifications');
    console.log('  - audit_logs');
    console.log('✅ Default data inserted!');
    
  } catch (error) {
    console.error('❌ Error running advanced features migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runAdvancedFeatures();
