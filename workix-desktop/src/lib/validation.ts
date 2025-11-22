import { z } from 'zod';

// ============================================================================
// Validation Schemas - Production Ready with Zod
// ============================================================================

// ========================================
// Work Order Schemas
// ========================================

export const workOrderSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must not exceed 5000 characters'),
  
  source: z.enum(['manual', 'ppm', 'performance_deviation', 'customer_complaint', 'inspection']),
  
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  
  status: z.enum(['pending', 'acknowledged', 'in_progress', 'on_hold', 'completed', 'cancelled', 'closed'])
    .optional(),
  
  site_id: z.string()
    .uuid('Please select a valid site'),
  
  asset_ids: z.array(z.string().uuid())
    .optional(),
  
  assigned_to: z.string()
    .uuid('Please select a valid technician')
    .optional(),
  
  due_date: z.string()
    .datetime('Invalid date format')
    .optional(),
  
  estimated_hours: z.number()
    .min(0, 'Estimated hours must be positive')
    .max(1000, 'Estimated hours seems too high')
    .optional(),
  
  actual_hours: z.number()
    .min(0, 'Actual hours must be positive')
    .optional(),
});

export const workOrderActivitySchema = z.object({
  work_order_id: z.string().uuid(),
  
  activity_type: z.enum(['observation', 'action_taken', 'recommendation', 'status_change', 'comment', 'parts_used']),
  
  description: z.string()
    .min(5, 'Activity description must be at least 5 characters')
    .max(2000, 'Activity description is too long'),
  
  ai_enhanced: z.boolean().optional(),
  
  original_text: z.string().optional(),
  
  pictures: z.array(z.string().url('Invalid image URL')).optional(),
  
  parts_used: z.array(z.object({
    part_name: z.string().min(1, 'Part name is required'),
    part_number: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unit_cost: z.number().min(0).optional(),
    total_cost: z.number().min(0).optional(),
  })).optional(),
});

// ========================================
// Asset Schemas
// ========================================

export const assetSchema = z.object({
  name: z.string()
    .min(2, 'Asset name must be at least 2 characters')
    .max(200, 'Asset name is too long'),
  
  asset_tag: z.string()
    .min(1, 'Asset tag is required')
    .max(50, 'Asset tag is too long')
    .regex(/^[A-Z0-9-]+$/, 'Asset tag must contain only uppercase letters, numbers, and hyphens'),
  
  type: z.string()
    .min(1, 'Asset type is required'),
  
  category: z.string().optional(),
  
  site_id: z.string()
    .uuid('Please select a valid site'),
  
  parent_asset_id: z.string()
    .uuid()
    .optional(),
  
  manufacturer: z.string()
    .max(100, 'Manufacturer name is too long')
    .optional(),
  
  model: z.string()
    .max(100, 'Model name is too long')
    .optional(),
  
  serial_number: z.string()
    .max(100, 'Serial number is too long')
    .optional(),
  
  description: z.string()
    .max(2000, 'Description is too long')
    .optional(),
  
  status: z.enum(['operational', 'down', 'maintenance', 'retired', 'disposed']),
  
  criticality: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  
  purchase_date: z.string()
    .datetime()
    .optional(),
  
  purchase_cost: z.number()
    .min(0, 'Purchase cost must be positive')
    .optional(),
  
  warranty_expiry: z.string()
    .datetime()
    .optional(),
  
  meter_type: z.enum(['hours', 'cycles', 'distance', 'production']).optional(),
  
  meter_reading: z.number()
    .min(0, 'Meter reading must be positive')
    .optional(),
});

// ========================================
// Client Schema
// ========================================

export const clientSchema = z.object({
  name: z.string()
    .min(2, 'Client name must be at least 2 characters')
    .max(200, 'Client name is too long'),
  
  contact_person: z.string()
    .max(100, 'Contact person name is too long')
    .optional(),
  
  contact_email: z.string()
    .email('Invalid email address'),
  
  contact_phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
    .optional(),
  
  address: z.string()
    .max(500, 'Address is too long')
    .optional(),
  
  city: z.string()
    .max(100, 'City name is too long')
    .optional(),
  
  state: z.string()
    .max(100, 'State name is too long')
    .optional(),
  
  country: z.string()
    .max(100, 'Country name is too long')
    .optional(),
  
  postal_code: z.string()
    .max(20, 'Postal code is too long')
    .optional(),
  
  website: z.string()
    .url('Invalid website URL')
    .optional()
    .or(z.literal('')),
  
  industry: z.string()
    .max(100, 'Industry name is too long')
    .optional(),
  
  status: z.enum(['active', 'inactive']),
});

