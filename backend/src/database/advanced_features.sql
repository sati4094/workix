-- ============================================
-- ADVANCED FEATURES - Work Order Templates & SLA Management
-- ============================================

-- Work Order Templates
CREATE TABLE IF NOT EXISTS work_order_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority work_order_priority NOT NULL DEFAULT 'medium',
    estimated_hours DECIMAL(5, 2),
    default_checklist JSONB,
    required_parts JSONB,
    instructions TEXT,
    safety_notes TEXT,
    attachments JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_wo_templates_category ON work_order_templates(category);
CREATE INDEX idx_wo_templates_active ON work_order_templates(is_active);

-- SLA Policies
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority work_order_priority NOT NULL,
    response_time_hours INT NOT NULL,
    resolution_time_hours INT NOT NULL,
    escalation_enabled BOOLEAN DEFAULT true,
    escalation_1_hours INT,
    escalation_1_notify JSONB,
    escalation_2_hours INT,
    escalation_2_notify JSONB,
    escalation_3_hours INT,
    escalation_3_notify JSONB,
    business_hours_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sla_priority ON sla_policies(priority);
CREATE INDEX idx_sla_active ON sla_policies(is_active);

-- SLA Violations Tracking
CREATE TABLE IF NOT EXISTS sla_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    sla_policy_id UUID REFERENCES sla_policies(id),
    violation_type VARCHAR(50) NOT NULL, -- 'response', 'resolution'
    expected_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_time TIMESTAMP WITH TIME ZONE,
    delay_hours DECIMAL(5, 2),
    escalation_level INT DEFAULT 0,
    notified_users JSONB,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sla_violations_wo ON sla_violations(work_order_id);
CREATE INDEX idx_sla_violations_type ON sla_violations(violation_type);

-- Asset Hierarchy
CREATE TABLE IF NOT EXISTS asset_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    child_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'contains', -- 'contains', 'powers', 'feeds'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_asset_id, child_asset_id)
);

CREATE INDEX idx_asset_rel_parent ON asset_relationships(parent_asset_id);
CREATE INDEX idx_asset_rel_child ON asset_relationships(child_asset_id);

-- Parts Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    manufacturer VARCHAR(255),
    unit_of_measure VARCHAR(50) DEFAULT 'EA',
    unit_cost DECIMAL(10, 2),
    quantity_on_hand INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    reorder_quantity INT DEFAULT 0,
    location VARCHAR(255),
    barcode VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_part_number ON inventory_items(part_number);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_active ON inventory_items(is_active);

-- Parts Usage Tracking
CREATE TABLE IF NOT EXISTS parts_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    quantity_used INT NOT NULL,
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
    notes TEXT,
    used_by UUID REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parts_usage_wo ON parts_usage(work_order_id);
CREATE INDEX idx_parts_usage_item ON parts_usage(inventory_item_id);

-- Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'adjustment', 'return'
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2),
    reference_type VARCHAR(50), -- 'work_order', 'purchase_order', 'adjustment'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_trans_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);

-- Work Order Attachments
CREATE TABLE IF NOT EXISTS work_order_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wo_attachments_wo ON work_order_attachments(work_order_id);

-- Asset Documents
CREATE TABLE IF NOT EXISTS asset_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    document_type VARCHAR(100), -- 'manual', 'warranty', 'drawing', 'certificate', 'photo'
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_docs_asset ON asset_documents(asset_id);
CREATE INDEX idx_asset_docs_type ON asset_documents(document_type);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'work_order', 'sla_violation', 'escalation', 'assignment'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    priority VARCHAR(50) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via JSONB, -- {email: true, push: true, sms: false}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Default SLA Policies
INSERT INTO sla_policies (name, description, priority, response_time_hours, resolution_time_hours, escalation_1_hours, escalation_2_hours, escalation_3_hours)
VALUES 
    ('Critical Priority SLA', 'For critical equipment failures requiring immediate attention', 'critical', 1, 4, 2, 3, 4),
    ('High Priority SLA', 'For high priority issues affecting operations', 'high', 2, 8, 4, 6, 8),
    ('Medium Priority SLA', 'For standard maintenance requests', 'medium', 4, 24, 12, 18, 24),
    ('Low Priority SLA', 'For routine tasks and minor issues', 'low', 8, 48, 24, 36, 48);

-- Default Work Order Templates
INSERT INTO work_order_templates (name, description, category, priority, estimated_hours, default_checklist, instructions)
VALUES 
    ('Chiller Preventive Maintenance', 'Routine PM for chillers', 'Preventive Maintenance', 'medium', 4.0,
     '["Check refrigerant levels", "Inspect compressor operation", "Clean condenser coils", "Check oil levels", "Test safety controls", "Verify temperature differential", "Check for leaks", "Document readings"]',
     'Follow manufacturer specifications. Record all readings in the maintenance log. Report any abnormalities immediately.'),
    
    ('AHU Filter Replacement', 'Replace air handling unit filters', 'Preventive Maintenance', 'low', 1.5,
     '["Check filter size and type", "Remove old filters", "Inspect housing for damage", "Install new filters", "Check airflow", "Verify pressure differential", "Update filter log"]',
     'Ensure proper filter direction. Check for bypass around filter frame.'),
    
    ('Pump Inspection', 'Routine pump inspection and maintenance', 'Preventive Maintenance', 'medium', 2.0,
     '["Check for leaks", "Inspect seals and gaskets", "Verify motor operation", "Check alignment", "Lubricate bearings", "Test vibration levels", "Verify pressure readings"]',
     'Follow lockout/tagout procedures. Use vibration analyzer for bearing check.'),
    
    ('Emergency Repair', 'Template for emergency breakdown repairs', 'Emergency', 'critical', 2.0,
     '["Assess situation", "Ensure safety", "Isolate equipment", "Identify root cause", "Source required parts", "Complete repair", "Test operation", "Document findings"]',
     'Safety first. Contact supervisor if major repairs needed. Document all actions taken.');

COMMENT ON TABLE work_order_templates IS 'Reusable templates for common work orders with predefined checklists';
COMMENT ON TABLE sla_policies IS 'Service Level Agreement policies with response and resolution timeframes';
COMMENT ON TABLE asset_relationships IS 'Hierarchical relationships between assets (parent-child, dependencies)';
COMMENT ON TABLE inventory_items IS 'Parts and materials inventory for maintenance operations';
COMMENT ON TABLE notifications IS 'User notification queue for real-time alerts';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of all database changes';
