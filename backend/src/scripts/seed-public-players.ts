import { Logger } from '@nestjs/common';
import { PrismaClient, PlayerType, VerificationStatus, PlayerStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedPublicPlayers() {
  console.log('🌱 Seeding PUBLIC players for validation testing...');

  const publicPlayers = [
    {
      firstName: 'Lucas',
      lastName: 'Dubois',
      email: 'lucas.dubois@test.com',
      dateOfBirth: '2005-03-15',
      position: 'Midfielder',
      nationality: 'FR',
      clubName: 'FC Local Jeunes',
      parentName: 'Jean Dubois',
      parentEmail: 'jean.dubois@test.com',
      parentPhone: '+33612345678',
    },
    {
      firstName: 'Emma',
      lastName: 'Martinez',
      email: 'emma.martinez@test.com',
      dateOfBirth: '2004-07-22',
      position: 'Forward',
      nationality: 'ES',
      clubName: 'Academia Madrid',
      isPublic: true,
    },
    {
      firstName: 'Tom',
      lastName: 'Johnson',
      email: 'tom.johnson@test.com',
      dateOfBirth: '2003-11-08',
      position: 'Defender',
      nationality: 'GB',
      clubName: 'Youth United',
      height: 178,
      weight: 72,
    },
    {
      firstName: 'Sofia',
      lastName: 'Rossi',
      email: 'sofia.rossi@test.com',
      dateOfBirth: '2006-01-30',
      position: 'Goalkeeper',
      nationality: 'IT',
      clubName: 'Junior Milan',
      parentName: 'Marco Rossi',
      parentEmail: 'marco.rossi@test.com',
    },
    {
      firstName: 'Max',
      lastName: 'Wagner',
      email: 'max.wagner@test.com',
      dateOfBirth: '2005-09-12',
      position: 'Winger',
      nationality: 'DE',
      clubName: 'Bayern Youth',
      preferredFoot: 'Left',
      jerseyNumber: 17,
    },
  ];

  const hashedPassword = await bcrypt.hash('TestPlayer123!', 10);
  let createdCount = 0;

  for (const playerData of publicPlayers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: playerData.email },
      });

      if (!existingUser) {
        // Create user and player in a transaction
        await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.users.create({
            data: {
              id: randomUUID(),
              email: playerData.email,
              passwordHash: hashedPassword,
              firstName: playerData.firstName,
              lastName: playerData.lastName,
              phone: playerData.parentPhone || null,
              role: UserRole.PUBLIC,
              emailVerified: false,
              isActive: true,
              updatedAt: new Date(),
            },
          });

          // Create player profile
          await tx.players.create({
            data: {
              id: randomUUID(),
              userId: user.id,
              playerType: PlayerType.PUBLIC,
              verificationStatus: VerificationStatus.PENDING,
              position: playerData.position,
              dateOfBirth: new Date(playerData.dateOfBirth),
              nationality: playerData.nationality,
              status: PlayerStatus.PROSPECT,
              isPublic: playerData.isPublic !== false,
              parentName: playerData.parentName || null,
              parentEmail: playerData.parentEmail || null,
              parentPhone: playerData.parentPhone || null,
              preferredFoot: playerData.preferredFoot || null,
              jerseyNumber: playerData.jerseyNumber || null,
              height: playerData.height || null,
              weight: playerData.weight || null,
              biography: `Young talented ${playerData.position.toLowerCase()} from ${playerData.clubName}. Looking for opportunities to join professional academy.`,
              updatedAt: new Date(),
            },
          });

          console.log(`✅ Created PUBLIC player: ${playerData.firstName} ${playerData.lastName} (${playerData.email})`);
          createdCount++;
        });
      } else {
        console.log(`⏭️  User already exists: ${playerData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating player ${playerData.email}:`, error);
    }
  }

  console.log(`\n✨ Successfully created ${createdCount} PUBLIC players for testing!`);
  console.log('\n📝 Test credentials:');
  console.log('   Email: [any of the above]');
  console.log('   Password: TestPlayer123!');
  console.log('\n🔍 These players are now in PENDING verification status.');
  console.log('   Use the admin endpoints to validate, reject, or convert them to AGENCY.');
}

seedPublicPlayers()
  .catch((error) => {
    console.error('Error in seed script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });