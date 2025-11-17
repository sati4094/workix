const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register new user
exports.register = asyncHandler(async (req, res) => {
  const { email, password, name, role, phone, team } = req.body;

  // Check if user already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingUser.rows.length > 0) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert user
  const result = await query(
    `INSERT INTO users (email, password_hash, name, role, phone, team) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, email, name, role, status, phone, team, created_at`,
    [email, passwordHash, name, role, phone || null, team || null]
  );

  const user = result.rows[0];

  // Generate token
  const token = generateToken(user.id);

  // Cache user data
  await cache.set(`user:${user.id}`, user, 3600);

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
});

// Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user from database
  const result = await query(
    'SELECT id, email, password_hash, name, role, status, phone, team FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Your account has been deactivated. Please contact support.', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Remove password hash from user object
  delete user.password_hash;

  // Update last login
  await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate token
  const token = generateToken(user.id);

  // Cache user data
  await cache.set(`user:${user.id}`, user, 3600);

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
});

// Get current user profile
exports.getMe = asyncHandler(async (req, res) => {
  // User is already attached by auth middleware
  const userId = req.user.id;

  // Try to get from cache first
  let user = await cache.get(`user:${userId}`);

  if (!user) {
    const result = await query(
      'SELECT id, email, name, role, status, phone, team, profile_picture_url, created_at, last_login_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    user = result.rows[0];
    await cache.set(`user:${userId}`, user, 3600);
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// Update current user profile
exports.updateMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, phone, team, profile_picture_url } = req.body;

  // Don't allow updating sensitive fields
  if (req.body.password || req.body.email || req.body.role || req.body.status) {
    throw new AppError('This route is not for updating password, email, role, or status', 400);
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramCount++}`);
    values.push(phone);
  }
  if (team !== undefined) {
    updates.push(`team = $${paramCount++}`);
    values.push(team);
  }
  if (profile_picture_url !== undefined) {
    updates.push(`profile_picture_url = $${paramCount++}`);
    values.push(profile_picture_url);
  }

  if (updates.length === 0) {
    throw new AppError('No fields to update', 400);
  }

  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $${paramCount} 
     RETURNING id, email, name, role, status, phone, team, profile_picture_url, updated_at`,
    values
  );

  const user = result.rows[0];

  // Invalidate cache
  await cache.del(`user:${userId}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user },
  });
});

// Change password
exports.changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current password and new password', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400);
  }

  // Get current password hash
  const result = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
    newPasswordHash,
    userId,
  ]);

  logger.info(`Password changed for user: ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// Logout (client-side token removal, optionally blacklist token)
exports.logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Invalidate user cache
  await cache.del(`user:${userId}`);

  logger.info(`User logged out: ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

