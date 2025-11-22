// ============================================
// ENTERPRISE CMMS FRONTEND TYPES
// Extended types for new database entities
// ============================================

// Import existing types
export * from './index';

// ============================================
// ORGANIZATIONS
// ============================================

export interface Organization {
  id: number;
  name: string;
  domain: string;
  timezone: string;
  currency: string;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
}

// ============================================
// LOCATION HIERARCHY
// ============================================

export interface Building {
  id: number;
  site_id: string;
  site_name?: string;
  name: string;
  description?: string;
  building_code?: string;
  floor_count?: number;
  gross_area?: number;
  occupancy_type?: string;
  year_built?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: number;
  building_id: number;
  building_name?: string;
  name: string;
  floor_number: number;
  area?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: number;
  floor_id: number;
  floor_name?: string;
  building_name?: string;
  name: string;
  space_type?: string;
  area?: number;
  capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ASSET MANAGEMENT ENHANCEMENT
// ============================================

export interface AssetCategory {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  parent_category_id?: number;
  parent_category_name?: string;
  is_system_category: boolean;
  created_at: string;
  updated_at: string;
  // For tree display
  children?: AssetCategory[];
  asset_type_count?: number;
}

export interface AssetType {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  asset_count?: number;
}

export interface AssetSpecification {
  id: number;
  asset_id: string;
  spec_key: string;
  spec_value?: string;
  unit?: string;
  created_at: string;
}

// Extended Asset interface (merges with existing)
export interface EnhancedAsset {
  id: string;
  site_id: string;
  building_id?: number;
  building_name?: string;
  floor_id?: number;
  floor_name?: string;
  space_id?: number;
  space_name?: string;
  category_id?: number;
  category_name?: string;
  asset_type_id?: number;
  asset_type_name?: string;
  parent_asset_id?: string;
  parent_asset_name?: string;
  asset_tag: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
  capacity_unit?: string;
  commissioning_date?: string;
  warranty_expiry_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  installation_date?: string;
  expected_life?: number;
  status: string;
  condition?: string;
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  location_details?: string;
  qr_code_url?: string;
  specifications?: AssetSpecification[];
  created_at: string;
  updated_at: string;
}

// ============================================
// WORK ORDER ENHANCEMENTS
// ============================================

export interface WorkOrderTask {
  id: number;
  work_order_id: string;
  sequence?: number;
  task_name: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  created_at: string;
}

export interface WorkOrderPart {
  id: number;
  work_order_id: string;
  part_id: number;
  part_number?: string;
  part_name?: string;
  quantity_used: number;
  unit_cost?: number;
  total_cost?: number;
  created_at: string;
}

export interface WorkOrderLabor {
  id: number;
  work_order_id: string;
  technician_id: string;
  technician_name?: string;
  start_time: string;
  end_time?: string;
  hours?: number;
  hourly_rate?: number;
  total_cost?: number;
  notes?: string;
  created_at: string;
}

export interface WorkOrderComment {
  id: number;
  work_order_id: string;
  comment_text: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  is_internal: boolean;
}

// Extended WorkOrder with new fields
export interface EnhancedWorkOrder {
  id: string;
  org_id: number;
  work_order_number: string;
  title: string;
  subject?: string;
  description?: string;
  source: string;
  priority: string;
  status: string;
  work_type?: 'Preventive' | 'Corrective' | 'Emergency' | 'Project';
  category?: string;
  site_id: string;
  site_name?: string;
  building_id?: number;
  building_name?: string;
  asset_id?: string;
  asset_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_team?: number;
  assigned_team_name?: string;
  created_by?: string;
  requested_by?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  completion_notes?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  due_date?: string;
  // Populated arrays
  tasks?: WorkOrderTask[];
  parts?: WorkOrderPart[];
  labor?: WorkOrderLabor[];
  comments?: WorkOrderComment[];
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
  asset_type_name?: string;
  category?: string;
  estimated_duration?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tasks?: PMTemplateTask[];
}

export interface PMTemplateTask {
  id: number;
  template_id: number;
  sequence: number;
  task_name: string;
  description?: string;
  is_mandatory: boolean;
  created_at: string;
}

export interface PMSchedule {
  id: number;
  org_id: number;
  asset_id: string;
  asset_name?: string;
  template_id?: number;
  template_name?: string;
  schedule_name: string;
  frequency_type: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Meter';
  frequency_value: number;
  start_date: string;
  end_date?: string;
  next_due_date?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PMExecution {
  id: number;
  schedule_id: number;
  work_order_id?: string;
  work_order_number?: string;
  scheduled_date: string;
  execution_status: 'Pending' | 'Generated' | 'Completed' | 'Skipped';
  generated_at?: string;
  completed_at?: string;
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
  created_at: string;
  updated_at: string;
  // Calculated
  total_stock?: number;
  low_stock?: boolean;
}

export interface Storeroom {
  id: number;
  org_id: number;
  site_id?: string;
  site_name?: string;
  name: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  part_count?: number;
}

export interface PartStock {
  id: number;
  part_id: number;
  part_number?: string;
  part_name?: string;
  site_id?: string;
  site_name?: string;
  storeroom_id?: number;
  storeroom_name?: string;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  last_updated: string;
  is_low?: boolean;
  is_out?: boolean;
}

export interface PartTransaction {
  id: number;
  part_id: number;
  part_number?: string;
  part_name?: string;
  storeroom_id?: number;
  storeroom_name?: string;
  transaction_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  work_order_id?: string;
  work_order_number?: string;
  performed_by?: string;
  performed_by_name?: string;
  notes?: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  contacts?: VendorContact[];
  active_contracts?: number;
}

export interface VendorContact {
  id: number;
  vendor_id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  created_at: string;
}

export interface VendorContract {
  id: number;
  org_id: number;
  vendor_id: number;
  vendor_name?: string;
  contract_number: string;
  contract_name: string;
  description?: string;
  contract_type?: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  contract_value?: number;
  billing_frequency?: string;
  status: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  created_at: string;
  updated_at: string;
  days_until_expiry?: number;
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
  team_lead_name?: string;
  is_active: boolean;
  created_at: string;
  members?: TeamMember[];
  member_count?: number;
}

export interface TeamMember {
  id: number;
  team_id: number;
  account_id: string;
  account_name?: string;
  account_email?: string;
  account_role?: string;
  joined_at: string;
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
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  user_count?: number;
}

export interface Permission {
  id: number;
  module_name: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  description?: string;
}

// ============================================
// BOOKINGS
// ============================================

export interface Booking {
  id: number;
  org_id: number;
  space_id?: number;
  space_name?: string;
  asset_id?: string;
  asset_name?: string;
  booked_by: string;
  booked_by_name?: string;
  booking_title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendees?: number;
  status: 'Confirmed' | 'Cancelled' | 'Completed';
  created_at: string;
  duration?: number; // in minutes
}

// ============================================
// UTILITY MANAGEMENT
// ============================================

export interface UtilityMeter {
  id: number;
  org_id: number;
  site_id?: string;
  site_name?: string;
  meter_name: string;
  meter_number: string;
  utility_type: 'electricity' | 'water' | 'gas' | 'steam';
  unit: string;
  multiplier: number;
  is_active: boolean;
  created_at: string;
  last_reading?: UtilityReading;
  monthly_consumption?: number;
}

export interface UtilityReading {
  id: number;
  meter_id: number;
  meter_name?: string;
  meter_number?: string;
  utility_type?: string;
  reading_date: string;
  reading_value: number;
  consumption?: number;
  cost?: number;
  recorded_by?: string;
  recorded_by_name?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// IOT AND SENSORS
// ============================================

export interface IoTDevice {
  id: number;
  org_id: number;
  asset_id?: string;
  asset_name?: string;
  device_name: string;
  device_type: 'sensor' | 'controller' | 'meter';
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  ip_address?: string;
  protocol?: string;
  status: 'online' | 'offline' | 'error';
  last_seen?: string;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
  latest_reading?: SensorReading;
}

export interface SensorReading {
  id: number;
  device_id: number;
  metric_name: string;
  value: number;
  unit?: string;
  reading_time: string;
  quality?: string;
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
  created_by_name?: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: number;
  org_id: number;
  dashboard_name: string;
  description?: string;
  layout: Record<string, any>;
  widgets: Record<string, any>;
  created_by?: string;
  created_by_name?: string;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  actions?: WorkflowAction[];
}

export interface WorkflowAction {
  id: number;
  workflow_id: number;
  sequence: number;
  action_type: string;
  config: Record<string, any>;
  created_at: string;
}

// ============================================
// API TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  search?: string;
  filters?: Record<string, any>;
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
  errors?: Record<string, string[]>;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateBuildingForm {
  site_id: string;
  name: string;
  description?: string;
  building_code?: string;
  floor_count?: number;
  gross_area?: number;
  occupancy_type?: string;
  year_built?: number;
}

export interface CreateFloorForm {
  building_id: number;
  name: string;
  floor_number: number;
  area?: number;
}

export interface CreateSpaceForm {
  floor_id: number;
  name: string;
  space_type?: string;
  area?: number;
  capacity?: number;
}

export interface CreatePartForm {
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
}

export interface CreateVendorForm {
  vendor_name: string;
  vendor_type?: 'Supplier' | 'Contractor' | 'Service Provider';
  email?: string;
  phone?: string;
  website?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  payment_terms?: string;
}

export interface CreatePMTemplateForm {
  name: string;
  description?: string;
  asset_type_id?: number;
  category?: string;
  estimated_duration?: number;
  tasks: {
    sequence: number;
    task_name: string;
    description?: string;
    is_mandatory: boolean;
  }[];
}

export interface CreateBookingForm {
  space_id?: number;
  asset_id?: string;
  booking_title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendees?: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface WorkOrderFilters {
  status?: string[];
  priority?: string[];
  work_type?: string[];
  site_id?: string;
  building_id?: number;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
}

export interface AssetFilters {
  status?: string[];
  category_id?: number;
  asset_type_id?: number;
  site_id?: string;
  building_id?: number;
  criticality?: string[];
}

export interface PartFilters {
  category?: string;
  low_stock?: boolean;
  storeroom_id?: number;
  is_active?: boolean;
}

export interface VendorFilters {
  vendor_type?: string[];
  is_active?: boolean;
  rating_min?: number;
}
