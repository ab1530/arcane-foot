export type PreferredFoot = 'Left' | 'Right' | 'Both';

export type ParsedAge = {
  min?: number;
  max?: number;
};

export type ParsedNeedLine = {
  lineNumber: number;
  clubName: string;
  positions: string[]; // Prisma players.position values
  age?: ParsedAge;
  preferredFoot?: PreferredFoot;
  warnings: string[];
  errors: string[];
};

export type ClubNeedMatchPlayer = {
  playerId: string;
  firstName: string | null;
  lastName: string | null;
  position: string;
  nationality: string;
  club: { id: string; name: string; logo: string | null } | null;
  marketValue: number | null;
  contractUntil: Date | null;
  preferredFoot: string | null;
  photoUrl: string | null;
};

export type ClubNeedMatchResult = {
  lineNumber: number;
  clubName: string;
  criteria: {
    positions: string[];
    age?: ParsedAge;
    preferredFoot?: PreferredFoot;
  };
  players: ClubNeedMatchPlayer[];
  warnings: string[];
  errors: string[];
};

export type ClubNeedLineState = {
  lineNumber: number;
  clubName: string;
  isCompleted: boolean;
  completedAt: string | null;
  completedById: string | null;
  reopenedAt: string | null;
  reopenedById: string | null;
};

export type ClubNeedRequestProgress = 'ACTIVE' | 'PARTIAL' | 'COMPLETED';
