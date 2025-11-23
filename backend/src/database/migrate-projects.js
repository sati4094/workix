const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
});

async function migrateProjects() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting projects migration to enterprises...\n');
    
    // Step 1: Add enterprise_id column
    console.log('Step 1: Adding enterprise_id column...');
    await client.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='projects' AND column_name='enterprise_id') THEN
              ALTER TABLE projects ADD COLUMN enterprise_id UUID;
              RAISE NOTICE 'Added enterprise_id column';
          ELSE
              RAISE NOTICE 'enterprise_id column already exists';
          END IF;
      END $$;
    `);
    
    // Step 2: Copy data from client_id to enterprise_id
    console.log('Step 2: Copying data from client_id to enterprise_id...');
    const updateResult = await client.query(`
      UPDATE projects 
      SET enterprise_id = client_id 
      WHERE enterprise_id IS NULL AND client_id IS NOT NULL
      RETURNING id
    `);
    console.log(`   Updated ${updateResult.rowCount} projects\n`);
    
    // Step 3: Add foreign key constraint
    console.log('Step 3: Adding foreign key constraint...');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_projects_enterprise') THEN
              ALTER TABLE projects 
              ADD CONSTRAINT fk_projects_enterprise 
              FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE;
              RAISE NOTICE 'Added foreign key constraint';
          ELSE
              RAISE NOTICE 'Foreign key constraint already exists';
          END IF;
      END $$;
    `);
    
    // Step 4: Create index
    console.log('Step 4: Creating index...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_enterprise ON projects(enterprise_id)`);
    
    // Step 5: Drop old constraints
    console.log('Step 5: Dropping old client_id constraints...');
    await client.query(`
      DO $$
      BEGIN
          IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey') THEN
              ALTER TABLE projects DROP CONSTRAINT projects_client_id_fkey;
              RAISE NOTICE 'Dropped old foreign key';
          END IF;
      END $$;
    `);
    
    await client.query(`DROP INDEX IF EXISTS idx_projects_client`);
    
    // Step 6: Make client_id nullable for backward compatibility
    console.log('Step 6: Making client_id nullable...');
    await client.query(`ALTER TABLE projects ALTER COLUMN client_id DROP NOT NULL`);
    
    // Verification
    console.log('\n✅ Migration complete! Verification:');
    const verification = await client.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(enterprise_id) as projects_with_enterprise,
        COUNT(client_id) as projects_with_client
      FROM projects
    `);
    
    console.log(`   Total projects: ${verification.rows[0].total_projects}`);
    console.log(`   Projects with enterprise_id: ${verification.rows[0].projects_with_enterprise}`);
    console.log(`   Projects with client_id: ${verification.rows[0].projects_with_client}`);
    
    console.log('\n✅ Projects migration successful!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateProjects()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
