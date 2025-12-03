-- ============================================
-- SEED DATA FOR ENTERPRISE USER MANAGEMENT
-- Migration: 003_seed_data.sql
-- ============================================

-- ============================================
-- 1. SEED SYSTEM ROLES
-- ============================================

INSERT INTO system_roles (name, slug, level, scope, is_workix_role, can_view_all_orgs, can_impersonate, can_manage_users, can_manage_facilities, can_assign_work_orders, can_approve_work_orders, description, color) VALUES
('SuperAdmin', 'superadmin', 0, 'platform', true, true, true, true, true, true, true, 'Workix platform administrator with access to all organizations', '#dc2626'),
('SuperTech', 'supertech', 1, 'platform', true, true, false, false, false, true, false, 'Workix technical support team', '#ea580c'),
('Admin', 'admin', 2, 'organization', false, false, false, true, true, true, true, 'Client organization administrator', '#7c3aed'),
('Portfolio Manager', 'portfolio_manager', 3, 'portfolio', false, false, false, false, true, true, true, 'Manages multiple facilities within a portfolio', '#2563eb'),
('Facility Manager', 'facility_manager', 4, 'facility', false, false, false, false, true, true, true, 'Manages a single facility', '#059669'),
('Engineer', 'engineer', 5, 'facility', false, false, false, false, false, true, true, 'Engineering staff with technical oversight', '#0891b2'),
('Technician', 'technician', 6, 'facility', false, false, false, false, false, false, false, 'Field technician performing maintenance', '#f59e0b'),
('Basic User', 'basic_user', 7, 'self', false, false, false, false, false, false, false, 'View-only access to assigned items', '#64748b')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    scope = EXCLUDED.scope,
    is_workix_role = EXCLUDED.is_workix_role,
    can_view_all_orgs = EXCLUDED.can_view_all_orgs,
    can_impersonate = EXCLUDED.can_impersonate,
    can_manage_users = EXCLUDED.can_manage_users,
    can_manage_facilities = EXCLUDED.can_manage_facilities,
    can_assign_work_orders = EXCLUDED.can_assign_work_orders,
    can_approve_work_orders = EXCLUDED.can_approve_work_orders;

-- ============================================
-- 2. SEED PERMISSIONS
-- ============================================

INSERT INTO permissions (name, slug, resource, action, description, category) VALUES
-- Work Orders
('Create Work Orders', 'work_orders.create', 'work_orders', 'create', 'Create new work orders', 'Work Orders'),
('Read All Work Orders', 'work_orders.read_all', 'work_orders', 'read', 'View all work orders', 'Work Orders'),
('Read Assigned Work Orders', 'work_orders.read_assigned', 'work_orders', 'read', 'View only assigned work orders', 'Work Orders'),
('Update Work Orders', 'work_orders.update', 'work_orders', 'update', 'Modify work orders', 'Work Orders'),
('Delete Work Orders', 'work_orders.delete', 'work_orders', 'delete', 'Delete work orders', 'Work Orders'),
('Assign Work Orders', 'work_orders.assign', 'work_orders', 'assign', 'Assign work orders to users', 'Work Orders'),
('Approve Work Orders', 'work_orders.approve', 'work_orders', 'approve', 'Approve work order completion', 'Work Orders'),
('Close Work Orders', 'work_orders.close', 'work_orders', 'close', 'Close completed work orders', 'Work Orders'),
('Export Work Orders', 'work_orders.export', 'work_orders', 'export', 'Export work orders data', 'Work Orders'),

-- Assets
('Create Assets', 'assets.create', 'assets', 'create', 'Create new assets', 'Assets'),
('Read Assets', 'assets.read', 'assets', 'read', 'View assets', 'Assets'),
('Update Assets', 'assets.update', 'assets', 'update', 'Modify assets', 'Assets'),
('Delete Assets', 'assets.delete', 'assets', 'delete', 'Delete assets', 'Assets'),
('Export Assets', 'assets.export', 'assets', 'export', 'Export assets data', 'Assets'),

