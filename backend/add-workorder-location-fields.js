const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addLocationFields() {
  const client = await pool.connect();
  
  try {
    console.log('Adding location fields to work_orders table...');
    
    // Add building and location columns if they don't exist
    await client.query(`
      DO $$ 
      BEGIN
        -- Add building column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'building'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN building VARCHAR(100);
          RAISE NOTICE 'Added building column';
        ELSE
          RAISE NOTICE 'Building column already exists';
        END IF;
        
        -- Add location column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'location'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN location VARCHAR(200);
          RAISE NOTICE 'Added location column';
        ELSE
          RAISE NOTICE 'Location column already exists';
        END IF;
        
        -- Add project_id column for direct reference
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'project_id'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN project_id UUID REFERENCES projects(id);
          RAISE NOTICE 'Added project_id column';
        ELSE
          RAISE NOTICE 'Project_id column already exists';
        END IF;
        
        -- Add scheduled_start column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'scheduled_start'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN scheduled_start TIMESTAMP WITH TIME ZONE;
          RAISE NOTICE 'Added scheduled_start column';
        ELSE
          RAISE NOTICE 'Scheduled_start column already exists';
        END IF;
        
        -- Add scheduled_end column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'scheduled_end'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
          RAISE NOTICE 'Added scheduled_end column';
        ELSE
          RAISE NOTICE 'Scheduled_end column already exists';
        END IF;
      END $$;
    `);
    
    // Update existing work orders to populate project_id from site
    await client.query(`
      UPDATE work_orders wo
      SET project_id = s.project_id
      FROM sites s
      WHERE wo.site_id = s.id AND wo.project_id IS NULL;
    `);
    
    console.log('✅ Location fields added successfully!');
    console.log('✅ Existing work orders updated with project_id from sites');
    
  } catch (error) {
    console.error('❌ Error adding location fields:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addLocationFields().catch(console.error);
