/**
 * WORKIX DATA MIGRATION - Enterprise Architecture
 * Populates enterprise_id and creates default buildings
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function migrateData() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Starting data migration...\n');
    
    await client.query('BEGIN');
    
    // ============================================
    // STEP 1: Populate sites.enterprise_id from work orders
    // ============================================
    console.log('📍 Populating sites.enterprise_id...');
    
    const siteUpdateResult = await client.query(`
      UPDATE sites s
      SET enterprise_id = subquery.enterprise_id
      FROM (
        SELECT DISTINCT 
          wo.site_id,
          wo.enterprise_id
        FROM work_orders wo
        WHERE wo.site_id IS NOT NULL 
          AND wo.enterprise_id IS NOT NULL
        GROUP BY wo.site_id, wo.enterprise_id
      ) AS subquery
      WHERE s.id = subquery.site_id
        AND s.enterprise_id IS NULL
    `);
    
    console.log(`  ✓ Updated ${siteUpdateResult.rowCount} sites with enterprise_id`);
    
    // ============================================
    // STEP 2: Create default buildings for each site
    // ============================================
    console.log('\n🏢 Creating default buildings for sites...');
    
    const sitesWithoutBuildings = await client.query(`
      SELECT 
        s.id as site_id,
        s.name as site_name,
        s.facility_code,
        COUNT(a.id) as asset_count
      FROM sites s
      LEFT JOIN buildings b ON s.id = b.site_id
      LEFT JOIN assets a ON a.site_id = s.id
      WHERE b.id IS NULL
      GROUP BY s.id, s.name, s.facility_code
    `);
    
    for (const site of sitesWithoutBuildings.rows) {
      const buildingName = site.asset_count > 0 ? 'Main Building' : 'Building A';
      const buildingCode = site.facility_code ? `${site.facility_code}-B1` : 'B1';
      
      await client.query(`
        INSERT INTO buildings (site_id, name, building_code, description, status)
        VALUES ($1, $2, $3, $4, 'active')
      `, [
        site.site_id,
        buildingName,
        buildingCode,
        `Default building for ${site.site_name}`
      ]);
    }
    
    console.log(`  ✓ Created ${sitesWithoutBuildings.rows.length} default buildings`);
    
    // ============================================
    // STEP 3: Link assets to buildings
    // ============================================
    console.log('\n🔗 Linking assets to buildings...');
    
    const assetLinkResult = await client.query(`
      UPDATE assets a
      SET building_id = subquery.building_id
      FROM (
        SELECT 
          a.id as asset_id,
          b.id as building_id
        FROM assets a
        JOIN buildings b ON a.site_id = b.site_id
        WHERE a.building_id IS NULL
          AND b.name IN ('Main Building', 'Building A')
      ) AS subquery
      WHERE a.id = subquery.asset_id
    `);
    
    console.log(`  ✓ Linked ${assetLinkResult.rowCount} assets to buildings`);
    
    // ============================================
    // STEP 4: Link work orders to buildings
    // ============================================
    console.log('\n📋 Linking work orders to buildings...');
    
    const woLinkResult = await client.query(`
      UPDATE work_orders wo
      SET building_id = a.building_id
      FROM assets a
      WHERE wo.asset_id = a.id
        AND a.building_id IS NOT NULL
        AND wo.building_id IS NULL
    `);
    
    console.log(`  ✓ Linked ${woLinkResult.rowCount} work orders to buildings via assets`);
    
    // ============================================
    // STEP 5: Generate statistics
    // ============================================
    console.log('\n📊 Migration Statistics:\n');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM enterprises) as total_enterprises,
        (SELECT COUNT(*) FROM sites WHERE enterprise_id IS NOT NULL) as sites_with_enterprise,
        (SELECT COUNT(*) FROM sites WHERE enterprise_id IS NULL) as sites_without_enterprise,
        (SELECT COUNT(*) FROM buildings) as total_buildings,
        (SELECT COUNT(*) FROM assets WHERE building_id IS NOT NULL) as assets_with_building,
        (SELECT COUNT(*) FROM assets WHERE building_id IS NULL) as assets_without_building,
        (SELECT COUNT(*) FROM work_orders WHERE building_id IS NOT NULL) as work_orders_with_building,
        (SELECT COUNT(*) FROM work_orders WHERE building_id IS NULL) as work_orders_without_building
    `);
    
    const s = stats.rows[0];
    console.log(`  Enterprises:           ${s.total_enterprises}`);
    console.log(`  Sites with enterprise: ${s.sites_with_enterprise} / ${parseInt(s.sites_with_enterprise) + parseInt(s.sites_without_enterprise)}`);
    console.log(`  Total Buildings:       ${s.total_buildings}`);
    console.log(`  Assets with building:  ${s.assets_with_building} / ${parseInt(s.assets_with_building) + parseInt(s.assets_without_building)}`);
    console.log(`  Work Orders linked:    ${s.work_orders_with_building} / ${parseInt(s.work_orders_with_building) + parseInt(s.work_orders_without_building)}`);
    
    // ============================================
    // STEP 6: Identify issues
    // ============================================
    const issues = [];
    
    if (parseInt(s.sites_without_enterprise) > 0) {
      issues.push(`⚠️  ${s.sites_without_enterprise} sites without enterprise_id (manual assignment needed)`);
    }
    
    if (parseInt(s.assets_without_building) > 0) {
      issues.push(`⚠️  ${s.assets_without_building} assets without building_id (will be assigned when buildings are created)`);
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues to Review:\n');
      issues.forEach(issue => console.log(`  ${issue}`));
    } else {
      console.log('\n✅ All data migrated successfully!');
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Migration completed!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
