-- ============================================
-- WORKIX SCHEMA RESTRUCTURE - Enterprise Architecture
-- Migration: 002_restructure_to_enterprise.sql
-- Description: Clean hierarchy with Enterprise → Site → Building → Asset → Work Order
-- Changes:
--   - Rename 'clients' → 'enterprises'
--   - Add 'buildings' layer between sites and assets
--   - Make projects optional with flexible scoping
--   - Update all foreign key relationships
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: RENAME clients TO enterprises
-- ============================================

ALTER TABLE IF EXISTS clients RENAME TO enterprises;

-- Update indexes
ALTER INDEX IF EXISTS idx_clients_org RENAME TO idx_enterprises_org;
ALTER INDEX IF EXISTS idx_clients_organization_id RENAME TO idx_enterprises_organization_id;
ALTER INDEX IF EXISTS idx_clients_email RENAME TO idx_enterprises_email;
ALTER INDEX IF EXISTS idx_clients_status RENAME TO idx_enterprises_status;

-- Add missing columns to enterprises (if not exist)
ALTER TABLE enterprises 
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS billing_address TEXT,
    ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_enterprises_status ON enterprises(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enterprises_email ON enterprises(email) WHERE deleted_at IS NULL;

COMMENT ON TABLE enterprises IS 'Top-level business entities (formerly clients) - e.g., Emirates Group, ADNOC';

-- ============================================
-- STEP 2: CREATE buildings TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    building_code VARCHAR(50),
    description TEXT,
    
    -- Physical Details
    floors INTEGER DEFAULT 1,
    total_area_sqft DECIMAL(12, 2),
    construction_year INTEGER,
    building_type VARCHAR(100), -- 'office', 'warehouse', 'residential', 'parking', 'mixed-use'
    
    -- Location within Site
    location_notes TEXT,
    map_coordinates JSONB, -- {x, y} for site map positioning
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'under-construction', 'maintenance', 'closed'
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_building_code_per_site UNIQUE (site_id, building_code)
);

-- Indexes for buildings
CREATE INDEX idx_buildings_site_id ON buildings(site_id);
CREATE INDEX idx_buildings_status ON buildings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_buildings_building_code ON buildings(building_code) WHERE building_code IS NOT NULL;

COMMENT ON TABLE buildings IS 'Individual structures within a site - e.g., Tower A, Parking Structure, Main Terminal';

-- ============================================
-- STEP 3: UPDATE assets TABLE
-- ============================================

-- Add building_id to assets (nullable for backward compatibility)
ALTER TABLE assets 
    ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_assets_building_id ON assets(building_id);

-- Update comment
COMMENT ON TABLE assets IS 'Equipment and systems within buildings - e.g., HVAC units, elevators, generators';

-- ============================================
-- STEP 4: UPDATE work_orders TABLE
-- ============================================

-- Rename client_id to enterprise_id
ALTER TABLE work_orders 
    RENAME COLUMN client_id TO enterprise_id;

-- Add building_id (can be null if work order is site-level)
ALTER TABLE work_orders 
    ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;

-- Update indexes
DROP INDEX IF EXISTS idx_work_orders_client_id;
CREATE INDEX idx_work_orders_enterprise_id ON work_orders(enterprise_id);
CREATE INDEX idx_work_orders_building_id ON work_orders(building_id);

-- Update comment
COMMENT ON TABLE work_orders IS 'Maintenance and service requests - linked to asset, building, site, and enterprise';

-- ============================================
-- STEP 5: UPDATE sites TABLE
-- ============================================

-- Add enterprise_id for direct relationship (denormalized for performance)
ALTER TABLE sites 
    ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_sites_enterprise_id ON sites(enterprise_id);

-- ============================================
-- STEP 6: ENHANCE projects TABLE (Make it flexible)
-- ============================================

-- Add scope type to projects
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS scope_type VARCHAR(50) DEFAULT 'enterprise', -- 'enterprise', 'site', 'building', 'category'
    ADD COLUMN IF NOT EXISTS scope_category VARCHAR(100); -- If scope_type='category', e.g., 'hvac', 'electrical'

-- Create junction tables for flexible project scoping
CREATE TABLE IF NOT EXISTS project_enterprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_project_enterprise UNIQUE (project_id, enterprise_id)
);

CREATE TABLE IF NOT EXISTS project_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_project_site UNIQUE (project_id, site_id)
);

CREATE TABLE IF NOT EXISTS project_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_project_building UNIQUE (project_id, building_id)
);

-- Indexes for project junctions
CREATE INDEX idx_project_enterprises_project_id ON project_enterprises(project_id);
CREATE INDEX idx_project_enterprises_enterprise_id ON project_enterprises(enterprise_id);
CREATE INDEX idx_project_sites_project_id ON project_sites(project_id);
CREATE INDEX idx_project_sites_site_id ON project_sites(site_id);
CREATE INDEX idx_project_buildings_project_id ON project_buildings(project_id);
CREATE INDEX idx_project_buildings_building_id ON project_buildings(building_id);

-- Update projects table
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_enterprise_id ON projects(enterprise_id);

