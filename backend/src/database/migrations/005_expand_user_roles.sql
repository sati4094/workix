-- Expand user_role enum with new platform and management roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'supertech';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'portfolio_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'facility_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'engineer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'basic_user';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'analyst';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'client';

-- Ensure enterprise/site association columns exist on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS enterprise_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS site_id UUID;

-- Apply foreign keys if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_users_enterprise_id'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_enterprise_id
      FOREIGN KEY (enterprise_id)
      REFERENCES enterprises(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_users_site_id'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_site_id
      FOREIGN KEY (site_id)
      REFERENCES sites(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Create helper indexes for tenant scoping
CREATE INDEX IF NOT EXISTS idx_users_enterprise_id ON users(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
