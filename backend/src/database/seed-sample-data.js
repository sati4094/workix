const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'workix',
});

async function seedSampleData() {
  console.log('🌱 Seeding sample data...\n');
  
  try {
    // Get organization and user IDs
    const orgs = await pool.query('SELECT id FROM organizations WHERE slug = $1', ['acme']);
    const orgId = orgs.rows[0]?.id;
    
    const users = await pool.query('SELECT id, name FROM users ORDER BY created_at LIMIT 3');
    const adminUser = users.rows[0];
    const techUser = users.rows[1];
    const managerUser = users.rows[2];
    
    if (!orgId) {
      console.log('❌ Organization not found. Run migrations first.');
      return;
    }

    console.log('📍 Creating Sites...');
    const sites = [];
    const siteData = [
      { name: 'Downtown Office Tower', city: 'Dubai', code: 'DOT-01', sqft: 50000 },
      { name: 'Marina Bay Complex', city: 'Dubai', code: 'MBC-02', sqft: 75000 },
      { name: 'Airport Terminal 3', city: 'Dubai', code: 'AT3-03', sqft: 120000 },
      { name: 'Industrial Park A', city: 'Abu Dhabi', code: 'IPA-04', sqft: 200000 },
      { name: 'Shopping Mall West', city: 'Dubai', code: 'SMW-05', sqft: 95000 }
    ];
    
    for (const site of siteData) {
      const result = await pool.query(`
        INSERT INTO sites (organization_id, name, city, facility_code, square_feet, address, country, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name
      `, [orgId, site.name, site.city, site.code, site.sqft, `${site.code} Street, ${site.city}`, 'UAE', true, adminUser.id]);
      sites.push(result.rows[0]);
      console.log(`   ✓ Created: ${result.rows[0].name}`);
    }

    console.log('\n🏢 Creating Clients...');
    const clients = [];
    const clientData = [
      { name: 'Emirates Group', contact: 'Ahmed Al Mansoori', email: 'ahmed@emirates.ae', phone: '+971-4-555-0100' },
      { name: 'Dubai Properties', contact: 'Sara Khan', email: 'sara@dp.ae', phone: '+971-4-555-0200' },
      { name: 'Abu Dhabi National Oil', contact: 'Mohammed Hassan', email: 'mhh@adnoc.ae', phone: '+971-2-555-0300' }
    ];
    
    for (const client of clientData) {
      const result = await pool.query(`
        INSERT INTO clients (organization_id, name, contact_person, contact_email, contact_phone, city, country, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name
      `, [orgId, client.name, client.contact, client.email, client.phone, 'Dubai', 'UAE', true, adminUser.id]);
      clients.push(result.rows[0]);
      console.log(`   ✓ Created: ${result.rows[0].name}`);
    }

    console.log('\n🔧 Creating Assets...');
    const assets = [];
    const assetData = [
      { name: 'HVAC Unit - Roof Level 12', category: 'HVAC', manufacturer: 'Carrier', model: 'AquaEdge 19DV', serial: 'CAR-2023-1001', criticality: 'high' },
      { name: 'Fire Pump - Basement', category: 'Fire Safety', manufacturer: 'Grundfos', model: 'CR 64-2', serial: 'GRU-2023-2002', criticality: 'critical' },
      { name: 'Elevator #1 - Main Lobby', category: 'Elevators', manufacturer: 'Otis', model: 'Gen2', serial: 'OTS-2023-3003', criticality: 'high' },
      { name: 'Chiller Unit - Mechanical Room', category: 'HVAC', manufacturer: 'Trane', model: 'RTWD', serial: 'TRA-2023-4004', criticality: 'high' },
      { name: 'Generator - Emergency Power', category: 'Power', manufacturer: 'Caterpillar', model: 'C18', serial: 'CAT-2023-5005', criticality: 'critical' },
      { name: 'Water Tank - Roof', category: 'Plumbing', manufacturer: 'Sintex', model: 'WT-10000', serial: 'SIN-2023-6006', criticality: 'medium' },
      { name: 'Access Control System', category: 'Security', manufacturer: 'HID', model: 'VertX V2000', serial: 'HID-2023-7007', criticality: 'high' },
      { name: 'BMS Controller - Floor 10', category: 'Building Management', manufacturer: 'Siemens', model: 'Desigo CC', serial: 'SIE-2023-8008', criticality: 'medium' }
    ];
    
    for (let i = 0; i < assetData.length; i++) {
      const asset = assetData[i];
      const siteId = sites[i % sites.length].id;
      const result = await pool.query(`
        INSERT INTO assets (site_id, organization_id, name, asset_tag, category, manufacturer, model, serial_number, 
                            status, criticality, purchase_date, installation_date, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, name
      `, [siteId, orgId, asset.name, `AST-${1000 + i}`, asset.category, asset.manufacturer, asset.model, 
          asset.serial, 'operational', asset.criticality, '2023-01-15', '2023-02-01', true, adminUser.id]);
      assets.push(result.rows[0]);
      console.log(`   ✓ Created: ${result.rows[0].name}`);
    }

    console.log('\n📋 Creating Work Orders...');
    const workOrders = [];
    const woData = [
      { title: 'HVAC Annual Maintenance', type: 'preventive', priority: 'medium', status: 'open', description: 'Scheduled annual maintenance for HVAC system including filter replacement and cleaning' },
      { title: 'Emergency Generator Repair', type: 'corrective', priority: 'critical', status: 'in_progress', description: 'Generator failed to start during weekly test. Needs immediate inspection' },
      { title: 'Elevator Safety Inspection', type: 'inspection', priority: 'high', status: 'open', description: 'Mandatory quarterly safety inspection for all elevators' },
      { title: 'Fire Alarm System Check', type: 'preventive', priority: 'high', status: 'completed', description: 'Monthly fire alarm system testing and battery check' },
      { title: 'Water Leak - Floor 8', type: 'corrective', priority: 'high', status: 'in_progress', description: 'Water leak reported in ceiling, causing damage to office space' },
      { title: 'AC Not Cooling - Office 1205', type: 'corrective', priority: 'medium', status: 'open', description: 'Tenant complaint about insufficient cooling in office 1205' },
      { title: 'BMS Calibration', type: 'preventive', priority: 'low', status: 'scheduled', description: 'Quarterly calibration of Building Management System sensors' },
      { title: 'Lighting Replacement - Parking', type: 'corrective', priority: 'medium', status: 'open', description: 'Replace 15 burnt-out LED lights in basement parking' },
      { title: 'Access Card System Upgrade', type: 'project', priority: 'low', status: 'scheduled', description: 'Upgrade access control system to latest firmware version' },
      { title: 'Plumbing Inspection', type: 'inspection', priority: 'medium', status: 'completed', description: 'Annual plumbing system inspection completed with no issues found' }
    ];
    
    for (let i = 0; i < woData.length; i++) {
      const wo = woData[i];
      const siteId = sites[i % sites.length].id;
      const assetId = assets[i % assets.length].id;
      const clientId = clients[i % clients.length].id;
      const assignedTo = i % 2 === 0 ? techUser.id : managerUser.id;
      
      const result = await pool.query(`
        INSERT INTO work_orders (organization_id, site_id, asset_id, client_id, wo_number, title, description, 
                                 priority, status, type, assigned_to, requested_by, scheduled_start, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, wo_number, title
      `, [orgId, siteId, assetId, clientId, `WO-2024-${1000 + i}`, wo.title, wo.description, 
          wo.priority, wo.status, wo.type, assignedTo, adminUser.id, new Date(), adminUser.id]);
      workOrders.push(result.rows[0]);
      console.log(`   ✓ Created: ${result.rows[0].wo_number} - ${result.rows[0].title}`);
    }

    console.log('\n✅ Sample data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Sites: ${sites.length}`);
    console.log(`   Clients: ${clients.length}`);
    console.log(`   Assets: ${assets.length}`);
    console.log(`   Work Orders: ${workOrders.length}\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedSampleData();
