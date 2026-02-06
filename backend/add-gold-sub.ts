import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scout = await prisma.users.findFirst({
    where: { email: 'scout1@arcane.com' }
  });

  if (!scout) {
    console.log('Scout not found');
    return;
  }

  console.log(`Found scout: ${scout.email} (ID: ${scout.id})`);

  const existing = await prisma.subscriptions.findFirst({
    where: { userId: scout.id }
  });

  if (existing) {
    await prisma.subscriptions.update({
      where: { id: existing.id },
      data: {
        tier: SubscriptionTier.GOLD,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }
    });
    console.log('✅ Updated subscription to GOLD');
  } else {
    await prisma.subscriptions.create({
      data: {
        id: Math.random().toString(36).substring(7),
        userId: scout.id,
        tier: SubscriptionTier.GOLD,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }
    });
    console.log('✅ Created GOLD subscription');
  }

  const sub = await prisma.subscriptions.findFirst({
    where: { userId: scout.id }
  });
  console.log(`Subscription: ${sub?.tier} - ${sub?.status}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
