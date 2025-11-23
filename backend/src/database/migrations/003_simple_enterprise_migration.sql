-- ============================================
-- WORKIX SCHEMA RESTRUCTURE - Simple Migration
-- Migration: 003_simple_enterprise_migration.sql
-- Description: Rename clients → enterprises, add buildings table
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Rename clients to enterprises
-- ============================================

ALTER TABLE IF EXISTS clients RENAME TO enterprises;

-- Rename indexes
ALTER INDEX IF EXISTS idx_clients_org RENAME TO idx_enterprises_org;

-- Add new columns if they don't exist
ALTER TABLE enterprises 
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS billing_address TEXT,
    ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- ============================================
-- STEP 2: Create buildings table
-- ============================================

CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    building_code VARCHAR(50),
    description TEXT,
    floors INTEGER DEFAULT 1,
    total_area_sqft DECIMAL(12, 2),
    construction_year INTEGER,
    building_type VARCHAR(100),
    location_notes TEXT,
    map_coordinates JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT unique_building_code_per_site UNIQUE (site_id, building_code)
);

CREATE INDEX IF NOT EXISTS idx_buildings_site_id ON buildings(site_id);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status);
CREATE INDEX IF NOT EXISTS idx_buildings_building_code ON buildings(building_code) WHERE building_code IS NOT NULL;

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
    ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_building_id ON assets(building_id);

-- ============================================
-- STEP 5: Update work_orders table
-- ============================================

-- First, check if the column exists before renaming
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'work_orders' AND column_name = 'client_id') THEN
        ALTER TABLE work_orders RENAME COLUMN client_id TO enterprise_id;
    ELSE
        ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id);
    END IF;
END $$;

ALTER TABLE work_orders 
    ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;

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
    wo.work_order_number,
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
SELECT 'sites with enterprise_id', COUNT(*) FROM sites WHERE enterprise_id IS NOT NULL;