// ========================================
// Project Schema
// ========================================

export const projectSchema = z.object({
  name: z.string()
    .min(2, 'Project name must be at least 2 characters')
    .max(200, 'Project name is too long'),
  
  description: z.string()
    .max(2000, 'Description is too long')
    .optional(),
  
  client_id: z.string()
    .uuid('Please select a valid client'),
  
  manager_id: z.string()
    .uuid('Please select a valid manager')
    .optional(),
  
  start_date: z.string()
    .datetime()
    .optional(),
  
  end_date: z.string()
    .datetime()
    .optional(),
  
  budget: z.number()
    .min(0, 'Budget must be positive')
    .optional(),
  
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

// ========================================
// Site Schema
// ========================================

export const siteSchema = z.object({
  name: z.string()
    .min(2, 'Site name must be at least 2 characters')
    .max(200, 'Site name is too long'),
  
  project_id: z.string()
    .uuid('Please select a valid project'),
  
  address: z.string()
    .min(5, 'Address is required')
    .max(500, 'Address is too long'),
  
  city: z.string()
    .max(100, 'City name is too long')
    .optional(),
  
  state: z.string()
    .max(100, 'State name is too long')
    .optional(),
  
  country: z.string()
    .max(100, 'Country name is too long')
    .optional(),
  
  postal_code: z.string()
    .max(20, 'Postal code is too long')
    .optional(),
  
  latitude: z.number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .optional(),
  
  contact_person: z.string()
    .max(100, 'Contact person name is too long')
    .optional(),
  
  contact_phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
    .optional(),
  
  contact_email: z.string()
    .email('Invalid email address')
    .optional(),
});

// ========================================
// User Schema
// ========================================

export const userSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  
  email: z.string()
    .email('Invalid email address'),
  
  phone: z.string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
    .optional(),
  
  role: z.enum(['admin', 'manager', 'analyst', 'technician', 'client']),
  
  status: z.enum(['active', 'inactive', 'suspended']),
  
  department: z.string()
    .max(100, 'Department name is too long')
    .optional(),
  
  job_title: z.string()
    .max(100, 'Job title is too long')
    .optional(),
  
  employee_id: z.string()
    .max(50, 'Employee ID is too long')
    .optional(),
});

export const userPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#]/, 'Password must contain at least one special character'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ========================================
// PPM Schema
// ========================================

export const ppmSchema = z.object({
  name: z.string()
    .min(3, 'PM schedule name must be at least 3 characters')
    .max(200, 'PM schedule name is too long'),
  
  description: z.string()
    .max(2000, 'Description is too long')
    .optional(),
  
  asset_id: z.string()
    .uuid('Please select a valid asset'),
  
  schedule_type: z.enum(['calendar', 'meter', 'hybrid']),
  
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'])
    .optional(),
  
  frequency_value: z.number()
    .int()
    .min(1, 'Frequency value must be at least 1')
    .max(365, 'Frequency value is too high')
    .optional(),
  
  meter_threshold: z.number()
    .min(0, 'Meter threshold must be positive')
    .optional(),
  
  work_order_template: z.object({
    title: z.string().min(3, 'Template title is required'),
    description: z.string().min(10, 'Template description is required'),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    estimated_hours: z.number().min(0).optional(),
    checklist: z.array(z.string()).optional(),
    required_parts: z.array(z.string()).optional(),
  }),
  
  assigned_to: z.string()
    .uuid()
    .optional(),
  
  is_active: z.boolean(),
}).refine(
  (data) => {
    // Calendar-based must have frequency
    if (data.schedule_type === 'calendar' && !data.frequency) {
      return false;
    }
    // Meter-based must have meter_threshold
    if (data.schedule_type === 'meter' && !data.meter_threshold) {
      return false;
    }
    // Hybrid must have both
    if (data.schedule_type === 'hybrid' && (!data.frequency || !data.meter_threshold)) {
      return false;
    }
    return true;
  },
  {
    message: 'Invalid schedule configuration for the selected type',
    path: ['schedule_type'],
  }
);

