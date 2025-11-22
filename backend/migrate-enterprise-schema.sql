-- ============================================
-- ENTERPRISE CMMS SCHEMA ENHANCEMENT
-- Migration Script - Adds Enterprise Features to Workix
-- Based on Facilio-style comprehensive facility management
-- ============================================

-- This migration adds 30+ new tables to enhance Workix with enterprise capabilities:
-- - Organizations metadata and multi-tenancy support
-- - Advanced roles and permissions system
-- - Location hierarchy (Buildings, Floors, Spaces)
-- - Asset management (Categories, Types, Specifications)
-- - Enhanced work order features (Tasks, Parts, Labor tracking)
-- - Preventive Maintenance templates and schedules
-- - Comprehensive inventory management (Parts, Storerooms, Transactions)
-- - Vendor management and contracts
-- - Team management
-- - API client management for integrations
-- - Custom module framework
-- - IoT device and sensor data
-- - Booking system for spaces
-- - Utility meter tracking
-- - Advanced reporting and dashboards
-- - Workflow automation

-- ============================================
-- PART 1: ORGANIZATIONS AND MULTI-TENANCY
-- ============================================

-- Add organization support to existing system
CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT chk_org_currency CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- Add org_id to existing users table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE users ADD COLUMN org_id BIGINT REFERENCES organizations(id);
        -- Create default organization and assign all existing users
        INSERT INTO organizations (name, domain, timezone, currency) 
        VALUES ('Default Organization', 'default', 'America/New_York', 'USD');
        UPDATE users SET org_id = (SELECT id FROM organizations WHERE domain = 'default');
        ALTER TABLE users ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- PART 2: ADVANCED ROLES AND PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_developer_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_name_per_org UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(org_id);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    module_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    CONSTRAINT uq_permission_module_action UNIQUE (module_name, action)
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module_name);

CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);

CREATE TABLE IF NOT EXISTS account_roles (
    id BIGSERIAL PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    CONSTRAINT uq_account_role UNIQUE (account_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_account_roles_account ON account_roles(account_id);

-- ============================================
-- PART 3: LOCATION HIERARCHY ENHANCEMENT
-- ============================================

-- Add org_id to sites table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sites' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE sites ADD COLUMN org_id BIGINT REFERENCES organizations(id);
        UPDATE sites SET org_id = (SELECT id FROM organizations WHERE domain = 'default');
        ALTER TABLE sites ALTER COLUMN org_id SET NOT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS buildings (
    id BIGSERIAL PRIMARY KEY,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    building_code VARCHAR(50),
    floor_count INTEGER,
    gross_area DECIMAL(12,2),
    occupancy_type VARCHAR(100),
    year_built INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_building_code_per_site UNIQUE (site_id, building_code)
);

CREATE INDEX IF NOT EXISTS idx_buildings_site ON buildings(site_id);

CREATE TABLE IF NOT EXISTS floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    floor_number INTEGER NOT NULL,
    area DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_floor_number_per_building UNIQUE (building_id, floor_number)
);

CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);

CREATE TABLE IF NOT EXISTS spaces (
    id BIGSERIAL PRIMARY KEY,
    floor_id BIGINT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    space_type VARCHAR(100),
    area DECIMAL(12,2),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spaces_floor ON spaces(floor_id);
CREATE INDEX IF NOT EXISTS idx_spaces_type ON spaces(space_type);

-- Add building_id and floor_id to assets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'building_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN building_id BIGINT REFERENCES buildings(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'floor_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN floor_id BIGINT REFERENCES floors(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'space_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN space_id BIGINT REFERENCES spaces(id);
    END IF;
END $$;

-- ============================================
-- PART 4: ASSET MANAGEMENT ENHANCEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS asset_categories (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id BIGINT REFERENCES asset_categories(id),
    is_system_category BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asset_category_name_per_org UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_asset_categories_org ON asset_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_asset_categories_parent ON asset_categories(parent_category_id);

CREATE TABLE IF NOT EXISTS asset_types (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES asset_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asset_type_name_per_category UNIQUE (category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_asset_types_category ON asset_types(category_id);

-- Add category_id and asset_type_id to assets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN category_id BIGINT REFERENCES asset_categories(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'asset_type_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN asset_type_id BIGINT REFERENCES asset_types(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'parent_asset_id'
    ) THEN
        ALTER TABLE assets ADD COLUMN parent_asset_id UUID REFERENCES assets(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'criticality'
    ) THEN
        ALTER TABLE assets ADD COLUMN criticality VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'condition'
    ) THEN
        ALTER TABLE assets ADD COLUMN condition VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'purchase_date'
    ) THEN
        ALTER TABLE assets ADD COLUMN purchase_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'purchase_price'
    ) THEN
        ALTER TABLE assets ADD COLUMN purchase_price DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'installation_date'
    ) THEN
        ALTER TABLE assets ADD COLUMN installation_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' AND column_name = 'expected_life'
    ) THEN
        ALTER TABLE assets ADD COLUMN expected_life INTEGER;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_type_id ON assets(asset_type_id);

