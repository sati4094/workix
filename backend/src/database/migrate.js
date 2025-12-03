require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migration...');
    
    const { rows: userRoleType } = await client.query(
      "SELECT 1 FROM pg_type WHERE typname = 'user_role'"
    );

    if (userRoleType.length === 0) {
      // Fresh install – run full schema bootstrap
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      await client.query(schema);

      console.log('📝 Database tables created');
      console.log('🔧 Triggers and functions set up');
      console.log('👀 Views created');
    } else {
      // Existing install – apply incremental patches
      const incrementalPatches = [
        '005_expand_user_roles.sql',
        '006_entity_tags.sql'
      ];

      for (const patchFile of incrementalPatches) {
        const patchPath = path.join(__dirname, 'migrations', patchFile);

        if (!fs.existsSync(patchPath)) {
          throw new Error(`Incremental patch ${patchFile} is missing.`);
        }

        const patchSql = fs.readFileSync(patchPath, 'utf8');
        await client.query(patchSql);
        console.log(`✅ Incremental migration applied: ${patchFile}`);
      }

      await client.query(
        "UPDATE users SET role = 'superadmin' WHERE email = 'admin@workix.com' AND role <> 'superadmin'"
      );
      await client.query(
        "UPDATE users SET role = 'supertech' WHERE email = 'support@workix.com' AND role <> 'supertech'"
      );
    }

    console.log('✅ Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

