import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper to generate IDs
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// French-style names for realistic data
const FIRST_NAMES = ['Antoine', 'Baptiste', 'Lucas', 'Mathieu', 'Nicolas', 'Thomas', 'Alexandre', 'Maxime', 'Hugo', 'Pierre',
  'Julien', 'Romain', 'Vincent', 'Paul', 'Louis', 'Arthur', 'Gabriel', 'Raphaël', 'Léo', 'Jules'];

const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];

const CLUB_CITIES = {
  France: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Nice', 'Bordeaux', 'Toulouse', 'Strasbourg', 'Nantes', 'Rennes'],
  England: ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'],
  Spain: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'],
  Italy: ['Milan', 'Rome', 'Turin', 'Naples', 'Florence'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt']
};

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

async function main() {
  console.log('🌱 Starting demo data seed...');

  // Clear existing data (be careful in production!)
  console.log('Clearing existing data...');

  // Try to delete tables that exist
  try {
    await prisma.scouting_notes.deleteMany();
  } catch (e) {}
  try {
    await prisma.scouting_reports.deleteMany();
  } catch (e) {}
  try {
    await prisma.match_assignments.deleteMany();
  } catch (e) {}
  try {
    await prisma.matches.deleteMany();
  } catch (e) {}
  try {
    await prisma.camp_participations.deleteMany();
  } catch (e) {}
  try {
    await prisma.camps.deleteMany();
  } catch (e) {}
  try {
    await prisma.club_requests.deleteMany();
  } catch (e) {}
  try {
    await prisma.players.deleteMany();
  } catch (e) {}
  try {
    await prisma.clubs.deleteMany();
  } catch (e) {}
  try {
    await prisma.coaching_bookings.deleteMany();
  } catch (e) {}
  try {
    await prisma.coaches.deleteMany();
  } catch (e) {}
  try {
    await prisma.user_achievements.deleteMany();
  } catch (e) {}
  try {
    await prisma.achievements.deleteMany();
  } catch (e) {}
  try {
    await prisma.user_daily_challenges.deleteMany();
  } catch (e) {}
  try {
    await prisma.daily_challenges.deleteMany();
  } catch (e) {}
  try {
    await prisma.subscriptions.deleteMany();
  } catch (e) {}
  try {
    await prisma.notifications.deleteMany();
  } catch (e) {}
  try {
    await prisma.users.deleteMany();
  } catch (e) {}

  const demoPassword = process.env.ARCANE_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error(
      'ARCANE_DEMO_PASSWORD is required to seed demo users. Set it in your environment (do not commit passwords).',
    );
  }

  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Create users
  console.log('Creating users...');
  const users = [];

  // Super Admin
  users.push({
    id: generateId(),
    email: 'admin@arcane.com',
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Regular Admins
  for (let i = 1; i <= 3; i++) {
    users.push({
      id: generateId(),
      email: `admin${i}@arcane.com`,
      passwordHash,
      firstName: FIRST_NAMES[i],
      lastName: LAST_NAMES[i],
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Scouts (50)
  for (let i = 1; i <= 50; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    users.push({
      id: generateId(),
      email: `scout${i}@arcane.com`,
      passwordHash,
      firstName,
      lastName,
      role: 'SCOUT',
      emailVerified: true,
      isActive: true,
      phone: `+33 6 ${Math.floor(10000000 + Math.random() * 89999999)}`,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0891b2&color=fff`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Agents (20)
  for (let i = 1; i <= 20; i++) {
    users.push({
      id: generateId(),
      email: `agent${i}@arcane.com`,
      passwordHash,
      firstName: FIRST_NAMES[(i + 5) % FIRST_NAMES.length],
      lastName: LAST_NAMES[(i + 5) % LAST_NAMES.length],
      role: 'AGENT',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Analysts (10)
  for (let i = 1; i <= 10; i++) {
    users.push({
      id: generateId(),
      email: `analyst${i}@arcane.com`,
      passwordHash,
      firstName: FIRST_NAMES[(i + 10) % FIRST_NAMES.length],
      lastName: LAST_NAMES[(i + 10) % LAST_NAMES.length],
      role: 'ANALYST',
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await prisma.users.createMany({ data: users });

  // Create clubs
  console.log('Creating clubs...');
  const clubs = [];
  let clubIndex = 0;

  for (const [country, cities] of Object.entries(CLUB_CITIES)) {
    for (const city of cities.slice(0, 5)) {
      clubIndex++;
      const clubContactUser = {
        id: generateId(),
        email: `club.${city.toLowerCase()}@arcane.com`,
        passwordHash,
        firstName: 'Contact',
        lastName: city,
        role: 'CLUB_CONTACT' as const,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await prisma.users.create({ data: clubContactUser });

      clubs.push({
        id: generateId(),
        name: `${city} FC`,
        shortName: city.substring(0, 3).toUpperCase(),
        logo: `https://ui-avatars.com/api/?name=${city}&background=${Math.floor(Math.random()*16777215).toString(16)}&color=fff&size=128&rounded=true`,
        country,
        city,
        stadium: `Stade ${city}`,
        founded: 1900 + Math.floor(Math.random() * 100),
        website: `https://www.${city.toLowerCase()}fc.com`,
        contactUserId: clubContactUser.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  await prisma.clubs.createMany({ data: clubs });

  // Create players
  console.log('Creating players...');
  const players = [];
  const playerUsers = [];

  for (let i = 0; i < 200; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const age = 16 + Math.floor(Math.random() * 20);
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

    const playerUser = {
      id: generateId(),
      email: `player${i + 1}@arcane.com`,
      passwordHash,
      firstName,
      lastName,
      role: 'PLAYER' as const,
      emailVerified: true,
      isActive: true,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=3b82f6&color=fff`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    playerUsers.push(playerUser);

    const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const clubId = Math.random() > 0.2 ? clubs[Math.floor(Math.random() * clubs.length)].id : null;

    players.push({
      id: generateId(),
      userId: playerUser.id,
      clubId,
      position,
      preferredFoot: Math.random() > 0.3 ? 'right' : 'left',
      jerseyNumber: Math.floor(1 + Math.random() * 99),
      height: 165 + Math.floor(Math.random() * 30),
      weight: 60 + Math.floor(Math.random() * 30),
      dateOfBirth,
      nationality: ['France', 'Spain', 'Brazil', 'England', 'Germany', 'Italy'][Math.floor(Math.random() * 6)],
      status: 'ACTIVE',
      marketValue: Math.floor(0.5 + Math.random() * 20) * 1000000,
      contractUntil: clubId ? new Date(Date.now() + Math.random() * 4 * 365 * 24 * 60 * 60 * 1000) : null,
      biography: `${firstName} ${lastName} is a talented ${age}-year-old ${position} with great potential.`,
      statsJson: {
        matchesPlayed: Math.floor(15 + Math.random() * 20),
        goals: position === 'ST' ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 5),
        assists: Math.floor(Math.random() * 10),
        yellowCards: Math.floor(Math.random() * 5),
        redCards: Math.random() > 0.9 ? 1 : 0,
        averageRating: (6.0 + Math.random() * 2.5).toFixed(1),
        passAccuracy: (70 + Math.random() * 20).toFixed(1),
        arkaneIndex: {
          technical: Math.floor(60 + Math.random() * 35),
          tactical: Math.floor(60 + Math.random() * 35),
          physical: Math.floor(60 + Math.random() * 35),
          mental: Math.floor(60 + Math.random() * 35),
          potential: Math.floor(70 + Math.random() * 25),
          consistency: Math.floor(60 + Math.random() * 35)
        }
      },
      isPublic: true,
      playerType: 'PUBLIC',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await prisma.users.createMany({ data: playerUsers });
  await prisma.players.createMany({ data: players });

  // Create matches
  console.log('Creating matches...');
  const matches = [];
  const startDate = new Date('2024-08-01');
  const endDate = new Date('2025-05-31');

  for (let i = 0; i < 100; i++) {
    const homeClub = clubs[Math.floor(Math.random() * clubs.length)];
    let awayClub = clubs[Math.floor(Math.random() * clubs.length)];
    while (awayClub.id === homeClub.id) {
      awayClub = clubs[Math.floor(Math.random() * clubs.length)];
    }

    const matchDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const isCompleted = matchDate < new Date();
    const scout = users.find(u => u.role === 'SCOUT');

    matches.push({
      id: generateId(),
      homeClubId: homeClub.id,
      awayClubId: awayClub.id,
      scheduledAt: matchDate,
      matchDate,
      season: '2024-2025',
      status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
      homeScore: isCompleted ? Math.floor(Math.random() * 4) : null,
      awayScore: isCompleted ? Math.floor(Math.random() * 4) : null,
      scoutId: scout?.id || null,
      attendance: 5000 + Math.floor(Math.random() * 50000),
      referee: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
      round: `Round ${Math.floor(1 + i / 3)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await prisma.matches.createMany({ data: matches });

  // Create scouting reports
  console.log('Creating scouting reports...');
  const completedMatches = matches.filter(m => m.status === 'COMPLETED');
  const scouts = users.filter(u => u.role === 'SCOUT');
  const reports = [];

  for (let i = 0; i < Math.min(150, completedMatches.length * 2); i++) {
    const match = completedMatches[i % completedMatches.length];
    const scout = scouts[i % scouts.length];
    const player = players[i % players.length];

    const technicalRating = 60 + Math.floor(Math.random() * 35);
    const physicalRating = 60 + Math.floor(Math.random() * 35);
    const mentalRating = 60 + Math.floor(Math.random() * 35);
    const tacticalRating = 60 + Math.floor(Math.random() * 35);
    const overallRating = Math.floor((technicalRating + physicalRating + mentalRating + tacticalRating) / 4);

    reports.push({
      id: generateId(),
      matchId: match.id,
      playerId: player.id,
      scoutId: scout.id,
      status: ['SUBMITTED', 'REVIEWED', 'APPROVED'][Math.floor(Math.random() * 3)],
      overallRating,
      summary: `Observed player during match. Performance was ${overallRating > 75 ? 'excellent' : overallRating > 65 ? 'good' : 'average'}.`,
      strengths: 'Good technical ability, strong work rate',
      weaknesses: 'Needs to improve defensive positioning',
      technicalRating,
      physicalRating,
      mentalRating,
      tacticalRating,
      playerMinutesPlayed: 45 + Math.floor(Math.random() * 45),
      playerPosition: player.position,
      recommendation: ['BUY_NOW', 'MONITOR', 'FOLLOW_UP', 'NOT_INTERESTED'][Math.floor(Math.random() * 4)],
      recommendationNotes: 'Continue monitoring this player for future opportunities.',
      tags: ['promising', 'technical', 'athletic'],
      submittedAt: new Date(match.matchDate.getTime() + 24 * 60 * 60 * 1000),
      reviewedAt: new Date(match.matchDate.getTime() + 48 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await prisma.scouting_reports.createMany({ data: reports });

  // Create achievements
  console.log('Creating achievements...');
  const achievements = [
    { id: generateId(), code: 'FIRST_GOAL', name: 'First Goal', description: 'Score your first goal', category: 'PLAYER_MILESTONE' as const, rarity: 'COMMON' as const, points: 100 },
    { id: generateId(), code: 'HAT_TRICK', name: 'Hat Trick Hero', description: 'Score 3 goals in a match', category: 'PLAYER_MILESTONE' as const, rarity: 'RARE' as const, points: 500 },
    { id: generateId(), code: 'CENTURY', name: 'Century Club', description: 'Play 100 matches', category: 'PLAYER_MILESTONE' as const, rarity: 'EPIC' as const, points: 1000 },
    { id: generateId(), code: 'SCOUT_10', name: 'Eye for Talent', description: 'Submit 10 scouting reports', category: 'SCOUT_EXPERTISE' as const, rarity: 'COMMON' as const, points: 200 },
    { id: generateId(), code: 'DIAMOND', name: 'Diamond Finder', description: 'Discover a player worth over 10M', category: 'SCOUT_EXPERTISE' as const, rarity: 'LEGENDARY' as const, points: 1000 },
    { id: generateId(), code: 'CHAMPION', name: 'Champions', description: 'Win the league', category: 'CLUB_ACHIEVEMENT' as const, rarity: 'MYTHIC' as const, points: 2000 },
    { id: generateId(), code: 'TEAM_PLAYER', name: 'Team Player', description: 'Join a club', category: 'SOCIAL_ENGAGEMENT' as const, rarity: 'COMMON' as const, points: 50 },
    { id: generateId(), code: 'CLEAN_SHEET', name: 'Clean Sheet', description: 'Keep a clean sheet as goalkeeper', category: 'PERFORMANCE' as const, rarity: 'RARE' as const, points: 300 },
    { id: generateId(), code: 'PERFECT_SCOUT', name: 'Perfect Scout', description: 'Submit a report with 90+ rating', category: 'SCOUT_EXPERTISE' as const, rarity: 'RARE' as const, points: 400 },
    { id: generateId(), code: 'RISING_STAR', name: 'Rising Star', description: 'Reach level 10', category: 'SOCIAL_ENGAGEMENT' as const, rarity: 'COMMON' as const, points: 200 }
  ].map(a => ({ ...a, isActive: true, createdAt: new Date(), updatedAt: new Date() }));

  await prisma.achievements.createMany({ data: achievements });

  // Note: user_stats table may not exist in current migrations
  // Skip creating user stats if table doesn't exist

  // Create camps
  console.log('Creating camps...');
  const camps = clubs.slice(0, 20).map(club => ({
    id: generateId(),
    name: `${club.name} Summer Camp 2025`,
    description: `Join us for an intensive training camp at ${club.stadium}. Perfect for aspiring players aged 14-21.`,
    clubId: club.id,
    location: `${club.stadium}, ${club.city}`,
    startDate: new Date('2025-06-15'),
    endDate: new Date('2025-06-22'),
    capacity: 50,
    availableSpots: Math.floor(10 + Math.random() * 40),
    ageMin: 14,
    ageMax: 21,
    price: 500,
    currency: 'EUR',
    type: 'CAMP' as const,
    status: 'PUBLISHED' as const,
    isPublic: true,
    hasShowcaseGame: true,
    includedBenefits: ['Professional coaching', 'Video analysis', 'Nutrition guidance'],
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await prisma.camps.createMany({ data: camps });

  // Create coaches
  console.log('Creating coaches...');
  const coachingTypes = ['MENTAL_COACHING', 'PHYSICAL_TRAINING', 'TECHNICAL_COACH', 'TACTICAL_COACH'];
  const coaches = [];

  for (let i = 0; i < 20; i++) {
    const firstName = FIRST_NAMES[(i + 8) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + 8) % LAST_NAMES.length];

    coaches.push({
      id: generateId(),
      firstName,
      lastName,
      email: `coach${i + 1}@arcane.com`,
      phone: `+33 6 ${Math.floor(10000000 + Math.random() * 89999999)}`,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=10b981&color=fff`,
      bio: `Experienced coach with ${5 + Math.floor(Math.random() * 15)} years of experience.`,
      coachingType: coachingTypes[i % coachingTypes.length],
      specialties: ['Ball control', 'Tactical awareness', 'Physical conditioning'],
      hourlyRate: 50 + Math.floor(Math.random() * 100),
      currency: 'EUR',
      isActive: true,
      city: Object.values(CLUB_CITIES).flat()[i % Object.values(CLUB_CITIES).flat().length],
      country: Object.keys(CLUB_CITIES)[Math.floor(i / 5) % Object.keys(CLUB_CITIES).length],
      canWorkRemote: Math.random() > 0.5,
      languages: ['English', 'French'],
      certifications: ['UEFA B License', 'Sports Psychology'],
      yearsExperience: 5 + Math.floor(Math.random() * 15),
      minTierRequired: 'BASIC',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  await prisma.coaches.createMany({ data: coaches });

  // Create subscriptions for premium users
  console.log('Creating subscriptions...');
  const premiumUsers = users.filter(u => ['SCOUT', 'AGENT', 'ANALYST'].includes(u.role)).slice(0, 30);
  const subscriptions = premiumUsers.map(user => ({
    id: generateId(),
    userId: user.id,
    tier: ['PRO', 'BASIC', 'FREE'][Math.floor(Math.random() * 3)] as 'PRO' | 'BASIC' | 'FREE',
    status: 'ACTIVE' as const,
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await prisma.subscriptions.createMany({ data: subscriptions });

  console.log('✅ Demo data seed completed successfully!');
  console.log(`
    Created:
    - ${users.length + playerUsers.length} users (${playerUsers.length} players)
    - ${clubs.length} clubs
    - ${players.length} player profiles
    - ${matches.length} matches
    - ${reports.length} scouting reports
    - ${achievements.length} achievements
    - ${camps.length} camps
    - ${coaches.length} coaches
    - ${subscriptions.length} subscriptions
  `);
}

main()
  .catch(e => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
