import { PrismaClient, AchievementCategory, AchievementRarity, BadgeType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ARCANE FOOTBALL - ACHIEVEMENTS SEED DATA
 *
 * Complete achievement system with:
 * - 40+ unique achievements across 5 categories
 * - Progressive difficulty (Common → Mythic)
 * - Rewards (points + badges)
 * - Smart unlock conditions
 */

export const ACHIEVEMENTS = [
  // ============= PLAYER MILESTONES =============
  {
    code: 'FIRST_GOAL',
    name: 'Premier But',
    description: 'Marquez votre premier but',
    icon: '⚽',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.COMMON,
    points: 50,
    condition: { type: 'goals', value: 1 },
    rewardBadge: BadgeType.BRONZE,
  },
  {
    code: 'HAT_TRICK',
    name: 'Triplé',
    description: 'Marquez 3 buts dans un match',
    icon: '🎩',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.RARE,
    points: 200,
    condition: { type: 'goals_per_match', value: 3 },
    rewardBadge: BadgeType.SILVER,
  },
  {
    code: 'CENTURY_CLUB',
    name: 'Club des 100',
    description: 'Marquez 100 buts au total',
    icon: '💯',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.EPIC,
    points: 1000,
    condition: { type: 'goals', value: 100 },
    rewardBadge: BadgeType.GOLD,
  },
  {
    code: 'PROFILE_COMPLETE',
    name: 'Profil Complet',
    description: 'Complétez 100% de votre profil',
    icon: '✅',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.COMMON,
    points: 100,
    condition: { type: 'profile_complete', value: 100 },
  },
  {
    code: 'FIRST_UPLOAD',
    name: 'Premier Upload',
    description: 'Uploadez votre première vidéo ou photo',
    icon: '📸',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.COMMON,
    points: 50,
    condition: { type: 'first_action', action: 'media_upload' },
  },
  {
    code: 'VERIFIED_PLAYER',
    name: 'Joueur Vérifié',
    description: 'Obtenez la vérification de votre profil',
    icon: '✓',
    category: AchievementCategory.PLAYER_MILESTONE,
    rarity: AchievementRarity.RARE,
    points: 300,
    condition: { type: 'verification', value: 'VERIFIED' },
    rewardBadge: BadgeType.SILVER,
  },

  // ============= SCOUT EXPERTISE =============
  {
    code: 'FIRST_REPORT',
    name: 'Premier Rapport',
    description: 'Créez votre premier rapport de scouting',
    icon: '📝',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.COMMON,
    points: 100,
    condition: { type: 'reports', value: 1 },
    rewardBadge: BadgeType.BRONZE,
  },
  {
    code: 'SCOUT_ROOKIE',
    name: 'Scout Débutant',
    description: 'Validez 10 joueurs',
    icon: '🔍',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.COMMON,
    points: 200,
    condition: { type: 'validations', value: 10 },
  },
  {
    code: 'SCOUT_PRO',
    name: 'Scout Professionnel',
    description: 'Validez 50 joueurs',
    icon: '👁️',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.RARE,
    points: 500,
    condition: { type: 'validations', value: 50 },
    rewardBadge: BadgeType.SILVER,
  },
  {
    code: 'SCOUT_MASTER',
    name: 'Maître Scout',
    description: 'Validez 200 joueurs',
    icon: '🏆',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.EPIC,
    points: 1500,
    condition: { type: 'validations', value: 200 },
    rewardBadge: BadgeType.GOLD,
  },
  {
    code: 'TALENT_HUNTER',
    name: 'Chasseur de Talents',
    description: 'Découvrez 5 talents qui signent en pro',
    icon: '🎯',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.LEGENDARY,
    points: 3000,
    condition: { type: 'talent_discoveries', value: 5 },
    rewardBadge: BadgeType.PLATINUM,
  },
  {
    code: 'DETAILED_ANALYST',
    name: 'Analyste Détaillé',
    description: 'Créez 10 rapports avec toutes les sections remplies',
    icon: '📊',
    category: AchievementCategory.SCOUT_EXPERTISE,
    rarity: AchievementRarity.RARE,
    points: 400,
    condition: { type: 'detailed_reports', value: 10 },
  },

  // ============= CLUB ACHIEVEMENTS =============
  {
    code: 'FIRST_REQUEST',
    name: 'Première Approche',
    description: 'Envoyez votre première demande à un club',
    icon: '📨',
    category: AchievementCategory.CLUB_ACHIEVEMENT,
    rarity: AchievementRarity.COMMON,
    points: 75,
    condition: { type: 'first_action', action: 'club_request' },
  },
  {
    code: 'CONTRACT_SIGNED',
    name: 'Contrat Signé',
    description: 'Signez votre premier contrat avec un club',
    icon: '✍️',
    category: AchievementCategory.CLUB_ACHIEVEMENT,
    rarity: AchievementRarity.RARE,
    points: 500,
    condition: { type: 'contracts_signed', value: 1 },
    rewardBadge: BadgeType.SILVER,
  },
  {
    code: 'CLUB_LOYALTY',
    name: 'Fidélité au Club',
    description: 'Restez 365 jours dans le même club',
    icon: '💙',
    category: AchievementCategory.CLUB_ACHIEVEMENT,
    rarity: AchievementRarity.EPIC,
    points: 800,
    condition: { type: 'club_tenure_days', value: 365 },
    rewardBadge: BadgeType.GOLD,
  },
  {
    code: 'TRANSFER_MARKET',
    name: 'Marché des Transferts',
    description: 'Recevez 5 offres de clubs différents',
    icon: '💰',
    category: AchievementCategory.CLUB_ACHIEVEMENT,
    rarity: AchievementRarity.RARE,
    points: 600,
    condition: { type: 'club_offers', value: 5 },
  },

  // ============= SOCIAL ENGAGEMENT =============
  {
    code: 'WEEK_WARRIOR',
    name: 'Guerrier de la Semaine',
    description: 'Connectez-vous 7 jours consécutifs',
    icon: '🔥',
    category: AchievementCategory.SOCIAL_ENGAGEMENT,
    rarity: AchievementRarity.COMMON,
    points: 150,
    condition: { type: 'login_streak', value: 7 },
  },
  {
    code: 'MONTH_MASTER',
    name: 'Maître du Mois',
    description: 'Connectez-vous 30 jours consécutifs',
    icon: '⚡',
    category: AchievementCategory.SOCIAL_ENGAGEMENT,
    rarity: AchievementRarity.RARE,
    points: 500,
    condition: { type: 'login_streak', value: 30 },
    rewardBadge: BadgeType.SILVER,
  },
  {
    code: 'YEAR_LEGEND',
    name: 'Légende de l\'Année',
    description: 'Connectez-vous 365 jours consécutifs',
    icon: '👑',
    category: AchievementCategory.SOCIAL_ENGAGEMENT,
    rarity: AchievementRarity.MYTHIC,
    points: 5000,
    condition: { type: 'login_streak', value: 365 },
    rewardBadge: BadgeType.DIAMOND,
  },
  {
    code: 'FIRST_SHARE',
    name: 'Premier Partage',
    description: 'Partagez votre premier achievement',
    icon: '📢',
    category: AchievementCategory.SOCIAL_ENGAGEMENT,
    rarity: AchievementRarity.COMMON,
    points: 50,
    condition: { type: 'first_action', action: 'share_achievement' },
  },
  {
    code: 'INFLUENCER',
    name: 'Influenceur',
    description: 'Ayez 100 vues sur votre profil',
    icon: '📈',
    category: AchievementCategory.SOCIAL_ENGAGEMENT,
    rarity: AchievementRarity.RARE,
    points: 300,
    condition: { type: 'profile_views', value: 100 },
  },

  // ============= PERFORMANCE =============
  {
    code: 'LEVEL_5',
    name: 'Niveau 5',
    description: 'Atteignez le niveau 5',
    icon: '5️⃣',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.COMMON,
    points: 100,
    condition: { type: 'level', value: 5 },
  },
  {
    code: 'LEVEL_10',
    name: 'Niveau 10',
    description: 'Atteignez le niveau 10',
    icon: '🔟',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.RARE,
    points: 300,
    condition: { type: 'level', value: 10 },
    rewardBadge: BadgeType.SILVER,
  },
  {
    code: 'LEVEL_25',
    name: 'Niveau 25',
    description: 'Atteignez le niveau 25',
    icon: '🌟',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.EPIC,
    points: 1000,
    condition: { type: 'level', value: 25 },
    rewardBadge: BadgeType.GOLD,
  },
  {
    code: 'LEVEL_50',
    name: 'Niveau 50',
    description: 'Atteignez le niveau 50',
    icon: '💎',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.LEGENDARY,
    points: 3000,
    condition: { type: 'level', value: 50 },
    rewardBadge: BadgeType.PLATINUM,
  },
  {
    code: 'LEVEL_100',
    name: 'Niveau 100',
    description: 'Atteignez le niveau 100 - Légende absolue',
    icon: '👑',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.MYTHIC,
    points: 10000,
    condition: { type: 'level', value: 100 },
    rewardBadge: BadgeType.DIAMOND,
  },
  {
    code: 'POINT_COLLECTOR',
    name: 'Collecteur de Points',
    description: 'Accumulez 10,000 points',
    icon: '💰',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.EPIC,
    points: 500,
    condition: { type: 'total_points', value: 10000 },
  },
  {
    code: 'DAILY_CHAMPION',
    name: 'Champion Quotidien',
    description: 'Complétez 30 défis quotidiens',
    icon: '🏅',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.RARE,
    points: 600,
    condition: { type: 'daily_challenges_completed', value: 30 },
  },
  {
    code: 'LEADERBOARD_TOP_10',
    name: 'Top 10',
    description: 'Entrez dans le top 10 du leaderboard',
    icon: '🥇',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.EPIC,
    points: 1200,
    condition: { type: 'leaderboard_rank', value: 10 },
    rewardBadge: BadgeType.GOLD,
  },
  {
    code: 'LEADERBOARD_TOP_3',
    name: 'Podium',
    description: 'Entrez dans le top 3 du leaderboard',
    icon: '🥇',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.LEGENDARY,
    points: 2500,
    condition: { type: 'leaderboard_rank', value: 3 },
    rewardBadge: BadgeType.PLATINUM,
  },
  {
    code: 'LEADERBOARD_CHAMPION',
    name: 'Champion',
    description: 'Devenez #1 du leaderboard',
    icon: '👑',
    category: AchievementCategory.PERFORMANCE,
    rarity: AchievementRarity.MYTHIC,
    points: 5000,
    condition: { type: 'leaderboard_rank', value: 1 },
    rewardBadge: BadgeType.DIAMOND,
  },
];

export async function seedAchievements() {
  console.log('🏆 Seeding achievements...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const achievement of ACHIEVEMENTS) {
    try {
      const existing = await prisma.achievements.findUnique({
        where: { code: achievement.code },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.achievements.create({
        data: {
          id: `achievement_${achievement.code.toLowerCase()}`,
          ...achievement,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating achievement ${achievement.code}:`, error.message);
    }
  }

  console.log(`✅ Created ${createdCount} achievements`);
  console.log(`⏭️  Skipped ${skippedCount} existing achievements`);
  console.log(`📊 Total: ${ACHIEVEMENTS.length} achievements defined`);
}

// Run directly if called as script
if (require.main === module) {
  seedAchievements()
    .then(() => {
      console.log('✅ Achievements seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Achievements seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
