const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { is_read, notification_type, priority } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;
    
    if (is_read !== undefined) {
      query += ` AND is_read = $${paramCount++}`;
      params.push(is_read === 'true');
    }
    
    if (notification_type) {
      query += ` AND notification_type = $${paramCount++}`;
      params.push(notification_type);
    }
    
    if (priority) {
      query += ` AND priority = $${paramCount++}`;
      params.push(priority);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      unread_count: result.rows.filter(n => !n.is_read).length
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    logger.info(`Notification marked as read: ${id}`);
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false RETURNING id',
      [userId]
    );
    
    logger.info(`Marked ${result.rows.length} notifications as read for user ${userId}`);
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read', error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    logger.info(`Notification deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
  }
};

// Create notification (internal use - called by other controllers)
exports.createNotification = async (userId, notificationData) => {
  try {
    const {
      notification_type,
      title,
      message,
      reference_type,
      reference_id,
      priority = 'normal',
      sent_via = { email: false, push: true, sms: false }
    } = notificationData;
    
    const result = await pool.query(
      `INSERT INTO notifications (
        user_id, notification_type, title, message, reference_type, reference_id, priority, sent_via
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [userId, notification_type, title, message, reference_type, reference_id, priority, JSON.stringify(sent_via)]
    );
    
    logger.info(`Notification created for user ${userId}: ${title}`);
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count', error: error.message });
  }
};
