const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// GET /api/v1/templates - Get all templates
router.get('/', templateController.getTemplates);

// GET /api/v1/templates/categories - Get unique categories
router.get('/categories', templateController.getCategories);

// GET /api/v1/templates/:id - Get single template
router.get('/:id', templateController.getTemplateById);

// POST /api/v1/templates - Create new template (managers/admins only)
router.post('/', restrictTo('admin', 'manager'), templateController.createTemplate);

// PUT /api/v1/templates/:id - Update template (managers/admins only)
router.put('/:id', restrictTo('admin', 'manager'), templateController.updateTemplate);

// DELETE /api/v1/templates/:id - Delete template (admins only)
router.delete('/:id', restrictTo('admin'), templateController.deleteTemplate);

module.exports = router;