CREATE TABLE IF NOT EXISTS asset_specifications (
    id BIGSERIAL PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    spec_key VARCHAR(100) NOT NULL,
    spec_value TEXT,
    unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_specs_asset ON asset_specifications(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_specs_key ON asset_specifications(asset_id, spec_key);

-- ============================================
-- PART 5: WORK ORDER ENHANCEMENT
-- ============================================

-- Add missing fields to work_orders table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN org_id BIGINT REFERENCES organizations(id);
        UPDATE work_orders SET org_id = (SELECT id FROM organizations WHERE domain = 'default');
        ALTER TABLE work_orders ALTER COLUMN org_id SET NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'building_id'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN building_id BIGINT REFERENCES buildings(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'asset_id'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN asset_id UUID REFERENCES assets(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'subject'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN subject VARCHAR(500);
        UPDATE work_orders SET subject = title WHERE subject IS NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'work_type'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN work_type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'category'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'assigned_team'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN assigned_team BIGINT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN created_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'requested_by'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN requested_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'scheduled_start'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN scheduled_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'scheduled_end'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN scheduled_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'actual_start'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN actual_start TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'actual_end'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN actual_end TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'estimated_cost'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN estimated_cost DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'actual_cost'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN actual_cost DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'completion_notes'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN completion_notes TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'rating'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'work_orders' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE work_orders ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS work_order_tasks (
    id BIGSERIAL PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    sequence INTEGER,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wo_tasks_work_order ON work_order_tasks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_tasks_sequence ON work_order_tasks(work_order_id, sequence);

CREATE TABLE IF NOT EXISTS work_order_parts (
    id BIGSERIAL PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id BIGINT NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wo_parts_work_order ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_part ON work_order_parts(part_id);

CREATE TABLE IF NOT EXISTS work_order_labor (
    id BIGSERIAL PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    hours DECIMAL(8,2),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wo_labor_work_order ON work_order_labor(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_labor_technician ON work_order_labor(technician_id);

CREATE TABLE IF NOT EXISTS work_order_comments (
    id BIGSERIAL PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_internal BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_wo_comments_work_order ON work_order_comments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_comments_created ON work_order_comments(created_at);

-- ============================================
-- PART 6: PREVENTIVE MAINTENANCE ENHANCEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS pm_templates (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type_id BIGINT REFERENCES asset_types(id),
    category VARCHAR(100),
    estimated_duration INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pm_templates_org ON pm_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_pm_templates_asset_type ON pm_templates(asset_type_id);

CREATE TABLE IF NOT EXISTS pm_template_tasks (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES pm_templates(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pm_template_tasks_template ON pm_template_tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_pm_template_tasks_sequence ON pm_template_tasks(template_id, sequence);

CREATE TABLE IF NOT EXISTS pm_schedules (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    template_id BIGINT REFERENCES pm_templates(id),
    schedule_name VARCHAR(255) NOT NULL,
    frequency_type VARCHAR(50) NOT NULL,
    frequency_value INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE,
    assigned_to UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_frequency_type CHECK (frequency_type IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Meter'))
);

CREATE INDEX IF NOT EXISTS idx_pm_schedules_org ON pm_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_asset ON pm_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_next_due ON pm_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_active ON pm_schedules(is_active);

CREATE TABLE IF NOT EXISTS pm_executions (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL REFERENCES pm_schedules(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id),
    scheduled_date DATE NOT NULL,
    execution_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    generated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_execution_status CHECK (execution_status IN ('Pending', 'Generated', 'Completed', 'Skipped'))
);

CREATE INDEX IF NOT EXISTS idx_pm_executions_schedule ON pm_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_pm_executions_work_order ON pm_executions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_pm_executions_date ON pm_executions(scheduled_date);

-- ============================================
-- PART 7: INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS parts (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    part_number VARCHAR(100) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    unit_of_measure VARCHAR(50),
    unit_cost DECIMAL(15,2),
    reorder_level DECIMAL(10,2),
    reorder_quantity DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_part_number_per_org UNIQUE (org_id, part_number)
);

CREATE INDEX IF NOT EXISTS idx_parts_org ON parts(org_id);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);

CREATE TABLE IF NOT EXISTS storerooms (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storerooms_org ON storerooms(org_id);
CREATE INDEX IF NOT EXISTS idx_storerooms_site ON storerooms(site_id);

CREATE TABLE IF NOT EXISTS part_stock (
    id BIGSERIAL PRIMARY KEY,
    part_id BIGINT NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id),
    storeroom_id BIGINT REFERENCES storerooms(id),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(10,2),
    max_quantity DECIMAL(10,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_part_stock_location UNIQUE (part_id, site_id, storeroom_id)
);

CREATE INDEX IF NOT EXISTS idx_part_stock_part ON part_stock(part_id);
CREATE INDEX IF NOT EXISTS idx_part_stock_site ON part_stock(site_id);
CREATE INDEX IF NOT EXISTS idx_part_stock_storeroom ON part_stock(storeroom_id);

CREATE TABLE IF NOT EXISTS part_transactions (
    id BIGSERIAL PRIMARY KEY,
    part_id BIGINT NOT NULL REFERENCES parts(id),
    storeroom_id BIGINT REFERENCES storerooms(id),
    transaction_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    work_order_id UUID REFERENCES work_orders(id),
    purchase_order_id BIGINT,
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'))
);

CREATE INDEX IF NOT EXISTS idx_part_transactions_part ON part_transactions(part_id);
CREATE INDEX IF NOT EXISTS idx_part_transactions_storeroom ON part_transactions(storeroom_id);
CREATE INDEX IF NOT EXISTS idx_part_transactions_work_order ON part_transactions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_part_transactions_created ON part_transactions(created_at);

-- Link work_order_parts to parts table
ALTER TABLE work_order_parts
    ADD CONSTRAINT fk_wo_parts_part 
    FOREIGN KEY (part_id) REFERENCES parts(id);

-- ============================================
-- PART 8: VENDOR MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_vendor_type CHECK (vendor_type IN ('Supplier', 'Contractor', 'Service Provider'))
);

CREATE INDEX IF NOT EXISTS idx_vendors_org ON vendors(org_id);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

CREATE TABLE IF NOT EXISTS vendor_contacts (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);

CREATE TABLE IF NOT EXISTS vendor_contracts (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    contract_name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_date DATE,
    contract_value DECIMAL(15,2),
    billing_frequency VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_contract_number_per_org UNIQUE (org_id, contract_number),
    CONSTRAINT chk_contract_status CHECK (status IN ('Draft', 'Active', 'Expired', 'Terminated'))
);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_org ON vendor_contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_dates ON vendor_contracts(start_date, end_date);

-- ============================================
-- PART 9: TEAM MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    team_lead UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(team_lead);

CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_member UNIQUE (team_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_account ON team_members(account_id);

-- Add foreign key for assigned_team in work_orders
ALTER TABLE work_orders
    ADD CONSTRAINT fk_wo_assigned_team 
    FOREIGN KEY (assigned_team) REFERENCES teams(id);

-- ============================================
-- PART 10: API AND INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS api_clients (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    client_secret VARCHAR(255) NOT NULL,
    auth_type VARCHAR(50) NOT NULL DEFAULT 'API_KEY',
    grant_type VARCHAR(50),
    redirect_uri VARCHAR(500),
    scopes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_auth_type CHECK (auth_type IN ('API_KEY', 'OAUTH2'))
);

CREATE INDEX IF NOT EXISTS idx_api_clients_org ON api_clients(org_id);
CREATE INDEX IF NOT EXISTS idx_api_clients_client_id ON api_clients(client_id);

CREATE TABLE IF NOT EXISTS api_tokens (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES api_clients(id) ON DELETE CASCADE,
    account_id UUID REFERENCES users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'access',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_token_type CHECK (token_type IN ('access', 'refresh'))
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_tokens_client ON api_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_expires ON api_tokens(expires_at);

CREATE TABLE IF NOT EXISTS api_logs (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES api_clients(id),
    account_id UUID REFERENCES users(id),
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    request_body JSONB,
    response_body JSONB,
    ip_address INET,
    user_agent VARCHAR(500),
    execution_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_logs_client ON api_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(status_code);

CREATE TABLE IF NOT EXISTS connectors (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    connector_name VARCHAR(255) NOT NULL,
    connector_type VARCHAR(100) NOT NULL,
    namespace VARCHAR(100) UNIQUE NOT NULL,
    auth_type VARCHAR(50) NOT NULL,
    credentials JSONB,
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connectors_org ON connectors(org_id);
CREATE INDEX IF NOT EXISTS idx_connectors_type ON connectors(connector_type);

-- ============================================
-- PART 11: CUSTOM MODULES AND FORMS
-- ============================================

CREATE TABLE IF NOT EXISTS custom_modules (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_module_id BIGINT REFERENCES custom_modules(id),
    icon VARCHAR(100),
    is_system_module BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_custom_module_name_per_org UNIQUE (org_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_modules_org ON custom_modules(org_id);

CREATE TABLE IF NOT EXISTS custom_fields (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES custom_modules(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    data_type VARCHAR(50),
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    validation_rules JSONB,
    options JSONB,
    sequence INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_custom_field_name_per_module UNIQUE (module_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_module ON custom_fields(module_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_sequence ON custom_fields(module_id, sequence);

CREATE TABLE IF NOT EXISTS custom_forms (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES custom_modules(id) ON DELETE CASCADE,
    form_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    layout JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_custom_forms_module ON custom_forms(module_id);

-- ============================================
-- PART 12: ENHANCED AUDIT AND ACTIVITY
-- ============================================

-- Enhance existing audit_logs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN org_id BIGINT REFERENCES organizations(id);
        UPDATE audit_logs SET org_id = (SELECT id FROM organizations WHERE domain = 'default');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'module_name'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN module_name VARCHAR(100);
        UPDATE audit_logs SET module_name = entity_type WHERE module_name IS NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'record_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN record_id BIGINT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module_name, record_id);

CREATE TABLE IF NOT EXISTS activity_feed (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    module_name VARCHAR(100),
    record_id BIGINT,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_org ON activity_feed(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_account ON activity_feed(account_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_module ON activity_feed(module_name, record_id);

-- ============================================
-- PART 13: REPORTING AND ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(100) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    columns JSONB NOT NULL,
    filters JSONB,
    grouping JSONB,
    sorting JSONB,
    chart_config JSONB,
    created_by UUID REFERENCES users(id),
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_report_type CHECK (report_type IN ('table', 'chart', 'dashboard'))
);

CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(org_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_module ON reports(module_name);

CREATE TABLE IF NOT EXISTS dashboards (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL,
    widgets JSONB NOT NULL,
    created_by UUID REFERENCES users(id),
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboards_org ON dashboards(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);

-- ============================================
-- PART 14: IoT AND SENSOR DATA
-- ============================================

CREATE TABLE IF NOT EXISTS iot_devices (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    mac_address VARCHAR(100),
    ip_address INET,
    protocol VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_device_type CHECK (device_type IN ('sensor', 'controller', 'meter')),
    CONSTRAINT chk_device_status CHECK (status IN ('online', 'offline', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_iot_devices_org ON iot_devices(org_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_asset ON iot_devices(asset_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_serial ON iot_devices(serial_number);

-- Note: For production, consider TimescaleDB for sensor_readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50),
    reading_time TIMESTAMP WITH TIME ZONE NOT NULL,
    quality VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(reading_time);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_metric ON sensor_readings(device_id, metric_name, reading_time);

-- ============================================
-- PART 15: BOOKING AND SCHEDULING
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    space_id BIGINT REFERENCES spaces(id),
    asset_id UUID REFERENCES assets(id),
    booked_by UUID NOT NULL REFERENCES users(id),
    booking_title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    attendees INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_status CHECK (status IN ('Confirmed', 'Cancelled', 'Completed')),
    CONSTRAINT chk_booking_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_bookings_space ON bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_times ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- ============================================
-- PART 16: UTILITY MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS utility_meters (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    meter_name VARCHAR(255) NOT NULL,
    meter_number VARCHAR(100) NOT NULL,
    utility_type VARCHAR(50) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    multiplier DECIMAL(10,4) DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_meter_number_per_org UNIQUE (org_id, meter_number),
    CONSTRAINT chk_utility_type CHECK (utility_type IN ('electricity', 'water', 'gas', 'steam'))
);

CREATE INDEX IF NOT EXISTS idx_utility_meters_site ON utility_meters(site_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_type ON utility_meters(utility_type);

CREATE TABLE IF NOT EXISTS utility_readings (
    id BIGSERIAL PRIMARY KEY,
    meter_id BIGINT NOT NULL REFERENCES utility_meters(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    reading_value DECIMAL(15,4) NOT NULL,
    consumption DECIMAL(15,4),
    cost DECIMAL(15,2),
    recorded_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_meter_reading_date UNIQUE (meter_id, reading_date)
);

CREATE INDEX IF NOT EXISTS idx_utility_readings_meter ON utility_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_date ON utility_readings(reading_date);

-- ============================================
-- PART 17: NOTIFICATION TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_template_type CHECK (template_type IN ('email', 'sms', 'push'))
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_org ON notification_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);

-- Enhance existing notifications table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'org_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN org_id BIGINT REFERENCES organizations(id);
        UPDATE notifications SET org_id = (SELECT id FROM organizations WHERE domain = 'default');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'in-app';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'related_entity'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_entity VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'related_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_id BIGINT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'sent_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- ============================================
-- PART 18: WORKFLOW AUTOMATION
-- ============================================

CREATE TABLE IF NOT EXISTS workflows (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_module VARCHAR(100) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL,
    conditions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_module, trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);

CREATE TABLE IF NOT EXISTS workflow_actions (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_sequence ON workflow_actions(workflow_id, sequence);

-- ============================================
-- PART 19: TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp for new tables
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_floors_updated_at 
    BEFORE UPDATE ON floors 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_spaces_updated_at 
    BEFORE UPDATE ON spaces 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_asset_categories_updated_at 
    BEFORE UPDATE ON asset_categories 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_asset_types_updated_at 
    BEFORE UPDATE ON asset_types 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pm_templates_updated_at 
    BEFORE UPDATE ON pm_templates 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_pm_schedules_updated_at 
    BEFORE UPDATE ON pm_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_parts_updated_at 
    BEFORE UPDATE ON parts 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_vendor_contracts_updated_at 
    BEFORE UPDATE ON vendor_contracts 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_custom_modules_updated_at 
    BEFORE UPDATE ON custom_modules 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_custom_forms_updated_at 
    BEFORE UPDATE ON custom_forms 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_dashboards_updated_at 
    BEFORE UPDATE ON dashboards 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_iot_devices_updated_at 
    BEFORE UPDATE ON iot_devices 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON workflows 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_connectors_updated_at 
    BEFORE UPDATE ON connectors 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================
-- PART 20: SEED DATA
-- ============================================

-- Insert default permissions
INSERT INTO permissions (module_name, action, description) VALUES
('work_orders', 'CREATE', 'Create work orders'),
('work_orders', 'READ', 'View work orders'),
('work_orders', 'UPDATE', 'Update work orders'),
('work_orders', 'DELETE', 'Delete work orders'),
('assets', 'CREATE', 'Create assets'),
('assets', 'READ', 'View assets'),
('assets', 'UPDATE', 'Update assets'),
('assets', 'DELETE', 'Delete assets'),
('sites', 'CREATE', 'Create sites'),
('sites', 'READ', 'View sites'),
('sites', 'UPDATE', 'Update sites'),
('sites', 'DELETE', 'Delete sites'),
('inventory', 'CREATE', 'Create inventory items'),
('inventory', 'READ', 'View inventory'),
('inventory', 'UPDATE', 'Update inventory'),
('inventory', 'DELETE', 'Delete inventory'),
('reports', 'CREATE', 'Create reports'),
('reports', 'READ', 'View reports'),
('vendors', 'CREATE', 'Create vendors'),
('vendors', 'READ', 'View vendors'),
('vendors', 'UPDATE', 'Update vendors'),
('pm_schedules', 'CREATE', 'Create PM schedules'),
('pm_schedules', 'READ', 'View PM schedules'),
('pm_schedules', 'UPDATE', 'Update PM schedules')
ON CONFLICT (module_name, action) DO NOTHING;

-- Insert default asset categories
INSERT INTO asset_categories (org_id, name, description, is_system_category) VALUES
((SELECT id FROM organizations WHERE domain = 'default'), 'HVAC', 'Heating, Ventilation, and Air Conditioning', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Electrical', 'Electrical Systems', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Plumbing', 'Plumbing Systems', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Building Automation', 'BMS and Controls', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Fire Safety', 'Fire Suppression and Alarms', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Security', 'Security Systems', TRUE)
ON CONFLICT DO NOTHING;

-- Insert default roles for the default organization
INSERT INTO roles (org_id, name, description, is_system_role) VALUES
((SELECT id FROM organizations WHERE domain = 'default'), 'System Administrator', 'Full system access', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Facility Manager', 'Manage facility operations', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Technician', 'Execute work orders', TRUE),
((SELECT id FROM organizations WHERE domain = 'default'), 'Viewer', 'Read-only access', TRUE)
ON CONFLICT (org_id, name) DO NOTHING;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE organizations IS 'Multi-tenant organization support - root level entity';
COMMENT ON TABLE buildings IS 'Buildings within sites for enhanced location hierarchy';
COMMENT ON TABLE floors IS 'Individual floors within buildings';
COMMENT ON TABLE spaces IS 'Rooms/zones within floors';
COMMENT ON TABLE asset_categories IS 'High-level asset classification (HVAC, Electrical, etc.)';
COMMENT ON TABLE asset_types IS 'Specific types within categories (Chiller, Boiler, etc.)';
COMMENT ON TABLE asset_specifications IS 'Technical specifications for assets';
COMMENT ON TABLE work_order_tasks IS 'Individual tasks within work orders';
COMMENT ON TABLE work_order_parts IS 'Parts/materials used in work orders';
COMMENT ON TABLE work_order_labor IS 'Labor hours tracked for work orders';
COMMENT ON TABLE pm_templates IS 'Preventive maintenance procedure templates';
COMMENT ON TABLE pm_schedules IS 'Scheduled preventive maintenance';
COMMENT ON TABLE parts IS 'Spare parts and materials inventory';
COMMENT ON TABLE storerooms IS 'Physical inventory storage locations';
COMMENT ON TABLE part_stock IS 'Stock levels at different locations';
COMMENT ON TABLE part_transactions IS 'All inventory movements';
COMMENT ON TABLE vendors IS 'Supplier and service provider information';
COMMENT ON TABLE vendor_contracts IS 'Service contracts with vendors';
COMMENT ON TABLE teams IS 'Maintenance and operations teams';
COMMENT ON TABLE api_clients IS 'API client applications for integrations';
COMMENT ON TABLE connectors IS 'External system integrations';
COMMENT ON TABLE custom_modules IS 'User-defined custom modules';
COMMENT ON TABLE custom_fields IS 'Custom fields for modules';
COMMENT ON TABLE reports IS 'Saved report definitions';
COMMENT ON TABLE dashboards IS 'Dashboard configurations';
COMMENT ON TABLE iot_devices IS 'IoT devices and sensors';
COMMENT ON TABLE sensor_readings IS 'Time-series sensor data';
COMMENT ON TABLE bookings IS 'Space and resource bookings';
COMMENT ON TABLE utility_meters IS 'Utility meter tracking';
COMMENT ON TABLE workflows IS 'Automated workflow definitions';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Display summary
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ENTERPRISE CMMS SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total tables in database: %', table_count;
    RAISE NOTICE 'Migration added 35+ new enterprise tables';
    RAISE NOTICE 'Enhanced existing tables with new fields';
    RAISE NOTICE 'Created indexes for optimal performance';
    RAISE NOTICE 'Added triggers for automatic timestamps';
    RAISE NOTICE 'Seeded default data (permissions, categories, roles)';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Your Workix CMMS is now enterprise-ready!';
    RAISE NOTICE '==============================================';
END $$;