-- Users
('Create Users', 'users.create', 'users', 'create', 'Create new users', 'Users'),
('Read All Users', 'users.read_all', 'users', 'read', 'View all users', 'Users'),
('Update Users', 'users.update', 'users', 'update', 'Modify users', 'Users'),
('Delete Users', 'users.delete', 'users', 'delete', 'Delete users', 'Users'),
('Assign Roles', 'users.assign_roles', 'users', 'assign', 'Assign roles to users', 'Users'),
('Manage Permissions', 'users.manage_permissions', 'users', 'manage', 'Manage user permissions', 'Users'),
('Impersonate Users', 'users.impersonate', 'users', 'impersonate', 'Login as another user', 'Users'),

-- Organizations
('Create Organizations', 'organizations.create', 'organizations', 'create', 'Create new organizations', 'Organizations'),
('Read Organizations', 'organizations.read', 'organizations', 'read', 'View organizations', 'Organizations'),
('Update Organizations', 'organizations.update', 'organizations', 'update', 'Modify organizations', 'Organizations'),
('Delete Organizations', 'organizations.delete', 'organizations', 'delete', 'Delete organizations', 'Organizations'),

-- Portfolios
('Create Portfolios', 'portfolios.create', 'portfolios', 'create', 'Create new portfolios', 'Portfolios'),
('Read Portfolios', 'portfolios.read', 'portfolios', 'read', 'View portfolios', 'Portfolios'),
('Update Portfolios', 'portfolios.update', 'portfolios', 'update', 'Modify portfolios', 'Portfolios'),
('Delete Portfolios', 'portfolios.delete', 'portfolios', 'delete', 'Delete portfolios', 'Portfolios'),

-- Facilities
('Create Facilities', 'facilities.create', 'facilities', 'create', 'Create new facilities', 'Facilities'),
('Read Facilities', 'facilities.read', 'facilities', 'read', 'View facilities', 'Facilities'),
('Update Facilities', 'facilities.update', 'facilities', 'update', 'Modify facilities', 'Facilities'),
('Delete Facilities', 'facilities.delete', 'facilities', 'delete', 'Delete facilities', 'Facilities'),

-- Reports
('View Basic Reports', 'reports.view_basic', 'reports', 'read', 'View basic reports', 'Reports'),
('View Advanced Reports', 'reports.view_advanced', 'reports', 'read', 'View advanced analytics', 'Reports'),
('Export Reports', 'reports.export', 'reports', 'export', 'Export report data', 'Reports'),

-- System
('View Audit Logs', 'system.view_audit_logs', 'system', 'read', 'View system audit logs', 'System'),
('Manage Settings', 'system.manage_settings', 'system', 'manage', 'Manage system settings', 'System')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- SuperAdmin gets all permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'superadmin'),
    id,
    true
FROM permissions
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Admin permissions (organization level)
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'admin'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.create', 'work_orders.read_all', 'work_orders.update', 'work_orders.delete', 'work_orders.assign', 'work_orders.approve', 'work_orders.close', 'work_orders.export',
    'assets.create', 'assets.read', 'assets.update', 'assets.delete', 'assets.export',
    'users.create', 'users.read_all', 'users.update', 'users.delete', 'users.assign_roles', 'users.manage_permissions',
    'organizations.read', 'organizations.update',
    'portfolios.create', 'portfolios.read', 'portfolios.update', 'portfolios.delete',
    'facilities.create', 'facilities.read', 'facilities.update', 'facilities.delete',
    'reports.view_basic', 'reports.view_advanced', 'reports.export',
    'system.view_audit_logs'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Portfolio Manager permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'portfolio_manager'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.create', 'work_orders.read_all', 'work_orders.update', 'work_orders.assign', 'work_orders.approve', 'work_orders.close', 'work_orders.export',
    'assets.create', 'assets.read', 'assets.update', 'assets.export',
    'facilities.read', 'facilities.update',
    'reports.view_basic', 'reports.view_advanced', 'reports.export'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Facility Manager permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'facility_manager'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.create', 'work_orders.read_all', 'work_orders.update', 'work_orders.assign', 'work_orders.approve', 'work_orders.close',
    'assets.create', 'assets.read', 'assets.update',
    'facilities.read', 'facilities.update',
    'reports.view_basic', 'reports.export'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Engineer permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'engineer'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.create', 'work_orders.read_all', 'work_orders.update', 'work_orders.assign', 'work_orders.approve',
    'assets.read', 'assets.update',
    'facilities.read',
    'reports.view_basic'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Technician permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'technician'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.read_assigned', 'work_orders.update',
    'assets.read'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- Basic User permissions
