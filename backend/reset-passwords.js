require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/database/connection');

async function resetPasswords() {
  try {
    console.log('🔄 Resetting user passwords...\n');

    // Hash passwords
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const techHash = await bcrypt.hash('Tech@123', 10);

    // Update admin password
    await query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [adminHash, 'admin@workix.com']
    );
    console.log('✅ Admin password reset: admin@workix.com / Admin@123');

    // Update technician passwords
    await query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [techHash, 'john.tech@workix.com']
    );
    console.log('✅ Technician password reset: john.tech@workix.com / Tech@123');

    await query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [techHash, 'sarah.tech@workix.com']
    );
    console.log('✅ Technician password reset: sarah.tech@workix.com / Tech@123');

    await query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [techHash, 'analyst@workix.com']
    );
    console.log('✅ Analyst password reset: analyst@workix.com / Tech@123');

    console.log('\n🎉 All passwords reset successfully!');
    console.log('\n📝 You can now login with:');
    console.log('   Admin: admin@workix.com / Admin@123');
    console.log('   Technician: john.tech@workix.com / Tech@123');
    console.log('   Analyst: analyst@workix.com / Tech@123\n');

  } catch (error) {
    console.error('❌ Failed to reset passwords:', error.message);
  } finally {
    process.exit(0);
  }
}

resetPasswords();

