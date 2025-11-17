-- Workix Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geo-location (optional but recommended)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'technician', 'analyst', 'manager', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE work_order_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE work_order_status AS ENUM ('pending', 'acknowledged', 'in_progress', 'parts_pending', 'completed', 'cancelled');
CREATE TYPE work_order_source AS ENUM ('performance_deviation', 'customer_complaint', 'preventive_maintenance', 'manual');

CREATE TYPE activity_type AS ENUM ('observation', 'action_taken', 'recommendation', 'status_change', 'comment', 'parts_used');

CREATE TYPE ppm_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual');
CREATE TYPE ppm_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'overdue');

CREATE TYPE asset_type AS ENUM ('chiller', 'ahu', 'pump', 'cooling_tower', 'boiler', 'vfd', 'motor', 'compressor', 'other');

-- ============================================
-- USERS TABLE
-- ============================================

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- CLIENTS TABLE
-- ============================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_clients_name ON clients(name);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    contract_number VARCHAR(100),
    contract_start_date DATE,
    contract_end_date DATE,
    contract_value DECIMAL(15, 2),
    project_manager_id UUID REFERENCES users(id),
    description TEXT,
    performance_baseline JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);

-- ============================================
-- SITES TABLE
-- ============================================

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    operating_hours VARCHAR(100),
    site_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_sites_project ON sites(project_id);
CREATE INDEX idx_sites_location ON sites(latitude, longitude);

-- ============================================
-- ASSETS TABLE
-- ============================================

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_assets_site ON assets(site_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_tag ON assets(asset_tag);
CREATE INDEX idx_assets_status ON assets(status);

-- ============================================
-- WORK ORDERS TABLE
-- ============================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source work_order_source NOT NULL,
    priority work_order_priority NOT NULL DEFAULT 'medium',
    status work_order_status NOT NULL DEFAULT 'pending',
    site_id UUID NOT NULL REFERENCES sites(id),
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    performance_deviation_details JSONB,
    customer_complaint_details JSONB,
    reference_pictures JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    customer_signature TEXT,
    customer_signed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workorders_number ON work_orders(work_order_number);
CREATE INDEX idx_workorders_status ON work_orders(status);
CREATE INDEX idx_workorders_priority ON work_orders(priority);
CREATE INDEX idx_workorders_assigned ON work_orders(assigned_to);
CREATE INDEX idx_workorders_site ON work_orders(site_id);
CREATE INDEX idx_workorders_created ON work_orders(created_at);

-- ============================================
-- WORK ORDER ASSETS (Many-to-Many)
-- ============================================

CREATE TABLE work_order_assets (
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    PRIMARY KEY (work_order_id, asset_id)
);

CREATE INDEX idx_wo_assets_workorder ON work_order_assets(work_order_id);
CREATE INDEX idx_wo_assets_asset ON work_order_assets(asset_id);

-- ============================================
-- WORK ORDER ACTIVITIES TABLE
-- ============================================

CREATE TABLE work_order_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    description TEXT NOT NULL,
    ai_enhanced BOOLEAN DEFAULT FALSE,
    original_text TEXT,
    pictures JSONB,
    parts_used JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_activities_workorder ON work_order_activities(work_order_id);
CREATE INDEX idx_wo_activities_type ON work_order_activities(activity_type);
CREATE INDEX idx_wo_activities_created ON work_order_activities(created_at);

-- ============================================
-- PPM PLANS TABLE
-- ============================================

CREATE TABLE ppm_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    asset_type asset_type,
    frequency ppm_frequency NOT NULL,
    tasks_checklist JSONB NOT NULL,
    estimated_duration_minutes INTEGER,
    required_parts JSONB,
    instructions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_ppm_plans_type ON ppm_plans(asset_type);
CREATE INDEX idx_ppm_plans_active ON ppm_plans(is_active);

-- ============================================
-- PPM SCHEDULES TABLE
-- ============================================

CREATE TABLE ppm_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ppm_plan_id UUID NOT NULL REFERENCES ppm_plans(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assigned_technician_id UUID REFERENCES users(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status ppm_status NOT NULL DEFAULT 'scheduled',
    work_order_id UUID REFERENCES work_orders(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ppm_schedules_plan ON ppm_schedules(ppm_plan_id);
CREATE INDEX idx_ppm_schedules_asset ON ppm_schedules(asset_id);
CREATE INDEX idx_ppm_schedules_technician ON ppm_schedules(assigned_technician_id);
CREATE INDEX idx_ppm_schedules_date ON ppm_schedules(scheduled_date);
CREATE INDEX idx_ppm_schedules_status ON ppm_schedules(status);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_order_activities_updated_at BEFORE UPDATE ON work_order_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppm_plans_updated_at BEFORE UPDATE ON ppm_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ppm_schedules_updated_at BEFORE UPDATE ON ppm_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    year_str VARCHAR(4);
BEGIN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 6) AS INTEGER)), 0) + 1
    INTO next_num
    FROM work_orders
    WHERE work_order_number LIKE 'WO' || year_str || '%';
    
    NEW.work_order_number := 'WO' || year_str || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_wo_number BEFORE INSERT ON work_orders
    FOR EACH ROW EXECUTE FUNCTION generate_work_order_number();

-- ============================================
-- VIEWS
-- ============================================

-- View for work order summary with related data
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
    (SELECT COUNT(*) FROM work_order_activities WHERE work_order_id = wo.id) AS activity_count,
    (SELECT COUNT(*) FROM work_order_assets WHERE work_order_id = wo.id) AS asset_count
FROM work_orders wo
JOIN sites s ON wo.site_id = s.id
JOIN projects p ON s.project_id = p.id
JOIN clients c ON p.client_id = c.id
LEFT JOIN users assigned_user ON wo.assigned_to = assigned_user.id
LEFT JOIN users reported_user ON wo.reported_by = reported_user.id;

-- View for technician workload
CREATE OR REPLACE VIEW technician_workload AS
SELECT 
    u.id AS technician_id,
    u.name AS technician_name,
    COUNT(CASE WHEN wo.status IN ('acknowledged', 'in_progress') THEN 1 END) AS active_work_orders,
    COUNT(CASE WHEN wo.status = 'pending' THEN 1 END) AS pending_work_orders,
    COUNT(CASE WHEN wo.status = 'completed' AND wo.completed_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS completed_last_30_days,
    COUNT(CASE WHEN ps.status = 'scheduled' AND ps.scheduled_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) AS upcoming_ppm_count
FROM users u
LEFT JOIN work_orders wo ON u.id = wo.assigned_to
LEFT JOIN ppm_schedules ps ON u.id = ps.assigned_technician_id
WHERE u.role = 'technician' AND u.status = 'active'
GROUP BY u.id, u.name;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default admin user (password: Admin@123)
INSERT INTO users (email, password_hash, name, role, status) VALUES
('admin@workix.com', '$2a$10$YourHashedPasswordHere', 'System Administrator', 'admin', 'active');

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores all system users including technicians, admins, analysts, and clients';
COMMENT ON TABLE work_orders IS 'Main table for service requests and maintenance tasks';
COMMENT ON TABLE assets IS 'Equipment and machinery tracked for maintenance';
COMMENT ON TABLE ppm_schedules IS 'Preventive maintenance schedules';

