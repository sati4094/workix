const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrder.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validation');
const Joi = require('joi');

// All routes require authentication
router.use(verifyToken);

// Activity validation schema
const addActivitySchema = Joi.object({
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    activity_type: Joi.string()
      .valid('observation', 'action_taken', 'recommendation', 'status_change', 'comment', 'parts_used')
      .required(),
    description: Joi.string().required(),
    ai_enhanced: Joi.boolean().optional(),
    original_text: Joi.string().optional(),
    pictures: Joi.array().items(Joi.string()).optional(),
    parts_used: Joi.array()
      .items(
        Joi.object({
          part_name: Joi.string().required(),
          part_number: Joi.string().optional(),
          quantity: Joi.number().integer().positive().required(),
        })
      )
      .optional(),
  }),
});

// Routes
router.get('/', workOrderController.getAllWorkOrders);
router.post('/', validate(schemas.workOrderCreate), restrictTo('admin', 'manager', 'analyst'), workOrderController.createWorkOrder);

router.get('/:id', workOrderController.getWorkOrderById);
router.patch('/:id', validate(schemas.workOrderUpdate), workOrderController.updateWorkOrder);
router.delete('/:id', restrictTo('admin', 'manager'), workOrderController.deleteWorkOrder);

// Activity routes
router.post('/:id/activities', validate(addActivitySchema), workOrderController.addActivity);
router.get('/:id/activities', workOrderController.getActivities);

module.exports = router;

