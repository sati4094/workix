require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const { connectDatabase } = require('./database/connection');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const projectRoutes = require('./routes/project.routes');
const siteRoutes = require('./routes/site.routes');
const assetRoutes = require('./routes/asset.routes');
const workOrderRoutes = require('./routes/workOrder.routes');
const ppmRoutes = require('./routes/ppm.routes');
const aiRoutes = require('./routes/ai.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const templateRoutes = require('./routes/template.routes');
const slaRoutes = require('./routes/sla.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const notificationRoutes = require('./routes/notification.routes');

// Enterprise routes
const buildingsRoutes = require('./routes/buildings.routes');
const floorsRoutes = require('./routes/floors.routes');
const spacesRoutes = require('./routes/spaces.routes');
const partsRoutes = require('./routes/parts.routes');
const storeroomsRoutes = require('./routes/storerooms.routes');
const vendorsRoutes = require('./routes/vendors.routes');
const teamsRoutes = require('./routes/teams.routes');
const rolesRoutes = require('./routes/roles.routes');
const assetCategoriesRoutes = require('./routes/asset-categories.routes');
const assetTypesRoutes = require('./routes/asset-types.routes');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Tauri, or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    
    // In development, allow all localhost and tauri origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('tauri')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(`/api/${API_VERSION}/`, limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/clients`, clientRoutes);
app.use(`/api/${API_VERSION}/projects`, projectRoutes);
app.use(`/api/${API_VERSION}/sites`, siteRoutes);
app.use(`/api/${API_VERSION}/assets`, assetRoutes);
app.use(`/api/${API_VERSION}/work-orders`, workOrderRoutes);
app.use(`/api/${API_VERSION}/ppm`, ppmRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/templates`, templateRoutes);
app.use(`/api/${API_VERSION}/sla`, slaRoutes);
app.use(`/api/${API_VERSION}/inventory`, inventoryRoutes);
app.use(`/api/${API_VERSION}/attachments`, attachmentRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// Enterprise routes
app.use(`/api/${API_VERSION}/buildings`, buildingsRoutes);
app.use(`/api/${API_VERSION}/floors`, floorsRoutes);
app.use(`/api/${API_VERSION}/spaces`, spacesRoutes);
app.use(`/api/${API_VERSION}/parts`, partsRoutes);
app.use(`/api/${API_VERSION}/storerooms`, storeroomsRoutes);
app.use(`/api/${API_VERSION}/vendors`, vendorsRoutes);
app.use(`/api/${API_VERSION}/teams`, teamsRoutes);
app.use(`/api/${API_VERSION}/roles`, rolesRoutes);
app.use(`/api/${API_VERSION}/asset-categories`, assetCategoriesRoutes);
app.use(`/api/${API_VERSION}/asset-types`, assetTypesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to PostgreSQL
    await connectDatabase();
    logger.info('PostgreSQL connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Workix Backend Server running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

startServer();

module.exports = app;

