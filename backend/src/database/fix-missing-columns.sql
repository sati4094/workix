-- Fix missing columns for backend routes
-- Only add what's actually needed by the backend queries

-- 1. Add created_by to enterprises (referenced in enterprise.routes.js)
ALTER TABLE enterprises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2. Add enterprise_id to projects (backend uses enterprise_id, table has client_id)
-- Keep client_id for backward compatibility
ALTER TABLE projects ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id);

-- 3. Update existing projects to copy client_id to enterprise_id
UPDATE projects SET enterprise_id = client_id WHERE enterprise_id IS NULL;

-- 4. Add portfolio_id to sites (referenced in site.routes.js and asset.routes.js)
-- This is optional and can be NULL
ALTER TABLE sites ADD COLUMN IF NOT EXISTS portfolio_id INTEGER;

-- Note: portfolios table is not created because it's not essential
-- The LEFT JOIN will simply return NULL for portfolio_name

COMMENT ON COLUMN enterprises.created_by IS 'User who created this enterprise';
COMMENT ON COLUMN projects.enterprise_id IS 'Reference to enterprise (replaces client_id)';
COMMENT ON COLUMN sites.portfolio_id IS 'Optional portfolio grouping';
