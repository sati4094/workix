const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Get comprehensive dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const { timeRange = '30' } = req.query; // days
    
    // KPI Metrics
    const kpiQuery = `
      SELECT 
        COUNT(*) as total_work_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical,
        AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 END) as avg_completion_hours,
        COUNT(DISTINCT assigned_to) as active_technicians,
        COUNT(CASE WHEN status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as completed_this_week
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
    `;
    
    const kpiResult = await pool.query(kpiQuery);
    const kpis = kpiResult.rows[0];
    
    // Work Order Trends (last 30 days)
    const trendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    const trendsResult = await pool.query(trendsQuery);
    
    // Status Distribution
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const statusResult = await pool.query(statusQuery);
    
    // Priority Distribution
    const priorityQuery = `
      SELECT 
        priority,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `;
    
    const priorityResult = await pool.query(priorityQuery);
    
    // SLA Compliance
    const slaQuery = `
      SELECT 
        COUNT(*) as total_with_sla,
        COUNT(CASE WHEN v.id IS NULL THEN 1 END) as compliant,
        COUNT(CASE WHEN v.id IS NOT NULL THEN 1 END) as violations,
        ROUND(COUNT(CASE WHEN v.id IS NULL THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as compliance_rate
      FROM work_orders w
      LEFT JOIN sla_violations v ON w.id = v.work_order_id
      WHERE w.created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
    `;
    
    const slaResult = await pool.query(slaQuery);
    
    // Top Performing Technicians
    const technicianQuery = `
      SELECT 
        u.id,
        u.name,
        COUNT(*) as completed_count,
        AVG(EXTRACT(EPOCH FROM (w.completed_at - w.created_at))/3600) as avg_completion_hours,
        COUNT(CASE WHEN w.priority = 'critical' THEN 1 END) as critical_completed
      FROM work_orders w
      JOIN users u ON w.assigned_to = u.id
      WHERE w.status = 'completed' 
        AND w.completed_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
      GROUP BY u.id, u.name
      ORDER BY completed_count DESC
      LIMIT 10
    `;
    
    const technicianResult = await pool.query(technicianQuery);
    
    // Asset Performance
    const assetQuery = `
      SELECT 
        a.id,
        a.name,
        a.category,
        COUNT(w.id) as work_order_count,
        AVG(EXTRACT(EPOCH FROM (w.completed_at - w.created_at))/3600) as avg_repair_hours,
        SUM(CASE WHEN w.status = 'completed' THEN 1 ELSE 0 END) as completed_repairs
      FROM assets a
      LEFT JOIN work_orders w ON a.id = w.asset_id 
        AND w.created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
      GROUP BY a.id, a.name, a.category
      HAVING COUNT(w.id) > 0
      ORDER BY work_order_count DESC
      LIMIT 10
    `;
    
    const assetResult = await pool.query(assetQuery);
    
    // Category Breakdown
    const categoryQuery = `
      SELECT 
        COALESCE(category, 'Uncategorized') as category,
        COUNT(*) as count
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const categoryResult = await pool.query(categoryQuery);
    
    // Cost Analysis (if parts usage exists)
    const costQuery = `
      SELECT 
        DATE_TRUNC('week', w.created_at) as week,
        COUNT(DISTINCT w.id) as work_orders,
        COALESCE(SUM(p.total_cost), 0) as total_parts_cost,
        COALESCE(AVG(p.total_cost), 0) as avg_cost_per_wo
      FROM work_orders w
      LEFT JOIN parts_usage p ON w.id = p.work_order_id
      WHERE w.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', w.created_at)
      ORDER BY week
    `;
    
    const costResult = await pool.query(costQuery);
    
    // Response Time Analysis
    const responseQuery = `
      SELECT 
        AVG(CASE WHEN acknowledged_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (acknowledged_at - created_at))/3600 END) as avg_response_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (acknowledged_at - created_at))/3600) as median_response_hours,
        AVG(CASE WHEN status = 'completed' AND completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at))/3600 END) as avg_resolution_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as median_resolution_hours
      FROM work_orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(timeRange)} days'
    `;
    
    const responseResult = await pool.query(responseQuery);
    
    res.json({
      success: true,
      data: {
        kpis: {
          total_work_orders: parseInt(kpis.total_work_orders),
          completed: parseInt(kpis.completed),
          in_progress: parseInt(kpis.in_progress),
          pending: parseInt(kpis.pending),
          critical: parseInt(kpis.critical),
          completion_rate: kpis.total_work_orders > 0 
            ? ((parseInt(kpis.completed) / parseInt(kpis.total_work_orders)) * 100).toFixed(2) 
            : 0,
          avg_completion_hours: parseFloat(kpis.avg_completion_hours || 0).toFixed(2),
          active_technicians: parseInt(kpis.active_technicians),
          completed_this_week: parseInt(kpis.completed_this_week),
        },
        trends: trendsResult.rows.map(row => ({
          date: row.date,
          total: parseInt(row.total),
          completed: parseInt(row.completed),
          critical: parseInt(row.critical),
        })),
        statusDistribution: statusResult.rows,
        priorityDistribution: priorityResult.rows,
        slaCompliance: slaResult.rows[0],
        topTechnicians: technicianResult.rows.map(row => ({
          ...row,
          completed_count: parseInt(row.completed_count),
          avg_completion_hours: parseFloat(row.avg_completion_hours || 0).toFixed(2),
          critical_completed: parseInt(row.critical_completed),
        })),
        assetPerformance: assetResult.rows.map(row => ({
          ...row,
          work_order_count: parseInt(row.work_order_count),
          avg_repair_hours: parseFloat(row.avg_repair_hours || 0).toFixed(2),
          completed_repairs: parseInt(row.completed_repairs),
        })),
        categoryBreakdown: categoryResult.rows,
        costAnalysis: costResult.rows.map(row => ({
          week: row.week,
          work_orders: parseInt(row.work_orders),
          total_parts_cost: parseFloat(row.total_parts_cost || 0).toFixed(2),
          avg_cost_per_wo: parseFloat(row.avg_cost_per_wo || 0).toFixed(2),
        })),
        responseTimes: {
          avg_response_hours: parseFloat(responseResult.rows[0].avg_response_hours || 0).toFixed(2),
          median_response_hours: parseFloat(responseResult.rows[0].median_response_hours || 0).toFixed(2),
          avg_resolution_hours: parseFloat(responseResult.rows[0].avg_resolution_hours || 0).toFixed(2),
          median_resolution_hours: parseFloat(responseResult.rows[0].median_resolution_hours || 0).toFixed(2),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics', error: error.message });
  }
};

// Get real-time metrics
exports.getRealTimeMetrics = async (req, res) => {
  try {
    const metricsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM work_orders WHERE status = 'pending') as pending_count,
        (SELECT COUNT(*) FROM work_orders WHERE status = 'in_progress') as active_count,
        (SELECT COUNT(*) FROM work_orders WHERE priority = 'critical' AND status NOT IN ('completed', 'cancelled')) as critical_open,
        (SELECT COUNT(*) FROM sla_violations WHERE created_at >= CURRENT_DATE) as sla_violations_today,
        (SELECT COUNT(*) FROM inventory_items WHERE quantity_on_hand <= reorder_level) as low_stock_items,
        (SELECT COUNT(*) FROM notifications WHERE is_read = false) as unread_notifications
    `;
    
    const result = await pool.query(metricsQuery);
    
    res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error fetching real-time metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch real-time metrics', error: error.message });
  }
};
