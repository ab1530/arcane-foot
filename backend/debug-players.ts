import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });

async function testPlayersQuery() {
  try {
    console.log('Testing players query...\n');

    // Test the exact query used by players.service.ts findAll()
    const players = await prisma.players.findMany({
      take: 5,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            country: true,
          },
        },
        _count: {
          select: {
            scouting_reports: true,
            media: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ SUCCESS: Found ${players.length} players\n`);
    console.log('Sample player:');
    if (players[0]) {
      console.log(JSON.stringify(players[0], null, 2));
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlayersQuery();
