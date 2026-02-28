import type { ParsedAge, ParsedNeedLine, PreferredFoot } from './types';

const normalizeToken = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const parseAgeToken = (token: string): ParsedAge | null => {
  const t = normalizeToken(token);

  // U23 / U-23
  const uMatch = t.match(/^u-?(\d{1,2})$/i);
  if (uMatch) {
    const max = parseInt(uMatch[1], 10);
    if (Number.isFinite(max) && max >= 14 && max <= 50) return { max };
  }

  // 18-23 / 18 – 23
  const rangeMatch = t.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    if (Number.isFinite(min) && Number.isFinite(max) && min >= 14 && max <= 50 && min <= max) {
      return { min, max };
    }
  }

  return null;
};

const parseFootToken = (token: string): PreferredFoot | null => {
  const t = normalizeToken(token);

  const left = ['left', 'left foot', 'pied gauche', 'gauche'];
  const right = ['right', 'right foot', 'pied droit', 'droit'];
  const both = ['both', 'ambi', 'ambidextre', 'ambidextr', 'ambidextre'];

  if (left.includes(t)) return 'Left';
  if (right.includes(t)) return 'Right';
  if (both.includes(t)) return 'Both';

  return null;
};

const POSITION_MAP: Array<{ patterns: string[]; positions: string[] }> = [
  { patterns: ['striker', 'st', '9', 'n9', 'num 9', 'numero 9'], positions: ['Striker'] },
  {
    patterns: ['right winger', 'rw', 'ailier droit'],
    positions: ['Right Winger'],
  },
  {
    patterns: ['left winger', 'lw', 'ailier gauche'],
    positions: ['Left Winger'],
  },
  {
    // Generic winger => both wings
    patterns: ['winger', 'ailier'],
    positions: ['Left Winger', 'Right Winger'],
  },
  {
    patterns: ['central back', 'center back', 'centre back', 'cb', 'dc', 'defenseur central'],
    positions: ['Center Back'],
  },
  { patterns: ['left back', 'lb', 'arriere gauche', 'lat gauche'], positions: ['Left Back'] },
  { patterns: ['right back', 'rb', 'arriere droit', 'lat droit'], positions: ['Right Back'] },
  {
    patterns: [
      'defensive midfielder',
      'defensive mid',
      'dm',
      'cdm',
      'mdf',
      '6',
      'numero 6',
      'num 6',
    ],
    positions: ['Defensive Midfielder'],
  },
  {
    patterns: ['central midfielder', 'central mid', 'cm', 'mc', 'milieu central'],
    positions: ['Central Midfielder'],
  },
  {
    patterns: ['attacking midfielder', 'attacking mid', 'am', 'cam', '10', 'numero 10', 'num 10'],
    positions: ['Attacking Midfielder'],
  },
  { patterns: ['goalkeeper', 'keeper', 'gk', 'gardien'], positions: ['Goalkeeper'] },
];

const parsePositionsFromToken = (token: string): string[] => {
  const t = normalizeToken(token);
  const found: string[] = [];

  const matches = (pattern: string) => {
    const p = normalizeToken(pattern);
    // Avoid accidental substring matches for short abbreviations (e.g. "st" in "strong")
    if (/^\d+$/.test(p)) return t === p;
    if (p.length <= 2) return t === p;
    return t === p || t.includes(p);
  };

  for (const entry of POSITION_MAP) {
    if (entry.patterns.some(matches)) {
      found.push(...entry.positions);
    }
  }

  return [...new Set(found)];
};

export function parseClubNeedsRawText(rawText: string): ParsedNeedLine[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line, idx) => {
    const lineNumber = idx + 1;
    const parts = line
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const clubName = parts[0] ?? '';

    const warnings: string[] = [];
    const errors: string[] = [];
    const positions: string[] = [];
    let age: ParsedAge | undefined;
    let preferredFoot: PreferredFoot | undefined;

    if (!clubName) {
      errors.push('Missing club name');
    }

    const tokens = parts.slice(1);
    if (tokens.length === 0) {
      errors.push('No criteria provided');
    }

    for (const rawToken of tokens) {
      const token = normalizeToken(rawToken);
      if (!token) continue;

      const parsedAge = parseAgeToken(token);
      if (parsedAge) {
        age = { ...(age ?? {}), ...parsedAge };
        continue;
      }

      const foot = parseFootToken(token);
      if (foot) {
        preferredFoot = foot;
        continue;
      }

      const tokenPositions = parsePositionsFromToken(token);
      if (tokenPositions.length > 0) {
        positions.push(...tokenPositions);
        continue;
      }

      warnings.push(`Ignored token: ${rawToken}`);
    }

    const dedupPositions = [...new Set(positions)];
    if (dedupPositions.length === 0) {
      errors.push('No position recognized');
    }

    return {
      lineNumber,
      clubName,
      positions: dedupPositions,
      age,
      preferredFoot,
      warnings,
      errors,
    };
  });
}
