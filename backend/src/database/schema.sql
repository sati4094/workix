-- Workix Enterprise CMMS Database Schema
-- Version: 2.0
-- Last Updated: December 2, 2025
-- Database: PostgreSQL 15+ with TimescaleDB

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- ENUM TYPES
-- ============================================

-- User roles (supports Workix platform and enterprise scopes)
CREATE TYPE user_role AS ENUM (
  'superadmin',
  'supertech',
  'admin',
  'portfolio_manager',
  'facility_manager',
  'engineer',
  'technician',
  'basic_user',
  'manager',
  'analyst',
  'client'
);

-- User status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- Work order status (lifecycle)
CREATE TYPE work_order_status AS ENUM (
  'pending',
  'acknowledged',
  'in_progress',
  'parts_pending',
  'completed',
  'cancelled'
);

-- Work order priority
CREATE TYPE work_order_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Work order source
CREATE TYPE work_order_source AS ENUM (
  'performance_deviation',
  'customer_complaint',
  'preventive_maintenance',
  'manual'
);

-- Asset types
CREATE TYPE asset_type AS ENUM (
  'chiller',
  'ahu',
  'pump',
  'cooling_tower',
  'boiler',
  'vfd',
  'motor',
  'compressor',
  'other'
);

-- Activity types for work order activities
CREATE TYPE activity_type AS ENUM (
  'observation',
  'action_taken',
  'recommendation',
  'status_change',
  'comment',
  'parts_used'
);

-- PPM frequency
CREATE TYPE ppm_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual'
);

-- PPM status
CREATE TYPE ppm_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'skipped',
  'overdue'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  status user_status NOT NULL DEFAULT 'active',
  phone VARCHAR(50),
  team VARCHAR(100),
  profile_picture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMPTZ,
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ
);

-- Enterprises (customers/clients)
CREATE TABLE enterprises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Projects (contracts/engagements)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enterprise_id UUID REFERENCES enterprises(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_code VARCHAR(50),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  contract_value DECIMAL(15,2),
  contract_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Sites (physical locations)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  site_code VARCHAR(50) UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'UAE',
  contact_person VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  operating_hours VARCHAR(100),
  site_notes TEXT,
  portfolio_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Associate users with enterprises and sites for scoped access
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS enterprise_id UUID,
  ADD COLUMN IF NOT EXISTS site_id UUID;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS fk_users_enterprise_id,
  ADD CONSTRAINT fk_users_enterprise_id
    FOREIGN KEY (enterprise_id)
    REFERENCES enterprises(id)
    ON DELETE SET NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS fk_users_site_id,
  ADD CONSTRAINT fk_users_site_id
    FOREIGN KEY (site_id)
    REFERENCES sites(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);

-- ============================================
-- TAGGING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(64) NOT NULL,
  color VARCHAR(20),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS tags_label_unique_idx ON tags(LOWER(label));

CREATE TABLE IF NOT EXISTS enterprise_tags (
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enterprise_id, tag_id)
);

CREATE TABLE IF NOT EXISTS site_tags (
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, tag_id)
);

