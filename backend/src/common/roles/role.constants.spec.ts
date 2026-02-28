import { isCategoryARole, isCategoryBRole, ROLE_CATEGORY_MAP } from './role.constants';

describe('Role category mapping', () => {
  it('should map SUPER_ADMIN and ADMIN as category A', () => {
    expect(isCategoryARole('SUPER_ADMIN')).toBe(true);
    expect(isCategoryARole('ADMIN')).toBe(true);
  });

  it('should map AGENT as category B', () => {
    expect(isCategoryBRole('AGENT')).toBe(true);
  });

  it('should expose shared mapping in role constants', () => {
    expect(ROLE_CATEGORY_MAP.SUPER_ADMIN).toBe('A');
    expect(ROLE_CATEGORY_MAP.ADMIN).toBe('A');
    expect(ROLE_CATEGORY_MAP.AGENT).toBe('B');
  });
});
