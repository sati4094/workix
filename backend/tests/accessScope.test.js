const {
  applyEnterpriseScope,
  applySiteScope,
  applyWorkOrderScope,
  assertWorkOrderAccess,
} = require('../src/utils/accessScope');
const { AppError } = require('../src/middlewares/errorHandler');

describe('accessScope helpers', () => {
  const enterpriseId = '11111111-1111-1111-1111-111111111111';
  const siteId = '22222222-2222-2222-2222-222222222222';

  it('skips scoping for superadmin roles', () => {
    const conditions = [];
    const values = [];
    applyEnterpriseScope({ user: { role: 'superadmin' }, conditions, values, alias: 'e' });
    expect(conditions).toHaveLength(0);
    expect(values).toHaveLength(0);
  });

  it('applies enterprise scope for admin roles', () => {
    const conditions = [];
    const values = [];
    applyEnterpriseScope({
      user: { role: 'admin', enterprise_id: enterpriseId },
      conditions,
      values,
      alias: 'e',
    });
    expect(conditions).toEqual(['e.id = $1']);
    expect(values).toEqual([enterpriseId]);
  });

  it('applies enterprise and site scope for technicians', () => {
    const conditions = [];
    const values = [];
    applySiteScope({
      user: { role: 'technician', enterprise_id: enterpriseId, site_id: siteId },
      conditions,
      values,
      alias: 's',
    });
    expect(conditions).toEqual(['s.enterprise_id = $1', 's.id = $2']);
    expect(values).toEqual([enterpriseId, siteId]);
  });

  it('applies work order site scoping for technicians with assignment', () => {
    const conditions = [];
    const values = [];
    applyWorkOrderScope({
      user: { role: 'technician', enterprise_id: enterpriseId, site_id: siteId },
      conditions,
      values,
      alias: 'wo',
    });
    expect(conditions).toEqual(['wo.enterprise_id = $1', 'wo.site_id = $2']);
    expect(values).toEqual([enterpriseId, siteId]);
  });

  it('allows enterprise admin to access work orders inside enterprise', () => {
    expect(() =>
      assertWorkOrderAccess(
        { role: 'admin', enterprise_id: enterpriseId },
        { enterprise_id: enterpriseId }
      )
    ).not.toThrow();
  });

  it('blocks access for mismatched enterprise', () => {
    expect(() =>
      assertWorkOrderAccess(
        { role: 'manager', enterprise_id: enterpriseId },
        { enterprise_id: '33333333-3333-3333-3333-333333333333' }
      )
    ).toThrow(AppError);
  });
});
