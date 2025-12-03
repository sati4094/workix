const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys
      stripUnknown: true, // Remove unknown keys
    };

    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      validationOptions
    );

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      throw new AppError(errorMessage, 400);
    }

    // Replace request data with validated data
    req.body = value.body || req.body;
    req.query = value.query || req.query;
    req.params = value.params || req.params;

    next();
  };
};

// Common validation schemas
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid({ version: 'uuidv4' }),

  // Pagination
  pagination: Joi.object({
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
    }),
  }),

  // User registration
  userRegister: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      name: Joi.string().min(2).max(255).required(),
      role: Joi.string()
        .valid(
          'superadmin',
          'supertech',
          'admin',
          'manager',
          'portfolio_manager',
          'facility_manager',
          'engineer',
          'technician',
          'analyst',
          'basic_user',
          'client'
        )
        .required(),
      phone: Joi.string().pattern(/^[0-9+\-() ]+$/).allow('', null),
      team: Joi.string().max(100).allow('', null),
      enterprise_id: Joi.string().uuid().allow(null, ''),
      site_id: Joi.string().uuid().allow(null, ''),
      tag_ids: Joi.array().items(Joi.string().uuid()).optional(),
    }),
  }),

  // User login
  userLogin: Joi.object({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),

  // Work order creation
  workOrderCreate: Joi.object({
    body: Joi.object({
      title: Joi.string().min(5).max(255).required(),
      description: Joi.string().allow('', null),
      source: Joi.string().valid('performance_deviation', 'customer_complaint', 'preventive_maintenance', 'manual').required(),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
      site_id: Joi.string().uuid().required(),
      building_id: Joi.number().integer().allow(null),
      floor_id: Joi.number().integer().allow(null),
      space_id: Joi.number().integer().allow(null),
      asset_ids: Joi.array().items(Joi.string().uuid()).min(0),
      assigned_to: Joi.string().uuid().allow(null),
      performance_deviation_details: Joi.object().allow(null),
      customer_complaint_details: Joi.object().allow(null),
      reference_pictures: Joi.array().items(Joi.string()),
      due_date: Joi.date().iso().allow(null),
      estimated_hours: Joi.number().positive().allow(null),
    }),
  }),

  // Work order update
  workOrderUpdate: Joi.object({
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      title: Joi.string().min(5).max(255),
      description: Joi.string().allow('', null),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
      status: Joi.string().valid('pending', 'acknowledged', 'in_progress', 'parts_pending', 'completed', 'cancelled'),
      assigned_to: Joi.string().uuid().allow(null),
      due_date: Joi.date().iso().allow(null),
      estimated_hours: Joi.number().positive().allow(null),
      actual_hours: Joi.number().positive().allow(null),
    }).min(1),
  }),

  // Asset creation
  assetCreate: Joi.object({
    body: Joi.object({
      site_id: Joi.string().uuid().required(),
      asset_tag: Joi.string().max(100).required(),
      name: Joi.string().min(2).max(255).required(),
      type: Joi.string().valid('chiller', 'ahu', 'pump', 'cooling_tower', 'boiler', 'vfd', 'motor', 'compressor', 'other').required(),
      manufacturer: Joi.string().max(255).allow('', null),
      model: Joi.string().max(255).allow('', null),
      serial_number: Joi.string().max(255).allow('', null),
      capacity: Joi.string().max(100).allow('', null),
      capacity_unit: Joi.string().max(50).allow('', null),
      commissioning_date: Joi.date().iso().allow(null),
      warranty_expiry_date: Joi.date().iso().allow(null),
      performance_baseline: Joi.object().allow(null),
      specifications: Joi.object().allow(null),
      location_details: Joi.string().allow('', null),
    }),
  }),
};

module.exports = {
  validate,
  schemas,
};

