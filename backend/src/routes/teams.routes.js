const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');
const { pool } = require('../database/connection');

router.use(verifyToken);

// Get all teams
router.get('/', asyncHandler(async (req, res) => {
  const { org_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  
  let query = `
    SELECT t.*, 
           u.name as team_lead_name,
           (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as members_count
    FROM teams t
    LEFT JOIN users u ON t.team_lead = u.id
    WHERE t.is_active = true
  `;
  const params = [];
  
  if (org_id) {
    params.push(org_id);
    query += ` AND t.org_id = $${params.length}`;
  }
  
  query += ` ORDER BY t.team_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit) }
  });
}));

// Get team by ID with members
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(`
    SELECT t.*, 
           u.name as team_lead_name,
           (SELECT json_agg(json_build_object(
             'user_id', tm.account_id,
             'user_name', u2.name,
             'email', u2.email,
             'joined_at', tm.joined_at
           ))
           FROM team_members tm
           LEFT JOIN users u2 ON tm.account_id = u2.id
           WHERE tm.team_id = t.id) as members
    FROM teams t
    LEFT JOIN users u ON t.team_lead = u.id
    WHERE t.id = $1 AND t.is_active = true
  `, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Create team
router.post('/', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { org_id, team_name, description, team_lead } = req.body;
  
  const result = await pool.query(`
    INSERT INTO teams (org_id, team_name, description, team_lead)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [org_id, team_name, description, team_lead]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Update team
router.patch('/:id', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const allowedFields = ['team_name', 'description', 'team_lead'];
  const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
  
  if (fields.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }
  
  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
  const values = fields.map(field => updates[field]);
  
  const result = await pool.query(
    `UPDATE teams SET ${setClause} WHERE id = $1 AND is_active = true RETURNING *`,
    [id, ...values]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }
  
  res.json({ success: true, data: result.rows[0] });
}));

// Add team member
router.post('/:id/members', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { account_id } = req.body;
  
  const result = await pool.query(`
    INSERT INTO team_members (team_id, account_id)
    VALUES ($1, $2)
    ON CONFLICT (team_id, account_id) DO NOTHING
    RETURNING *
  `, [id, account_id]);
  
  res.status(201).json({ success: true, data: result.rows[0] });
}));

// Remove team member
router.delete('/:id/members/:userId', restrictTo('admin', 'manager'), asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  
  const result = await pool.query(
    'DELETE FROM team_members WHERE team_id = $1 AND account_id = $2 RETURNING *',
    [id, userId]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Team member not found' });
  }
  
  res.json({ success: true, message: 'Member removed from team' });
}));

// Delete team
router.delete('/:id', restrictTo('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await pool.query(
    'UPDATE teams SET is_active = false WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Team not found' });
  }
  
  res.json({ success: true, message: 'Team deleted successfully' });
}));

module.exports = router;
