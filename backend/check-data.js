const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkData() {
  try {
    // Check user
    const userRes = await pool.query(`
      SELECT id, email, name, role, org_id 
      FROM users 
      WHERE email = 'admin@workix.com'
    `);
    console.log('\n👤 User:');
    console.log(userRes.rows[0]);

    // Check work orders
    const woRes = await pool.query(`
      SELECT id, work_order_number, title, building_id, floor_id, space_id, org_id, site_id
      FROM work_orders
      ORDER BY created_at DESC
      LIMIT 3
    `);
    console.log('\n📋 Recent Work Orders:');
    woRes.rows.forEach(wo => {
      console.log(` - ${wo.work_order_number}: ${wo.title}`);
      console.log(`   Building: ${wo.building_id}, Floor: ${wo.floor_id}, Space: ${wo.space_id}`);
      console.log(`   Org: ${wo.org_id}, Site: ${wo.site_id}`);
    });

    // Check sites
    const siteRes = await pool.query(`
      SELECT id, name, project_id
      FROM sites
      LIMIT 3
    `);
    console.log('\n📍 Sites:');
    siteRes.rows.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id}, Project: ${s.project_id})`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
