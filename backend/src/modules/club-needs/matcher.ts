import type { ParsedNeedLine } from './types';

export function buildPlayersWhereFromNeedLine(line: ParsedNeedLine) {
  const where: any = {
    isPublic: true,
  };

  if (line.positions?.length) {
    where.position = { in: line.positions };
  }

  // Age filter based on dateOfBirth (same logic as PlayersService)
  if (line.age?.min !== undefined || line.age?.max !== undefined) {
    const today = new Date();
    where.dateOfBirth = {};

    if (line.age?.max !== undefined) {
      const minDate = new Date(today.getFullYear() - line.age.max, today.getMonth(), today.getDate());
      where.dateOfBirth.gte = minDate;
    }

    if (line.age?.min !== undefined) {
      const maxDate = new Date(today.getFullYear() - line.age.min, today.getMonth(), today.getDate());
      where.dateOfBirth.lte = maxDate;
    }
  }

  // Preferred foot logic: Left/Right accept Both
  if (line.preferredFoot === 'Left') {
    where.preferredFoot = { in: ['Left', 'Both'] };
  } else if (line.preferredFoot === 'Right') {
    where.preferredFoot = { in: ['Right', 'Both'] };
  } else if (line.preferredFoot === 'Both') {
    where.preferredFoot = 'Both';
  }

  return where;
}

