const { AppError } = require('../middlewares/errorHandler');

const GLOBAL_ROLES = new Set(['superadmin', 'supertech']);
const ENTERPRISE_SCOPED_ROLES = new Set([
  'admin',
  'manager',
  'portfolio_manager',
  'facility_manager',
  'analyst',
  'engineer',
  'technician',
]);
const SITE_STRICT_ROLES = new Set(['technician']);

const isGlobalRole = (role) => GLOBAL_ROLES.has(role);

const ensureEnterpriseAssignment = (user) => {
  if (!user || !user.enterprise_id) {
    return false;
  }
  return true;
};

const applyEnterpriseScope = ({ user, conditions, values, alias = 'e' }) => {
  if (!user || isGlobalRole(user.role)) {
    return;
  }

  if (!ensureEnterpriseAssignment(user)) {
    conditions.push('1 = 0');
    return;
  }

  conditions.push(`${alias}.id = $${values.length + 1}`);
  values.push(user.enterprise_id);
};

const applySiteScope = ({ user, conditions, values, alias = 's' }) => {
  if (!user || isGlobalRole(user.role)) {
    return;
  }

  if (!ensureEnterpriseAssignment(user)) {
    conditions.push('1 = 0');
    return;
  }

  conditions.push(`${alias}.enterprise_id = $${values.length + 1}`);
  values.push(user.enterprise_id);

  if (SITE_STRICT_ROLES.has(user.role) && user.site_id) {
    conditions.push(`${alias}.id = $${values.length + 1}`);
    values.push(user.site_id);
  }
};

const applyWorkOrderScope = ({ user, conditions, values, alias = 'wo' }) => {
  if (!user || isGlobalRole(user.role)) {
    return;
  }

  if (user.role === 'client') {
    if (!ensureEnterpriseAssignment(user)) {
      conditions.push('1 = 0');
    } else {
      conditions.push(`${alias}.enterprise_id = $${values.length + 1}`);
      values.push(user.enterprise_id);
    }
    return;
  }

  if (!ENTERPRISE_SCOPED_ROLES.has(user.role)) {
    // default to user-specific scope if role not recognised
    conditions.push(`${alias}.reported_by = $${values.length + 1}`);
    values.push(user.id);
    return;
  }

  if (!ensureEnterpriseAssignment(user)) {
    conditions.push('1 = 0');
    return;
  }

  conditions.push(`${alias}.enterprise_id = $${values.length + 1}`);
  values.push(user.enterprise_id);

  if (SITE_STRICT_ROLES.has(user.role) && user.site_id) {
    conditions.push(`${alias}.site_id = $${values.length + 1}`);
    values.push(user.site_id);
  }
};

const canAccessWorkOrder = (user, workOrder) => {
  if (!user || !workOrder) {
    return false;
  }

  if (isGlobalRole(user.role)) {
    return true;
  }

  if (user.role === 'client') {
    if (user.enterprise_id && workOrder.enterprise_id) {
      return workOrder.enterprise_id === user.enterprise_id;
    }
    return false;
  }

  if (!ENTERPRISE_SCOPED_ROLES.has(user.role)) {
    return workOrder.reported_by === user.id || workOrder.assigned_to === user.id;
  }

  if (!ensureEnterpriseAssignment(user)) {
    return false;
  }

  if (workOrder.enterprise_id && workOrder.enterprise_id !== user.enterprise_id) {
    return false;
  }

  if (SITE_STRICT_ROLES.has(user.role) && user.site_id && workOrder.site_id && workOrder.site_id !== user.site_id) {
    return false;
  }

  if (SITE_STRICT_ROLES.has(user.role)) {
    return workOrder.assigned_to === user.id || workOrder.reported_by === user.id || !workOrder.site_id;
  }

  return true;
};

const assertWorkOrderAccess = (user, workOrder) => {
  if (!canAccessWorkOrder(user, workOrder)) {
    throw new AppError('You do not have permission to view this work order', 403);
  }
};

module.exports = {
  applyEnterpriseScope,
  applySiteScope,
  applyWorkOrderScope,
  assertWorkOrderAccess,
};
