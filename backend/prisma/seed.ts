import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    await prisma.scoutingReport.deleteMany();
    await prisma.match.deleteMany();
    await prisma.player.deleteMany();
    await prisma.club.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Existing data cleared');
  }

  // Hash a common password for all seed users
  const password = await bcrypt.hash('Password123!', 10);

  // 1. Create Users with different roles
  console.log('👥 Creating users...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@arcane.com',
      passwordHash: password,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+33600000001',
      isActive: true,
    },
  });

  const scout1 = await prisma.user.create({
    data: {
      email: 'scout1@arcane.com',
      passwordHash: password,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'SCOUT',
      phone: '+33600000002',
      isActive: true,
    },
  });

  const scout2 = await prisma.user.create({
    data: {
      email: 'scout2@arcane.com',
      passwordHash: password,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'SCOUT',
      phone: '+33600000003',
      isActive: true,
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@arcane.com',
      passwordHash: password,
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: 'AGENT',
      phone: '+33600000004',
      isActive: true,
    },
  });

  const player1User = await prisma.user.create({
    data: {
      email: 'kylian.mbappe@example.com',
      passwordHash: password,
      firstName: 'Kylian',
      lastName: 'Mbappé',
      role: 'PLAYER',
      phone: '+33600000005',
      isActive: true,
    },
  });

  const player2User = await prisma.user.create({
    data: {
      email: 'antoine.griezmann@example.com',
      passwordHash: password,
      firstName: 'Antoine',
      lastName: 'Griezmann',
      role: 'PLAYER',
      phone: '+33600000006',
      isActive: true,
    },
  });

  const player3User = await prisma.user.create({
    data: {
      email: 'karim.benzema@example.com',
      passwordHash: password,
      firstName: 'Karim',
      lastName: 'Benzema',
      role: 'PLAYER',
      phone: '+33600000007',
      isActive: true,
    },
  });

  const player4User = await prisma.user.create({
    data: {
      email: 'ngolo.kante@example.com',
      passwordHash: password,
      firstName: 'N\'Golo',
      lastName: 'Kanté',
      role: 'PLAYER',
      phone: '+33600000008',
      isActive: true,
    },
  });

  console.log(`✅ Created ${8} users`);

  // 2. Create Clubs
  console.log('🏟️  Creating clubs...');
  const psg = await prisma.club.create({
    data: {
      name: 'Paris Saint-Germain',
      shortName: 'PSG',
      country: 'FR',
      city: 'Paris',
      stadium: 'Parc des Princes',
      founded: 1970,
      logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      website: 'https://www.psg.fr',
    },
  });

  const om = await prisma.club.create({
    data: {
      name: 'Olympique de Marseille',
      shortName: 'OM',
      country: 'FR',
      city: 'Marseille',
      stadium: 'Stade Vélodrome',
      founded: 1899,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
      website: 'https://www.om.fr',
    },
  });

  const lyon = await prisma.club.create({
    data: {
      name: 'Olympique Lyonnais',
      shortName: 'OL',
      country: 'FR',
      city: 'Lyon',
      stadium: 'Groupama Stadium',
      founded: 1950,
      logo: 'https://upload.wikimedia.org/wikipedia/en/e/e2/Olympique_Lyonnais_logo.svg',
      website: 'https://www.ol.fr',
    },
  });

  const monaco = await prisma.club.create({
    data: {
      name: 'AS Monaco',
      shortName: 'Monaco',
      country: 'MC',
      city: 'Monaco',
      stadium: 'Stade Louis II',
      founded: 1924,
      logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/AS_Monaco_FC.svg',
      website: 'https://www.asmonaco.com',
    },
  });

  const lille = await prisma.club.create({
    data: {
      name: 'LOSC Lille',
      shortName: 'Lille',
      country: 'FR',
      city: 'Lille',
      stadium: 'Stade Pierre-Mauroy',
      founded: 1944,
      logo: 'https://upload.wikimedia.org/wikipedia/en/d/d0/Lille_OSC_logo.svg',
      website: 'https://www.losc.fr',
    },
  });

  const realMadrid = await prisma.club.create({
    data: {
      name: 'Real Madrid',
      shortName: 'Real',
      country: 'ES',
      city: 'Madrid',
      stadium: 'Santiago Bernabéu',
      founded: 1902,
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      website: 'https://www.realmadrid.com',
    },
  });

  console.log(`✅ Created ${6} clubs`);

  // 3. Create Players
  console.log('⚽ Creating players...');
  const mbappe = await prisma.player.create({
    data: {
      userId: player1User.id,
      position: 'Forward',
      height: 178,
      weight: 73,
      preferredFoot: 'Right',
      nationality: 'FR',
      dateOfBirth: new Date('1998-12-20'),
      clubId: realMadrid.id,
      jerseyNumber: 9,
      status: 'ACTIVE',
      marketValue: 180000000,
      contractUntil: new Date('2029-06-30'),
      statsJson: {
        appearances: 308,
        goals: 256,
        assists: 108,
        yellowCards: 32,
        redCards: 1,
      },
    },
  });

  const griezmann = await prisma.player.create({
    data: {
      userId: player2User.id,
      position: 'Forward',
      height: 176,
      weight: 72,
      preferredFoot: 'Left',
      nationality: 'FR',
      dateOfBirth: new Date('1991-03-21'),
      clubId: om.id,
      jerseyNumber: 7,
      status: 'ACTIVE',
      marketValue: 25000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        appearances: 425,
        goals: 234,
        assists: 98,
        yellowCards: 28,
        redCards: 2,
      },
    },
  });

  const benzema = await prisma.player.create({
    data: {
      userId: player3User.id,
      position: 'Forward',
      height: 185,
      weight: 81,
      preferredFoot: 'Right',
      nationality: 'FR',
      dateOfBirth: new Date('1987-12-19'),
      clubId: lyon.id,
      jerseyNumber: 10,
      status: 'ACTIVE',
      marketValue: 15000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        appearances: 648,
        goals: 354,
        assists: 165,
        yellowCards: 56,
        redCards: 4,
      },
    },
  });

  const kante = await prisma.player.create({
    data: {
      userId: player4User.id,
      position: 'Midfielder',
      height: 168,
      weight: 70,
      preferredFoot: 'Right',
      nationality: 'FR',
      dateOfBirth: new Date('1991-03-29'),
      clubId: psg.id,
      jerseyNumber: 13,
      status: 'ACTIVE',
      marketValue: 30000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        appearances: 398,
        goals: 13,
        assists: 16,
        yellowCards: 42,
        redCards: 1,
      },
    },
  });

  console.log(`✅ Created ${4} players`);

  // 4. Create Matches
  console.log('📅 Creating matches...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const match1 = await prisma.match.create({
    data: {
      homeClubId: psg.id,
      awayClubId: om.id,
      scheduledAt: tomorrow,
      venue: psg.stadium,
      competition: 'Ligue 1',
      season: '2025-2026',
      status: 'SCHEDULED',
      scoutId: scout1.id,
      notes: 'Classic Le Classique match - high priority scouting',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      homeClubId: lyon.id,
      awayClubId: monaco.id,
      scheduledAt: nextWeek,
      venue: lyon.stadium,
      competition: 'Ligue 1',
      season: '2025-2026',
      status: 'SCHEDULED',
      scoutId: scout2.id,
    },
  });

  const match3 = await prisma.match.create({
    data: {
      homeClubId: lille.id,
      awayClubId: psg.id,
      scheduledAt: lastWeek,
      venue: lille.stadium,
      competition: 'Ligue 1',
      season: '2025-2026',
      status: 'COMPLETED',
      homeScore: 1,
      awayScore: 2,
      scoutId: scout1.id,
    },
  });

  const match4 = await prisma.match.create({
    data: {
      homeClubId: om.id,
      awayClubId: lyon.id,
      scheduledAt: new Date(today.setHours(20, 0, 0, 0)),
      venue: om.stadium,
      competition: 'Ligue 1',
      season: '2025-2026',
      status: 'LIVE',
      homeScore: 1,
      awayScore: 1,
      scoutId: scout2.id,
    },
  });

  console.log(`✅ Created ${4} matches`);

  // 5. Create Scouting Reports
  console.log('📝 Creating scouting reports...');
  const report1 = await prisma.scoutingReport.create({
    data: {
      matchId: match3.id,
      playerId: mbappe.id,
      scoutId: scout1.id,
      status: 'APPROVED',
      overallRating: 9,
      strengths: 'Exceptional speed, clinical finishing, great decision making',
      weaknesses: 'Can be selfish at times, defensive contribution could improve',
      summary: 'World-class forward with incredible pace and finishing ability. A game-changer.',
      notesJson: {
        technicalSkills: 9,
        physicalAttributes: 8,
        tacticalAwareness: 8,
        mentalStrength: 9,
        recommendation: 'PRIORITY_TARGET',
        videoTimestamps: {
          goals: ['12:34', '67:89'],
          keyPasses: ['23:45', '56:78'],
          skills: ['34:56'],
        },
      },
    },
  });

  const report2 = await prisma.scoutingReport.create({
    data: {
      matchId: match3.id,
      playerId: kante.id,
      scoutId: scout1.id,
      status: 'APPROVED',
      overallRating: 8,
      strengths: 'Incredible work rate, ball recovery, tactical intelligence',
      weaknesses: 'Limited offensive contribution, passing could be more adventurous',
      summary: 'Elite defensive midfielder with exceptional stamina and positioning.',
      notesJson: {
        technicalSkills: 7,
        physicalAttributes: 9,
        tacticalAwareness: 9,
        mentalStrength: 9,
        recommendation: 'MONITOR',
      },
    },
  });

  console.log(`✅ Created ${2} scouting reports`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Users: ${8} (1 admin, 2 scouts, 1 agent, 4 players)`);
  console.log(`  - Clubs: ${6}`);
  console.log(`  - Players: ${4}`);
  console.log(`  - Matches: ${4} (1 completed, 1 live, 2 scheduled)`);
  console.log(`  - Scouting Reports: ${2}`);
  console.log('\n🔐 Login credentials (all users):');
  console.log('  Email: <user-email>');
  console.log('  Password: Password123!');
  console.log('\n📧 Sample users:');
  console.log('  - admin@arcane.com (SUPER_ADMIN)');
  console.log('  - scout1@arcane.com (SCOUT)');
  console.log('  - scout2@arcane.com (SCOUT)');
  console.log('  - agent@arcane.com (AGENT)');
  console.log('  - kylian.mbappe@example.com (PLAYER)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
