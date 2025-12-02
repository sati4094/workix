const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const analyticsController = require('../controllers/analytics.controller');

router.use(verifyToken);
router.use(restrictTo('admin', 'manager', 'analyst'));

// NEW: Comprehensive dashboard statistics
router.get('/dashboard', analyticsController.getDashboardStats);

// NEW: Real-time metrics
router.get('/real-time', analyticsController.getRealTimeMetrics);

// LEGACY: Old dashboard endpoint (kept for backwards compatibility)
router.get('/dashboard-legacy', asyncHandler(async (req, res) => {
  // Work order statistics
  const workOrderStats = await query(`
    SELECT 
      COUNT(*) as total_work_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status = 'parts_pending' THEN 1 END) as parts_pending,
      COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_priority,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority
    FROM work_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  `);

  // Technician workload
  const technicianWorkload = await query(`
    SELECT * FROM technician_workload ORDER BY active_work_orders DESC LIMIT 10
  `);

  // Overdue work orders
  const overdueWorkOrders = await query(`
    SELECT COUNT(*) as overdue_count
    FROM work_orders
    WHERE due_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')
  `);

  // Recent completions
  const recentCompletions = await query(`
    SELECT COUNT(*) as completed_last_7_days
    FROM work_orders
    WHERE status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
  `);

  res.status(200).json({
    success: true,
    data: {
      work_order_stats: workOrderStats.rows[0],
      technician_workload: technicianWorkload.rows,
      overdue_count: parseInt(overdueWorkOrders.rows[0].overdue_count),
      completed_last_7_days: parseInt(recentCompletions.rows[0].completed_last_7_days),
    },
  });
}));

// Work order trends
router.get('/trends', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const trends = await query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN priority = 'critical' OR priority = 'high' THEN 1 END) as high_priority
    FROM work_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(period)} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  res.status(200).json({ success: true, data: { trends: trends.rows } });
}));

// Asset reliability
router.get('/asset-reliability', asyncHandler(async (req, res) => {
  const assetIssues = await query(`
    SELECT 
      a.id,
      a.name,
      a.asset_tag,
      a.type,
      s.name as site_name,
      s.site_code,
      COUNT(woa.work_order_id) as failure_count,
      MAX(wo.created_at) as last_failure_date
    FROM assets a
    JOIN sites s ON a.site_id = s.id
    LEFT JOIN work_order_assets woa ON a.id = woa.asset_id
    LEFT JOIN work_orders wo ON woa.work_order_id = wo.id
    WHERE wo.created_at >= CURRENT_DATE - INTERVAL '90 days' OR wo.created_at IS NULL
    GROUP BY a.id, a.name, a.asset_tag, a.type, s.name, s.site_code
    ORDER BY failure_count DESC
    LIMIT 20
  `);

  res.status(200).json({ success: true, data: { asset_reliability: assetIssues.rows } });
}));

// Technician performance
router.get('/technician-performance', asyncHandler(async (req, res) => {
  const performance = await query(`
    SELECT 
      u.id,
      u.name,
      COUNT(wo.id) as total_assigned,
      COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed,
      AVG(CASE 
        WHEN wo.completed_at IS NOT NULL AND wo.acknowledged_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.acknowledged_at))/3600 
      END) as avg_completion_hours,
      COUNT(CASE WHEN wo.completed_at <= wo.due_date THEN 1 END) as on_time_completions,
      COUNT(CASE WHEN wo.completed_at > wo.due_date THEN 1 END) as late_completions
    FROM users u
    LEFT JOIN work_orders wo ON u.id = wo.assigned_to
    WHERE u.role = 'technician' AND u.status = 'active'
      AND (wo.created_at >= CURRENT_DATE - INTERVAL '30 days' OR wo.created_at IS NULL)
    GROUP BY u.id, u.name
    ORDER BY completed DESC
  `);

  res.status(200).json({ success: true, data: { technician_performance: performance.rows } });
}));

// MTTR (Mean Time To Repair)
router.get('/mttr', asyncHandler(async (req, res) => {
  const mttr = await query(`
    SELECT 
      AVG(EXTRACT(EPOCH FROM (completed_at - acknowledged_at))/3600) as avg_hours,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - acknowledged_at))/3600) as median_hours
    FROM work_orders
    WHERE status = 'completed' 
      AND acknowledged_at IS NOT NULL 
      AND completed_at IS NOT NULL
      AND completed_at >= CURRENT_DATE - INTERVAL '90 days'
  `);

  res.status(200).json({ success: true, data: { mttr: mttr.rows[0] } });
}));

// Work order by source
router.get('/by-source', asyncHandler(async (req, res) => {
  const bySource = await query(`
    SELECT 
      source,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
    FROM work_orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY source
    ORDER BY count DESC
  `);

  res.status(200).json({ success: true, data: { by_source: bySource.rows } });
}));

module.exports = router;

