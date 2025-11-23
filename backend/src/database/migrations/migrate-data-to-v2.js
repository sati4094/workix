/**
 * Data Migration Script: v1 → v2 Enterprise Architecture
 * 
 * This script migrates existing data to the new schema:
 * 1. clients → enterprises (already renamed by 002_restructure_to_enterprise.sql)
 * 2. Create default buildings for each site
 * 3. Link assets to their buildings
 * 4. Update work_orders with enterprise_id and building_id
 * 5. Populate site.enterprise_id (denormalized)
 * 6. Link existing projects to enterprises
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function migrateData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting data migration to v2 architecture...\n');
    
    // ============================================
    // STEP 1: Verify schema migration completed
    // ============================================
    console.log('📋 Step 1: Verifying schema migration...');
    
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('enterprises', 'buildings')
    `);
    
    if (tables.length !== 2) {
      throw new Error('Schema migration not complete. Run 002_restructure_to_enterprise.sql first.');
    }
    console.log('✓ Schema migration verified\n');
    
    // ============================================
    // STEP 2: Populate site.enterprise_id
    // ============================================
    console.log('📋 Step 2: Populating site.enterprise_id...');
    
    // For now, we'll need to infer enterprise from work orders or set manually
    // Option A: Use most common enterprise from work orders at this site
    const updateSiteEnterpriseQuery = `
      UPDATE sites s
      SET enterprise_id = subq.enterprise_id
      FROM (
        SELECT 
          wo.site_id,
          wo.enterprise_id,
          COUNT(*) as wo_count,
          ROW_NUMBER() OVER (PARTITION BY wo.site_id ORDER BY COUNT(*) DESC) as rn
        FROM work_orders wo
        WHERE wo.enterprise_id IS NOT NULL 
        AND wo.site_id IS NOT NULL
        GROUP BY wo.site_id, wo.enterprise_id
      ) subq
      WHERE s.id = subq.site_id 
      AND subq.rn = 1
      AND s.enterprise_id IS NULL
    `;
    
    const { rowCount: sitesUpdated } = await client.query(updateSiteEnterpriseQuery);
    console.log(`✓ Updated ${sitesUpdated} sites with enterprise_id\n`);
    
    // ============================================
    // STEP 3: Create default buildings for sites
    // ============================================
    console.log('📋 Step 3: Creating default buildings...');
    
    const createBuildingsQuery = `
      INSERT INTO buildings (
        id,
        site_id,
        name,
        building_code,
        description,
        status,
        created_at,
        updated_at
      )
      SELECT 
        uuid_generate_v4(),
        s.id,
        COALESCE(s.name || ' - Main Building', 'Main Building'),
        'MAIN',
        'Default building created during migration',
        'active',
        NOW(),
        NOW()
      FROM sites s
      WHERE NOT EXISTS (
        SELECT 1 FROM buildings b WHERE b.site_id = s.id
      )
      RETURNING id
    `;
    
    const { rowCount: buildingsCreated } = await client.query(createBuildingsQuery);
    console.log(`✓ Created ${buildingsCreated} default buildings\n`);
    
    // ============================================
    // STEP 4: Link assets to buildings
    // ============================================
    console.log('📋 Step 4: Linking assets to buildings...');
    
    // Link each asset to the first building of its site
    const linkAssetsQuery = `
      UPDATE assets a
      SET building_id = b.id
      FROM (
        SELECT DISTINCT ON (site_id) 
          id, 
          site_id
        FROM buildings
        WHERE deleted_at IS NULL
        ORDER BY site_id, created_at
      ) b
      WHERE a.site_id = b.site_id
      AND a.building_id IS NULL
      AND a.deleted_at IS NULL
    `;
    
    const { rowCount: assetsLinked } = await client.query(linkAssetsQuery);
    console.log(`✓ Linked ${assetsLinked} assets to buildings\n`);
    
    // ============================================
    // STEP 5: Update work_orders with building_id
    // ============================================
    console.log('📋 Step 5: Updating work orders with building_id...');
    
    // Link work orders to buildings via their assets
    const updateWorkOrderBuildingsQuery = `
      UPDATE work_orders wo
      SET building_id = a.building_id
      FROM assets a
      WHERE wo.asset_id = a.id
      AND a.building_id IS NOT NULL
      AND wo.building_id IS NULL
      AND wo.deleted_at IS NULL
    `;
    
    const { rowCount: workOrdersUpdated } = await client.query(updateWorkOrderBuildingsQuery);
    console.log(`✓ Updated ${workOrdersUpdated} work orders with building_id\n`);
    
    // ============================================
    // STEP 6: Link projects to enterprises
    // ============================================
    console.log('📋 Step 6: Linking projects to enterprises...');
    
    // Create project_enterprises entries for existing projects
    const linkProjectsQuery = `
      INSERT INTO project_enterprises (project_id, enterprise_id)
      SELECT DISTINCT 
        p.id,
        p.enterprise_id
      FROM projects p
      WHERE p.enterprise_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM project_enterprises pe 
        WHERE pe.project_id = p.id 
        AND pe.enterprise_id = p.enterprise_id
      )
      ON CONFLICT (project_id, enterprise_id) DO NOTHING
    `;
    
    const { rowCount: projectLinksCreated } = await client.query(linkProjectsQuery);
    console.log(`✓ Created ${projectLinksCreated} project-enterprise links\n`);
    
    // ============================================
    // STEP 7: Generate summary statistics
    // ============================================
    console.log('📋 Step 7: Generating migration summary...\n');
    
    const summaryQuery = `
      SELECT 
        (SELECT COUNT(*) FROM enterprises WHERE deleted_at IS NULL) as total_enterprises,
        (SELECT COUNT(*) FROM sites WHERE deleted_at IS NULL) as total_sites,
        (SELECT COUNT(*) FROM buildings WHERE deleted_at IS NULL) as total_buildings,
        (SELECT COUNT(*) FROM assets WHERE deleted_at IS NULL) as total_assets,
        (SELECT COUNT(*) FROM work_orders WHERE deleted_at IS NULL) as total_work_orders,
        (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) as total_projects,
        (SELECT COUNT(*) FROM assets WHERE building_id IS NOT NULL AND deleted_at IS NULL) as assets_with_building,
        (SELECT COUNT(*) FROM work_orders WHERE building_id IS NOT NULL AND deleted_at IS NULL) as work_orders_with_building,
        (SELECT COUNT(*) FROM sites WHERE enterprise_id IS NOT NULL AND deleted_at IS NULL) as sites_with_enterprise
    `;
    
    const { rows: [summary] } = await client.query(summaryQuery);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('           MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📊 Enterprises:              ${summary.total_enterprises}`);
    console.log(`🏢 Sites:                    ${summary.total_sites}`);
    console.log(`   └─ With enterprise link:  ${summary.sites_with_enterprise}`);
    console.log(`🏗️  Buildings:                ${summary.total_buildings}`);
    console.log(`⚙️  Assets:                   ${summary.total_assets}`);
    console.log(`   └─ Linked to buildings:   ${summary.assets_with_building}`);
    console.log(`📋 Work Orders:              ${summary.total_work_orders}`);
    console.log(`   └─ With building link:    ${summary.work_orders_with_building}`);
    console.log(`📁 Projects:                 ${summary.total_projects}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!\n');
    
    // ============================================
    // STEP 8: Data validation checks
    // ============================================
    console.log('🔍 Running validation checks...\n');
    
    const validationQueries = [
      {
        name: 'Orphaned assets (no building)',
        query: `SELECT COUNT(*) as count FROM assets WHERE building_id IS NULL AND deleted_at IS NULL`
      },
      {
        name: 'Sites without enterprise',
        query: `SELECT COUNT(*) as count FROM sites WHERE enterprise_id IS NULL AND deleted_at IS NULL`
      },
      {
        name: 'Buildings without site',
        query: `SELECT COUNT(*) as count FROM buildings WHERE site_id IS NULL AND deleted_at IS NULL`
      },
      {
        name: 'Work orders without enterprise',
        query: `SELECT COUNT(*) as count FROM work_orders WHERE enterprise_id IS NULL AND deleted_at IS NULL`
      }
    ];
    
    for (const validation of validationQueries) {
      const { rows: [result] } = await client.query(validation.query);
      const status = parseInt(result.count) === 0 ? '✓' : '⚠️';
      console.log(`${status} ${validation.name}: ${result.count}`);
    }
    
    console.log('\n🎉 All done! The database is now using the v2 Enterprise Architecture.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✨ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
