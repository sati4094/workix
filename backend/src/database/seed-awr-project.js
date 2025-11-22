const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedAWRProject() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Starting AWR project seeding...\n');

    // 1. Create AWR Client
    console.log('1. Creating AWR client...');
    const clientResult = await client.query(`
      INSERT INTO clients (name, contact_person, contact_email, contact_phone, address, city, country, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, ['AWR', 'Ahmed Al Mansoori', 'contact@awr.ae', '+971-4-1234567', 'Sheikh Zayed Road', 'Dubai', 'UAE', 'Premium commercial HVAC client']);
    const clientId = clientResult.rows[0].id;
    console.log(`✓ Client created: AWR (ID: ${clientId})\n`);

    // 2. Create Project (required before creating sites)
    console.log('2. Creating HVAC System Maintenance project...');
    const projectResult = await client.query(`
      INSERT INTO projects (
        name, client_id, description, contract_number, 
        contract_start_date, contract_end_date, contract_value, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      'HVAC System Maintenance - DXB Towers',
      clientId,
      'Comprehensive HVAC system maintenance and management for DXB Towers facility',
      'AWR-2025-001',
      '2025-01-01',
      '2025-12-31',
      500000,
      'active'
    ]);
    const projectId = projectResult.rows[0].id;
    console.log(`✓ Project created (ID: ${projectId})\n`);

    // 3. Create DXB Towers Site
    console.log('3. Creating DXB Towers site...');
    const siteResult = await client.query(`
      INSERT INTO sites (
        project_id, name, address, city, country, 
        latitude, longitude, contact_person, contact_phone, contact_email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      projectId,
      'DXB Towers',
      'Sheikh Zayed Road, Dubai',
      'Dubai',
      'UAE',
      25.2048,
      55.2708,
      'Ahmed Al Mansoori',
      '+971-4-1234567',
      'contact@awr.ae'
    ]);
    const siteId = siteResult.rows[0].id;
    console.log(`✓ Site created: DXB Towers (ID: ${siteId})\n`);

    // 4. Create Assets
    console.log('4. Creating assets...\n');
    
    const assets = [];

    // Chillers (3 units)
    console.log('Creating Chillers...');
    for (let i = 1; i <= 3; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details, 
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `Chiller ${i}`,
        `DXB-CH-${i.toString().padStart(3, '0')}`,
        'chiller',
        'Carrier',
        '30XA-1002',
        `CH${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-01-15',
        '2027-01-15',
        'operational',
        siteId,
        'Basement - Plant Room',
        JSON.stringify({
          capacity: '1000 TR',
          refrigerant: 'R-134a',
          voltage: '380V',
          power: '750 kW',
          cooling_type: 'Water-cooled'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // Primary Pumps (4 units)
    console.log('\nCreating Primary Pumps...');
    for (let i = 1; i <= 4; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `Primary Pump ${i}`,
        `DXB-PP-${i.toString().padStart(3, '0')}`,
        'pump',
        'Grundfos',
        'NBE 150-315',
        `PP${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-01-20',
        '2027-01-20',
        i <= 3 ? 'operational' : 'standby',
        siteId,
        'Basement - Pump Room',
        JSON.stringify({
          flow_rate: '800 m³/h',
          head: '35 m',
          power: '45 kW',
          speed: '1450 RPM',
          type: 'Primary CHW Pump'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // Condenser Pumps (4 units)
    console.log('\nCreating Condenser Pumps...');
    for (let i = 1; i <= 4; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `Condenser Pump ${i}`,
        `DXB-CP-${i.toString().padStart(3, '0')}`,
        'pump',
        'Grundfos',
        'NBE 200-350',
        `CP${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-01-20',
        '2027-01-20',
        i <= 3 ? 'operational' : 'standby',
        siteId,
        'Basement - Pump Room',
        JSON.stringify({
          flow_rate: '900 m³/h',
          head: '32 m',
          power: '55 kW',
          speed: '1450 RPM',
          type: 'Condenser Water Pump'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // Cooling Towers (3 units)
    console.log('\nCreating Cooling Towers...');
    for (let i = 1; i <= 3; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `Cooling Tower ${i}`,
        `DXB-CT-${i.toString().padStart(3, '0')}`,
        'cooling_tower',
        'Baltimore Aircoil',
        'VTI-1500',
        `CT${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-01-25',
        '2027-01-25',
        'operational',
        siteId,
        'Rooftop - Cooling Tower Area',
        JSON.stringify({
          capacity: '1200 TR',
          type: 'Open Circuit',
          fans: '2 x 30 HP',
          water_flow: '3600 GPM'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // Secondary Pumps (4 units)
    console.log('\nCreating Secondary Pumps...');
    for (let i = 1; i <= 4; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `Secondary Pump ${i}`,
        `DXB-SP-${i.toString().padStart(3, '0')}`,
        'pump',
        'Wilo',
        'VeroLine IPL 100/145',
        `SP${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-01-22',
        '2027-01-22',
        i <= 3 ? 'operational' : 'standby',
        siteId,
        'Basement - Pump Room',
        JSON.stringify({
          flow_rate: '600 m³/h',
          head: '28 m',
          power: '37 kW',
          speed: 'VFD Controlled',
          type: 'Secondary Distribution Pump'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // AHUs (10 units)
    console.log('\nCreating Air Handling Units...');
    const ahuLocations = [
      'Technical Floor - AHU Room 1',
      'Technical Floor - AHU Room 2',
      'Technical Floor - AHU Room 3',
      'Technical Floor - AHU Room 4',
      'Level 1 - Office Zone A AHU Room',
      'Level 2 - Office Zone A AHU Room',
      'Level 3 - Office Zone A AHU Room',
      'Level 4 - Office Zone A AHU Room',
      'Level 5 - Executive Floor AHU Room',
      'Ground Floor - Lobby AHU Room'
    ];
    
    for (let i = 1; i <= 10; i++) {
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `AHU ${i}`,
        `DXB-AHU-${i.toString().padStart(3, '0')}`,
        'ahu',
        'Daikin',
        'DAM-45',
        `AHU${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-02-01',
        '2027-02-01',
        'operational',
        siteId,
        ahuLocations[i - 1],
        JSON.stringify({
          airflow: '15000 CFM',
          cooling_capacity: '120 kW',
          heating_capacity: '80 kW',
          filter_type: 'MERV 13',
          supply_fan: '15 HP',
          return_fan: '10 HP'
        })
      ]);
      assets.push(result.rows[0]);
      console.log(`  ✓ ${result.rows[0].name}`);
    }

    // FCUs (50 units)
    console.log('\nCreating Fan Coil Units...');
    const fcuFloors = [
      'Ground Floor - Lobby',
      'Ground Floor - Retail Area',
      'Level 1 - Office Zone A',
      'Level 1 - Office Zone B',
      'Level 2 - Office Zone A',
      'Level 2 - Office Zone B',
      'Level 3 - Office Zone A',
      'Level 3 - Office Zone B',
      'Level 4 - Office Zone A',
      'Level 4 - Office Zone B',
      'Level 5 - Executive Offices'
    ];

    for (let i = 1; i <= 50; i++) {
      const floorIndex = Math.floor((i - 1) / 5) % fcuFloors.length;
      const result = await client.query(`
        INSERT INTO assets (
          name, asset_tag, type, manufacturer, model, serial_number,
          commissioning_date, warranty_expiry_date, status, site_id, location_details,
          specifications
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        `FCU ${i}`,
        `DXB-FCU-${i.toString().padStart(3, '0')}`,
        'other',
        'Carrier',
        '42N-40',
        `FCU${i}-2024-${Math.random().toString(36).substring(7).toUpperCase()}`,
        '2024-02-05',
        '2027-02-05',
        'operational',
        siteId,
        fcuFloors[floorIndex],
        JSON.stringify({
          capacity: '3.5 kW',
          airflow: '600 CFM',
          type: 'Concealed Ceiling FCU',
          fan_speed: '3-speed',
          filter_type: 'G4'
        })
      ]);
      assets.push(result.rows[0]);
      if (i % 10 === 0) console.log(`  ✓ Created FCUs 1-${i}`);
    }

    console.log(`\n✓ Total assets created: ${assets.length}\n`);

    // 5. Create sample work orders (if they don't exist)
    console.log('5. Creating sample work orders...');
    
    const workOrders = [
      {
        title: 'Quarterly Preventive Maintenance - Chiller 1',
        description: 'Perform quarterly maintenance on Chiller 1 including refrigerant check, oil analysis, and vibration testing',
        priority: 'high'
      },
      {
        title: 'Monthly Filter Replacement - All AHUs',
        description: 'Replace MERV 13 filters in all 10 AHUs as per maintenance schedule',
        priority: 'medium'
      },
      {
        title: 'Cooling Tower Water Treatment',
        description: 'Chemical treatment and cleaning of cooling tower basins',
        priority: 'medium'
      },
      {
        title: 'Pump Bearing Inspection - Primary Pumps',
        description: 'Inspect and lubricate bearings on all primary pumps',
        priority: 'low'
      },
      {
        title: 'Emergency - FCU 25 Not Cooling',
        description: 'FCU 25 reported not cooling properly. Requires immediate attention.',
        priority: 'critical'
      }
    ];

    let woCreated = 0;
    for (let i = 0; i < workOrders.length; i++) {
      const wo = workOrders[i];
      const woNumber = `WO-AWR-2025-${(i + 1).toString().padStart(3, '0')}`;
      
      try {
        await client.query(`
          INSERT INTO work_orders (
            work_order_number, title, description, priority, status, source, site_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          woNumber,
          wo.title,
          wo.description,
          wo.priority,
          'pending',
          'manual',
          siteId
        ]);
        woCreated++;
      } catch (err) {
        if (err.code !== '23505') throw err; // Ignore duplicate key errors
      }
    }
    console.log(`✓ Created ${woCreated} sample work orders (${workOrders.length - woCreated} already existed)\n`);

    // 6. Inventory items would be created via the inventory API
    console.log('6. Skipping inventory items (use inventory interface to add spare parts)\n');

    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✓ AWR Project seeding completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nSummary:');
    console.log(`  • Client: AWR`);
    console.log(`  • Site: DXB Towers`);
    console.log(`  • Project: HVAC System Maintenance (Contract: AWR-2025-001)`);
    console.log(`  • Assets: ${assets.length} units across 15 locations`);
    console.log(`    - 3 Chillers (Basement - Plant Room)`);
    console.log(`    - 4 Primary Pumps (Basement - Pump Room)`);
    console.log(`    - 4 Condenser Pumps (Basement - Pump Room)`);
    console.log(`    - 3 Cooling Towers (Rooftop)`);
    console.log(`    - 4 Secondary Pumps (Basement - Pump Room)`);
    console.log(`    - 10 AHUs (Various Technical Floors)`);
    console.log(`    - 50 FCUs (Distributed across 5 levels)`);
    console.log(`  • Work Orders: 5 sample work orders`);
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Location details are stored in asset records and displayed in work orders!');
    console.log('Use the inventory interface to add spare parts for equipment.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding AWR project:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedAWRProject()
  .then(() => {
    console.log('\nSeeding script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSeeding script failed:', error);
    process.exit(1);
  });
