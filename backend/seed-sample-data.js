require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix_db',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin'
});

async function seedSampleData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting sample data seeding...\n');
    await client.query('BEGIN');
    
    // 1. Create Organization
    console.log('📊 Creating organization...');
    const orgResult = await client.query(`
      INSERT INTO organizations (name, domain, timezone, currency, is_active, settings)
      VALUES ('Acme Facilities Management', 'acme-facilities.com', 'America/New_York', 'USD', TRUE, '{"date_format": "YYYY-MM-DD"}')
      RETURNING id AS org_id
    `);
    const orgId = orgResult.rows[0].org_id;
    console.log(`✓ Organization created: ${orgId}\n`);
    
    // 2. Create Roles
    console.log('🔐 Creating roles...');
    const rolesData = [
      ['Administrator', 'Full system access', true],
      ['Facility Manager', 'Manage sites and work orders', false],
      ['Technician', 'Execute work orders', false],
      ['Viewer', 'Read-only access', false]
    ];
    
    const roleIds = {};
    for (const [name, description, isSystem] of rolesData) {
      const result = await client.query(`
        INSERT INTO roles (name, description, is_system_role, org_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (org_id, name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id AS role_id
      `, [name, description, isSystem, orgId]);
      roleIds[name] = result.rows[0].role_id;
    }
    console.log(`✓ Created ${rolesData.length} roles\n`);
    
    // 3. Create Teams
    console.log('👥 Creating teams...');
    const teamsData = [
      ['HVAC Team', 'HVAC maintenance and repairs', 'hvac'],
      ['Electrical Team', 'Electrical systems maintenance', 'electrical'],
      ['Plumbing Team', 'Plumbing and water systems', 'plumbing']
    ];
    
    const teamIds = {};
    for (const [name, description, dept] of teamsData) {
      const result = await client.query(`
        INSERT INTO teams (name, description, department, org_id)
        VALUES ($1, $2, $3, $4)
        RETURNING team_id
      `, [name, description, dept, orgId]);
      teamIds[dept] = result.rows[0].team_id;
    }
    console.log(`✓ Created ${teamsData.length} teams\n`);
    
    // 4. Create Users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    const usersData = [
      ['John Admin', 'admin@acme.com', '555-0101', 'admin', 'active', 'hvac', 'System Administrator', 'EMP001'],
      ['Sarah Manager', 'sarah.manager@acme.com', '555-0102', 'manager', 'active', 'hvac', 'Facility Manager', 'EMP002'],
      ['Mike Technician', 'mike.tech@acme.com', '555-0103', 'technician', 'active', 'hvac', 'HVAC Technician', 'EMP003'],
      ['Lisa Electrician', 'lisa.electric@acme.com', '555-0104', 'technician', 'active', 'electrical', 'Electrician', 'EMP004'],
      ['Bob Plumber', 'bob.plumber@acme.com', '555-0105', 'technician', 'active', 'plumbing', 'Plumber', 'EMP005']
    ];
    
    const userIds = {};
    for (const [name, email, phone, roleCode, status, dept, title, empId] of usersData) {
      // Update existing user if email matches, or create new
      const result = await client.query(`
        INSERT INTO users (name, email, phone, password, role, status, department, job_title, employee_id, org_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          job_title = EXCLUDED.job_title,
          employee_id = EXCLUDED.employee_id,
          org_id = EXCLUDED.org_id
        RETURNING user_id
      `, [name, email, phone, hashedPassword, roleCode, status, dept, title, empId, orgId]);
      userIds[email] = result.rows[0].user_id;
      
      // Create account_roles relationship
      await client.query(`
        INSERT INTO account_roles (user_id, role_id, org_id, assigned_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, role_id, org_id) DO NOTHING
      `, [userIds[email], roleIds[roleCode], orgId, userIds[email]]);
      
      // Add to team
      if (teamIds[dept]) {
        await client.query(`
          INSERT INTO team_members (team_id, user_id, role, org_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [teamIds[dept], userIds[email], roleCode === 'manager' ? 'lead' : 'member', orgId]);
      }
    }
    console.log(`✓ Created ${usersData.length} users\n`);
    
    // 5. Create Client
    console.log('🏢 Creating client...');
    const clientResult = await client.query(`
      INSERT INTO clients (name, email, phone, address, city, state, zip_code, country, status)
      VALUES ('Global Enterprise Corp', 'contact@globalcorp.com', '555-1000', '123 Business Plaza', 'New York', 'NY', '10001', 'USA', 'active')
      RETURNING client_id
    `);
    const clientId = clientResult.rows[0].client_id;
    console.log(`✓ Client created: ${clientId}\n`);
    
    // 6. Create Project
    console.log('📋 Creating project...');
    const projectResult = await client.query(`
      INSERT INTO projects (name, client_id, description, start_date, end_date, budget, status, project_manager)
      VALUES ('Corporate HQ Maintenance', $1, 'Ongoing maintenance for headquarters facility', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 500000, 'active', $2)
      RETURNING project_id
    `, [clientId, userIds['sarah.manager@acme.com']]);
    const projectId = projectResult.rows[0].project_id;
    console.log(`✓ Project created: ${projectId}\n`);
    
    // 7. Create Site
    console.log('📍 Creating site...');
    const siteResult = await client.query(`
      INSERT INTO sites (name, client_id, project_id, address, city, state, zip_code, country, site_type, status, coordinates)
      VALUES ('Corporate HQ - Manhattan', $1, $2, '123 Business Plaza', 'New York', 'NY', '10001', 'USA', 'office', 'active', '{"lat": 40.7589, "lng": -73.9851}')
      RETURNING site_id
    `, [clientId, projectId]);
    const siteId = siteResult.rows[0].site_id;
    console.log(`✓ Site created: ${siteId}\n`);
    
    // 8. Create Building
    console.log('🏗️ Creating building...');
    const buildingResult = await client.query(`
      INSERT INTO buildings (site_id, name, building_code, building_type, address, floors_count, total_area, construction_year, org_id)
      VALUES ($1, 'Main Tower', 'MT-01', 'office', '123 Business Plaza', 25, 250000, 2015, $2)
      RETURNING building_id
    `, [siteId, orgId]);
    const buildingId = buildingResult.rows[0].building_id;
    console.log(`✓ Building created: ${buildingId}\n`);
    
    // 9. Create Floors
    console.log('🏢 Creating floors...');
    const floorsData = [
      ['Ground Floor', 'G', 0, 12000],
      ['First Floor', '1', 1, 10000],
      ['Second Floor', '2', 2, 10000]
    ];
    
    const floorIds = {};
    for (const [name, floorCode, level, area] of floorsData) {
      const result = await client.query(`
        INSERT INTO floors (building_id, name, floor_code, level, area, org_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING floor_id
      `, [buildingId, name, floorCode, level, area, orgId]);
      floorIds[floorCode] = result.rows[0].floor_id;
    }
    console.log(`✓ Created ${floorsData.length} floors\n`);
    
    // 10. Create Spaces
    console.log('🚪 Creating spaces...');
    const spacesData = [
      ['Lobby', 'G', 'lobby', 2000],
      ['Server Room', 'G', 'utility', 500],
      ['Main Office Area', '1', 'office', 8000],
      ['Conference Room A', '1', 'meeting', 400],
      ['Executive Suite', '2', 'office', 5000],
      ['Break Room', '2', 'common', 300]
    ];
    
    const spaceIds = [];
    for (const [name, floorCode, spaceType, area] of spacesData) {
      const result = await client.query(`
        INSERT INTO spaces (floor_id, name, space_code, space_type, area, org_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING space_id
      `, [floorIds[floorCode], name, name.replace(/\s+/g, '-').toUpperCase(), spaceType, area, orgId]);
      spaceIds.push(result.rows[0].space_id);
    }
    console.log(`✓ Created ${spacesData.length} spaces\n`);
    
    // 11. Create Asset Categories
    console.log('📦 Creating asset categories...');
    const categoriesData = [
      ['HVAC', 'Heating, Ventilation, and Air Conditioning systems'],
      ['Electrical', 'Electrical systems and equipment'],
      ['Plumbing', 'Plumbing and water systems']
    ];
    
    const categoryIds = {};
    for (const [name, description] of categoriesData) {
      const result = await client.query(`
        INSERT INTO asset_categories (name, description, org_id)
        VALUES ($1, $2, $3)
        RETURNING category_id
      `, [name, description, orgId]);
      categoryIds[name] = result.rows[0].category_id;
    }
    console.log(`✓ Created ${categoriesData.length} asset categories\n`);
    
    // 12. Create Asset Types
    console.log('🔧 Creating asset types...');
    const typesData = [
      ['Chiller', 'HVAC', 'Large cooling units'],
      ['Air Handler', 'HVAC', 'Air distribution units'],
      ['Transformer', 'Electrical', 'Power transformers'],
      ['Generator', 'Electrical', 'Backup generators'],
      ['Water Heater', 'Plumbing', 'Hot water systems']
    ];
    
    const typeIds = {};
    for (const [name, categoryName, description] of typesData) {
      const result = await client.query(`
        INSERT INTO asset_types (category_id, name, description, org_id)
        VALUES ($1, $2, $3, $4)
        RETURNING type_id
      `, [categoryIds[categoryName], name, description, orgId]);
      typeIds[name] = result.rows[0].type_id;
    }
    console.log(`✓ Created ${typesData.length} asset types\n`);
    
    // 13. Create Assets
    console.log('🏭 Creating assets...');
    const assetsData = [
      ['Chiller Unit #1', 'CH-001', 'Chiller', siteId, buildingId, floorIds['G'], 'operational', 'high', 'Carrier', 'AquaEdge 19DV', '2016-03-15', 250000],
      ['Chiller Unit #2', 'CH-002', 'Chiller', siteId, buildingId, floorIds['G'], 'operational', 'high', 'Carrier', 'AquaEdge 19DV', '2016-03-15', 250000],
      ['Air Handler - Floor 1', 'AHU-1-01', 'Air Handler', siteId, buildingId, floorIds['1'], 'operational', 'medium', 'Trane', 'CleanEffects', '2016-05-20', 45000],
      ['Air Handler - Floor 2', 'AHU-2-01', 'Air Handler', siteId, buildingId, floorIds['2'], 'operational', 'medium', 'Trane', 'CleanEffects', '2016-05-20', 45000],
      ['Main Transformer', 'TRF-001', 'Transformer', siteId, buildingId, floorIds['G'], 'operational', 'critical', 'ABB', 'DryFormer', '2015-12-10', 180000],
      ['Emergency Generator', 'GEN-001', 'Generator', siteId, buildingId, floorIds['G'], 'operational', 'critical', 'Caterpillar', 'C175-20', '2015-11-20', 320000],
      ['Water Heater - Tower', 'WH-001', 'Water Heater', siteId, buildingId, floorIds['G'], 'operational', 'medium', 'Rheem', 'ProTerra', '2017-02-14', 12000]
    ];
    
    const assetIds = [];
    for (const [name, assetTag, typeName, site, building, floor, status, criticality, manufacturer, model, purchaseDate, cost] of assetsData) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type_id, site_id, building_id, floor_id, status, 
          criticality, manufacturer, model, purchase_date, purchase_price, expected_life
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 20)
        RETURNING asset_id
      `, [name, assetTag, typeIds[typeName], site, building, floor, status, criticality, manufacturer, model, purchaseDate, cost]);
      assetIds.push(result.rows[0].asset_id);
    }
    console.log(`✓ Created ${assetsData.length} assets\n`);
    
    // 14. Create Storerooms
    console.log('🏪 Creating storerooms...');
    const storeroomsData = [
      ['Main Warehouse', 'WH-MAIN', siteId, buildingId, 'Main storage facility'],
      ['Floor 1 Supply Closet', 'SC-F1', siteId, buildingId, 'Quick access supplies'],
      ['Mechanical Room Storage', 'MR-STORE', siteId, buildingId, 'HVAC parts storage']
    ];
    
    const storeroomIds = {};
    for (const [name, code, site, building, description] of storeroomsData) {
      const result = await client.query(`
        INSERT INTO storerooms (name, location_code, site_id, building_id, description, org_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING storeroom_id
      `, [name, code, site, building, description, orgId]);
      storeroomIds[code] = result.rows[0].storeroom_id;
    }
    console.log(`✓ Created ${storeroomsData.length} storerooms\n`);
    
    // 15. Create Parts
    console.log('🔩 Creating parts...');
    const partsData = [
      ['Air Filter - 20x25x4', 'AF-2025-4', 'MERV 13 pleated filter', 'ea', 25.50, 10, 50],
      ['Air Filter - 16x20x2', 'AF-1620-2', 'MERV 11 pleated filter', 'ea', 18.75, 10, 40],
      ['Compressor Oil - 5 Gallon', 'OIL-COMP-5G', 'Synthetic compressor oil', 'gal', 185.00, 5, 20],
      ['Refrigerant R-410A - 25lb', 'REF-410A-25', 'R-410A refrigerant cylinder', 'lb', 12.50, 2, 10],
      ['Belt - B-Section', 'BELT-B-120', 'V-belt for blowers', 'ea', 32.00, 5, 25],
      ['Bearing - Pillow Block', 'BRG-PB-1.5', '1.5" pillow block bearing', 'ea', 78.50, 2, 10],
      ['Circuit Breaker - 100A', 'CB-100A-3P', '100A 3-pole breaker', 'ea', 245.00, 2, 8],
      ['Emergency Light Battery', 'BAT-EL-12V', '12V sealed lead acid', 'ea', 42.00, 5, 20],
      ['PVC Pipe - 2" Schedule 40', 'PVC-2-S40', 'PVC pipe 10ft length', 'ea', 15.25, 10, 40],
      ['Pipe Fitting - 2" Elbow', 'FIT-PVC-2-EL', '90 degree elbow', 'ea', 3.50, 20, 100],
      ['HVAC Thermostat', 'THERMO-PROG', 'Programmable thermostat', 'ea', 125.00, 3, 15],
      ['Fuse - 30A Time Delay', 'FUSE-30A-TD', 'Time delay cartridge fuse', 'ea', 8.75, 10, 50],
      ['Pump Seal Kit', 'SEAL-PUMP-2', 'Mechanical seal kit', 'ea', 95.00, 2, 8],
      ['Wire - 12 AWG THHN', 'WIRE-12-THHN', 'Copper wire per foot', 'ft', 1.25, 500, 2000],
      ['Valve - Ball 2"', 'VALVE-BALL-2', '2" brass ball valve', 'ea', 68.00, 3, 12]
    ];
    
    const partIds = [];
    for (const [name, partNumber, description, uom, cost, reorder, reorderQty] of partsData) {
      const result = await client.query(`
        INSERT INTO parts (part_number, name, description, unit_of_measure, unit_cost, reorder_level, reorder_quantity, org_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING part_id
      `, [partNumber, name, description, uom, cost, reorder, reorderQty, orgId]);
      partIds.push(result.rows[0].part_id);
      
      // Create stock in main warehouse
      const stockQty = Math.floor(Math.random() * (reorderQty * 2 - reorder)) + reorder;
      await client.query(`
        INSERT INTO part_stock (part_id, storeroom_id, quantity, min_quantity, max_quantity, org_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [result.rows[0].part_id, storeroomIds['WH-MAIN'], stockQty, reorder, reorderQty * 2, orgId]);
    }
    console.log(`✓ Created ${partsData.length} parts with stock\n`);
    
    // 16. Create Vendors
    console.log('🤝 Creating vendors...');
    const vendorsData = [
      ['HVAC Supply Co', 'HVAC', 'supplies@hvacsupply.com', '555-2000', '456 Industrial Dr'],
      ['Electrical Wholesale', 'Electrical', 'sales@elecwholesale.com', '555-2001', '789 Commerce Blvd']
    ];
    
    const vendorIds = {};
    for (const [name, type, email, phone, address] of vendorsData) {
      const result = await client.query(`
        INSERT INTO vendors (name, vendor_type, email, phone, address, status, org_id)
        VALUES ($1, $2, $3, $4, $5, 'active', $6)
        RETURNING vendor_id
      `, [name, type, email, phone, address, orgId]);
      vendorIds[name] = result.rows[0].vendor_id;
    }
    console.log(`✓ Created ${vendorsData.length} vendors\n`);
    
    // 17. Create PM Templates
    console.log('📋 Creating PM templates...');
    const templatesData = [
      ['Chiller Quarterly Inspection', 'HVAC', 'quarterly', 'Comprehensive chiller inspection'],
      ['Generator Monthly Test', 'Electrical', 'monthly', 'Monthly generator load test'],
      ['Fire Alarm Annual Inspection', 'Safety', 'yearly', 'Annual fire alarm system test']
    ];
    
    const templateIds = [];
    for (const [name, category, freq, description] of templatesData) {
      const result = await client.query(`
        INSERT INTO pm_templates (name, category, frequency, description, estimated_duration, org_id)
        VALUES ($1, $2, $3, $4, 120, $5)
        RETURNING template_id
      `, [name, category, freq, description, orgId]);
      templateIds.push(result.rows[0].template_id);
      
      // Add template tasks
      const tasks = [
        'Visual inspection',
        'Check all connections',
        'Measure and record readings',
        'Clean and lubricate as needed',
        'Document findings'
      ];
      
      for (let i = 0; i < tasks.length; i++) {
        await client.query(`
          INSERT INTO pm_template_tasks (template_id, task_order, description, is_required, org_id)
          VALUES ($1, $2, $3, true, $4)
        `, [result.rows[0].template_id, i + 1, tasks[i], orgId]);
      }
    }
    console.log(`✓ Created ${templatesData.length} PM templates with tasks\n`);
    
    // 18. Create PM Schedules
    console.log('📅 Creating PM schedules...');
    for (let i = 0; i < 3 && i < assetIds.length && i < templateIds.length; i++) {
      await client.query(`
        INSERT INTO pm_schedules (
          asset_id, template_id, frequency, next_due_date, 
          assigned_to, status, org_id
        )
        VALUES ($1, $2, 'monthly', CURRENT_DATE + INTERVAL '7 days', $3, 'active', $4)
      `, [assetIds[i], templateIds[0], userIds['mike.tech@acme.com'], orgId]);
    }
    console.log(`✓ Created PM schedules\n`);
    
    // 19. Create Work Orders
    console.log('🔨 Creating work orders...');
    const workOrdersData = [
      ['Chiller maintenance', 'High vibration reported on Chiller #1', 'maintenance', 'high', 0],
      ['Replace air filters', 'Scheduled filter replacement - Floor 1 AHU', 'preventive', 'medium', 2],
      ['Emergency - No power in Suite 2A', 'Complete power outage in executive suite', 'corrective', 'critical', 4],
      ['Water leak investigation', 'Water stains on ceiling - Conference Room A', 'inspection', 'high', 3],
      ['Generator load test', 'Monthly generator testing and log', 'preventive', 'medium', 5]
    ];
    
    const workOrderIds = [];
    for (const [title, description, type, priority, assetIdx] of workOrdersData) {
      const assetId = assetIds[assetIdx] || assetIds[0];
      const result = await client.query(`
        INSERT INTO work_orders (
          title, description, work_type, priority, status,
          site_id, building_id, asset_id, 
          reported_by, assigned_to, due_date
        )
        VALUES ($1, $2, $3, $4, 'open', $5, $6, $7, $8, $9, CURRENT_DATE + INTERVAL '3 days')
        RETURNING work_order_id
      `, [
        title, description, type, priority,
        siteId, buildingId, assetId,
        userIds['sarah.manager@acme.com'],
        userIds['mike.tech@acme.com']
      ]);
      workOrderIds.push(result.rows[0].work_order_id);
      
      // Add tasks to work order
      await client.query(`
        INSERT INTO work_order_tasks (work_order_id, description, task_order, status, org_id)
        VALUES 
          ($1, 'Initial assessment', 1, 'pending', $2),
          ($1, 'Perform repair/maintenance', 2, 'pending', $2),
          ($1, 'Test and verify', 3, 'pending', $2),
          ($1, 'Update documentation', 4, 'pending', $2)
      `, [result.rows[0].work_order_id, orgId]);
      
      // Add parts to some work orders
      if (partIds.length > 0 && Math.random() > 0.5) {
        const partId = partIds[Math.floor(Math.random() * partIds.length)];
        await client.query(`
          INSERT INTO work_order_parts (work_order_id, part_id, quantity_planned, org_id)
          VALUES ($1, $2, 2, $3)
        `, [result.rows[0].work_order_id, partId, orgId]);
      }
    }
    console.log(`✓ Created ${workOrdersData.length} work orders with tasks\n`);
    
    await client.query('COMMIT');
    
    console.log('✅ Sample data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - 1 Organization: ${orgId}`);
    console.log(`   - 4 Roles`);
    console.log(`   - 3 Teams`);
    console.log(`   - 5 Users`);
    console.log(`   - 1 Client: ${clientId}`);
    console.log(`   - 1 Project: ${projectId}`);
    console.log(`   - 1 Site: ${siteId}`);
    console.log(`   - 1 Building: ${buildingId}`);
    console.log(`   - 3 Floors`);
    console.log(`   - 6 Spaces`);
    console.log(`   - 3 Asset Categories`);
    console.log(`   - 5 Asset Types`);
    console.log(`   - 7 Assets`);
    console.log(`   - 3 Storerooms`);
    console.log(`   - 15 Parts with stock`);
    console.log(`   - 2 Vendors`);
    console.log(`   - 3 PM Templates`);
    console.log(`   - 3 PM Schedules`);
    console.log(`   - 5 Work Orders with tasks\n`);
    console.log('🔑 Login credentials for all users:');
    console.log('   Email: admin@acme.com (or any user email above)');
    console.log('   Password: Password@123\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedSampleData()
  .then(() => {
    console.log('🎉 Seeding process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
