const express = require('express');
const router = express.Router();
const slaController = require('../controllers/sla.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// SLA Policies routes
router.get('/policies', slaController.getSLAPolicies);
router.get('/policies/:id', slaController.getSLAPolicyById);
router.post('/policies', restrictTo('admin', 'manager'), slaController.createSLAPolicy);
router.put('/policies/:id', restrictTo('admin', 'manager'), slaController.updateSLAPolicy);
router.delete('/policies/:id', restrictTo('admin'), slaController.deleteSLAPolicy);

// SLA Violations routes (read-only)
router.get('/violations', slaController.getSLAViolations);

module.exports = router;
