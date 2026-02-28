import { buildPlayersWhereFromNeedLine } from './matcher';
import type { ParsedNeedLine } from './types';

describe('ClubNeeds matcher', () => {
  it('builds where clause with positions + isPublic + preferredFoot Left includes Both', () => {
    const line: ParsedNeedLine = {
      lineNumber: 1,
      clubName: 'Mallorca',
      positions: ['Striker'],
      preferredFoot: 'Left',
      warnings: [],
      errors: [],
    };

    const where = buildPlayersWhereFromNeedLine(line);
    expect(where.isPublic).toBe(true);
    expect(where.position).toEqual({ in: ['Striker'] });
    expect(where.preferredFoot).toEqual({ in: ['Left', 'Both'] });
  });

  it('builds where clause with age range', () => {
    const line: ParsedNeedLine = {
      lineNumber: 1,
      clubName: 'Girona',
      positions: ['Center Back'],
      age: { min: 18, max: 23 },
      warnings: [],
      errors: [],
    };

    const where = buildPlayersWhereFromNeedLine(line);
    expect(where.dateOfBirth).toBeDefined();
    expect(where.dateOfBirth.gte).toBeInstanceOf(Date);
    expect(where.dateOfBirth.lte).toBeInstanceOf(Date);
  });
});
