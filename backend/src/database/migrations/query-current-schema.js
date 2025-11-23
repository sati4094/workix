/**
 * Query current database schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function querySchema() {
  const client = await pool.connect();
  
  try {
    console.log('\n📋 CURRENT DATABASE SCHEMA\n');
    
    // Check clients table
    console.log('=== CLIENTS TABLE ===');
    const clientCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clients'
      ORDER BY ordinal_position
    `);
    clientCols.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check sites table
    console.log('\n=== SITES TABLE ===');
    const siteCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sites'
      ORDER BY ordinal_position
    `);
    siteCols.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check work_orders table
    console.log('\n=== WORK_ORDERS TABLE ===');
    const woCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'work_orders'
      ORDER BY ordinal_position
    `);
    woCols.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check assets table
    console.log('\n=== ASSETS TABLE ===');
    const assetCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assets'
      ORDER BY ordinal_position
    `);
    assetCols.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });
    
    // Check if buildings table exists
    console.log('\n=== BUILDINGS TABLE ===');
    const buildingExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'buildings'
      ) as exists
    `);
    
    if (buildingExists.rows[0].exists) {
      const buildingCols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'buildings'
        ORDER BY ordinal_position
      `);
      buildingCols.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
    } else {
      console.log('  Table does not exist yet');
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

querySchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
