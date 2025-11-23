-- ============================================
-- WORKIX SCHEMA RESTRUCTURE - Corrected Migration
-- Migration: 004_enterprise_migration_corrected.sql
-- Description: Rename clients → enterprises, update buildings table, add new columns
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Rename clients to enterprises
-- ============================================

ALTER TABLE IF EXISTS clients RENAME TO enterprises;

-- Rename indexes (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_org') THEN
        ALTER INDEX idx_clients_org RENAME TO idx_enterprises_org;
    END IF;
END $$;

-- Add new columns if they don't exist
ALTER TABLE enterprises 
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS billing_address TEXT,
    ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);

-- Rename is_active to status if needed (keep both for compatibility)
ALTER TABLE enterprises 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Update status based on is_active
UPDATE enterprises SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;

-- ============================================
-- STEP 2: Update buildings table
-- ============================================

-- Buildings table already exists, just add missing columns and rename some
ALTER TABLE buildings 
    ADD COLUMN IF NOT EXISTS building_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS floors INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS total_area_sqft DECIMAL(12, 2),
    ADD COLUMN IF NOT EXISTS construction_year INTEGER,
    ADD COLUMN IF NOT EXISTS building_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS location_notes TEXT,
    ADD COLUMN IF NOT EXISTS map_coordinates JSONB,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Rename existing columns to match new schema (check if old name exists AND new name doesn't)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'floor_count')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'buildings' AND column_name = 'floors') THEN
        ALTER TABLE buildings RENAME COLUMN floor_count TO floors;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'gross_area')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'buildings' AND column_name = 'total_area_sqft') THEN
        ALTER TABLE buildings RENAME COLUMN gross_area TO total_area_sqft;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'year_built')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'buildings' AND column_name = 'construction_year') THEN
        ALTER TABLE buildings RENAME COLUMN year_built TO construction_year;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'buildings' AND column_name = 'occupancy_type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'buildings' AND column_name = 'building_type') THEN
        ALTER TABLE buildings RENAME COLUMN occupancy_type TO building_type;
    END IF;
END $$;

-- Add status if not exists and populate from is_active
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
UPDATE buildings SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;

-- Change id from bigint to UUID if needed (optional, can keep as is)
-- Note: This is complex and may not be necessary

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON buildings(site_id);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buildings_building_code ON buildings(building_code) WHERE building_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_building_code_per_site ON buildings(site_id, building_code) WHERE building_code IS NOT NULL;

-- ============================================
-- STEP 3: Update sites table
-- ============================================

ALTER TABLE sites 
    ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sites_enterprise_id ON sites(enterprise_id);

-- ============================================
-- STEP 4: Update assets table
-- ============================================

ALTER TABLE assets 
    ADD COLUMN IF NOT EXISTS building_id BIGINT REFERENCES buildings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_building_id ON assets(building_id);

-- ============================================
-- STEP 5: Update work_orders table
-- ============================================

-- Rename client_id to enterprise_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'work_orders' AND column_name = 'client_id') THEN
        ALTER TABLE work_orders RENAME COLUMN client_id TO enterprise_id;
    END IF;
END $$;

-- Add enterprise_id if it doesn't exist (in case rename didn't work)
ALTER TABLE work_orders 
    ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id);

-- Add building_id
ALTER TABLE work_orders 
    ADD COLUMN IF NOT EXISTS building_id BIGINT REFERENCES buildings(id) ON DELETE SET NULL;

-- Update indexes
DROP INDEX IF EXISTS idx_work_orders_client_id;
CREATE INDEX IF NOT EXISTS idx_work_orders_enterprise_id ON work_orders(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_building_id ON work_orders(building_id);

-- ============================================
-- STEP 6: Create helpful views
-- ============================================

CREATE OR REPLACE VIEW view_work_order_summary AS
SELECT 
    wo.id,
    wo.wo_number as work_order_number,
    wo.title,
    wo.status,
    wo.priority,
    s.name as site_name,
    s.facility_code as site_code,
    b.name as building_name,
    b.building_code,
    e.name as enterprise_name,
    a.name as asset_name,
    a.asset_tag
FROM work_orders wo
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN buildings b ON wo.building_id = b.id
LEFT JOIN enterprises e ON wo.enterprise_id = e.id
LEFT JOIN assets a ON wo.asset_id = a.id;

CREATE OR REPLACE VIEW view_asset_hierarchy AS
SELECT 
    a.id as asset_id,
    a.name as asset_name,
    a.asset_tag,
    a.category,
    b.id as building_id,
    b.name as building_name,
    b.building_code,
    s.id as site_id,
    s.name as site_name,
    s.facility_code,
    e.id as enterprise_id,
    e.name as enterprise_name
FROM assets a
LEFT JOIN buildings b ON a.building_id = b.id
LEFT JOIN sites s ON a.site_id = s.id
LEFT JOIN enterprises e ON s.enterprise_id = e.id;

COMMIT;

-- ============================================
-- Verification
-- ============================================

SELECT 
    'enterprises' as table_name, 
    COUNT(*) as count 
FROM enterprises
UNION ALL
SELECT 'buildings', COUNT(*) FROM buildings
UNION ALL
SELECT 'sites with enterprise_id', COUNT(*) FROM sites WHERE enterprise_id IS NOT NULL
UNION ALL
SELECT 'assets with building_id', COUNT(*) FROM assets WHERE building_id IS NOT NULL
UNION ALL
SELECT 'work_orders with building_id', COUNT(*) FROM work_orders WHERE building_id IS NOT NULL;
