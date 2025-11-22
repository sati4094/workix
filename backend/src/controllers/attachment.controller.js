const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Get work order attachments
exports.getWorkOrderAttachments = async (req, res) => {
  try {
    const { work_order_id } = req.query;
    
    let query = `
      SELECT a.*, u.name as uploaded_by_name
      FROM work_order_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (work_order_id) {
      query += ' AND a.work_order_id = $1';
      params.push(work_order_id);
    }
    
    query += ' ORDER BY a.uploaded_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching work order attachments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attachments', error: error.message });
  }
};

// Upload work order attachment
exports.uploadWorkOrderAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const { work_order_id, description } = req.body;
    const userId = req.user?.id;
    
    const file_url = `/uploads/${req.file.filename}`;
    
    const result = await pool.query(
      `INSERT INTO work_order_attachments (
        work_order_id, file_name, file_type, file_size, file_url, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        work_order_id,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        file_url,
        description,
        userId
      ]
    );
    
    logger.info(`Work order attachment uploaded: ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error uploading work order attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file', error: error.message });
  }
};

// Delete work order attachment
exports.deleteWorkOrderAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM work_order_attachments WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    
    const attachment = result.rows[0];
    const filePath = path.join(__dirname, '../../', attachment.file_url);
    
    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file: ${filePath}`, error);
    }
    
    // Delete from database
    await pool.query('DELETE FROM work_order_attachments WHERE id = $1', [id]);
    
    logger.info(`Work order attachment deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting work order attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete attachment', error: error.message });
  }
};

// Get asset documents
exports.getAssetDocuments = async (req, res) => {
  try {
    const { asset_id, document_type } = req.query;
    
    let query = `
      SELECT d.*, u.name as uploaded_by_name
      FROM asset_documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (asset_id) {
      query += ` AND d.asset_id = $${paramCount++}`;
      params.push(asset_id);
    }
    
    if (document_type) {
      query += ` AND d.document_type = $${paramCount++}`;
      params.push(document_type);
    }
    
    query += ' ORDER BY d.uploaded_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching asset documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents', error: error.message });
  }
};

// Upload asset document
exports.uploadAssetDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const { asset_id, document_type, description } = req.body;
    const userId = req.user?.id;
    
    const file_url = `/uploads/${req.file.filename}`;
    
    const result = await pool.query(
      `INSERT INTO asset_documents (
        asset_id, document_type, file_name, file_type, file_size, file_url, description, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        asset_id,
        document_type || 'manual',
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        file_url,
        description,
        userId
      ]
    );
    
    logger.info(`Asset document uploaded: ${result.rows[0].id}`);
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error uploading asset document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document', error: error.message });
  }
};

// Delete asset document
exports.deleteAssetDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM asset_documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    const document = result.rows[0];
    const filePath = path.join(__dirname, '../../', document.file_url);
    
    // Delete file from filesystem
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file: ${filePath}`, error);
    }
    
    // Delete from database
    await pool.query('DELETE FROM asset_documents WHERE id = $1', [id]);
    
    logger.info(`Asset document deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting asset document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
  }
};

exports.upload = upload;
