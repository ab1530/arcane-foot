import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TAG = '[DEMO_CALENDAR_2026]';
const SEASON = '2025-2026';
const TIMEZONE = 'Europe/Paris';

const competitions = [
  {
    id: 'demo-cal-2026-comp-ligue-1',
    name: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    level: '1',
    type: 'LEAGUE',
    season: SEASON,
  },
  {
    id: 'demo-cal-2026-comp-ligue-2',
    name: 'Ligue 2',
    shortName: 'L2',
    country: 'France',
    level: '2',
    type: 'LEAGUE',
    season: SEASON,
  },
  {
    id: 'demo-cal-2026-comp-national',
    name: 'National 1',
    shortName: 'NAT',
    country: 'France',
    level: '3',
    type: 'LEAGUE',
    season: SEASON,
  },
];

const clubs = [
  {
    id: 'demo-cal-2026-club-marseille',
    name: 'Marseille Academy',
    shortName: 'OMA',
    country: 'France',
    city: 'Marseille',
    stadium: 'Stade Velodrome',
    logo: 'https://ui-avatars.com/api/?name=Marseille&background=1f4f9a&color=fff',
  },
  {
    id: 'demo-cal-2026-club-lyon',
    name: 'Lyon Prospect',
    shortName: 'LYP',
    country: 'France',
    city: 'Lyon',
    stadium: 'Groupama Stadium',
    logo: 'https://ui-avatars.com/api/?name=Lyon&background=1d4ed8&color=fff',
  },
  {
    id: 'demo-cal-2026-club-lille',
    name: 'Lille Elite',
    shortName: 'LIL',
    country: 'France',
    city: 'Lille',
    stadium: 'Decathlon Arena',
    logo: 'https://ui-avatars.com/api/?name=Lille&background=b91c1c&color=fff',
  },
  {
    id: 'demo-cal-2026-club-nantes',
    name: 'Nantes U23',
    shortName: 'NAN',
    country: 'France',
    city: 'Nantes',
    stadium: 'Stade de la Beaujoire',
    logo: 'https://ui-avatars.com/api/?name=Nantes&background=166534&color=fff',
  },
  {
    id: 'demo-cal-2026-club-rennes',
    name: 'Rennes Futur',
    shortName: 'REN',
    country: 'France',
    city: 'Rennes',
    stadium: 'Roazhon Park',
    logo: 'https://ui-avatars.com/api/?name=Rennes&background=7c2d12&color=fff',
  },
  {
    id: 'demo-cal-2026-club-strasbourg',
    name: 'Strasbourg Next',
    shortName: 'STR',
    country: 'France',
    city: 'Strasbourg',
    stadium: 'Stade de la Meinau',
    logo: 'https://ui-avatars.com/api/?name=Strasbourg&background=334155&color=fff',
  },
  {
    id: 'demo-cal-2026-club-nice',
    name: 'Nice Espoir',
    shortName: 'NIC',
    country: 'France',
    city: 'Nice',
    stadium: 'Allianz Riviera',
    logo: 'https://ui-avatars.com/api/?name=Nice&background=0f766e&color=fff',
  },
  {
    id: 'demo-cal-2026-club-toulouse',
    name: 'Toulouse Development',
    shortName: 'TLS',
    country: 'France',
    city: 'Toulouse',
    stadium: 'Stadium de Toulouse',
    logo: 'https://ui-avatars.com/api/?name=Toulouse&background=6d28d9&color=fff',
  },
];

