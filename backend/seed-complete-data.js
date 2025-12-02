require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin'
});

async function seedCompleteData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting comprehensive data seeding...\n');
    await client.query('BEGIN');

    // Get existing enterprise
    const existingEnterprise = await client.query(`SELECT id FROM enterprises LIMIT 1`);
    let enterpriseId;
    
    if (existingEnterprise.rows.length > 0) {
      enterpriseId = existingEnterprise.rows[0].id;
      console.log(`✓ Using existing enterprise: ${enterpriseId}\n`);
    } else {
      const newEnterprise = await client.query(`
        INSERT INTO enterprises (name, code, industry, email, phone, address, city, state, country, timezone, currency, settings)
        VALUES ('Acme Facilities Corp', 'ACME', 'Facilities Management', 'info@acmefacilities.com', '555-1000', 
                '123 Business Park', 'New York', 'NY', 'USA', 'America/New_York', 'USD',
                '{"logo": null, "theme": "default", "date_format": "YYYY-MM-DD"}')
        RETURNING id
      `);
      enterpriseId = newEnterprise.rows[0].id;
      console.log(`✓ Created enterprise: ${enterpriseId}\n`);
    }

    // Create/update admin user (users table: id, email, password_hash, name, role, status, phone, team)
    console.log('👤 Setting up users...');
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    const techPassword = await bcrypt.hash('Tech@123', 12);
    
    // Update or insert admin
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, phone, team)
      VALUES (gen_random_uuid(), 'System Administrator', 'admin@workix.com', $1, 'admin', 'active', '555-0001', 'IT')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = $1,
        role = 'admin',
        status = 'active'
    `, [hashedPassword]);
    
    // Get admin user id
    const adminResult = await client.query(`SELECT id FROM users WHERE email = 'admin@workix.com'`);
    const adminId = adminResult.rows[0].id;
    
    // Update technician
    await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, phone, team)
      VALUES (gen_random_uuid(), 'John Technician', 'john.tech@workix.com', $1, 'technician', 'active', '555-0002', 'Maintenance')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = $1,
        role = 'technician',
        status = 'active'
    `, [techPassword]);
    
    const techResult = await client.query(`SELECT id FROM users WHERE email = 'john.tech@workix.com'`);
    const techId = techResult.rows[0].id;
    
    // Create more technicians (users table columns: id, email, password_hash, name, role, status, phone, team)
    // Valid roles: admin, technician, analyst, manager, client
    const usersData = [
      ['Sarah Wilson', 'sarah.wilson@workix.com', 'technician', 'HVAC'],
      ['Mike Johnson', 'mike.johnson@workix.com', 'technician', 'Electrical'],
      ['Lisa Chen', 'lisa.chen@workix.com', 'manager', 'Operations'],
      ['Bob Martinez', 'bob.martinez@workix.com', 'technician', 'Plumbing'],
      ['Emily Davis', 'emily.davis@workix.com', 'analyst', 'Finance']
    ];
    
    const userIds = { 'admin@workix.com': adminId, 'john.tech@workix.com': techId };
    for (const [name, email, role, team] of usersData) {
      await client.query(`
        INSERT INTO users (id, name, email, password_hash, role, status, phone, team)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', '555-' || (1000 + floor(random() * 9000))::text, $5)
        ON CONFLICT (email) DO UPDATE SET 
          name = $1,
          role = $4,
          team = $5
      `, [name, email, techPassword, role, team]);
      
      const userResult = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
      userIds[email] = userResult.rows[0].id;
    }
    console.log(`✓ Created/updated ${Object.keys(userIds).length} users\n`);

    // Create projects (projects table: id, name, client_id, contract_number, contract_start_date, contract_end_date, 
    // contract_value, project_manager_id, description, performance_baseline, status, created_at, updated_at, created_by, enterprise_id)
    console.log('📋 Creating projects...');
    
    // Get or create a client
    const existingClient = await client.query(`SELECT id FROM clients LIMIT 1`);
    let clientId;
    if (existingClient.rows.length > 0) {
      clientId = existingClient.rows[0].id;
    } else {
      const newClient = await client.query(`
        INSERT INTO clients (name, email, phone, address, city, state, country, created_by)
        VALUES ('Acme Corporation', 'info@acme.com', '555-1000', '123 Business Park', 'New York', 'NY', 'USA', $1)
        RETURNING id
      `, [adminId]);
      clientId = newClient.rows[0].id;
    }
    
    const projectsData = [
      ['Corporate HQ Maintenance 2024', 'Comprehensive maintenance program for headquarters', 'active', 500000],
      ['Data Center Expansion', 'New data center infrastructure project', 'active', 1200000],
      ['Energy Efficiency Upgrade', 'Building-wide energy optimization initiative', 'active', 350000],
      ['HVAC System Overhaul', 'Complete HVAC replacement for Building B', 'planning', 780000],
      ['Fire Safety Compliance', 'Fire alarm and sprinkler system updates', 'completed', 125000]
    ];
    
    const projectIds = {};
    for (const [name, description, status, contractValue] of projectsData) {
      const result = await client.query(`
        INSERT INTO projects (name, description, status, contract_value, contract_start_date, enterprise_id, created_by, project_manager_id, client_id)
        VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '30 days', $5, $6, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, description, status, contractValue, enterpriseId, adminId, clientId]);
      
      if (result.rows.length > 0) {
        projectIds[name] = result.rows[0].id;
      }
    }
    
    // Get first project
    const projectResult = await client.query(`SELECT id FROM projects LIMIT 1`);
    const projectId = projectResult.rows[0]?.id;
    console.log(`✓ Created ${Object.keys(projectIds).length} projects\n`);

    // Create sites (sites table: id, project_id, name, address, city, state, postal_code, country, 
    // contact_person, contact_phone, contact_email, latitude, longitude, operating_hours, site_notes, 
    // created_at, updated_at, created_by, enterprise_id, portfolio_id, site_code)
    console.log('📍 Creating sites...');
    const sitesData = [
      ['Corporate Headquarters', 'Main corporate office complex', '123 Business Park', 'New York', 'NY', '10001', 'HQ-001'],
      ['Manufacturing Plant', 'Primary manufacturing facility', '456 Industrial Blvd', 'Newark', 'NJ', '07102', 'MFG-001'],
      ['Research Center', 'R&D and innovation hub', '789 Innovation Way', 'Boston', 'MA', '02101', 'RND-001'],
      ['Distribution Center', 'Logistics and warehousing', '321 Commerce Dr', 'Philadelphia', 'PA', '19101', 'DST-001'],
      ['Regional Office - South', 'Southern region headquarters', '555 Palm Avenue', 'Miami', 'FL', '33101', 'REG-001']
    ];
    
    const siteIds = {};
    for (const [name, notes, address, city, state, postalCode, siteCode] of sitesData) {
      const result = await client.query(`
        INSERT INTO sites (name, site_notes, address, city, state, postal_code, country, site_code, enterprise_id, project_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'USA', $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, notes, address, city, state, postalCode, siteCode, enterpriseId, projectId, adminId]);
      
      if (result.rows.length > 0) {
        siteIds[name] = result.rows[0].id;
      }
    }
    
    // Get first site
    const siteResult = await client.query(`SELECT id FROM sites LIMIT 1`);
    const siteId = siteResult.rows[0]?.id;
    console.log(`✓ Created ${Object.keys(siteIds).length} sites\n`);

    // Create more buildings (buildings table: id, site_id, name, description, building_code, floor_count, 
    // gross_area, occupancy_type, year_built, is_active, created_at, updated_at)
    console.log('🏗️ Creating buildings...');
    const existingBuildings = await client.query(`SELECT id, name FROM buildings`);
    const buildingMap = {};
    existingBuildings.rows.forEach(b => buildingMap[b.name] = b.id);
    
    const buildingsData = [
      ['Executive Tower', 'EXT-001', 'Corporate offices', 15, 180000, 'Business', 2018],
      ['Engineering Block', 'ENG-001', 'Engineering and R&D', 4, 45000, 'Industrial', 2015],
      ['Warehouse Alpha', 'WHA-001', 'Storage and logistics', 2, 120000, 'Storage', 2010],
      ['Server Farm Building', 'SRV-001', 'Data center facility', 3, 35000, 'Mercantile', 2020],
      ['Cafeteria & Amenities', 'CAF-001', 'Employee amenities', 2, 15000, 'Assembly', 2016]
    ];
    
    for (const [name, code, description, floors, area, occupancy, year] of buildingsData) {
      if (!buildingMap[name]) {
        const result = await client.query(`
          INSERT INTO buildings (site_id, name, building_code, description, floor_count, gross_area, occupancy_type, year_built, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          RETURNING id
        `, [siteId, name, code, description, floors, area, occupancy, year]);
        buildingMap[name] = result.rows[0].id;
      }
    }
    
    const buildingId = buildingMap['Main Office Tower'] || buildingMap['Executive Tower'] || Object.values(buildingMap)[0];
    console.log(`✓ Created/verified ${Object.keys(buildingMap).length} buildings\n`);

    // Create floors (floors table: id, building_id, name, floor_number, area, is_active, created_at, updated_at)
    console.log('🏢 Creating floors...');
    const floorsData = [
      ['Ground Floor', 0, 12000],
      ['First Floor', 1, 10000],
      ['Second Floor', 2, 10000],
      ['Third Floor', 3, 10000],
      ['Rooftop', 4, 5000]
    ];
    
    const floorIds = {};
    for (const [name, level, area] of floorsData) {
      const existing = await client.query(`SELECT id FROM floors WHERE building_id = $1 AND floor_number = $2`, [buildingId, level]);
      if (existing.rows.length === 0) {
        const result = await client.query(`
          INSERT INTO floors (building_id, name, floor_number, area, is_active)
          VALUES ($1, $2, $3, $4, true)
          RETURNING id
        `, [buildingId, name, level, area]);
        floorIds[level] = result.rows[0].id;
      } else {
        floorIds[level] = existing.rows[0].id;
      }
    }
    console.log(`✓ Created/verified ${Object.keys(floorIds).length} floors\n`);

    // Create spaces (spaces: id, floor_id, name, space_type, area, capacity, is_active, created_at, updated_at)
    console.log('🚪 Creating spaces...');
    const spacesData = [
      ['Main Lobby', 'lobby', 0, 1500],
      ['Reception Area', 'reception', 0, 300],
      ['Server Room', 'utility', 0, 500],
      ['Open Office - 1F', 'office', 1, 7500],
      ['Conference Room A', 'meeting', 1, 400],
      ['Conference Room B', 'meeting', 1, 350],
      ['Executive Suite', 'office', 2, 3000],
      ['Board Room', 'meeting', 2, 600],
      ['Break Room', 'common', 2, 400],
      ['Training Center', 'meeting', 3, 2000],
      ['Innovation Lab', 'laboratory', 3, 3000],
      ['HVAC Plant Room', 'mechanical', 4, 2000]
    ];
    
    for (const [name, spaceType, floorLevel, area] of spacesData) {
      const floorId = floorIds[floorLevel];
      if (floorId) {
        await client.query(`
          INSERT INTO spaces (floor_id, name, space_type, area, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT DO NOTHING
        `, [floorId, name, spaceType, area]);
      }
    }
    console.log(`✓ Created spaces\n`);

    // Create asset categories (asset_categories: id, name, description, enterprise_id)
    console.log('📦 Creating asset categories...');
    const categoriesData = [
      ['HVAC', 'Heating, Ventilation, and Air Conditioning'],
      ['Electrical', 'Electrical systems and equipment'],
      ['Plumbing', 'Water and plumbing systems'],
      ['Fire Safety', 'Fire detection and suppression'],
      ['Elevators', 'Vertical transportation systems'],
      ['IT Infrastructure', 'Network and computing equipment'],
      ['Building Envelope', 'Roof, walls, and structural elements']
    ];
    
    const categoryIds = {};
    for (const [name, description] of categoriesData) {
      const result = await client.query(`
        INSERT INTO asset_categories (name, description, enterprise_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, description, enterpriseId]);
      
      if (result.rows.length > 0) {
        categoryIds[name] = result.rows[0].id;
      } else {
        const existing = await client.query(`SELECT id FROM asset_categories WHERE name = $1`, [name]);
        if (existing.rows.length > 0) categoryIds[name] = existing.rows[0].id;
      }
    }
    console.log(`✓ Created ${Object.keys(categoryIds).length} asset categories\n`);

    // Create asset types (asset_types: id, category_id, name, description, created_at, updated_at)
    console.log('🔧 Creating asset types...');
    const typesData = [
      ['Chiller', 'HVAC', 'Chilled water production'],
      ['Air Handler Unit', 'HVAC', 'Air distribution system'],
      ['Boiler', 'HVAC', 'Hot water/steam generation'],
      ['Transformer', 'Electrical', 'Power transformation'],
      ['Generator', 'Electrical', 'Emergency power'],
      ['Switchgear', 'Electrical', 'Power distribution'],
      ['Fire Alarm Panel', 'Fire Safety', 'Fire detection control'],
      ['Sprinkler System', 'Fire Safety', 'Fire suppression'],
      ['Passenger Elevator', 'Elevators', 'Vertical transport'],
      ['UPS System', 'IT Infrastructure', 'Uninterruptible power'],
      ['Network Switch', 'IT Infrastructure', 'Network connectivity'],
      ['Water Pump', 'Plumbing', 'Water circulation'],
      ['Roof Membrane', 'Building Envelope', 'Waterproofing']
    ];
    
    const typeIds = {};
    for (const [name, categoryName, description] of typesData) {
      const categoryId = categoryIds[categoryName];
      if (categoryId) {
        const result = await client.query(`
          INSERT INTO asset_types (category_id, name, description)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [categoryId, name, description]);
        
        if (result.rows.length > 0) {
          typeIds[name] = result.rows[0].id;
        } else {
          const existing = await client.query(`SELECT id FROM asset_types WHERE name = $1 AND category_id = $2`, [name, categoryId]);
          if (existing.rows.length > 0) typeIds[name] = existing.rows[0].id;
        }
      }
    }
    console.log(`✓ Created ${Object.keys(typeIds).length} asset types\n`);

    // Create assets (assets table: id, site_id, asset_tag, name, type, manufacturer, model, serial_number, 
    // capacity, capacity_unit, commissioning_date, warranty_expiry_date, performance_baseline, specifications,
    // location_details, qr_code_url, manual_url, status, created_at, updated_at, created_by, building_id, 
    // floor_id, space_id, category_id, asset_type_id, parent_asset_id)
    // Valid asset_type enum: chiller, ahu, pump, cooling_tower, boiler, vfd, motor, compressor, other
    console.log('🏭 Creating assets...');
    const firstFloorId = Object.values(floorIds)[0] || null;
    
    const assetsData = [
      ['Chiller Unit #1', 'CH-001', 'chiller', 'Carrier', 'AquaEdge 19DV', 'SN-CH001-2016', 'operational'],
      ['Chiller Unit #2', 'CH-002', 'chiller', 'Carrier', 'AquaEdge 19DV', 'SN-CH002-2016', 'operational'],
      ['AHU-1 Ground Floor', 'AHU-G01', 'ahu', 'Trane', 'ClimateChanger', 'SN-AHU001-2018', 'operational'],
      ['AHU-2 First Floor', 'AHU-1F01', 'ahu', 'Trane', 'ClimateChanger', 'SN-AHU002-2018', 'operational'],
      ['Main Boiler', 'BLR-001', 'boiler', 'Cleaver-Brooks', 'CBLE-700', 'SN-BLR001-2015', 'operational'],
      ['Main Transformer', 'TRF-001', 'other', 'ABB', 'Distribution', 'SN-TRF001-2015', 'operational'],
      ['Emergency Generator', 'GEN-001', 'motor', 'Caterpillar', 'C15', 'SN-GEN001-2017', 'operational'],
      ['Main Pump Station', 'PMP-001', 'pump', 'Grundfos', 'CR Series', 'SN-PMP001-2015', 'operational'],
      ['Cooling Tower #1', 'CT-001', 'cooling_tower', 'Marley', 'NC Series', 'SN-CT001-2019', 'operational'],
      ['VFD Panel - AHU1', 'VFD-001', 'vfd', 'ABB', 'ACS580', 'SN-VFD001-2020', 'operational'],
      ['Compressor Unit #1', 'CMP-001', 'compressor', 'Carrier', '06T', 'SN-CMP001-2016', 'operational'],
      ['Motor - Pump 1', 'MTR-001', 'motor', 'WEG', 'W22', 'SN-MTR001-2017', 'operational'],
      ['Fire Alarm Panel - Main', 'FAP-001', 'other', 'Notifier', 'NFS2-3030', 'SN-FAP001-2019', 'operational'],
      ['Elevator #1', 'ELV-001', 'other', 'OTIS', 'Gen2', 'SN-ELV001-2016', 'operational'],
      ['UPS System Main', 'UPS-001', 'other', 'Eaton', '9PX', 'SN-UPS001-2020', 'operational'],
      ['Roof Membrane - Bldg A', 'ROF-001', 'other', 'Firestone', 'TPO', 'SN-ROF001-2010', 'needs_attention']
    ];
    
    const assetIds = [];
    for (const [name, tag, assetType, manufacturer, model, serialNumber, status] of assetsData) {
      // Find category based on asset type
      let categoryId = null;
      if (['chiller', 'ahu', 'boiler'].includes(assetType)) {
        categoryId = categoryIds['HVAC'];
      } else if (['cooling_tower', 'pump'].includes(assetType)) {
        categoryId = categoryIds['Plumbing'];
      } else if (['vfd', 'motor', 'compressor'].includes(assetType)) {
        categoryId = categoryIds['Electrical'];
      } else {
        categoryId = categoryIds['Building Envelope'] || categoryIds['HVAC'];
      }
      
      // Find type ID based on asset type
      let typeId = null;
      const typeNameMap = {
        'chiller': 'Chiller',
        'ahu': 'Air Handler Unit', 
        'boiler': 'Boiler',
        'pump': 'Water Pump',
        'cooling_tower': 'Chiller',
        'vfd': 'Switchgear',
        'motor': 'Generator',
        'compressor': 'Chiller',
        'other': 'Roof Membrane'
      };
      typeId = typeIds[typeNameMap[assetType]] || Object.values(typeIds)[0];
      
      const result = await client.query(`
        INSERT INTO assets (name, asset_tag, type, site_id, building_id, floor_id, status, manufacturer, model, serial_number, category_id, asset_type_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, tag, assetType, siteId, buildingId, firstFloorId, status, manufacturer, model, serialNumber, categoryId, typeId, adminId]);
      
      if (result.rows.length > 0) {
        assetIds.push(result.rows[0].id);
      }
    }
    console.log(`✓ Created ${assetIds.length} assets\n`);

    // Create storerooms (storerooms: id, org_id, site_id, name, location, is_active, created_at, updated_at, enterprise_id)
    console.log('🏪 Creating storerooms...');
    const storeroomsData = [
      ['Main Warehouse', 'Building A - Ground Floor'],
      ['HVAC Parts Storage', 'Mechanical Room'],
      ['Electrical Supplies', 'Electrical Room'],
      ['Floor 1 Supply Closet', 'First Floor - Storage Room']
    ];
    
    const storeroomIds = {};
    for (const [name, location] of storeroomsData) {
      const result = await client.query(`
        INSERT INTO storerooms (name, location, site_id, enterprise_id, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, location, siteId, enterpriseId]);
      
      if (result.rows.length > 0) {
        storeroomIds[name] = result.rows[0].id;
      }
    }
    console.log(`✓ Created ${Object.keys(storeroomIds).length} storerooms\n`);

    // Create parts (parts: id, org_id, part_number, part_name, description, category, manufacturer, 
    // model_number, unit_of_measure, unit_cost, reorder_level, reorder_quantity, is_active, enterprise_id)
    console.log('🔩 Creating parts...');
    const partsData = [
      ['Air Filter 20x25x4 MERV 13', 'AF-2025-4', 'HVAC', 'ea', 25.50, 10, 50],
      ['Air Filter 16x20x2 MERV 11', 'AF-1620-2', 'HVAC', 'ea', 18.75, 10, 40],
      ['Compressor Oil 5 Gal', 'OIL-COMP-5G', 'HVAC', 'ea', 185.00, 5, 20],
      ['R-410A Refrigerant 25lb', 'REF-410A-25', 'HVAC', 'ea', 275.00, 2, 10],
      ['V-Belt B Section', 'BELT-B-120', 'HVAC', 'ea', 32.00, 5, 25],
      ['Pillow Block Bearing 1.5"', 'BRG-PB-1.5', 'Mechanical', 'ea', 78.50, 2, 10],
      ['Circuit Breaker 100A 3P', 'CB-100A-3P', 'Electrical', 'ea', 245.00, 2, 8],
      ['Circuit Breaker 50A 2P', 'CB-50A-2P', 'Electrical', 'ea', 95.00, 5, 15],
      ['Emergency Light Battery', 'BAT-EL-12V', 'Electrical', 'ea', 42.00, 5, 20],
      ['PVC Pipe 2" Sch40 10ft', 'PVC-2-S40', 'Plumbing', 'ea', 15.25, 10, 40],
      ['Pipe Elbow 2" 90deg', 'FIT-PVC-2-EL', 'Plumbing', 'ea', 3.50, 20, 100],
      ['HVAC Thermostat Programmable', 'THERMO-PROG', 'HVAC', 'ea', 125.00, 3, 15],
      ['Time Delay Fuse 30A', 'FUSE-30A-TD', 'Electrical', 'ea', 8.75, 10, 50],
      ['Pump Seal Kit', 'SEAL-PUMP-2', 'Plumbing', 'ea', 95.00, 2, 8],
      ['THHN Wire 12AWG (per ft)', 'WIRE-12-THHN', 'Electrical', 'ft', 1.25, 500, 2000],
      ['Ball Valve 2" Brass', 'VALVE-BALL-2', 'Plumbing', 'ea', 68.00, 3, 12],
      ['Smoke Detector Battery', 'BAT-SMK-9V', 'Fire Safety', 'ea', 4.50, 50, 200],
      ['Elevator Door Sensor', 'ELV-DOOR-SNS', 'Elevator', 'ea', 450.00, 1, 4]
    ];
    
    const partIds = [];
    const mainStoreroomId = storeroomIds['Main Warehouse'] || Object.values(storeroomIds)[0];
    for (const [partName, partNumber, category, uom, cost, reorderLevel, reorderQty] of partsData) {
      const result = await client.query(`
        INSERT INTO parts (part_name, part_number, category, unit_of_measure, unit_cost, reorder_level, reorder_quantity, enterprise_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [partName, partNumber, category, uom, cost, reorderLevel, reorderQty, enterpriseId]);
      
      if (result.rows.length > 0) {
        partIds.push(result.rows[0].id);
        
        // Add stock for this part (part_stock: part_id, site_id, storeroom_id, quantity, min_quantity, max_quantity)
        const stockQty = Math.floor(Math.random() * (reorderQty * 2 - reorderLevel)) + reorderLevel;
        if (mainStoreroomId && siteId) {
          await client.query(`
            INSERT INTO part_stock (part_id, site_id, storeroom_id, quantity, min_quantity, max_quantity)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING
          `, [result.rows[0].id, siteId, mainStoreroomId, stockQty, reorderLevel, reorderQty * 2]);
        }
      }
    }
    console.log(`✓ Created ${partIds.length} parts with stock\n`);

    // Create vendors (vendors: vendor_name, vendor_type, email, phone, address_line_1, city, state, country, enterprise_id)
    console.log('🤝 Creating vendors...');
    const vendorsData = [
      ['HVAC Supply Co', 'Supplier', 'supplies@hvacsupply.com', '555-2000', '456 Industrial Dr', 'Newark', 'NJ'],
      ['Electrical Wholesale', 'Supplier', 'sales@elecwholesale.com', '555-2001', '789 Commerce Blvd', 'Jersey City', 'NJ'],
      ['Johnson Controls', 'Service Provider', 'service@jci.com', '555-2002', '100 Technology Way', 'Milwaukee', 'WI'],
      ['OTIS Elevator', 'Service Provider', 'maintenance@otis.com', '555-2003', '200 Elevator Ave', 'Farmington', 'CT'],
      ['Fire Protection Inc', 'Service Provider', 'service@firepro.com', '555-2004', '300 Safety Rd', 'Philadelphia', 'PA']
    ];
    
    for (const [name, type, email, phone, address, city, state] of vendorsData) {
      await client.query(`
        INSERT INTO vendors (vendor_name, vendor_type, email, phone, address_line_1, city, state, country, enterprise_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'USA', $8, true)
        ON CONFLICT DO NOTHING
      `, [name, type, email, phone, address, city, state, enterpriseId]);
    }
    console.log(`✓ Created vendors\n`);

    // Create PM templates (pm_templates: name, description, category, estimated_duration, enterprise_id)
    console.log('📋 Creating PM templates...');
    const templatesData = [
      ['Chiller Quarterly Inspection', 'Quarterly inspection of chiller systems', 'HVAC', 240],
      ['AHU Monthly Service', 'Monthly service for air handler units', 'HVAC', 120],
      ['Generator Monthly Test', 'Monthly load test for generators', 'Electrical', 60],
      ['Fire Alarm Annual Inspection', 'Annual fire alarm system inspection', 'Fire Safety', 480],
      ['Elevator Monthly Inspection', 'Monthly elevator safety inspection', 'Elevator', 90],
      ['Roof Inspection Quarterly', 'Quarterly roof condition inspection', 'Building', 180]
    ];
    
    const templateIds = [];
    for (const [name, description, category, duration] of templatesData) {
      const result = await client.query(`
        INSERT INTO pm_templates (name, description, category, estimated_duration, enterprise_id, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, description, category, duration, enterpriseId]);
      
      if (result.rows.length > 0) {
        templateIds.push(result.rows[0].id);
        
        // Add tasks to template (pm_template_tasks: template_id, sequence, task_name, description, is_mandatory)
        const tasks = [
          'Visual inspection of all components',
          'Check operating parameters and record readings',
          'Inspect and clean filters/strainers',
          'Lubricate moving parts as needed',
          'Test safety devices and controls',
          'Document findings and recommendations'
        ];
        
        for (let i = 0; i < tasks.length; i++) {
          await client.query(`
            INSERT INTO pm_template_tasks (template_id, sequence, task_name, description, is_mandatory)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT DO NOTHING
          `, [result.rows[0].id, i + 1, `Task ${i + 1}`, tasks[i]]);
        }
      }
    }
    console.log(`✓ Created ${templateIds.length} PM templates\n`);

    // Create PM schedules (pm_schedules: asset_id, template_id, schedule_name, frequency_type, frequency_value, 
    // start_date, next_due_date, assigned_to, is_active, enterprise_id)
    // Valid frequency_type: 'Daily', 'Weekly', 'Monthly', 'Yearly', 'Meter'
    console.log('📅 Creating PM schedules...');
    const existingAssets = await client.query(`SELECT id FROM assets LIMIT 5`);
    for (let i = 0; i < Math.min(existingAssets.rows.length, templateIds.length); i++) {
      await client.query(`
        INSERT INTO pm_schedules (asset_id, template_id, schedule_name, frequency_type, frequency_value, start_date, next_due_date, assigned_to, is_active, enterprise_id)
        VALUES ($1, $2, $3, 'Monthly', 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', $4, true, $5)
        ON CONFLICT DO NOTHING
      `, [existingAssets.rows[i].id, templateIds[i % templateIds.length], 'Monthly PM Schedule', techId, enterpriseId]);
    }
    console.log(`✓ Created PM schedules\n`);

    // Create work orders (work_orders: title, description, source, priority, status, site_id, building_id, 
    // reported_by, assigned_to, due_date, enterprise_id)
    // Valid source: performance_deviation, customer_complaint, preventive_maintenance, manual
    console.log('🔨 Creating work orders...');
    const workOrdersData = [
      ['Chiller #1 High Vibration', 'High vibration detected during operation. Needs inspection.', 'performance_deviation', 'high', 'pending'],
      ['AHU-1 Filter Replacement', 'Scheduled filter change for ground floor AHU', 'preventive_maintenance', 'medium', 'in_progress'],
      ['Emergency - Power Outage in Suite 2A', 'Complete power failure in executive suite. Critical.', 'manual', 'critical', 'pending'],
      ['Water Leak in Lobby Ceiling', 'Water stains appearing on ceiling tiles near main entrance', 'customer_complaint', 'high', 'acknowledged'],
      ['Generator Monthly Load Test', 'Scheduled monthly generator testing and logging', 'preventive_maintenance', 'medium', 'pending'],
      ['Replace Exit Sign Battery - 3F', 'Exit sign on 3rd floor not illuminating properly', 'manual', 'low', 'completed'],
      ['Quarterly HVAC Inspection', 'Regular quarterly inspection of HVAC systems', 'preventive_maintenance', 'medium', 'pending'],
      ['Elevator #2 Door Adjustment', 'Elevator door closing slowly, adjustment needed', 'customer_complaint', 'medium', 'parts_pending'],
      ['Replace Broken Window Lock', 'Window lock mechanism broken in Conference Room A', 'manual', 'low', 'pending'],
      ['Annual Fire Alarm Testing', 'Comprehensive annual fire alarm system test', 'preventive_maintenance', 'high', 'pending']
    ];
    
    const workOrderIds = [];
    let woCounter = Math.floor(Math.random() * 1000) + 1; // Random start to avoid conflicts
    for (const [title, description, source, priority, status] of workOrdersData) {
      const woNumber = `WO${new Date().getFullYear()}${String(woCounter++).padStart(6, '0')}`;
      const result = await client.query(`
        INSERT INTO work_orders (work_order_number, title, description, source, priority, status, site_id, building_id, reported_by, assigned_to, due_date, enterprise_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE + INTERVAL '7 days' * (random() * 3 + 1)::int, $11)
        ON CONFLICT (work_order_number) DO UPDATE SET title = EXCLUDED.title
        RETURNING id
      `, [woNumber, title, description, source, priority, status, siteId, buildingId, adminId, techId, enterpriseId]);
      
      if (result.rows.length > 0) {
        workOrderIds.push(result.rows[0].id);
      
        // Add tasks (work_order_tasks: work_order_id, sequence, task_name, description, is_completed)
        await client.query(`
          INSERT INTO work_order_tasks (work_order_id, sequence, task_name, description, is_completed)
          VALUES 
            ($1, 1, 'Assessment', 'Initial assessment and diagnosis', false),
            ($1, 2, 'Repair', 'Perform required work', false),
            ($1, 3, 'Testing', 'Test and verify completion', false),
            ($1, 4, 'Documentation', 'Update documentation', false)
        `, [result.rows[0].id]);
      }
    }
    console.log(`✓ Created ${workOrderIds.length} work orders\n`);

    // Create teams (teams: team_name, description, team_lead, enterprise_id)
    console.log('👥 Creating teams...');
    const teamsData = [
      ['HVAC Team', 'Heating, ventilation, and AC maintenance'],
      ['Electrical Team', 'Electrical systems and power'],
      ['General Maintenance', 'General building maintenance'],
      ['Emergency Response', 'Critical and emergency repairs']
    ];
    
    for (const [name, description] of teamsData) {
      const result = await client.query(`
        INSERT INTO teams (team_name, description, team_lead, enterprise_id, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [name, description, userIds['lisa.chen@workix.com'] || techId, enterpriseId]);
      
      if (result.rows.length > 0) {
        // Add team members (team_members: team_id, account_id)
        const teamId = result.rows[0].id;
        await client.query(`
          INSERT INTO team_members (team_id, account_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [teamId, techId]);
      }
    }
    console.log(`✓ Created teams\n`);

    await client.query('COMMIT');
    
    console.log('\n✅ Complete data seeding finished successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 1 Enterprise');
    console.log('   - 7+ Users');
    console.log('   - 5 Projects');
    console.log('   - 5 Sites');
    console.log('   - 8+ Buildings');
    console.log('   - 5 Floors');
    console.log('   - 12 Spaces');
    console.log('   - 7 Asset Categories');
    console.log('   - 13 Asset Types');
    console.log('   - 16 Assets');
    console.log('   - 4 Storerooms');
    console.log('   - 18 Parts with stock');
    console.log('   - 5 Vendors');
    console.log('   - 6 PM Templates');
    console.log('   - PM Schedules');
    console.log('   - 10 Work Orders');
    console.log('   - 4 Teams');
    
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@workix.com / Admin@123');
    console.log('   Technician: john.tech@workix.com / Tech@123');
    console.log('   All other users: [email] / Tech@123\n');
    
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
seedCompleteData()
  .then(() => {
    console.log('🎉 Seeding process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
