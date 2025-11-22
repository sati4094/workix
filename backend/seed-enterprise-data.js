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

async function seedEnterpriseData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting enterprise data seeding...\n');
    await client.query('BEGIN');
    
    // 1. Create Organization
    console.log('📊 Creating organization...');
    const orgResult = await client.query(`
      INSERT INTO organizations (name, domain, timezone, currency)
      VALUES ('Acme Facilities Management', 'acme-fm.com', 'America/New_York', 'USD')
      RETURNING id
    `);
    const orgId = orgResult.rows[0].id;
    console.log(`✓ Organization created: ${orgId}\n`);
    
    // 2. Create Roles
    console.log('🔐 Creating roles...');
    const rolesData = [
      ['Administrator', 'Full system access and configuration', true],
      ['Facility Manager', 'Manage sites, assets, and work orders', false],
      ['Technician', 'Execute maintenance tasks', false],
      ['Viewer', 'Read-only access to reports and dashboards', false]
    ];
    
    const roleIds = {};
    for (const [name, description, isSystem] of rolesData) {
      const result = await client.query(`
        INSERT INTO roles (org_id, name, description, is_system_role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (org_id, name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
      `, [orgId, name, description, isSystem]);
      roleIds[name] = result.rows[0].id;
    }
    console.log(`✓ Created ${rolesData.length} roles\n`);
    
    // 3. Create/Update Users
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('Password@123', 12);
    
    const userResult1 = await client.query(`
      SELECT id FROM users WHERE email = 'admin@acme.com'
    `);
    const adminId = userResult1.rows[0]?.id;
    
    if (adminId) {
      console.log(`✓ Found existing admin user: ${adminId}`);
      // Assign role
      await client.query(`
        INSERT INTO account_roles (account_id, role_id, assigned_by)
        VALUES ($1, $2, $1)
        ON CONFLICT DO NOTHING
      `, [adminId, roleIds['Administrator']]);
    }
    
    const usersData = [
      ['Sarah Manager', 'sarah.manager@acme.com', '555-0102', 'Facility Manager'],
      ['Mike Technician', 'mike.tech@acme.com', '555-0103', 'Technician'],
      ['Lisa Electrician', 'lisa.electric@acme.com', '555-0104', 'Technician'],
      ['Bob Plumber', 'bob.plumber@acme.com', '555-0105', 'Technician']
    ];
    
    const userIds = { 'admin@acme.com': adminId };
    for (const [name, email, phone, roleName] of usersData) {
      const result = await client.query(`
        INSERT INTO users (name, email, phone, password_hash, role, status, org_id)
        VALUES ($1, $2, $3, $4, 'technician', 'active', $5)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          org_id = EXCLUDED.org_id
        RETURNING id
      `, [name, email, phone, hashedPassword, orgId]);
      userIds[email] = result.rows[0].id;
      
      // Assign role
      await client.query(`
        INSERT INTO account_roles (account_id, role_id, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [userIds[email], roleIds[roleName], adminId]);
    }
    console.log(`✓ Created/updated ${usersData.length + 1} users\n`);
    
    // 4. Create Teams
    console.log('👥 Creating teams...');
    const teamsData = [
      ['HVAC Team', 'Heating, ventilation, and air conditioning', 'mike.tech@acme.com'],
      ['Electrical Team', 'Electrical systems and equipment', 'lisa.electric@acme.com'],
      ['Plumbing Team', 'Plumbing and water systems', 'bob.plumber@acme.com']
    ];
    
    const teamIds = {};
    for (const [teamName, description, leadEmail] of teamsData) {
      const result = await client.query(`
        INSERT INTO teams (org_id, team_name, description, team_lead)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [orgId, teamName, description, userIds[leadEmail]]);
      teamIds[teamName] = result.rows[0].id;
      
      // Add lead as member
      await client.query(`
        INSERT INTO team_members (team_id, account_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [result.rows[0].id, userIds[leadEmail]]);
    }
    console.log(`✓ Created ${teamsData.length} teams\n`);
    
    // 5. Get existing client/project/site
    console.log('🔍 Finding existing client, project, and site...');
    const clientResult = await client.query(`SELECT id FROM clients LIMIT 1`);
    const projectResult = await client.query(`SELECT id FROM projects LIMIT 1`);
    const siteResult = await client.query(`SELECT id FROM sites LIMIT 1`);
    
    let clientId, projectId, siteId;
    
    if (clientResult.rows.length === 0) {
      const newClient = await client.query(`
        INSERT INTO clients (name, email, phone, address, city, state, zip_code, country, status)
        VALUES ('Global Enterprise Corp', 'contact@globalcorp.com', '555-1000', '123 Business Plaza', 'New York', 'NY', '10001', 'USA', 'active')
        RETURNING id
      `);
      clientId = newClient.rows[0].id;
    } else {
      clientId = clientResult.rows[0].id;
    }
    
    if (projectResult.rows.length === 0) {
      const newProject = await client.query(`
        INSERT INTO projects (name, client_id, description, start_date, status)
        VALUES ('HQ Maintenance', $1, 'Headquarters facility maintenance', CURRENT_DATE, 'active')
        RETURNING id
      `, [clientId]);
      projectId = newProject.rows[0].id;
    } else {
      projectId = projectResult.rows[0].id;
    }
    
    if (siteResult.rows.length === 0) {
      const newSite = await client.query(`
        INSERT INTO sites (name, client_id, address, city, state, zip_code, country, status)
        VALUES ('Corporate HQ', $1, '123 Business Plaza', 'New York', 'NY', '10001', 'USA', 'active')
        RETURNING id
      `, [clientId]);
      siteId = newSite.rows[0].id;
    } else {
      siteId = siteResult.rows[0].id;
    }
    console.log(`✓ Using Client: ${clientId}, Project: ${projectId}, Site: ${siteId}\n`);
    
    // 6. Create Building
    console.log('🏗️ Creating building...');
    const buildingResult = await client.query(`
      INSERT INTO buildings (site_id, name, building_code, floor_count, gross_area, year_built)
      VALUES ($1, 'Main Tower', 'MT-01', 25, 250000, 2015)
      RETURNING id
    `, [siteId]);
    const buildingId = buildingResult.rows[0].id;
    console.log(`✓ Building created: ${buildingId}\n`);
    
    // 7. Create Floors
    console.log('🏢 Creating floors...');
    const floorsData = [
      ['Ground Floor', 0, 12000],
      ['First Floor', 1, 10000],
      ['Second Floor', 2, 10000]
    ];
    
    const floorIds = [];
    for (const [name, floorNum, area] of floorsData) {
      const result = await client.query(`
        INSERT INTO floors (building_id, name, floor_number, area)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [buildingId, name, floorNum, area]);
      floorIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${floorsData.length} floors\n`);
    
    // 8. Create Spaces
    console.log('🚪 Creating spaces...');
    const spacesData = [
      [floorIds[0], 'Main Lobby', 'lobby', 2000, 100],
      [floorIds[0], 'Server Room', 'utility', 500, 10],
      [floorIds[1], 'Open Office Area', 'office', 7000, 150],
      [floorIds[1], 'Conference Room A', 'meeting', 400, 20],
      [floorIds[2], 'Executive Suite', 'office', 3000, 30],
      [floorIds[2], 'Break Room', 'common', 300, 25]
    ];
    
    const spaceIds = [];
    for (const [floorId, name, spaceType, area, capacity] of spacesData) {
      const result = await client.query(`
        INSERT INTO spaces (floor_id, name, space_type, area, capacity)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [floorId, name, spaceType, area, capacity]);
      spaceIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${spacesData.length} spaces\n`);
    
    // 9. Create Asset Categories
    console.log('📦 Creating asset categories...');
    const categoriesData = [
      ['HVAC Systems', 'Heating, ventilation, and air conditioning'],
      ['Electrical Systems', 'Electrical equipment and distribution'],
      ['Plumbing Systems', 'Water supply and drainage systems']
    ];
    
    const categoryIds = {};
    for (const [name, description] of categoriesData) {
      const result = await client.query(`
        INSERT INTO asset_categories (org_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [orgId, name, description]);
      categoryIds[name] = result.rows[0].id;
    }
    console.log(`✓ Created ${categoriesData.length} asset categories\n`);
    
    // 10. Create Asset Types
    console.log('🔧 Creating asset types...');
    const typesData = [
      ['Chiller', categoryIds['HVAC Systems'], 'Large cooling units'],
      ['Air Handler', categoryIds['HVAC Systems'], 'Air distribution systems'],
      ['Transformer', categoryIds['Electrical Systems'], 'Power transformers'],
      ['Generator', categoryIds['Electrical Systems'], 'Emergency backup power'],
      ['Water Heater', categoryIds['Plumbing Systems'], 'Hot water systems']
    ];
    
    const typeIds = {};
    for (const [name, categoryId, description] of typesData) {
      const result = await client.query(`
        INSERT INTO asset_types (category_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [categoryId, name, description]);
      typeIds[name] = result.rows[0].id;
    }
    console.log(`✓ Created ${typesData.length} asset types\n`);
    
    // 11. Update existing assets with new location fields
    console.log('🏭 Updating assets with location info...');
    const assets = await client.query(`SELECT id FROM assets LIMIT 5`);
    if (assets.rows.length > 0) {
      for (let i = 0; i < assets.rows.length; i++) {
        const assetId = assets.rows[i].id;
        const floorId = floorIds[i % floorIds.length]; // Cycle through floors
        
        await client.query(`
          UPDATE assets 
          SET building_id = $1, floor_id = $2
          WHERE id = $3
        `, [buildingId, floorId, assetId]);
      }
      console.log(`✓ Updated ${assets.rows.length} assets\n`);
    }
    
    // 12. Create Storerooms
    console.log('🏪 Creating storerooms...');
    const storeroomsData = [
      ['Main Warehouse', 'Ground floor central storage'],
      ['Floor 1 Supply Closet', 'Quick access supplies'],
      ['Mechanical Room', 'HVAC and mechanical parts']
    ];
    
    const storeroomIds = [];
    for (const [name, location] of storeroomsData) {
      const result = await client.query(`
        INSERT INTO storerooms (org_id, site_id, name, location)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [orgId, siteId, name, location]);
      storeroomIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${storeroomsData.length} storerooms\n`);
    
    // 13. Create Parts
    console.log('🔩 Creating parts...');
    const partsData = [
      ['AF-2025-4', 'Air Filter 20x25x4', 'MERV 13 pleated filter', 'HVAC', 'ea', 25.50, 10, 50],
      ['OIL-COMP-5G', 'Compressor Oil 5gal', 'Synthetic compressor oil', 'HVAC', 'gal', 185.00, 5, 20],
      ['REF-410A-25', 'Refrigerant R-410A 25lb', 'R-410A cylinder', 'HVAC', 'lb', 12.50, 2, 10],
      ['BELT-B-120', 'V-Belt B-Section', 'V-belt for blowers', 'HVAC', 'ea', 32.00, 5, 25],
      ['CB-100A-3P', 'Circuit Breaker 100A', '100A 3-pole breaker', 'Electrical', 'ea', 245.00, 2, 8],
      ['BAT-EL-12V', 'Emergency Light Battery', '12V sealed lead acid', 'Electrical', 'ea', 42.00, 5, 20],
      ['PVC-2-S40', 'PVC Pipe 2" Sch40', '10ft length', 'Plumbing', 'ea', 15.25, 10, 40],
      ['VALVE-BALL-2', 'Ball Valve 2"', 'Brass ball valve', 'Plumbing', 'ea', 68.00, 3, 12]
    ];
    
    const partIds = [];
    for (const [partNum, name, description, category, uom, cost, reorder, reorderQty] of partsData) {
      const result = await client.query(`
        INSERT INTO parts (org_id, part_number, part_name, description, category, unit_of_measure, unit_cost, reorder_level, reorder_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [orgId, partNum, name, description, category, uom, cost, reorder, reorderQty]);
      partIds.push(result.rows[0].id);
      
      // Create stock in main warehouse
      const stockQty = Math.floor(Math.random() * (reorderQty * 2 - reorder)) + reorder;
      await client.query(`
        INSERT INTO part_stock (part_id, site_id, storeroom_id, quantity, min_quantity, max_quantity)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [result.rows[0].id, siteId, storeroomIds[0], stockQty, reorder, reorderQty * 2]);
    }
    console.log(`✓ Created ${partsData.length} parts with stock\n`);
    
    // 14. Create Vendors
    console.log('🤝 Creating vendors...');
    const vendorsData = [
      ['HVAC Supply Co', 'Supplier', 'supplies@hvacsupply.com', '555-2000'],
      ['Electrical Wholesale', 'Supplier', 'sales@elecwholesale.com', '555-2001']
    ];
    
    const vendorIds = [];
    for (const [name, type, email, phone] of vendorsData) {
      const result = await client.query(`
        INSERT INTO vendors (org_id, vendor_name, vendor_type, email, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [orgId, name, type, email, phone]);
      vendorIds.push(result.rows[0].id);
    }
    console.log(`✓ Created ${vendorsData.length} vendors\n`);
    
    // 15. Create PM Templates
    console.log('📋 Creating PM templates...');
    const templatesData = [
      ['Chiller Quarterly Inspection', 'Comprehensive chiller inspection checklist', 'HVAC', 120],
      ['Generator Monthly Test', 'Monthly load test and inspection', 'Electrical', 90],
      ['Fire Alarm Annual Test', 'Annual fire alarm system inspection', 'Safety', 180]
    ];
    
    const templateIds = [];
    for (const [name, description, category, duration] of templatesData) {
      const result = await client.query(`
        INSERT INTO pm_templates (org_id, name, description, category, estimated_duration)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [orgId, name, description, category, duration]);
      templateIds.push(result.rows[0].id);
      
      // Add template tasks
      const tasks = [
        'Visual inspection of equipment',
        'Check all electrical connections',
        'Measure and record operational parameters',
        'Clean and lubricate as needed',
        'Document findings and recommendations'
      ];
      
      for (let i = 0; i < tasks.length; i++) {
        await client.query(`
          INSERT INTO pm_template_tasks (template_id, sequence, task_name, is_mandatory)
          VALUES ($1, $2, $3, true)
        `, [result.rows[0].id, i + 1, tasks[i]]);
      }
    }
    console.log(`✓ Created ${templatesData.length} PM templates with tasks\n`);
    
    // 16. Create PM Schedules
    console.log('📅 Creating PM schedules...');
    if (assets.rows.length > 0) {
      for (let i = 0; i < Math.min(3, assets.rows.length, templateIds.length); i++) {
        await client.query(`
          INSERT INTO pm_schedules (
            org_id, asset_id, template_id, schedule_name, frequency_type, 
            frequency_value, start_date, next_due_date, assigned_to
          )
          VALUES ($1, $2, $3, $4, 'Monthly', 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', $5)
        `, [orgId, assets.rows[i].id, templateIds[i], `PM Schedule ${i + 1}`, userIds['mike.tech@acme.com']]);
      }
      console.log(`✓ Created PM schedules\n`);
    }
    
    // 17. Update Work Orders with Tasks and Parts
    console.log('🔨 Enhancing work orders...');
    const workOrders = await client.query(`SELECT id FROM work_orders LIMIT 5`);
    if (workOrders.rows.length > 0) {
      for (let i = 0; i < workOrders.rows.length; i++) {
        const woId = workOrders.rows[i].id;
        
        // Update building reference if missing
        await client.query(`
          UPDATE work_orders 
          SET building_id = $1
          WHERE id = $2 AND building_id IS NULL
        `, [buildingId, woId]);
        
        // Add tasks
        await client.query(`
          INSERT INTO work_order_tasks (work_order_id, sequence, task_name, description)
          VALUES 
            ($1, 1, 'Initial Assessment', 'Assess the situation and identify required materials'),
            ($1, 2, 'Perform Repair', 'Execute the repair or maintenance work'),
            ($1, 3, 'Test Equipment', 'Verify equipment is functioning correctly'),
            ($1, 4, 'Document Work', 'Complete documentation and update records')
          ON CONFLICT DO NOTHING
        `, [woId]);
        
        // Add parts to some work orders
        if (partIds.length > 0 && i % 2 === 0) {
          const partId = partIds[i % partIds.length];
          await client.query(`
            INSERT INTO work_order_parts (work_order_id, part_id, quantity_used, unit_cost)
            VALUES ($1, $2, 2, (SELECT unit_cost FROM parts WHERE id = $2))
          `, [woId, partId]);
        }
      }
      console.log(`✓ Enhanced ${workOrders.rows.length} work orders\n`);
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ Enterprise data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - 1 Organization: ${orgId}`);
    console.log(`   - 4 Roles`);
    console.log(`   - 3 Teams`);
    console.log(`   - 5 Users with role assignments`);
    console.log(`   - 1 Building with 3 floors and 6 spaces`);
    console.log(`   - 3 Asset Categories and 5 Asset Types`);
    console.log(`   - ${assets.rows.length} Assets updated`);
    console.log(`   - 3 Storerooms`);
    console.log(`   - 8 Parts with stock levels`);
    console.log(`   - 2 Vendors`);
    console.log(`   - 3 PM Templates with tasks`);
    console.log(`   - PM Schedules created`);
    console.log(`   - Work Orders enhanced with tasks and parts\n`);
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@acme.com (or any user email above)');
    console.log('   Password: Password@123\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed function
seedEnterpriseData()
  .then(() => {
    console.log('🎉 Seeding process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
