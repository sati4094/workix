-- Migration: Update projects table to use enterprise_id instead of client_id
-- This migration is safe and maintains backward compatibility by keeping data

-- Step 1: Add enterprise_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='projects' AND column_name='enterprise_id') THEN
        ALTER TABLE projects ADD COLUMN enterprise_id UUID;
    END IF;
END $$;

-- Step 2: Copy data from client_id to enterprise_id (if client_id exists and enterprise_id is null)
UPDATE projects 
SET enterprise_id = client_id 
WHERE enterprise_id IS NULL AND client_id IS NOT NULL;

-- Step 3: Add foreign key constraint to enterprises table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_projects_enterprise') THEN
        ALTER TABLE projects 
        ADD CONSTRAINT fk_projects_enterprise 
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create index for enterprise_id
CREATE INDEX IF NOT EXISTS idx_projects_enterprise ON projects(enterprise_id);

-- Step 5: Drop old client_id foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey') THEN
        ALTER TABLE projects DROP CONSTRAINT projects_client_id_fkey;
    END IF;
END $$;

-- Step 6: Drop old client_id index if it exists
DROP INDEX IF EXISTS idx_projects_client;

-- Step 7: Keep client_id column for backward compatibility but make it nullable
ALTER TABLE projects ALTER COLUMN client_id DROP NOT NULL;

-- Verification query
SELECT 
    COUNT(*) as total_projects,
    COUNT(enterprise_id) as projects_with_enterprise,
    COUNT(client_id) as projects_with_client
FROM projects;
