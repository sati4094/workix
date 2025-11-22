const { Pool } = require('pg');

async function checkDatabases() {
  // Check workix database
  const pool1 = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'workix',
    user: 'admin',
    password: 'admin'
  });

  try {
    const r1 = await pool1.query("SELECT COUNT(*) FROM users WHERE email LIKE '%acme%'");
    console.log('✓ workix database - acme users:', r1.rows[0].count);
  } catch (e) {
    console.log('✗ workix database - Error:', e.message);
  } finally {
    await pool1.end();
  }

  // Check workix_cmms database
  const pool2 = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'workix_cmms',
    user: 'admin',
    password: 'admin'
  });

  try {
    const r2 = await pool2.query("SELECT COUNT(*) FROM users WHERE email LIKE '%acme%'");
    console.log('✓ workix_cmms database - acme users:', r2.rows[0].count);
    
    if (parseInt(r2.rows[0].count) > 0) {
      const users = await pool2.query("SELECT email, name, role FROM users WHERE email LIKE '%acme%' LIMIT 5");
      console.log('\nUsers in workix_cmms:');
      users.rows.forEach(u => console.log(`  ${u.email} | ${u.name} | ${u.role}`));
    }
  } catch (e) {
    console.log('✗ workix_cmms database - Error:', e.message);
  } finally {
    await pool2.end();
  }

  process.exit(0);
}

checkDatabases();