const venues = [
  {
    id: 'demo-cal-2026-venue-marseille',
    name: 'Stade Velodrome',
    address: '3 Boulevard Michelet',
    city: 'Marseille',
    country: 'France',
    latitude: 43.2699,
    longitude: 5.3959,
    clubId: 'demo-cal-2026-club-marseille',
  },
  {
    id: 'demo-cal-2026-venue-lyon',
    name: 'Groupama Stadium',
    address: '10 Avenue Simone Veil',
    city: 'Decines-Charpieu',
    country: 'France',
    latitude: 45.7651,
    longitude: 4.982,
    clubId: 'demo-cal-2026-club-lyon',
  },
  {
    id: 'demo-cal-2026-venue-lille',
    name: 'Decathlon Arena',
    address: '261 Boulevard de Tournai',
    city: 'Villeneuve-d Ascq',
    country: 'France',
    latitude: 50.6119,
    longitude: 3.1304,
    clubId: 'demo-cal-2026-club-lille',
  },
  {
    id: 'demo-cal-2026-venue-nantes',
    name: 'Stade de la Beaujoire',
    address: 'Route de Saint-Joseph',
    city: 'Nantes',
    country: 'France',
    latitude: 47.2554,
    longitude: -1.5257,
    clubId: 'demo-cal-2026-club-nantes',
  },
  {
    id: 'demo-cal-2026-venue-rennes',
    name: 'Roazhon Park',
    address: '111 Route de Lorient',
    city: 'Rennes',
    country: 'France',
    latitude: 48.1075,
    longitude: -1.7127,
    clubId: 'demo-cal-2026-club-rennes',
  },
  {
    id: 'demo-cal-2026-venue-strasbourg',
    name: 'Stade de la Meinau',
    address: '12 Rue de l Extenwoerth',
    city: 'Strasbourg',
    country: 'France',
    latitude: 48.5601,
    longitude: 7.7543,
    clubId: 'demo-cal-2026-club-strasbourg',
  },
  {
    id: 'demo-cal-2026-venue-nice',
    name: 'Allianz Riviera',
    address: 'Boulevard des Jardiniers',
    city: 'Nice',
    country: 'France',
    latitude: 43.7043,
    longitude: 7.1927,
    clubId: 'demo-cal-2026-club-nice',
  },
  {
    id: 'demo-cal-2026-venue-toulouse',
    name: 'Stadium de Toulouse',
    address: '1 Allee Gabriel Bienes',
    city: 'Toulouse',
    country: 'France',
    latitude: 43.5839,
    longitude: 1.4349,
    clubId: 'demo-cal-2026-club-toulouse',
  },
];

const kickoffHoursUtc = [13, 15, 18, 20];

const toTimeLabel = (date: Date) => {
  const label = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE,
  });
  return label.replace('h', ':');
};

async function upsertCalendarBaseData() {
  for (const competition of competitions) {
    const now = new Date();
    const createData: Prisma.competitionsUncheckedCreateInput = {
      ...competition,
      createdAt: now,
      updatedAt: now,
    };
    const updateData: Prisma.competitionsUncheckedUpdateInput = {
      ...competition,
      updatedAt: now,
    };
    await prisma.competitions.upsert({
      where: { id: competition.id },
      create: createData,
      update: updateData,
    });
  }

  for (const club of clubs) {
    const now = new Date();
    const createData: Prisma.clubsUncheckedCreateInput = {
      ...club,
      createdAt: now,
      updatedAt: now,
    };
    const updateData: Prisma.clubsUncheckedUpdateInput = {
      ...club,
      updatedAt: now,
    };
    await prisma.clubs.upsert({
      where: { id: club.id },
      create: createData,
      update: updateData,
    });
  }

  for (const venue of venues) {
    const now = new Date();
    const createData: Prisma.venuesUncheckedCreateInput = {
      ...venue,
      createdAt: now,
      updatedAt: now,
    };
    const updateData: Prisma.venuesUncheckedUpdateInput = {
      name: venue.name,
      address: venue.address,
      city: venue.city,
      country: venue.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      clubId: venue.clubId,
      updatedAt: now,
    };
    await prisma.venues.upsert({
      where: { id: venue.id },
      create: createData,
      update: updateData,
    });
  }
}

function buildDemoFixtures() {
  const fixtures: Array<{
    id: string;
    scheduledAt: Date;
    homeClubId: string;
    awayClubId: string;
    competitionId: string;
    venueId: string;
  }> = [];

  for (let i = 0; i < 30; i += 1) {
    const date = new Date(Date.UTC(2026, 1, 28 + i, kickoffHoursUtc[i % kickoffHoursUtc.length], 0, 0));
    const homeClub = clubs[i % clubs.length];
    const awayClub = clubs[(i + 3) % clubs.length];
    const competition = competitions[i % competitions.length];
    const venue = venues[i % venues.length];

    fixtures.push({
      id: `demo-cal-2026-match-${String(i + 1).padStart(2, '0')}`,
      scheduledAt: date,
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      competitionId: competition.id,
      venueId: venue.id,
    });
  }

  return fixtures;
}

