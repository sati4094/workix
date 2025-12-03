-- Migration 006: Entity tagging for enterprises, sites, and users
-- Provides reusable tags table and bridge tables for entity associations

BEGIN;

-- Core tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(64) NOT NULL,
  color VARCHAR(20),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure case-insensitive uniqueness for labels
CREATE UNIQUE INDEX IF NOT EXISTS tags_label_unique_idx ON tags (LOWER(label));

-- Enterprise <> tag bridge
CREATE TABLE IF NOT EXISTS enterprise_tags (
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enterprise_id, tag_id)
);

-- Site <> tag bridge
CREATE TABLE IF NOT EXISTS site_tags (
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, tag_id)
);

-- User <> tag bridge
CREATE TABLE IF NOT EXISTS user_tags (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tag_id)
);

-- Helpful indexes for lookups
CREATE INDEX IF NOT EXISTS idx_enterprise_tags_tag_id ON enterprise_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_site_tags_tag_id ON site_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_id ON user_tags(tag_id);

COMMIT;