CREATE TABLE IF NOT EXISTS user_tags (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_tags_tag_id ON enterprise_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_site_tags_tag_id ON site_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_id ON user_tags(tag_id);

-- Buildings
CREATE TABLE buildings (
  id SERIAL PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  building_code VARCHAR(50),
  description TEXT,
  floor_count INTEGER,
  gross_area DECIMAL(10,2),
  occupancy_type VARCHAR(100),
  year_built INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Floors
CREATE TABLE floors (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  floor_number INTEGER NOT NULL,
  gross_area DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Spaces (rooms/areas within floors)
CREATE TABLE spaces (
  id SERIAL PRIMARY KEY,
  floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  space_type VARCHAR(100),
  area DECIMAL(10,2),
  occupancy_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Asset Categories
CREATE TABLE asset_categories (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id INTEGER REFERENCES asset_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Asset Types (more specific than asset_type enum)
CREATE TABLE asset_types (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES asset_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_lifespan_years INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL,
  space_id INTEGER REFERENCES spaces(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES asset_categories(id) ON DELETE SET NULL,
  asset_type_id INTEGER REFERENCES asset_types(id) ON DELETE SET NULL,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_tag VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type asset_type NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  capacity VARCHAR(100),
  capacity_unit VARCHAR(50),
  commissioning_date DATE,
  warranty_expiry_date DATE,
  performance_baseline JSONB,
  specifications JSONB,
  location_details TEXT,
  qr_code_url TEXT,
  manual_url TEXT,
  status VARCHAR(50) DEFAULT 'operational',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- WORK ORDER TABLES
-- ============================================

-- Work Orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source work_order_source NOT NULL,
  priority work_order_priority NOT NULL DEFAULT 'medium',
  status work_order_status NOT NULL DEFAULT 'pending',
  site_id UUID NOT NULL REFERENCES sites(id),
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  assigned_team INTEGER,
  org_id INTEGER,
  performance_deviation_details JSONB,
  customer_complaint_details JSONB,
  reference_pictures JSONB,
  due_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  acknowledged_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  customer_signature TEXT,
  customer_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Assets (junction table - many-to-many)
CREATE TABLE work_order_assets (
  id SERIAL PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(work_order_id, asset_id)
);

-- Work Order Activities
CREATE TABLE work_order_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  ai_enhanced BOOLEAN DEFAULT false,
  ai_original_text TEXT,
  pictures JSONB,
  parts_used JSONB,
  labor_hours DECIMAL(5,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Comments
CREATE TABLE work_order_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Tasks (checklist items)
CREATE TABLE work_order_tasks (
  id SERIAL PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  sequence_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Labor
CREATE TABLE work_order_labor (
  id SERIAL PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  hours_worked DECIMAL(5,2) NOT NULL,
  hourly_rate DECIMAL(10,2),
  work_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Parts
CREATE TABLE work_order_parts (
  id SERIAL PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id INTEGER,
  part_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PPM (Preventive Maintenance) TABLES
-- ============================================

-- PPM Plans
CREATE TABLE ppm_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency ppm_frequency NOT NULL,
  tasks_checklist JSONB,
  estimated_duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- PPM Schedules
CREATE TABLE ppm_schedules (
  id SERIAL PRIMARY KEY,
  ppm_plan_id INTEGER NOT NULL REFERENCES ppm_plans(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_technician_id UUID REFERENCES users(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status ppm_status NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,
  work_order_id UUID REFERENCES work_orders(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PM Templates
CREATE TABLE pm_templates (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type asset_type,
  frequency ppm_frequency NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- PM Template Tasks
CREATE TABLE pm_template_tasks (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES pm_templates(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  sequence_order INTEGER,
  estimated_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PM Schedules
CREATE TABLE pm_schedules (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES pm_templates(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  assigned_to UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PM Executions
CREATE TABLE pm_executions (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES pm_schedules(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id),
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY TABLES
-- ============================================

-- Parts
CREATE TABLE parts (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  part_number VARCHAR(100) NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  unit_of_measure VARCHAR(50),
  unit_cost DECIMAL(10,2),
  reorder_point INTEGER,
  max_stock INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Storerooms
CREATE TABLE storerooms (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  location_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Part Stock (inventory at each storeroom)
CREATE TABLE part_stock (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  storeroom_id INTEGER NOT NULL REFERENCES storerooms(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_quantity DECIMAL(10,2),
  max_quantity DECIMAL(10,2),
  last_counted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(part_id, storeroom_id)
);

-- Part Transactions
CREATE TABLE part_transactions (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  storeroom_id INTEGER NOT NULL REFERENCES storerooms(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id),
  transaction_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VENDOR TABLES
-- ============================================

-- Vendors
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50),
  vendor_type VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  tax_id VARCHAR(100),
  payment_terms VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Contacts
CREATE TABLE vendor_contacts (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Contracts
CREATE TABLE vendor_contracts (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  contract_number VARCHAR(100),
  description TEXT,
  start_date DATE,
  end_date DATE,
  contract_value DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'active',
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TEAM TABLES
-- ============================================

-- Teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  team_lead_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Team Members
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_team VARCHAR(100),
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Asset Specifications (key-value pairs)
CREATE TABLE asset_specifications (
  id SERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  spec_name VARCHAR(100) NOT NULL,
  spec_value TEXT,
  unit VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Clients (legacy - may be deprecated)
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW technician_workload AS
SELECT
  u.id AS technician_id,
  u.name AS technician_name,
  COUNT(
    CASE WHEN wo.status IN ('acknowledged', 'in_progress') THEN 1 ELSE NULL END
  ) AS active_work_orders,
  COUNT(
    CASE WHEN wo.status = 'pending' THEN 1 ELSE NULL END
  ) AS pending_work_orders,
  COUNT(
    CASE
      WHEN wo.status = 'completed' AND wo.completed_at >= (CURRENT_DATE - INTERVAL '30 days')
      THEN 1 ELSE NULL END
  ) AS completed_last_30_days,
  COUNT(
    CASE
      WHEN ps.status = 'scheduled' AND ps.scheduled_date <= (CURRENT_DATE + INTERVAL '7 days')
      THEN 1 ELSE NULL END
  ) AS upcoming_ppm_count
FROM users u
LEFT JOIN work_orders wo ON u.id = wo.assigned_to
LEFT JOIN ppm_schedules ps ON u.id = ps.assigned_technician_id
WHERE u.role = 'technician'
  AND u.status = 'active'
GROUP BY u.id, u.name;

CREATE OR REPLACE VIEW work_order_summary AS
SELECT
  wo.id,
  wo.work_order_number,
  wo.title,
  wo.status,
  wo.priority,
  wo.source,
  wo.created_at,
  wo.due_date,
  s.name AS site_name,
  s.address AS site_address,
  p.name AS project_name,
  c.name AS client_name,
  assigned_user.name AS assigned_technician_name,
  assigned_user.phone AS assigned_technician_phone,
  reported_user.name AS reported_by_name,
  (
    SELECT COUNT(*)
    FROM work_order_activities
    WHERE work_order_activities.work_order_id = wo.id
  ) AS activity_count,
  (
    SELECT COUNT(*)
    FROM work_order_assets
    WHERE work_order_assets.work_order_id = wo.id
  ) AS asset_count
FROM work_orders wo
JOIN sites s ON wo.site_id = s.id
JOIN projects p ON s.project_id = p.id
JOIN clients c ON p.client_id = c.id
LEFT JOIN users assigned_user ON wo.assigned_to = assigned_user.id
LEFT JOIN users reported_user ON wo.reported_by = reported_user.id;

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Enterprises
CREATE INDEX idx_enterprises_code ON enterprises(enterprise_code);
CREATE INDEX idx_enterprises_name ON enterprises(name);

-- Sites
CREATE INDEX idx_sites_project ON sites(project_id);
CREATE INDEX idx_sites_enterprise ON sites(enterprise_id);
CREATE INDEX idx_sites_location ON sites(latitude, longitude);
CREATE INDEX idx_sites_code ON sites(site_code);

-- Buildings
CREATE INDEX idx_buildings_site_id ON buildings(site_id);
CREATE INDEX idx_buildings_name ON buildings(name);

-- Assets
CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_building ON assets(building_id);
CREATE INDEX idx_assets_floor ON assets(floor_id);
CREATE INDEX idx_assets_space ON assets(space_id);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_status ON assets(status);

-- Work Orders
CREATE INDEX idx_work_orders_site ON work_orders(site_id);
CREATE INDEX idx_work_orders_building ON work_orders(building_id);
CREATE INDEX idx_work_orders_enterprise ON work_orders(enterprise_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_priority ON work_orders(priority);
CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX idx_work_orders_created ON work_orders(created_at);
CREATE INDEX idx_work_orders_number ON work_orders(work_order_number);

-- Work Order Assets
CREATE INDEX idx_work_order_assets_wo ON work_order_assets(work_order_id);
CREATE INDEX idx_work_order_assets_asset ON work_order_assets(asset_id);

-- Activities
CREATE INDEX idx_activities_work_order ON work_order_activities(work_order_id);
CREATE INDEX idx_activities_created ON work_order_activities(created_at);

-- PPM
CREATE INDEX idx_ppm_schedules_asset ON ppm_schedules(asset_id);
CREATE INDEX idx_ppm_schedules_date ON ppm_schedules(scheduled_date);
CREATE INDEX idx_ppm_schedules_status ON ppm_schedules(status);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Audit
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_enterprises_updated_at BEFORE UPDATE ON enterprises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ppm_schedules_updated_at BEFORE UPDATE ON ppm_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_schedules_updated_at BEFORE UPDATE ON pm_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_part_stock_updated_at BEFORE UPDATE ON part_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_contracts_updated_at BEFORE UPDATE ON vendor_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default admin user (password: Admin@123)
-- Note: Replace with actual bcrypt hash when seeding
INSERT INTO users (email, password_hash, name, role, status) 
VALUES ('admin@workix.com', '$2a$10$rQEY7xGcj9Gk8hGxK9QUPOvqOHHGnPHfGXsWfxH7xGhGxH7xGhGxH', 'System Administrator', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample technician (password: Tech@123)
INSERT INTO users (email, password_hash, name, role, status, phone) 
VALUES ('john.tech@workix.com', '$2a$10$rQEY7xGcj9Gk8hGxK9QUPOvqOHHGnPHfGXsWfxH7xGhGxH7xGhGxH', 'John Technician', 'technician', 'active', '+971501234567')
ON CONFLICT (email) DO NOTHING;
