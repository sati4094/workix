-- ============================================
-- WORKIX ENTERPRISE USER MANAGEMENT SCHEMA
-- Migration: 001_enterprise_schema.sql
-- Description: Multi-tenant architecture with RLS
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. ORGANIZATIONS TABLE (Multi-tenant)
-- ============================================

DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    
    -- Subscription Info
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(50) DEFAULT 'trial',
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits
    max_users INTEGER DEFAULT 10,
    max_facilities INTEGER DEFAULT 5,
    max_work_orders_per_month INTEGER DEFAULT 100,
    max_storage_gb DECIMAL(10, 2) DEFAULT 5.0,
    
    -- Contact Info
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    postal_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- ============================================
-- 2. PORTFOLIOS TABLE
-- ============================================

DROP TABLE IF EXISTS portfolios CASCADE;

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(50),
    manager_id UUID,
    
    -- Metadata
    total_facilities INTEGER DEFAULT 0,
    total_square_feet DECIMAL(15, 2),
    annual_budget DECIMAL(15, 2),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_portfolios_org ON portfolios(organization_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_manager ON portfolios(manager_id);

-- ============================================
-- 3. SITES/FACILITIES TABLE
-- ============================================

DROP TABLE IF EXISTS sites CASCADE;

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolios(id),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    facility_code VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    
    -- Contact
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    facility_manager_id UUID,
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Properties
    square_feet DECIMAL(15, 2),
    annual_budget DECIMAL(15, 2),
    operating_hours VARCHAR(100),
    site_notes TEXT,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_sites_org ON sites(organization_id);
CREATE INDEX idx_sites_portfolio ON sites(portfolio_id);
CREATE INDEX idx_sites_manager ON sites(facility_manager_id);
CREATE INDEX idx_sites_location ON sites(latitude, longitude);

-- ============================================
-- 4. SYSTEM ROLES TABLE
-- ============================================

DROP TABLE IF EXISTS system_roles CASCADE;

CREATE TABLE system_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    level INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#7c3aed',
    
    -- Role capabilities
    is_workix_role BOOLEAN DEFAULT false,
    is_org_admin BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    can_manage_facilities BOOLEAN DEFAULT false,
    can_assign_work_orders BOOLEAN DEFAULT false,
    can_approve_work_orders BOOLEAN DEFAULT false,
    can_view_all_orgs BOOLEAN DEFAULT false,
    can_impersonate BOOLEAN DEFAULT false,
    
    scope VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_roles_slug ON system_roles(slug);
CREATE INDEX IF NOT EXISTS idx_system_roles_level ON system_roles(level);

-- ============================================
-- 5. RECREATE USERS TABLE WITH NEW STRUCTURE
-- ============================================

-- Backup existing users if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        DROP TABLE users_backup CASCADE;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users_backup AS SELECT * FROM users;
    END IF;
END $$;

-- Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Role (will reference system_roles after it's created)
    system_role_id UUID,
    
    -- Legacy role field (for backward compatibility)
    role VARCHAR(50),
    
    -- Hierarchy
    manager_id UUID REFERENCES users(id),
    
    -- Employment
    employee_id VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    team VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    
    -- Access Scope
    portfolio_id UUID REFERENCES portfolios(id),
    facility_id UUID REFERENCES sites(id),
    
    -- Location & Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',
    profile_picture_url TEXT,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT false,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    
    -- Email Verification
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_role ON users(system_role_id);
CREATE INDEX idx_users_portfolio ON users(portfolio_id);
CREATE INDEX idx_users_facility ON users(facility_id);
CREATE INDEX idx_users_status ON users(status);

-- Add foreign key constraint to users table now that system_roles exists
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_system_role_id_fkey,
  ADD CONSTRAINT users_system_role_id_fkey 
  FOREIGN KEY (system_role_id) REFERENCES system_roles(id);

-- Add foreign key for portfolios manager
ALTER TABLE portfolios 
  DROP CONSTRAINT IF EXISTS fk_portfolio_manager,
  ADD CONSTRAINT fk_portfolio_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key for sites facility manager
ALTER TABLE sites 
  DROP CONSTRAINT IF EXISTS fk_site_manager,
  ADD CONSTRAINT fk_site_manager 
  FOREIGN KEY (facility_manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 6. PERMISSIONS SYSTEM
-- ============================================

DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_role_id UUID NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_role_id, permission_id)
);

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    reason TEXT,
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- ============================================
-- 7. USER ACCESS SCOPES
-- ============================================

CREATE TABLE IF NOT EXISTS user_facility_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    access_level VARCHAR(50) DEFAULT 'read',
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, facility_id)
);

