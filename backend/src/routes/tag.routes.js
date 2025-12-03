const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const { verifyToken, restrictTo } = require('../middlewares/auth');
const { AppError, asyncHandler } = require('../middlewares/errorHandler');

router.use(verifyToken);

router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  const values = [];
  let whereClause = '';

  if (search) {
    whereClause = 'WHERE LOWER(label) LIKE $1';
    values.push(`%${search.toLowerCase()}%`);
  }

  const { rows } = await query(
    `SELECT id, label, color, description, created_at, updated_at
     FROM tags
     ${whereClause}
     ORDER BY label ASC`,
    values
  );

  res.status(200).json({
    success: true,
    data: { tags: rows },
  });
}));

router.post('/', restrictTo('superadmin', 'supertech', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { label, color, description } = req.body;

  if (!label || !label.trim()) {
    throw new AppError('Tag label is required', 400);
  }

  const trimmedLabel = label.trim();

  const result = await query(
    `INSERT INTO tags (label, color, description, created_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (LOWER(label)) DO UPDATE SET color = EXCLUDED.color, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP
     RETURNING id, label, color, description, created_at, updated_at`,
    [trimmedLabel, color || null, description || null, req.user.id]
  );

  res.status(201).json({
    success: true,
    message: 'Tag saved successfully',
    data: { tag: result.rows[0] },
  });
}));

router.patch('/:id', restrictTo('superadmin', 'supertech', 'admin', 'manager'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, color, description } = req.body;

  if (!label || !label.trim()) {
    throw new AppError('Tag label is required', 400);
  }

  const result = await query(
    `UPDATE tags
     SET label = $1,
         color = $2,
         description = $3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id, label, color, description, created_at, updated_at`,
    [label.trim(), color || null, description || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tag not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Tag updated successfully',
    data: { tag: result.rows[0] },
  });
}));

router.delete('/:id', restrictTo('superadmin', 'supertech', 'admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Tag not found', 404);
  }

  res.status(200).json({
    success: true,
    message: 'Tag deleted successfully',
  });
}));

module.exports = router;
