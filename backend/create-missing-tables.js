const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const createMissingTables = `
-- Work Order Templates Table
CREATE TABLE IF NOT EXISTS work_order_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  estimated_duration INTEGER,
  priority VARCHAR(20) DEFAULT 'medium',
  checklist JSONB,
  required_skills TEXT[],
  required_parts JSONB,
  instructions TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SLA Policies Table
CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL,
  response_time INTEGER NOT NULL,
  resolution_time INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_time INTEGER,
  escalation_contacts TEXT[],
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10,2),
  location VARCHAR(255),
  supplier VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Inventory Junction Table
CREATE TABLE IF NOT EXISTS work_order_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(work_order_id, inventory_item_id)
);

-- Work Order Attachments Table
CREATE TABLE IF NOT EXISTS work_order_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON work_order_templates(category);
CREATE INDEX IF NOT EXISTS idx_sla_priority ON sla_policies(priority);
CREATE INDEX IF NOT EXISTS idx_inventory_part_number ON inventory_items(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory_items(quantity);
CREATE INDEX IF NOT EXISTS idx_wo_inventory_work_order ON work_order_inventory(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_attachments_work_order ON work_order_attachments(work_order_id);
`;

async function createTables() {
  try {
    console.log('Creating missing tables...\n');
    
    await pool.query(createMissingTables);
    
    console.log('✅ Successfully created all missing tables:');
    console.log('  - work_order_templates');
    console.log('  - sla_policies');
    console.log('  - inventory_items');
    console.log('  - work_order_inventory');
    console.log('  - work_order_attachments');
    console.log('\n✅ Database is now ready!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

createTables();
