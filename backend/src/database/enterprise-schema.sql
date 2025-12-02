-- ============================================
-- ENTERPRISE ARCHITECTURE MIGRATION
-- Additional tables for workix-desktop frontend
-- ============================================

-- ============================================
-- ORGANIZATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ENTERPRISES (Clients renamed)
-- ============================================

CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    enterprise_code VARCHAR(50) UNIQUE,
    description TEXT,
    industry VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'UAE',
    postal_code VARCHAR(20),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enterprises_org_id ON enterprises(org_id);
CREATE INDEX idx_enterprises_name ON enterprises(name);
CREATE INDEX idx_enterprises_code ON enterprises(enterprise_code);

-- ============================================
-- LOCATION HIERARCHY
-- ============================================

-- Buildings
CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    building_code VARCHAR(50),
    floor_count INTEGER,
    gross_area DECIMAL(10,2),
    occupancy_type VARCHAR(100),
    year_built INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buildings_site_id ON buildings(site_id);
CREATE INDEX idx_buildings_name ON buildings(name);

-- Floors
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    floor_number INTEGER NOT NULL,
    area DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, floor_number)
);

CREATE INDEX idx_floors_building_id ON floors(building_id);

-- Spaces
CREATE TABLE IF NOT EXISTS spaces (
    id SERIAL PRIMARY KEY,
    floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    space_type VARCHAR(100),
    area DECIMAL(10,2),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spaces_floor_id ON spaces(floor_id);
CREATE INDEX idx_spaces_type ON spaces(space_type);

-- ============================================
-- ASSET MANAGEMENT ENHANCEMENT
-- ============================================

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES asset_categories(id) ON DELETE SET NULL,
    is_system_category BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_categories_org_id ON asset_categories(org_id);
CREATE INDEX idx_asset_categories_parent ON asset_categories(parent_category_id);

-- Asset Types
CREATE TABLE IF NOT EXISTS asset_types (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES asset_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_types_category ON asset_types(category_id);

-- Asset Specifications
CREATE TABLE IF NOT EXISTS asset_specifications (
    id SERIAL PRIMARY KEY,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    spec_key VARCHAR(100) NOT NULL,
    spec_value TEXT,
    unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_specs_asset_id ON asset_specifications(asset_id);

-- ============================================
-- WORK ORDER ENHANCEMENTS
-- ============================================

-- Work Order Tasks
CREATE TABLE IF NOT EXISTS work_order_tasks (
    id SERIAL PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    sequence INTEGER,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_tasks_work_order ON work_order_tasks(work_order_id);

-- Work Order Parts
CREATE TABLE IF NOT EXISTS work_order_parts (
    id SERIAL PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_parts_work_order ON work_order_parts(work_order_id);
CREATE INDEX idx_wo_parts_part ON work_order_parts(part_id);

-- Work Order Labor
CREATE TABLE IF NOT EXISTS work_order_labor (
    id SERIAL PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    hours DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_labor_work_order ON work_order_labor(work_order_id);
CREATE INDEX idx_wo_labor_technician ON work_order_labor(technician_id);

-- Work Order Comments
CREATE TABLE IF NOT EXISTS work_order_comments (
    id SERIAL PRIMARY KEY,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_comments_work_order ON work_order_comments(work_order_id);

-- ============================================
-- PREVENTIVE MAINTENANCE
-- ============================================

-- PM Templates
CREATE TABLE IF NOT EXISTS pm_templates (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type_id INTEGER REFERENCES asset_types(id) ON DELETE SET NULL,
    category VARCHAR(100),
    estimated_duration INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_templates_org ON pm_templates(org_id);
CREATE INDEX idx_pm_templates_asset_type ON pm_templates(asset_type_id);

-- PM Template Tasks
CREATE TABLE IF NOT EXISTS pm_template_tasks (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES pm_templates(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_template_tasks_template ON pm_template_tasks(template_id);

-- PM Schedules
CREATE TABLE IF NOT EXISTS pm_schedules (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES pm_templates(id) ON DELETE SET NULL,
    schedule_name VARCHAR(255) NOT NULL,
    frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Meter')),
    frequency_value INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pm_schedules_org ON pm_schedules(org_id);
CREATE INDEX idx_pm_schedules_asset ON pm_schedules(asset_id);
CREATE INDEX idx_pm_schedules_next_due ON pm_schedules(next_due_date);

-- PM Executions
CREATE TABLE IF NOT EXISTS pm_executions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES pm_schedules(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    execution_status VARCHAR(20) DEFAULT 'Pending' CHECK (execution_status IN ('Pending', 'Generated', 'Completed', 'Skipped')),
    generated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pm_executions_schedule ON pm_executions(schedule_id);
CREATE INDEX idx_pm_executions_work_order ON pm_executions(work_order_id);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Parts
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    part_number VARCHAR(100) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(10,2),
    reorder_level INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, part_number)
);

CREATE INDEX idx_parts_org ON parts(org_id);
CREATE INDEX idx_parts_number ON parts(part_number);
CREATE INDEX idx_parts_category ON parts(category);

-- Storerooms
CREATE TABLE IF NOT EXISTS storerooms (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storerooms_org ON storerooms(org_id);
CREATE INDEX idx_storerooms_site ON storerooms(site_id);

-- Part Stock
CREATE TABLE IF NOT EXISTS part_stock (
    id SERIAL PRIMARY KEY,
    part_id INTEGER REFERENCES parts(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    storeroom_id INTEGER REFERENCES storerooms(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER,
    max_quantity INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(part_id, site_id, storeroom_id)
);

CREATE INDEX idx_part_stock_part ON part_stock(part_id);
CREATE INDEX idx_part_stock_site ON part_stock(site_id);
CREATE INDEX idx_part_stock_storeroom ON part_stock(storeroom_id);

-- Part Transactions
CREATE TABLE IF NOT EXISTS part_transactions (
    id SERIAL PRIMARY KEY,
    part_id INTEGER REFERENCES parts(id) ON DELETE CASCADE,
    storeroom_id INTEGER REFERENCES storerooms(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_part_trans_part ON part_transactions(part_id);
CREATE INDEX idx_part_trans_work_order ON part_transactions(work_order_id);
CREATE INDEX idx_part_trans_date ON part_transactions(created_at);

-- ============================================
-- VENDOR MANAGEMENT
-- ============================================

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) CHECK (vendor_type IN ('Supplier', 'Contractor', 'Service Provider')),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendors_org ON vendors(org_id);
CREATE INDEX idx_vendors_type ON vendors(vendor_type);
CREATE INDEX idx_vendors_name ON vendors(vendor_name);

-- Vendor Contacts
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);

-- Vendor Contracts
CREATE TABLE IF NOT EXISTS vendor_contracts (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    contract_name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_date DATE,
    contract_value DECIMAL(15,2),
    billing_frequency VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Expired', 'Terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, contract_number)
);

CREATE INDEX idx_vendor_contracts_org ON vendor_contracts(org_id);
CREATE INDEX idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX idx_vendor_contracts_status ON vendor_contracts(status);

-- ============================================
-- TEAM MANAGEMENT
-- ============================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    team_lead UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_org ON teams(org_id);
CREATE INDEX idx_teams_lead ON teams(team_lead);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    account_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, account_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_account ON team_members(account_id);

-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Add enterprise_id to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sites_enterprise ON sites(enterprise_id);

-- Add location fields to assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS space_id INTEGER REFERENCES spaces(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES asset_categories(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_type_id INTEGER REFERENCES asset_types(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_building ON assets(building_id);
CREATE INDEX IF NOT EXISTS idx_assets_floor ON assets(floor_id);
CREATE INDEX IF NOT EXISTS idx_assets_space ON assets(space_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type_id);

-- Add enterprise_id and building_id to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assigned_team INTEGER REFERENCES teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_orders_enterprise ON work_orders(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_building ON work_orders(building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_org ON work_orders(org_id);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for new tables
CREATE TRIGGER update_enterprises_updated_at BEFORE UPDATE ON enterprises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE enterprises IS 'Main enterprises/clients table with full contact information';
COMMENT ON TABLE buildings IS 'Buildings within sites for location hierarchy';
COMMENT ON TABLE floors IS 'Floors within buildings';
COMMENT ON TABLE spaces IS 'Spaces/rooms within floors';
COMMENT ON TABLE parts IS 'Inventory parts/materials catalog';
COMMENT ON TABLE vendors IS 'Vendor/supplier management';
COMMENT ON TABLE teams IS 'Technician teams for work assignment';
COMMENT ON TABLE storerooms IS 'Physical storeroom locations for parts';
