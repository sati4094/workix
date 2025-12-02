-- Migrate clients to enterprises
INSERT INTO enterprises (
  id, name, address_line_1, city, state, country, postal_code,
  contact_person, contact_email, contact_phone,
  is_active, created_at, updated_at
)
SELECT 
  id, name, address, city, state, country, postal_code,
  contact_person, contact_email, contact_phone,
  true as is_active, created_at, updated_at
FROM clients
ON CONFLICT (id) DO NOTHING;

-- Now update projects to use enterprise_id
UPDATE projects SET enterprise_id = client_id WHERE enterprise_id IS NULL;

SELECT 'Migration complete: ' || COUNT(*) || ' clients migrated to enterprises' FROM enterprises;
