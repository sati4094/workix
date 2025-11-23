const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function checkData() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 Checking data...\n');
    
    // Check projects
    const projects = await client.query('SELECT id, name, client_id FROM projects');
    console.log('Projects:');
    projects.rows.forEach(p => console.log(`  - ${p.name} (client_id: ${p.client_id})`));
    
    // Check enterprises
    const enterprises = await client.query('SELECT id, name FROM enterprises');
    console.log('\nEnterprises:');
    enterprises.rows.forEach(e => console.log(`  - ${e.name} (id: ${e.id})`));
    
    // Check if client_ids match enterprise_ids
    console.log('\n🔍 Checking if client_ids exist in enterprises...');
    for (const project of projects.rows) {
      const match = enterprises.rows.find(e => e.id === project.client_id);
      if (match) {
        console.log(`  ✅ Project "${project.name}" → Enterprise "${match.name}"`);
      } else {
        console.log(`  ❌ Project "${project.name}" → client_id ${project.client_id} NOT FOUND in enterprises`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