// ========================================
// Auth Schemas
// ========================================

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  
  password: z.string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  
  email: z.string()
    .email('Invalid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ========================================
// Export Types from Schemas
// ========================================

export type WorkOrderFormData = z.infer<typeof workOrderSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type SiteFormData = z.infer<typeof siteSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type PPMFormData = z.infer<typeof ppmSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// ========================================
// Advanced Features Schemas
// ========================================

// Work Order Template Schema
export const workOrderTemplateSchema = z.object({
  name: z.string()
    .min(3, 'Template name must be at least 3 characters')
    .max(255, 'Template name is too long'),
  
  description: z.string()
    .max(2000, 'Description is too long')
    .optional(),
  
  category: z.string()
    .max(100, 'Category name is too long')
    .optional(),
  
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  
  estimated_hours: z.number()
    .min(0, 'Estimated hours must be positive')
    .max(999, 'Estimated hours is too high')
    .optional(),
  
  default_checklist: z.array(z.string()).optional(),
  
  required_parts: z.array(z.object({
    part_id: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).optional(),
  
  instructions: z.string().max(5000, 'Instructions too long').optional(),
  safety_notes: z.string().max(2000, 'Safety notes too long').optional(),
  is_active: z.boolean(),
});

// SLA Policy Schema
export const slaPolicySchema = z.object({
  name: z.string()
    .min(3, 'Policy name must be at least 3 characters')
    .max(255, 'Policy name is too long'),
  
  description: z.string().max(1000).optional(),
  
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  
  response_time_hours: z.number()
    .int()
    .min(1, 'Response time must be at least 1 hour')
    .max(720, 'Response time too high'),
  
  resolution_time_hours: z.number()
    .int()
    .min(1, 'Resolution time must be at least 1 hour')
    .max(2160, 'Resolution time too high'),
  
  escalation_enabled: z.boolean(),
  
  escalation_1_hours: z.number().int().min(1).optional(),
  escalation_1_notify: z.array(z.string()).optional(),
  escalation_2_hours: z.number().int().min(1).optional(),
  escalation_2_notify: z.array(z.string()).optional(),
  escalation_3_hours: z.number().int().min(1).optional(),
  escalation_3_notify: z.array(z.string()).optional(),
  
  business_hours_only: z.boolean(),
  is_active: z.boolean(),
}).refine(
  (data) => data.resolution_time_hours >= data.response_time_hours,
  {
    message: 'Resolution time must be greater than or equal to response time',
    path: ['resolution_time_hours'],
  }
);

// Inventory Item Schema
export const inventoryItemSchema = z.object({
  part_number: z.string()
    .min(2, 'Part number must be at least 2 characters')
    .max(100, 'Part number is too long')
    .regex(/^[A-Z0-9-]+$/, 'Part number must be alphanumeric with dashes'),
  
  name: z.string()
    .min(3, 'Part name must be at least 3 characters')
    .max(255, 'Part name is too long'),
  
  description: z.string().max(2000).optional(),
  
  category: z.string().max(100).optional(),
  
  manufacturer: z.string().max(255).optional(),
  
  unit_of_measure: z.string()
    .max(50, 'Unit of measure is too long')
    .default('EA'),
  
  unit_cost: z.number()
    .min(0, 'Unit cost must be positive')
    .max(999999.99, 'Unit cost is too high'),
  
  quantity_on_hand: z.number()
    .int()
    .min(0, 'Quantity cannot be negative'),
  
  reorder_level: z.number()
    .int()
    .min(0, 'Reorder level cannot be negative'),
  
  reorder_quantity: z.number()
    .int()
    .min(0, 'Reorder quantity cannot be negative'),
  
  location: z.string().max(255).optional(),
  
  barcode: z.string().max(100).optional(),
  
  notes: z.string().max(2000).optional(),
  
  is_active: z.boolean(),
});

// Parts Usage Schema
export const partsUsageSchema = z.object({
  work_order_id: z.string().uuid('Invalid work order'),
  
  inventory_item_id: z.string().uuid('Invalid inventory item'),
  
  quantity_used: z.number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .max(99999, 'Quantity is too high'),
  
  unit_cost: z.number()
    .min(0, 'Unit cost must be positive')
    .optional(),
  
  notes: z.string().max(1000).optional(),
});

// Work Order Attachment Schema
export const attachmentSchema = z.object({
  work_order_id: z.string().uuid('Invalid work order'),
  file_name: z.string().min(1, 'File name is required').max(255),
  file_type: z.string().max(100).optional(),
  file_size: z.number().int().min(1).optional(),
  file_url: z.string().url('Invalid file URL'),
  description: z.string().max(500).optional(),
});

export type WorkOrderTemplateFormData = z.infer<typeof workOrderTemplateSchema>;
export type SLAPolicyFormData = z.infer<typeof slaPolicySchema>;
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type PartsUsageFormData = z.infer<typeof partsUsageSchema>;
export type AttachmentFormData = z.infer<typeof attachmentSchema>;
