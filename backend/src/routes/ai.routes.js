const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middlewares/auth');
const Joi = require('joi');
const { validate } = require('../middlewares/validation');

// All AI routes require authentication
router.use(verifyToken);

// Validation schemas
const enhanceTextSchema = Joi.object({
  body: Joi.object({
    text: Joi.string().min(1).max(5000).required(),
    context: Joi.string().valid('observation', 'action_taken', 'recommendation', 'general').optional(),
  }),
});

const batchEnhanceSchema = Joi.object({
  body: Joi.object({
    texts: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().required(),
          context: Joi.string().optional(),
        })
      )
      .min(1)
      .max(10)
      .required(),
  }),
});

// Routes
router.post('/enhance-text', validate(enhanceTextSchema), aiController.enhanceText);
router.post('/batch-enhance', validate(batchEnhanceSchema), aiController.batchEnhance);
router.post('/generate-summary', aiController.generateSummary);

module.exports = router;

