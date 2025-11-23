const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function fixProjects() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Fixing projects with invalid client_ids...\n');
    
    // Get first enterprise to assign to orphaned projects
    const enterprises = await client.query('SELECT id, name FROM enterprises LIMIT 1');
    if (enterprises.rows.length === 0) {
      console.error('❌ No enterprises found! Please seed enterprises first.');
      return;
    }
    
    const defaultEnterprise = enterprises.rows[0];
    console.log(`Using default enterprise: ${defaultEnterprise.name} (${defaultEnterprise.id})\n`);
    
    // Update all projects to use the default enterprise
    const result = await client.query(`
      UPDATE projects 
      SET client_id = $1, enterprise_id = $1
      WHERE client_id NOT IN (SELECT id FROM enterprises)
      RETURNING id, name
    `, [defaultEnterprise.id]);
    
    console.log(`✅ Updated ${result.rowCount} projects:`);
    result.rows.forEach(p => console.log(`   - ${p.name}`));
    
    console.log('\n✅ Projects fixed! Now run migrate-projects.js again.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixProjects();
