require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./connection');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Hash password for demo users
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    // 1. Create admin user
    await query(
      `INSERT INTO users (email, password_hash, name, role, status, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@workix.com', passwordHash, 'System Administrator', 'admin', 'active', '+1-555-0100']
    );
    console.log('✅ Admin user created');

    // 2. Create sample technicians
    const techPasswordHash = await bcrypt.hash('Tech@123', 10);
    
    const tech1 = await query(
      `INSERT INTO users (email, password_hash, name, role, status, phone, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['john.tech@workix.com', techPasswordHash, 'John Technician', 'technician', 'active', '+1-555-0101', 'Field Team A']
    );

    const tech2 = await query(
      `INSERT INTO users (email, password_hash, name, role, status, phone, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['sarah.tech@workix.com', techPasswordHash, 'Sarah Technician', 'technician', 'active', '+1-555-0102', 'Field Team B']
    );
    console.log('✅ Technicians created');

    // 3. Create analyst user
    const analystResult = await query(
      `INSERT INTO users (email, password_hash, name, role, status, phone, team)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['analyst@workix.com', techPasswordHash, 'Energy Analyst', 'analyst', 'active', '+1-555-0103', 'Performance Analysis']
    );
    console.log('✅ Analyst created');

    // 4. Create sample client
    const clientResult = await query(
      `INSERT INTO clients (name, contact_person, contact_email, contact_phone, address, city, state, postal_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      ['Green Energy Corp', 'Michael Johnson', 'michael.j@greenenergy.com', '+1-555-2000', '123 Business Ave', 'New York', 'NY', '10001']
    );

    if (clientResult.rows.length > 0) {
      const clientId = clientResult.rows[0].id;
      console.log('✅ Sample client created');

      // 5. Create sample project
      const projectResult = await query(
        `INSERT INTO projects (name, client_id, contract_number, contract_start_date, contract_end_date, contract_value, description, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        ['Main Campus Energy Optimization', clientId, 'EPC-2024-001', '2024-01-01', '2026-12-31', 500000, 'Comprehensive energy performance contracting for main campus facilities', 'active']
      );

      const projectId = projectResult.rows[0].id;
      console.log('✅ Sample project created');

      // 6. Create sample site
      const siteResult = await query(
        `INSERT INTO sites (project_id, name, address, city, state, postal_code, contact_person, contact_phone, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [projectId, 'Building A - Main Office', '456 Green Street', 'New York', 'NY', '10002', 'Building Manager', '+1-555-3000', 40.7128, -74.0060]
      );

      const siteId = siteResult.rows[0].id;
      console.log('✅ Sample site created');

      // 7. Create sample assets
      const asset1 = await query(
        `INSERT INTO assets (site_id, asset_tag, name, type, manufacturer, model, capacity, capacity_unit, commissioning_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [siteId, 'CH-001', 'Main Chiller Unit 1', 'chiller', 'Carrier', '30XA-502', '500', 'Tons', '2020-06-15', 'operational']
      );

      const asset2 = await query(
        `INSERT INTO assets (site_id, asset_tag, name, type, manufacturer, model, capacity, capacity_unit, commissioning_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [siteId, 'AHU-001', 'Air Handling Unit - Floor 1', 'ahu', 'Trane', 'CGAM-140', '14000', 'CFM', '2020-06-15', 'operational']
      );

      console.log('✅ Sample assets created');

      // 8. Create sample PPM plan
      const ppmPlanResult = await query(
        `INSERT INTO ppm_plans (name, description, asset_type, frequency, tasks_checklist, estimated_duration_minutes, instructions, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          'Monthly Chiller Maintenance',
          'Routine monthly preventive maintenance for chiller units',
          'chiller',
          'monthly',
          JSON.stringify([
            { task: 'Check refrigerant levels', required: true },
            { task: 'Inspect condenser coils', required: true },
            { task: 'Test safety controls', required: true },
            { task: 'Check oil levels', required: true },
            { task: 'Clean filters', required: true },
            { task: 'Record operating temperatures and pressures', required: true }
          ]),
          120,
          'Perform all checks while unit is running. Record all readings in the maintenance log.',
          true
        ]
      );

      console.log('✅ Sample PPM plan created');

      // 9. Create sample work order
      if (tech1.rows.length > 0 && analystResult.rows.length > 0) {
        const workOrderResult = await query(
          `INSERT INTO work_orders (title, description, source, priority, site_id, reported_by, assigned_to, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            'Chiller Performance Deviation - High kW/Ton',
            'Chiller Unit 1 showing 15% higher energy consumption than baseline. Suspected efficiency loss.',
            'performance_deviation',
            'high',
            siteId,
            analystResult.rows[0].id,
            tech1.rows[0].id,
            'pending'
          ]
        );

        const workOrderId = workOrderResult.rows[0].id;

        // Link asset to work order
        await query(
          `INSERT INTO work_order_assets (work_order_id, asset_id) VALUES ($1, $2)`,
          [workOrderId, asset1.rows[0].id]
        );

        console.log('✅ Sample work order created');
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('   Admin: admin@workix.com / Admin@123');
    console.log('   Technician: john.tech@workix.com / Tech@123');
    console.log('   Analyst: analyst@workix.com / Tech@123');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Run seeding
seedDatabase();

