// ============================================
// ENTERPRISE CMMS TYPE DEFINITIONS
// TypeScript interfaces for all database entities
// ============================================

// ============================================
// ORGANIZATIONS AND MULTI-TENANCY
// ============================================

export interface Organization {
  id: number;
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  language: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  settings: Record<string, any>;
}

// ============================================
// ROLES AND PERMISSIONS
// ============================================

export interface Role {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  is_system_role: boolean;
  is_developer_role: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: number;
  module_name: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  description?: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: Date;
}

export interface AccountRole {
  id: number;
  account_id: string;
  role_id: number;
  assigned_at: Date;
  assigned_by?: string;
}

// ============================================
// LOCATION HIERARCHY
// ============================================

export interface Site {
  id: string;
  org_id: number;
  project_id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  site_notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface Building {
  id: number;
  site_id: string;
  name: string;
  description?: string;
  building_code?: string;
  floor_count?: number;
  gross_area?: number;
  occupancy_type?: string;
  year_built?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Floor {
  id: number;
  building_id: number;
  name: string;
  floor_number: number;
  area?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Space {
  id: number;
  floor_id: number;
  name: string;
  space_type?: string;
  area?: number;
  capacity?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// ASSET MANAGEMENT
// ============================================

export interface AssetCategory {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  parent_category_id?: number;
  is_system_category: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AssetType {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Asset {
  id: string;
  site_id: string;
  building_id?: number;
  floor_id?: number;
  space_id?: number;
  category_id?: number;
  asset_type_id?: number;
  parent_asset_id?: string;
  asset_tag: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
  capacity_unit?: string;
  commissioning_date?: Date;
  warranty_expiry_date?: Date;
  purchase_date?: Date;
  purchase_price?: number;
  installation_date?: Date;
  expected_life?: number;
  performance_baseline?: Record<string, any>;
  specifications?: Record<string, any>;
  location_details?: string;
  qr_code_url?: string;
  manual_url?: string;
  status: string;
  condition?: string;
  criticality?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface AssetSpecification {
  id: number;
  asset_id: string;
  spec_key: string;
  spec_value?: string;
  unit?: string;
  created_at: Date;
}

// ============================================
// WORK ORDERS
// ============================================

export interface WorkOrder {
  id: string;
  org_id: number;
  work_order_number: string;
  title: string;
  subject?: string;
  description?: string;
  source: string;
  priority: string;
  status: string;
  work_type?: string;
  category?: string;
  site_id: string;
  building_id?: number;
  asset_id?: string;
  reported_by?: string;
  assigned_to?: string;
  assigned_team?: number;
  created_by?: string;
  requested_by?: string;
  performance_deviation_details?: Record<string, any>;
  customer_complaint_details?: Record<string, any>;
  reference_pictures?: Record<string, any>;
  scheduled_start?: Date;
  scheduled_end?: Date;
  actual_start?: Date;
  actual_end?: Date;
  created_at: Date;
  acknowledged_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  closed_at?: Date;
  due_date?: Date;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  completion_notes?: string;
  rating?: number;
  customer_signature?: string;
  customer_signed_at?: Date;
  updated_at: Date;
}

export interface WorkOrderTask {
  id: number;
  work_order_id: string;
  sequence?: number;
  task_name: string;
  description?: string;
  is_completed: boolean;
  completed_at?: Date;
  completed_by?: string;
  created_at: Date;
}

export interface WorkOrderPart {
  id: number;
  work_order_id: string;
  part_id: number;
  quantity_used: number;
  unit_cost?: number;
  total_cost?: number;
  created_at: Date;
}

export interface WorkOrderLabor {
  id: number;
  work_order_id: string;
  technician_id: string;
  start_time: Date;
  end_time?: Date;
  hours?: number;
  hourly_rate?: number;
  total_cost?: number;
  notes?: string;
  created_at: Date;
}

export interface WorkOrderComment {
  id: number;
  work_order_id: string;
  comment_text: string;
  created_by: string;
  created_at: Date;
  is_internal: boolean;
}

// ============================================
// PREVENTIVE MAINTENANCE
// ============================================

export interface PMTemplate {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  asset_type_id?: number;
  category?: string;
  estimated_duration?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PMTemplateTask {
  id: number;
  template_id: number;
  sequence: number;
  task_name: string;
  description?: string;
  is_mandatory: boolean;
  created_at: Date;
}

export interface PMSchedule {
  id: number;
  org_id: number;
  asset_id: string;
  template_id?: number;
  schedule_name: string;
  frequency_type: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Meter';
  frequency_value: number;
  start_date: Date;
  end_date?: Date;
  next_due_date?: Date;
  assigned_to?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PMExecution {
  id: number;
  schedule_id: number;
  work_order_id?: string;
  scheduled_date: Date;
  execution_status: 'Pending' | 'Generated' | 'Completed' | 'Skipped';
  generated_at?: Date;
  completed_at?: Date;
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

export interface Part {
  id: number;
  org_id: number;
  part_number: string;
  part_name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  model_number?: string;
  unit_of_measure?: string;
  unit_cost?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Storeroom {
  id: number;
  org_id: number;
  site_id?: string;
  name: string;
  location?: string;
  is_active: boolean;
  created_at: Date;
}

export interface PartStock {
  id: number;
  part_id: number;
  site_id?: string;
  storeroom_id?: number;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  last_updated: Date;
}

export interface PartTransaction {
  id: number;
  part_id: number;
  storeroom_id?: number;
  transaction_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  work_order_id?: string;
  purchase_order_id?: number;
  performed_by?: string;
  notes?: string;
  created_at: Date;
}

// ============================================
// VENDOR MANAGEMENT
// ============================================

export interface Vendor {
  id: number;
  org_id: number;
  vendor_name: string;
  vendor_type?: 'Supplier' | 'Contractor' | 'Service Provider';
  email?: string;
  phone?: string;
  website?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  payment_terms?: string;
  is_active: boolean;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface VendorContact {
  id: number;
  vendor_id: number;
  first_name: string;
  last_name: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  created_at: Date;
}

export interface VendorContract {
  id: number;
  org_id: number;
  vendor_id: number;
  contract_number: string;
  contract_name: string;
  description?: string;
  contract_type?: string;
  start_date: Date;
  end_date?: Date;
  renewal_date?: Date;
  contract_value?: number;
  billing_frequency?: string;
  status: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  created_at: Date;
  updated_at: Date;
}

// ============================================
// TEAM MANAGEMENT
// ============================================

export interface Team {
  id: number;
  org_id: number;
  team_name: string;
  description?: string;
  team_lead?: string;
  is_active: boolean;
  created_at: Date;
}

export interface TeamMember {
  id: number;
  team_id: number;
  account_id: string;
  joined_at: Date;
}

// ============================================
// API AND INTEGRATION
// ============================================

export interface APIClient {
  id: number;
  org_id: number;
  client_name: string;
  client_id: string;
  client_secret: string;
  auth_type: 'API_KEY' | 'OAUTH2';
  grant_type?: string;
  redirect_uri?: string;
  scopes?: string;
  is_active: boolean;
  created_by?: string;
  created_at: Date;
  last_used?: Date;
}

export interface APIToken {
  id: number;
  client_id?: number;
  account_id?: string;
  token: string;
  token_type: 'access' | 'refresh';
  expires_at?: Date;
  is_revoked: boolean;
  created_at: Date;
}

export interface APILog {
  id: number;
  client_id?: number;
  account_id?: string;
  endpoint: string;
  method: string;
  status_code?: number;
  request_body?: Record<string, any>;
  response_body?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  execution_time?: number;
  created_at: Date;
}

export interface Connector {
  id: number;
  org_id: number;
  connector_name: string;
  connector_type: string;
  namespace: string;
  auth_type: string;
  credentials?: Record<string, any>;
  config?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// CUSTOM MODULES
// ============================================

export interface CustomModule {
  id: number;
  org_id: number;
  module_name: string;
  display_name: string;
  description?: string;
  parent_module_id?: number;
  icon?: string;
  is_system_module: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CustomField {
  id: number;
  module_id: number;
  field_name: string;
  display_name: string;
  field_type: string;
  data_type?: string;
  is_required: boolean;
  is_searchable: boolean;
  default_value?: string;
  validation_rules?: Record<string, any>;
  options?: Record<string, any>;
  sequence?: number;
  created_at: Date;
}

export interface CustomForm {
  id: number;
  module_id: number;
  form_name: string;
  description?: string;
  is_default: boolean;
  layout?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// AUDIT AND ACTIVITY
// ============================================

export interface AuditLog {
  id: string;
  org_id?: number;
  user_id?: string;
  module_name?: string;
  record_id?: number;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface ActivityFeed {
  id: number;
  org_id: number;
  account_id?: string;
  activity_type: string;
  module_name?: string;
  record_id?: number;
  description: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

// ============================================
// REPORTING
// ============================================

export interface Report {
  id: number;
  org_id: number;
  report_name: string;
  description?: string;
  report_type: 'table' | 'chart' | 'dashboard';
  module_name: string;
  columns: Record<string, any>;
  filters?: Record<string, any>;
  grouping?: Record<string, any>;
  sorting?: Record<string, any>;
  chart_config?: Record<string, any>;
  created_by?: string;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Dashboard {
  id: number;
  org_id: number;
  dashboard_name: string;
  description?: string;
  layout: Record<string, any>;
  widgets: Record<string, any>;
  created_by?: string;
  is_default: boolean;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============================================
// IOT AND SENSORS
// ============================================

export interface IoTDevice {
  id: number;
  org_id: number;
  asset_id?: string;
  device_name: string;
  device_type: 'sensor' | 'controller' | 'meter';
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  ip_address?: string;
  protocol?: string;
  status: 'online' | 'offline' | 'error';
  last_seen?: Date;
  config?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SensorReading {
  id: number;
  device_id: number;
  metric_name: string;
  value: number;
  unit?: string;
  reading_time: Date;
  quality?: string;
}

// ============================================
// BOOKINGS
// ============================================

export interface Booking {
  id: number;
  org_id: number;
  space_id?: number;
  asset_id?: string;
  booked_by: string;
  booking_title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  attendees?: number;
  status: 'Confirmed' | 'Cancelled' | 'Completed';
  created_at: Date;
}

// ============================================
// UTILITY MANAGEMENT
// ============================================

export interface UtilityMeter {
  id: number;
  org_id: number;
  site_id?: string;
  meter_name: string;
  meter_number: string;
  utility_type: 'electricity' | 'water' | 'gas' | 'steam';
  unit: string;
  multiplier: number;
  is_active: boolean;
  created_at: Date;
}

export interface UtilityReading {
  id: number;
  meter_id: number;
  reading_date: Date;
  reading_value: number;
  consumption?: number;
  cost?: number;
  recorded_by?: string;
  notes?: string;
  created_at: Date;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface NotificationTemplate {
  id: number;
  org_id: number;
  template_name: string;
  template_type: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  variables?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
}

export interface Notification {
  id: string;
  org_id?: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  notification_type?: string;
  reference_id?: string;
  reference_type?: string;
  related_entity?: string;
  related_id?: number;
  priority?: string;
  is_read: boolean;
  sent_at?: Date;
  read_at?: Date;
  created_at: Date;
}

// ============================================
// WORKFLOWS
// ============================================

export interface Workflow {
  id: number;
  org_id: number;
  workflow_name: string;
  description?: string;
  trigger_module: string;
  trigger_event: string;
  conditions?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowAction {
  id: number;
  workflow_id: number;
  sequence: number;
  action_type: string;
  config: Record<string, any>;
  created_at: Date;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
