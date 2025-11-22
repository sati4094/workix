const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachment.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

// All routes require authentication
router.use(verifyToken);

// Work Order Attachments
router.get('/work-orders', attachmentController.getWorkOrderAttachments);
router.post(
  '/work-orders',
  attachmentController.upload.single('file'),
  attachmentController.uploadWorkOrderAttachment
);
router.delete('/work-orders/:id', restrictTo('admin', 'manager', 'technician'), attachmentController.deleteWorkOrderAttachment);

// Asset Documents
router.get('/assets', attachmentController.getAssetDocuments);
router.post(
  '/assets',
  attachmentController.upload.single('file'),
  attachmentController.uploadAssetDocument
);
router.delete('/assets/:id', restrictTo('admin', 'manager'), attachmentController.deleteAssetDocument);

module.exports = router;
