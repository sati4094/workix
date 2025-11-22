const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function addLocationFKFields() {
  const client = await pool.connect();
  
  try {
    console.log('Adding location FK fields to work_orders table...');
    
    await client.query(`
      DO $$ 
      BEGIN
        -- Add building_id column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'building_id'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN building_id INTEGER REFERENCES buildings(id);
          RAISE NOTICE 'Added building_id column';
        ELSE
          RAISE NOTICE 'Building_id column already exists';
        END IF;
        
        -- Add floor_id column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'floor_id'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN floor_id INTEGER REFERENCES floors(id);
          RAISE NOTICE 'Added floor_id column';
        ELSE
          RAISE NOTICE 'Floor_id column already exists';
        END IF;
        
        -- Add space_id column
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'work_orders' AND column_name = 'space_id'
        ) THEN
          ALTER TABLE work_orders ADD COLUMN space_id INTEGER REFERENCES spaces(id);
          RAISE NOTICE 'Added space_id column';
        ELSE
          RAISE NOTICE 'Space_id column already exists';
        END IF;
      END $$;
    `);
    
    console.log('✅ Location FK fields added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding location FK fields:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addLocationFKFields().catch(console.error);
