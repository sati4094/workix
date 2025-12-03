require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./connection');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const opsPassword = await bcrypt.hash('Ops@123', 10);

    // Seed base tags
    const tagLabels = [
      { label: 'HVAC', color: '#6366F1' },
      { label: 'Critical', color: '#EF4444' },
      { label: 'Premium Client', color: '#F59E0B' },
      { label: 'Government', color: '#10B981' },
    ];

    for (const tag of tagLabels) {
      await query(
        `INSERT INTO tags (label, color, created_by)
         VALUES ($1, $2, NULL)
         ON CONFLICT (LOWER(label)) DO NOTHING`,
        [tag.label, tag.color]
      );
    }

    const { rows: tagRows } = await query('SELECT id, label FROM tags');
    const tagMap = Object.fromEntries(tagRows.map((row) => [row.label, row.id]));

    // Superadmin user
    await query(
      `INSERT INTO users (email, password_hash, name, role, status, phone)
       VALUES ($1, $2, $3, 'superadmin', 'active', $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@workix.com', adminPassword, 'System SuperAdmin', '+971-555-0100']
    );
    console.log('✅ Superadmin seeded');

    // Enterprise seed
    const enterpriseResult = await query(
      `INSERT INTO enterprises (name, enterprise_code, industry, country, description, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (enterprise_code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Aurora District Cooling', 'ADC-001', 'District Cooling', 'UAE', 'Flagship district cooling client', true]
    );
    const enterpriseId = enterpriseResult.rows[0].id;

    await query(
      `INSERT INTO enterprise_tags (enterprise_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [enterpriseId, tagMap['Premium Client']]
    );

    // Project + Site
    const projectResult = await query(
      `INSERT INTO projects (enterprise_id, name, project_code, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (project_code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [enterpriseId, 'Downtown Cooling Optimization', 'PRJ-ADC-2025']
    );
    const projectId = projectResult.rows[0].id;

    const siteResult = await query(
      `INSERT INTO sites (project_id, enterprise_id, name, site_code, address, city, country, latitude, longitude, contact_person, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (site_code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        projectId,
        enterpriseId,
        'District Cooling Plant A',
        'ADC-SITE-01',
        'Sheikh Mohammed Bin Rashid Blvd',
        'Dubai',
        'UAE',
        25.1972,
        55.2744,
        'Plant Manager',
        '+971-555-1001',
      ]
    );
    const siteId = siteResult.rows[0].id;

    await query(
      `INSERT INTO site_tags (site_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [siteId, tagMap.HVAC]
    );

    // Seed users tied to enterprise
    const engineerResult = await query(
      `INSERT INTO users (email, password_hash, name, role, status, enterprise_id, phone)
       VALUES ($1, $2, $3, 'engineer', 'active', $4, $5)
       ON CONFLICT (email) DO UPDATE SET enterprise_id = EXCLUDED.enterprise_id
       RETURNING id`,
      ['engineer@aurora.com', opsPassword, 'Lead Engineer', enterpriseId, '+971-555-2002']
    );
    const engineerId = engineerResult.rows[0].id;

    const techResult = await query(
      `INSERT INTO users (email, password_hash, name, role, status, enterprise_id, site_id, phone, team)
       VALUES ($1, $2, $3, 'technician', 'active', $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET site_id = EXCLUDED.site_id
       RETURNING id`,
      ['tech@aurora.com', opsPassword, 'Onsite Technician', enterpriseId, siteId, '+971-555-3003', 'Cooling Ops']
    );
    const technicianId = techResult.rows[0].id;

    await query(
      `INSERT INTO user_tags (user_id, tag_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, tag_id) DO NOTHING`,
      [technicianId, tagMap.Critical]
    );

    // Seed asset and work order
    const assetResult = await query(
      `INSERT INTO assets (site_id, asset_tag, name, type, manufacturer, model, commissioning_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'operational')
       ON CONFLICT (asset_tag) DO UPDATE SET site_id = EXCLUDED.site_id
       RETURNING id`,
      [
        siteId,
        'CHLR-ADC-001',
        'Primary Chiller Train 1',
        'chiller',
        'Johnson Controls',
        'YMC2-1030',
        '2023-09-01',
      ]
    );
    const assetId = assetResult.rows[0].id;

    const workOrderResult = await query(
      `INSERT INTO work_orders (
        work_order_number,
        title,
        description,
        source,
        priority,
        status,
        site_id,
        enterprise_id,
        reported_by,
        assigned_to,
        due_date
      ) VALUES ($1, $2, $3, 'performance_deviation', 'high', 'pending', $4, $5, $6, $7, NOW() + INTERVAL '3 days')
      ON CONFLICT (work_order_number) DO NOTHING
      RETURNING id`,
      [
        'WO-ADC-0001',
        'Chiller COP below threshold',
        'Automated analytics detected drop in COP for primary chiller. Requires diagnostics and potential tube cleaning.',
        siteId,
        enterpriseId,
        engineerId,
        technicianId,
      ]
    );

    if (workOrderResult.rows.length > 0) {
      await query(
        `INSERT INTO work_order_assets (work_order_id, asset_id)
         VALUES ($1, $2)
         ON CONFLICT (work_order_id, asset_id) DO NOTHING`,
        [workOrderResult.rows[0].id, assetId]
      );
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('   SuperAdmin: admin@workix.com / Admin@123');
    console.log('   Engineer: engineer@aurora.com / Ops@123');
    console.log('   Technician: tech@aurora.com / Ops@123');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();