INSERT INTO role_permissions (system_role_id, permission_id, granted)
SELECT 
    (SELECT id FROM system_roles WHERE slug = 'basic_user'),
    id,
    true
FROM permissions
WHERE slug IN (
    'work_orders.read_assigned',
    'assets.read'
)
ON CONFLICT (system_role_id, permission_id) DO NOTHING;

-- ============================================
-- 4. CREATE WORKIX ORGANIZATION
-- ============================================

INSERT INTO organizations (id, name, slug, domain, subscription_tier, subscription_status, max_users, max_facilities, is_active)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Workix', 'workix', 'workix.com', 'enterprise', 'active', 1000, 1000, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. CREATE DEMO CLIENT ORGANIZATION
-- ============================================

INSERT INTO organizations (id, name, slug, domain, subscription_tier, subscription_status, max_users, max_facilities, is_active, primary_contact_name, primary_contact_email)
VALUES 
('00000000-0000-0000-0000-000000000002', 'ACME Corporation', 'acme', 'acme.com', 'professional', 'active', 100, 50, true, 'John Doe', 'contact@acme.com')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. CREATE SAMPLE USERS (password: Admin@123)
-- ============================================

-- SuperAdmin (Workix) - Password: Admin@123
INSERT INTO users (id, organization_id, email, password_hash, name, system_role_id, status, email_verified, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@workix.com',
    '$2a$10$bhFOPhz0LcUdY3diurYex.HMlRf0Dj/Y0cy6ADEEdqx78IBV7FFja',
    'Workix Administrator',
    (SELECT id FROM system_roles WHERE slug = 'superadmin'),
    'active',
    true,
    'superadmin'
) ON CONFLICT (email) DO UPDATE SET
    system_role_id = EXCLUDED.system_role_id,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role;

-- SuperTech (Workix) - Password: Admin@123
INSERT INTO users (id, organization_id, email, password_hash, name, system_role_id, status, email_verified, role)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'support@workix.com',
    '$2a$10$bhFOPhz0LcUdY3diurYex.HMlRf0Dj/Y0cy6ADEEdqx78IBV7FFja',
    'Workix Support',
    (SELECT id FROM system_roles WHERE slug = 'supertech'),
    'active',
    true,
    'supertech'
) ON CONFLICT (email) DO UPDATE SET
    system_role_id = EXCLUDED.system_role_id,
    organization_id = EXCLUDED.organization_id;

-- ACME Admin - Password: Admin@123
INSERT INTO users (id, organization_id, email, password_hash, name, system_role_id, status, email_verified, role)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000002',
    'admin@acme.com',
    '$2a$10$bhFOPhz0LcUdY3diurYex.HMlRf0Dj/Y0cy6ADEEdqx78IBV7FFja',
    'ACME Administrator',
    (SELECT id FROM system_roles WHERE slug = 'admin'),
    'active',
    true,
    'admin'
) ON CONFLICT (email) DO UPDATE SET
    system_role_id = EXCLUDED.system_role_id,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role;

-- ============================================
-- Seed data complete
-- ============================================