-- ============================================
-- 8. SESSION MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE,
    device_type VARCHAR(50),
    device_name VARCHAR(255),
    device_id VARCHAR(255),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    location VARCHAR(255),
    user_agent TEXT,
    impersonated_by UUID REFERENCES users(id),
    impersonation_reason TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);

-- ============================================
-- 9. AUDIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    impersonated_by UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    organization_id UUID REFERENCES organizations(id),
    facility_id UUID REFERENCES sites(id),
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 9. CLIENTS TABLE
-- ============================================

DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_clients_org ON clients(organization_id);

-- ============================================
-- 10. ASSETS TABLE
-- ============================================

DROP TABLE IF EXISTS assets CASCADE;

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    asset_tag VARCHAR(100),
    category VARCHAR(100),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    installation_date DATE,
    
    location_within_site VARCHAR(255),
    status VARCHAR(50) DEFAULT 'operational',
    criticality VARCHAR(50) DEFAULT 'medium',
    
    maintenance_schedule_id UUID,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    
    specifications JSONB DEFAULT '{}',
    documents_urls TEXT[],
    notes TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_org ON assets(organization_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_tag ON assets(asset_tag);

-- ============================================
-- 11. WORK ORDERS TABLE
-- ============================================

DROP TABLE IF EXISTS work_orders CASCADE;

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    client_id UUID REFERENCES clients(id),
    
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    type VARCHAR(50) DEFAULT 'corrective',
    category VARCHAR(100),
    
    assigned_to UUID REFERENCES users(id),
    requested_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    estimated_hours DECIMAL(10, 2),
    actual_hours DECIMAL(10, 2),
    estimated_cost DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    
    location_notes TEXT,
    completion_notes TEXT,
    attachments JSONB DEFAULT '[]',
    checklist JSONB DEFAULT '[]',
    
    is_recurring BOOLEAN DEFAULT false,
    parent_wo_id UUID REFERENCES work_orders(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_wo_org ON work_orders(organization_id);
CREATE INDEX idx_wo_site ON work_orders(site_id);
CREATE INDEX idx_wo_asset ON work_orders(asset_id);
CREATE INDEX idx_wo_assigned ON work_orders(assigned_to);
CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_number ON work_orders(wo_number);
CREATE INDEX idx_wo_type ON work_orders(type);

-- ============================================
-- 12. HELPER FUNCTIONS FOR RLS
-- ============================================

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_org_id() RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_role_slug() RETURNS VARCHAR AS $$
    SELECT sr.slug 
    FROM users u 
    JOIN system_roles sr ON u.system_role_id = sr.id 
    WHERE u.id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_level() RETURNS INTEGER AS $$
    SELECT sr.level 
    FROM users u 
    JOIN system_roles sr ON u.system_role_id = sr.id 
    WHERE u.id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_workix_staff() RETURNS BOOLEAN AS $$
    SELECT COALESCE(sr.is_workix_role, false)
    FROM users u 
    JOIN system_roles sr ON u.system_role_id = sr.id 
    WHERE u.id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_portfolio_id() RETURNS UUID AS $$
    SELECT portfolio_id FROM users WHERE id = current_user_id();
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION current_user_facility_id() RETURNS UUID AS $$
    SELECT facility_id FROM users WHERE id = current_user_id();
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 13. AUTO-UPDATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Migration complete
-- ============================================
