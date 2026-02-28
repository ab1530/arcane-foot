import { parseClubNeedsRawText } from './parser';

describe('ClubNeeds parser', () => {
  it('parses positions, age, and preferred foot', () => {
    const input = [
      'Mallorca, winger, striker, U23, pied gauche',
      'Girona, central back, 6, 18-23, right',
    ].join('\n');

    const parsed = parseClubNeedsRawText(input);
    expect(parsed).toHaveLength(2);

    expect(parsed[0].clubName).toBe('Mallorca');
    expect(parsed[0].positions.sort()).toEqual(['Left Winger', 'Right Winger', 'Striker'].sort());
    expect(parsed[0].age).toEqual({ max: 23 });
    expect(parsed[0].preferredFoot).toBe('Left');
    expect(parsed[0].errors).toEqual([]);

    expect(parsed[1].clubName).toBe('Girona');
    expect(parsed[1].positions.sort()).toEqual(['Center Back', 'Defensive Midfielder'].sort());
    expect(parsed[1].age).toEqual({ min: 18, max: 23 });
    expect(parsed[1].preferredFoot).toBe('Right');
    expect(parsed[1].errors).toEqual([]);
  });

  it('marks line as error when no position recognized', () => {
    const parsed = parseClubNeedsRawText('Betis, fast, strong');
    expect(parsed[0].errors).toContain('No position recognized');
  });
});