async function seedCalendarFixtures() {
  const fixtures = buildDemoFixtures();
  const scoutPool = await prisma.users.findMany({
    where: { role: 'SCOUT', isActive: true },
    orderBy: { email: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 20,
  });
  const coordinator = await prisma.users.findFirst({
    where: {
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'AGENT'] },
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true },
  });

  let createdOrUpdatedMatches = 0;
  let createdOrUpdatedAssignments = 0;

  for (let i = 0; i < fixtures.length; i += 1) {
    const now = new Date();
    const fixture = fixtures[i];
    const scout = scoutPool.length > 0 ? scoutPool[i % scoutPool.length] : null;
    const assignScout = i % 2 === 0 && scout;
    const missionType = i % 4 === 0 ? 'PRIORITY' : 'VOLUNTARY';
    const matchCreateData: Prisma.matchesUncheckedCreateInput = {
      id: fixture.id,
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      scheduledAt: fixture.scheduledAt,
      season: SEASON,
      status: 'SCHEDULED',
      scoutId: assignScout ? scout!.id : null,
      notes: `${DEMO_TAG} Match de demo pour calendrier partagé`,
      competitionId: fixture.competitionId,
      matchDate: fixture.scheduledAt,
      matchTime: toTimeLabel(fixture.scheduledAt),
      timezone: TIMEZONE,
      venueId: fixture.venueId,
      createdAt: now,
      updatedAt: now,
    };
    const matchUpdateData: Prisma.matchesUncheckedUpdateInput = {
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      scheduledAt: fixture.scheduledAt,
      season: SEASON,
      status: 'SCHEDULED',
      scoutId: assignScout ? scout!.id : null,
      notes: `${DEMO_TAG} Match de demo pour calendrier partagé`,
      competitionId: fixture.competitionId,
      matchDate: fixture.scheduledAt,
      matchTime: toTimeLabel(fixture.scheduledAt),
      timezone: TIMEZONE,
      venueId: fixture.venueId,
      updatedAt: now,
    };

    await prisma.matches.upsert({
      where: { id: fixture.id },
      create: matchCreateData,
      update: matchUpdateData,
    });
    createdOrUpdatedMatches += 1;

    if (!assignScout) {
      continue;
    }

    const assignmentCreateData: Prisma.match_assignmentsUncheckedCreateInput = {
      id: `demo-cal-2026-assignment-${String(i + 1).padStart(2, '0')}`,
      matchId: fixture.id,
      scoutId: scout!.id,
      status: 'ASSIGNED',
      missionType,
      role: 'PRIMARY_SCOUT',
      targetPlayerNames: [],
      reportSubmitted: false,
      assignedById: coordinator?.id ?? null,
      notes: `${DEMO_TAG} ${missionType} / ${scout!.firstName ?? ''} ${scout!.lastName ?? ''}`.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const assignmentUpdateData: Prisma.match_assignmentsUncheckedUpdateInput = {
      scoutId: scout!.id,
      status: 'ASSIGNED',
      missionType,
      role: 'PRIMARY_SCOUT',
      targetPlayerNames: [],
      reportSubmitted: false,
      assignedById: coordinator?.id ?? null,
      notes: `${DEMO_TAG} ${missionType} / ${scout!.firstName ?? ''} ${scout!.lastName ?? ''}`.trim(),
      updatedAt: now,
    };

    await prisma.match_assignments.upsert({
      where: { id: `demo-cal-2026-assignment-${String(i + 1).padStart(2, '0')}` },
      create: assignmentCreateData,
      update: assignmentUpdateData,
    });
    createdOrUpdatedAssignments += 1;
  }

  return {
    fixtures: fixtures.length,
    createdOrUpdatedMatches,
    createdOrUpdatedAssignments,
    scoutsUsed: scoutPool.length,
    coordinatorRole: coordinator?.role ?? null,
  };
}

async function main() {
  console.log('--- Seed Calendar 2026 (Feb-Mar) ---');
  await upsertCalendarBaseData();
  const result = await seedCalendarFixtures();
  console.log('Seed summary:', result);
}

main()
  .catch((error) => {
    console.error('Failed to seed calendar 2026 fixtures:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
