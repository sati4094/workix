const { query } = require('../database/connection');
const { AppError } = require('../middlewares/errorHandler');

const ENTITY_TABLE_CONFIG = {
  enterprise: {
    table: 'enterprise_tags',
    column: 'enterprise_id',
  },
  site: {
    table: 'site_tags',
    column: 'site_id',
  },
  user: {
    table: 'user_tags',
    column: 'user_id',
  },
};

const sanitizeTagIds = (tagIds) => {
  if (!Array.isArray(tagIds)) {
    return [];
  }
  const unique = [...new Set(tagIds.filter(Boolean))];
  return unique;
};

const ensureTagsExist = async (tagIds) => {
  if (!tagIds.length) {
    return;
  }
  const { rows } = await query(
    'SELECT id FROM tags WHERE id = ANY($1::uuid[])',
    [tagIds]
  );
  if (rows.length !== tagIds.length) {
    throw new AppError('One or more supplied tags do not exist.', 400);
  }
};

const replaceTagsForEntity = async ({ entity, entityId, tagIds = [], userId }) => {
  const config = ENTITY_TABLE_CONFIG[entity];
  if (!config) {
    throw new AppError(`Unsupported entity type for tagging: ${entity}`, 400);
  }

  const normalizedTagIds = sanitizeTagIds(tagIds);
  await ensureTagsExist(normalizedTagIds);

  await query(`DELETE FROM ${config.table} WHERE ${config.column} = $1`, [entityId]);

  if (!normalizedTagIds.length) {
    return;
  }

  for (const tagId of normalizedTagIds) {
    await query(
      `INSERT INTO ${config.table} (${config.column}, tag_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (${config.column}, tag_id) DO NOTHING`,
      [entityId, tagId, userId || null]
    );
  }
};

module.exports = {
  replaceTagsForEntity,
};
