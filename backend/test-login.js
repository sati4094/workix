const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'workix',
  user: 'admin',
  password: 'admin'
});

async function checkLogin() {
  try {
    const result = await pool.query("SELECT id, email, name, password_hash FROM users WHERE email = 'admin@workix.com'");
    
    if (result.rows.length === 0) {
      console.log('❌ User not found: admin@workix.com');
      
      // List all users
      const allUsers = await pool.query("SELECT email, name FROM users LIMIT 10");
      console.log('\nAll users in database:');
      allUsers.rows.forEach(u => console.log(`  - ${u.email} | ${u.name}`));
    } else {
      const user = result.rows[0];
      console.log('✓ User found:', user.email);
      console.log('  Name:', user.name);
      console.log('  Password hash:', user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL');
      
      // Test password
      if (user.password_hash) {
        const isValid = await bcrypt.compare('Password@123', user.password_hash);
        console.log('  Password "Password@123" valid:', isValid);
        
        if (!isValid) {
          // Try other common passwords
          const testPasses = ['admin', 'Admin@123', 'password123'];
          for (const pass of testPasses) {
            const test = await bcrypt.compare(pass, user.password_hash);
            if (test) {
              console.log(`  ✓ Correct password is: "${pass}"`);
              break;
            }
          }
        }
      } else {
        console.log('  ⚠️  Password hash is NULL!');
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkLogin();
