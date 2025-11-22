const { pool } = require('./src/database/connection');

async function testUsers() {
  try {
    const res = await pool.query(`
      SELECT id, email, name, role, organization_id 
      FROM users 
      WHERE email LIKE '%acme%' OR email LIKE '%admin%'
      ORDER BY id
      LIMIT 10
    `);
    
    console.log('\n=== Users in Database ===');
    if (res.rows.length === 0) {
      console.log('No users found!');
    } else {
      res.rows.forEach(u => {
        console.log(`  ${u.email} | ${u.name} | ${u.role} | Org: ${u.organization_id}`);
      });
    }
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testUsers();
