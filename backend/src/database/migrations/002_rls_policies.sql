-- ============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

CREATE POLICY org_workix_staff ON organizations
    FOR ALL TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY org_own_org ON organizations
    FOR ALL TO PUBLIC
    USING (id = current_user_org_id());

-- ============================================
-- PORTFOLIOS POLICIES
-- ============================================

CREATE POLICY portfolio_workix_staff ON portfolios
    FOR ALL TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY portfolio_admin ON portfolios
    FOR ALL TO PUBLIC
    USING (
        organization_id = current_user_org_id() 
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY portfolio_manager ON portfolios
    FOR ALL TO PUBLIC
    USING (
        id = current_user_portfolio_id()
        OR manager_id = current_user_id()
    );

CREATE POLICY portfolio_facility_users ON portfolios
    FOR SELECT TO PUBLIC
    USING (
        id IN (
            SELECT portfolio_id FROM sites WHERE id = current_user_facility_id()
        )
    );

-- ============================================
-- SITES/FACILITIES POLICIES
-- ============================================

CREATE POLICY site_workix_staff ON sites
    FOR ALL TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY site_admin ON sites
    FOR ALL TO PUBLIC
    USING (
        organization_id = current_user_org_id() 
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY site_portfolio_manager ON sites
    FOR ALL TO PUBLIC
    USING (portfolio_id = current_user_portfolio_id());

CREATE POLICY site_facility_staff ON sites
    FOR ALL TO PUBLIC
    USING (
        id = current_user_facility_id()
        OR facility_manager_id = current_user_id()
    );

CREATE POLICY site_additional_access ON sites
    FOR SELECT TO PUBLIC
    USING (
        id IN (
            SELECT facility_id 
            FROM user_facility_access 
            WHERE user_id = current_user_id() 
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- ============================================
-- USERS POLICIES
-- ============================================

CREATE POLICY user_workix_staff ON users
    FOR ALL TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY user_admin ON users
    FOR ALL TO PUBLIC
    USING (
        organization_id = current_user_org_id()
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY user_portfolio_manager ON users
    FOR SELECT TO PUBLIC
    USING (
        current_user_role_slug() = 'portfolio_manager'
        AND (
            portfolio_id = current_user_portfolio_id()
            OR facility_id IN (
                SELECT id FROM sites WHERE portfolio_id = current_user_portfolio_id()
            )
        )
    );

CREATE POLICY user_facility_manager ON users
    FOR SELECT TO PUBLIC
    USING (
        current_user_role_slug() = 'facility_manager'
        AND facility_id = current_user_facility_id()
    );

CREATE POLICY user_facility_staff ON users
    FOR SELECT TO PUBLIC
    USING (
        facility_id = current_user_facility_id()
        AND current_user_role_slug() IN ('engineer', 'technician')
    );

CREATE POLICY user_self ON users
    FOR ALL TO PUBLIC
    USING (id = current_user_id());

-- ============================================
-- WORK ORDERS POLICIES
-- ============================================

CREATE POLICY wo_workix_staff ON work_orders
    FOR ALL TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY wo_admin ON work_orders
    FOR ALL TO PUBLIC
    USING (
        site_id IN (
            SELECT id FROM sites WHERE organization_id = current_user_org_id()
        )
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY wo_portfolio_manager ON work_orders
    FOR ALL TO PUBLIC
    USING (
        site_id IN (
            SELECT id FROM sites WHERE portfolio_id = current_user_portfolio_id()
        )
    );

CREATE POLICY wo_facility_manager ON work_orders
    FOR ALL TO PUBLIC
    USING (site_id = current_user_facility_id());

CREATE POLICY wo_engineer ON work_orders
    FOR ALL TO PUBLIC
    USING (
        site_id = current_user_facility_id()
        AND current_user_role_slug() = 'engineer'
    );

CREATE POLICY wo_technician ON work_orders
    FOR ALL TO PUBLIC
    USING (
        (assigned_to = current_user_id() OR site_id = current_user_facility_id())
        AND current_user_role_slug() = 'technician'
    );

CREATE POLICY wo_basic_user ON work_orders
    FOR SELECT TO PUBLIC
    USING (
        created_by = current_user_id()
        AND current_user_role_slug() = 'basic_user'
    );

-- ============================================
-- ASSETS POLICIES
-- ============================================

CREATE POLICY asset_workix_staff ON assets 
    FOR ALL TO PUBLIC 
    USING (is_workix_staff() = true);

CREATE POLICY asset_admin ON assets 
    FOR ALL TO PUBLIC 
    USING (
        site_id IN (SELECT id FROM sites WHERE organization_id = current_user_org_id()) 
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY asset_portfolio_manager ON assets 
    FOR ALL TO PUBLIC 
    USING (site_id IN (SELECT id FROM sites WHERE portfolio_id = current_user_portfolio_id()));

CREATE POLICY asset_facility_staff ON assets 
    FOR ALL TO PUBLIC 
    USING (site_id = current_user_facility_id());

CREATE POLICY asset_basic_user ON assets 
    FOR SELECT TO PUBLIC 
    USING (site_id = current_user_facility_id());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

CREATE POLICY audit_workix_staff ON audit_logs
    FOR SELECT TO PUBLIC
    USING (is_workix_staff() = true);

CREATE POLICY audit_admin ON audit_logs
    FOR SELECT TO PUBLIC
    USING (
        organization_id = current_user_org_id()
        AND current_user_role_slug() = 'admin'
    );

CREATE POLICY audit_portfolio_manager ON audit_logs
    FOR SELECT TO PUBLIC
    USING (
        facility_id IN (
            SELECT id FROM sites WHERE portfolio_id = current_user_portfolio_id()
        )
    );

-- ============================================
-- RLS Policies complete
-- ============================================
