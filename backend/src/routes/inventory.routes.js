const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// Inventory items routes
router.get('/items', inventoryController.getInventoryItems);
router.get('/items/categories', inventoryController.getInventoryCategories);
router.get('/items/:id', inventoryController.getInventoryItemById);
router.post('/items', restrictTo('admin', 'manager'), inventoryController.createInventoryItem);
router.put('/items/:id', restrictTo('admin', 'manager'), inventoryController.updateInventoryItem);
router.delete('/items/:id', restrictTo('admin'), inventoryController.deleteInventoryItem);

// Parts usage routes
router.get('/parts-usage', inventoryController.getPartsUsage);
router.post('/parts-usage', restrictTo('admin', 'manager', 'technician'), inventoryController.recordPartsUsage);

// Transactions routes (read-only)
router.get('/transactions', inventoryController.getInventoryTransactions);

module.exports = router;