COMMENT ON TABLE projects IS 'Service contracts/engagements - can be scoped at enterprise, site, building, or category level';

-- ============================================
-- STEP 7: UPDATE portfolios TABLE
-- ============================================

-- Portfolios remain as logical groupings (optional)
-- Update foreign key name for clarity
ALTER TABLE sites 
    DROP CONSTRAINT IF EXISTS sites_portfolio_id_fkey;

ALTER TABLE sites 
    ADD CONSTRAINT sites_portfolio_id_fkey 
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE SET NULL;

COMMENT ON TABLE portfolios IS 'Optional logical groupings of sites - e.g., "Retail Properties", "Airport Portfolio"';

-- ============================================
-- STEP 8: CREATE VIEWS for easier querying
-- ============================================

-- View: Complete Asset Hierarchy
CREATE OR REPLACE VIEW view_asset_hierarchy AS
SELECT 
    a.id as asset_id,
    a.name as asset_name,
    a.asset_tag,
    a.category as asset_category,
    
    b.id as building_id,
    b.name as building_name,
    b.building_code,
    
    s.id as site_id,
    s.name as site_name,
    s.facility_code as site_code,
    
    e.id as enterprise_id,
    e.name as enterprise_name,
    e.email as enterprise_email,
    
    p.id as portfolio_id,
    p.name as portfolio_name,
    
    o.id as organization_id,
    o.name as organization_name
FROM assets a
LEFT JOIN buildings b ON a.building_id = b.id
LEFT JOIN sites s ON a.site_id = s.id
LEFT JOIN enterprises e ON s.enterprise_id = e.id
LEFT JOIN portfolios p ON s.portfolio_id = p.id
LEFT JOIN organizations o ON a.organization_id = o.id
WHERE a.deleted_at IS NULL;

-- View: Complete Work Order Hierarchy
CREATE OR REPLACE VIEW view_work_order_hierarchy AS
SELECT 
    wo.id as work_order_id,
    wo.work_order_number,
    wo.title,
    wo.status,
    wo.priority,
    wo.work_type,
    
    a.id as asset_id,
    a.name as asset_name,
    a.asset_tag,
    a.category as asset_category,
    
    b.id as building_id,
    b.name as building_name,
    b.building_code,
    
    s.id as site_id,
    s.name as site_name,
    s.facility_code as site_code,
    
    e.id as enterprise_id,
    e.name as enterprise_name,
    
    pr.id as project_id,
    pr.name as project_name,
    pr.contract_number,
    
    o.id as organization_id,
    o.name as organization_name
FROM work_orders wo
LEFT JOIN assets a ON wo.asset_id = a.id
LEFT JOIN buildings b ON COALESCE(wo.building_id, a.building_id) = b.id
LEFT JOIN sites s ON wo.site_id = s.id
LEFT JOIN enterprises e ON wo.enterprise_id = e.id
LEFT JOIN projects pr ON wo.project_id = pr.id
LEFT JOIN organizations o ON wo.organization_id = o.id
WHERE wo.deleted_at IS NULL;

-- View: Building Summary Statistics
CREATE OR REPLACE VIEW view_building_stats AS
SELECT 
    b.id as building_id,
    b.name as building_name,
    b.building_code,
    b.site_id,
    s.name as site_name,
    e.name as enterprise_name,
    
    COUNT(DISTINCT a.id) as total_assets,
    COUNT(DISTINCT CASE WHEN wo.status = 'open' THEN wo.id END) as open_work_orders,
    COUNT(DISTINCT CASE WHEN wo.status = 'in_progress' THEN wo.id END) as in_progress_work_orders,
    COUNT(DISTINCT CASE WHEN wo.status = 'completed' THEN wo.id END) as completed_work_orders
FROM buildings b
LEFT JOIN sites s ON b.site_id = s.id
LEFT JOIN enterprises e ON s.enterprise_id = e.id
LEFT JOIN assets a ON a.building_id = b.id AND a.deleted_at IS NULL
LEFT JOIN work_orders wo ON wo.building_id = b.id AND wo.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, b.name, b.building_code, b.site_id, s.name, e.name;

-- ============================================
-- STEP 9: UPDATE TRIGGERS
-- ============================================

-- Update timestamp trigger for buildings
CREATE TRIGGER set_buildings_updated_at
    BEFORE UPDATE ON buildings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================

-- Grant permissions on new tables (adjust role names as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON buildings TO workix_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_enterprises TO workix_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_sites TO workix_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_buildings TO workix_api;
GRANT SELECT ON view_asset_hierarchy TO workix_api;
GRANT SELECT ON view_work_order_hierarchy TO workix_api;
GRANT SELECT ON view_building_stats TO workix_api;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Check table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('enterprises', 'buildings');

-- Check columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name IN ('enterprise_id', 'building_id');

-- Count records
-- SELECT 'enterprises' as table_name, COUNT(*) as count FROM enterprises
-- UNION ALL
-- SELECT 'buildings', COUNT(*) FROM buildings
-- UNION ALL
-- SELECT 'sites', COUNT(*) FROM sites;
