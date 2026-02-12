import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAchievements() {
  try {
    const userId = '141533f6-ab47-451a-974e-e0ce634b937a';
    console.log('Fetching achievements...');

    const achievements = await prisma.achievements.findMany();
    console.log('Total achievements:', achievements.length);

    const userStats = await prisma.user_stats.findUnique({ where: { userId } });
    console.log('User stats reportsCreated:', userStats?.reportsCreated);

    // Check FIRST_REPORT manually
    const firstReport = achievements.find(a => a.code === 'FIRST_REPORT');
    if (firstReport) {
      console.log('FIRST_REPORT achievement condition:', JSON.stringify(firstReport.condition));

      const shouldUnlock = (userStats?.reportsCreated || 0) >= (firstReport.condition as any).value;
      console.log('Should unlock FIRST_REPORT?', shouldUnlock);

      // Check if already unlocked
      const alreadyUnlocked = await prisma.user_achievements.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: firstReport.id
          }
        }
      });
      console.log('Already unlocked?', !!alreadyUnlocked);
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
  }
}

testAchievements();
