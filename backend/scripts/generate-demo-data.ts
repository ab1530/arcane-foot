import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

// Types based on Prisma schema
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'SCOUT' | 'ANALYST' | 'PLAYER' | 'CLUB_CONTACT' | 'PUBLIC';
type PlayerStatus = 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED' | 'PROSPECT';
type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'GOLD';
type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';

// Configuration
const DATA_CONFIG = {
  users: {
    superAdmins: 1,
    admins: 5,
    scouts: 200,
    agents: 80,
    analysts: 50,
    players: 500,
    clubContacts: 120,
    public: 100
  },
  clubs: 120,
  matches: 150,
  reports: 300,
  achievements: 75,
  camps: 20,
  coaches: 40
};

// Helper functions
let demoPasswordHashPromise: Promise<string> | null = null;
const getDemoPasswordHash = async (): Promise<string> => {
  if (!demoPasswordHashPromise) {
    const demoPassword = process.env.ARCANE_DEMO_PASSWORD;
    if (!demoPassword) {
      throw new Error(
        'ARCANE_DEMO_PASSWORD is required to generate demo users. Set it in your environment (do not commit passwords).',
      );
    }
    demoPasswordHashPromise = bcrypt.hash(demoPassword, 10);
  }
  return demoPasswordHashPromise;
};

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateDateBetween = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// European countries and their football cultures
const EUROPEAN_COUNTRIES = {
  France: { leagues: ['Ligue 1', 'Ligue 2'], cities: ['Paris', 'Lyon', 'Marseille', 'Lille', 'Nice', 'Bordeaux', 'Toulouse', 'Strasbourg', 'Nantes', 'Rennes'] },
  England: { leagues: ['Premier League', 'Championship'], cities: ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Sheffield', 'Newcastle', 'Bristol', 'Leicester', 'Southampton'] },
  Spain: { leagues: ['LaLiga', 'LaLiga 2'], cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga', 'Zaragoza', 'Vigo', 'Villarreal', 'San Sebastián'] },
  Italy: { leagues: ['Serie A', 'Serie B'], cities: ['Milan', 'Rome', 'Turin', 'Naples', 'Florence', 'Bologna', 'Genoa', 'Venice', 'Verona', 'Bergamo'] },
  Germany: { leagues: ['Bundesliga', '2. Bundesliga'], cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Leipzig', 'Bremen'] },
  Netherlands: { leagues: ['Eredivisie'], cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'] },
  Belgium: { leagues: ['Pro League'], cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mechelen', 'Aalst'] },
  Portugal: { leagues: ['Primeira Liga'], cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Setúbal', 'Funchal', 'Faro', 'Aveiro', 'Viseu', 'Guimarães'] }
};

// Position configurations
const POSITIONS = {
  GK: { full: 'Goalkeeper', subPositions: ['GK'] },
  DEF: { full: 'Defender', subPositions: ['CB', 'LB', 'RB', 'LWB', 'RWB'] },
  MID: { full: 'Midfielder', subPositions: ['CDM', 'CM', 'CAM', 'LM', 'RM'] },
  FWD: { full: 'Forward', subPositions: ['ST', 'CF', 'LW', 'RW'] }
};

// French-style names for realistic data
const FRENCH_FIRST_NAMES = ['Antoine', 'Baptiste', 'Lucas', 'Mathieu', 'Nicolas', 'Thomas', 'Alexandre', 'Maxime', 'Hugo', 'Pierre',
  'Julien', 'Romain', 'Vincent', 'Paul', 'Louis', 'Arthur', 'Gabriel', 'Raphaël', 'Léo', 'Jules',
  'Théo', 'Nathan', 'Enzo', 'Yanis', 'Mattéo', 'Noah', 'Tom', 'Clément', 'Adrian', 'Valentin'];

const FRENCH_LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
  'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand'];

// Nationalities distribution
const NATIONALITIES = [
  { country: 'France', weight: 0.30 },
  { country: 'Spain', weight: 0.15 },
  { country: 'Brazil', weight: 0.10 },
  { country: 'England', weight: 0.10 },
  { country: 'Germany', weight: 0.08 },
  { country: 'Italy', weight: 0.07 },
  { country: 'Netherlands', weight: 0.05 },
  { country: 'Belgium', weight: 0.05 },
  { country: 'Portugal', weight: 0.05 },
  { country: 'Argentina', weight: 0.05 }
];

// Generate weighted nationality
const getWeightedNationality = (): string => {
  const random = Math.random();
  let accumulator = 0;

  for (const nat of NATIONALITIES) {
    accumulator += nat.weight;
    if (random <= accumulator) {
      return nat.country;
    }
  }

  return 'France';
};

// Generate realistic player stats
const generatePlayerStats = (age: number, position: string) => {
  const baseMultiplier = age < 21 ? 0.7 : age < 25 ? 0.85 : 1;
  const positionMultipliers = {
    GK: { technical: 0.6, physical: 0.9, mental: 1.1, tactical: 0.8 },
    DEF: { technical: 0.7, physical: 1.0, mental: 0.9, tactical: 1.0 },
    MID: { technical: 1.0, physical: 0.8, mental: 1.0, tactical: 1.1 },
    FWD: { technical: 1.1, physical: 0.85, mental: 0.85, tactical: 0.8 }
  };

  const mult = positionMultipliers[position] || positionMultipliers.MID;

  return {
    matchesPlayed: Math.floor(15 + Math.random() * 20),
    minutesPlayed: Math.floor(500 + Math.random() * 2000),
    goals: position === 'FWD' ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 5),
    assists: Math.floor(Math.random() * 10),
    yellowCards: Math.floor(Math.random() * 5),
    redCards: Math.random() > 0.9 ? 1 : 0,
    averageRating: (6.0 + Math.random() * 2.5).toFixed(1),
    technicalRating: Math.floor(60 + Math.random() * 30 * mult.technical * baseMultiplier),
    physicalRating: Math.floor(60 + Math.random() * 30 * mult.physical * baseMultiplier),
    mentalRating: Math.floor(60 + Math.random() * 30 * mult.mental * baseMultiplier),
    tacticalRating: Math.floor(60 + Math.random() * 30 * mult.tactical * baseMultiplier),
    passAccuracy: (70 + Math.random() * 20).toFixed(1),
    duelSuccess: (40 + Math.random() * 30).toFixed(1),
    aerialSuccess: position === 'DEF' ? (50 + Math.random() * 30).toFixed(1) : (30 + Math.random() * 30).toFixed(1),
    sprintSpeed: (25 + Math.random() * 10).toFixed(1),
    maxSpeed: (28 + Math.random() * 8).toFixed(1)
  };
};

// Generate ArkaneIndex (6 dimensions)
const generateArkaneIndex = (stats: any) => {
  return {
    technical: Math.floor(stats.technicalRating * 0.9 + Math.random() * 10),
    tactical: Math.floor(stats.tacticalRating * 0.9 + Math.random() * 10),
    physical: Math.floor(stats.physicalRating * 0.9 + Math.random() * 10),
    mental: Math.floor(stats.mentalRating * 0.9 + Math.random() * 10),
    potential: Math.floor(70 + Math.random() * 25),
    consistency: Math.floor(60 + Math.random() * 35)
  };
};

// Generate market value based on age, position, and ratings
const generateMarketValue = (age: number, position: string, overallRating: number): number => {
  const ageMultiplier = age < 21 ? 1.5 : age < 25 ? 1.2 : age < 28 ? 1.0 : age < 32 ? 0.7 : 0.4;
  const positionMultiplier = position === 'FWD' ? 1.3 : position === 'MID' ? 1.1 : position === 'DEF' ? 0.9 : 0.7;
  const baseValue = (overallRating / 100) * 10; // Base in millions

  return parseFloat((baseValue * ageMultiplier * positionMultiplier).toFixed(2));
};

// Generate PlayStyle DNA
const generatePlayStyleDNA = (position: string) => {
  const styles = {
    GK: ['Sweeper Keeper', 'Traditional', 'Ball Playing'],
    DEF: ['Ball Playing Defender', 'Defensive Wall', 'Attacking Fullback', 'Libero'],
    MID: ['Box to Box', 'Playmaker', 'Destroyer', 'Regista', 'Mezzala', 'Trequartista'],
    FWD: ['Target Man', 'Poacher', 'False 9', 'Winger', 'Inside Forward', 'Complete Forward']
  };

  return getRandomElement(styles[position] || styles.MID);
};

// Main data generation class
class DemoDataGenerator {
  private users: any[] = [];
  private clubs: any[] = [];
  private players: any[] = [];
  private matches: any[] = [];
  private scoutingReports: any[] = [];
  private achievements: any[] = [];
  private userStats: any[] = [];
  private camps: any[] = [];
  private coaches: any[] = [];
  private subscriptions: any[] = [];

  async generate() {
    console.log('🚀 Starting demo data generation...');

    await this.generateUsers();
    await this.generateClubs();
    await this.generatePlayers();
    await this.generateMatches();
    await this.generateScoutingReports();
    await this.generateAchievements();
    await this.generateCamps();
    await this.generateCoaches();
    await this.generateAIData();

    await this.saveToFiles();

    console.log('✅ Demo data generation complete!');
  }

  private async generateUsers() {
    console.log('Generating users...');
    const passwordHash = await getDemoPasswordHash();

    // Super Admin
    this.users.push({
      id: uuidv4(),
      email: 'admin@arcane.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN' as UserRole,
      emailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Admins
    for (let i = 1; i <= DATA_CONFIG.users.admins; i++) {
      this.users.push({
        id: uuidv4(),
        email: `admin${i}@arcane.com`,
        passwordHash,
        firstName: getRandomElement(FRENCH_FIRST_NAMES),
        lastName: getRandomElement(FRENCH_LAST_NAMES),
        role: 'ADMIN' as UserRole,
        emailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Scouts
    for (let i = 1; i <= DATA_CONFIG.users.scouts; i++) {
      const firstName = getRandomElement(FRENCH_FIRST_NAMES);
      const lastName = getRandomElement(FRENCH_LAST_NAMES);
      this.users.push({
        id: uuidv4(),
        email: `scout${i}@arcane.com`,
        passwordHash,
        firstName,
        lastName,
        role: 'SCOUT' as UserRole,
        emailVerified: true,
        isActive: true,
        phone: faker.phone.number(),
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0891b2&color=fff`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Agents
    for (let i = 1; i <= DATA_CONFIG.users.agents; i++) {
      const firstName = getRandomElement(FRENCH_FIRST_NAMES);
      const lastName = getRandomElement(FRENCH_LAST_NAMES);
      this.users.push({
        id: uuidv4(),
        email: `agent${i}@arcane.com`,
        passwordHash,
        firstName,
        lastName,
        role: 'AGENT' as UserRole,
        emailVerified: true,
        isActive: true,
        phone: faker.phone.number(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create subscription data for premium users
    const premiumRoles = this.users.filter(u => ['SCOUT', 'AGENT', 'ANALYST'].includes(u.role));
    for (const user of premiumRoles) {
      const tier = Math.random() > 0.5 ? 'PRO' : Math.random() > 0.5 ? 'BASIC' : 'FREE';
      this.subscriptions.push({
        id: uuidv4(),
        userId: user.id,
        tier: tier as SubscriptionTier,
        status: 'ACTIVE',
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateClubs() {
    console.log('Generating clubs...');
    let clubIndex = 0;

    for (const [country, data] of Object.entries(EUROPEAN_COUNTRIES)) {
      const clubsPerLeague = Math.floor(120 / Object.keys(EUROPEAN_COUNTRIES).length / data.leagues.length);

      for (const league of data.leagues) {
        for (let i = 0; i < clubsPerLeague && clubIndex < DATA_CONFIG.clubs; i++) {
          const city = getRandomElement(data.cities);
          const clubName = `${city} FC`;
          const clubId = uuidv4();

          // Create club contact user
          const contactUser = {
            id: uuidv4(),
            email: `contact.${city.toLowerCase()}@club.com`,
            passwordHash: await getDemoPasswordHash(),
            firstName: 'Contact',
            lastName: clubName,
            role: 'CLUB_CONTACT' as UserRole,
            emailVerified: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.users.push(contactUser);

          this.clubs.push({
            id: clubId,
            name: clubName,
            shortName: city.substring(0, 3).toUpperCase(),
            logo: `https://ui-avatars.com/api/?name=${city}&background=${faker.string.hexadecimal({ length: 6 }).substring(2)}&color=fff&size=128&rounded=true`,
            country,
            city,
            stadium: `Stade ${city}`,
            founded: 1900 + Math.floor(Math.random() * 100),
            website: `https://www.${city.toLowerCase()}fc.com`,
            contactUserId: contactUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          clubIndex++;
        }
      }
    }
  }

  private async generatePlayers() {
    console.log('Generating players...');

    for (let i = 0; i < DATA_CONFIG.users.players; i++) {
      const firstName = getRandomElement(FRENCH_FIRST_NAMES);
      const lastName = getRandomElement(FRENCH_LAST_NAMES);
      const age = 16 + Math.floor(Math.random() * 20); // 16-36 years old
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

      const positionKey = getRandomElement(Object.keys(POSITIONS)) as keyof typeof POSITIONS;
      const position = POSITIONS[positionKey];
      const subPosition = getRandomElement(position.subPositions);

      // Create user for player
      const playerUser = {
        id: uuidv4(),
        email: `player${i + 1}@arcane.com`,
        passwordHash: await getDemoPasswordHash(),
        firstName,
        lastName,
        role: 'PLAYER' as UserRole,
        emailVerified: true,
        isActive: true,
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=3b82f6&color=fff`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.users.push(playerUser);

      // Generate player stats
      const stats = generatePlayerStats(age, positionKey);
      const overallRating = Math.floor((stats.technicalRating + stats.physicalRating + stats.mentalRating + stats.tacticalRating) / 4);
      const arkaneIndex = generateArkaneIndex(stats);
      const marketValue = generateMarketValue(age, positionKey, overallRating);
      const playStyle = generatePlayStyleDNA(positionKey);

      // Assign to random club (80% chance)
      const clubId = Math.random() > 0.2 ? getRandomElement(this.clubs).id : null;

      this.players.push({
        id: uuidv4(),
        userId: playerUser.id,
        clubId,
        position: subPosition,
        preferredFoot: Math.random() > 0.3 ? 'right' : 'left',
        jerseyNumber: Math.floor(1 + Math.random() * 99),
        height: 165 + Math.floor(Math.random() * 30), // 165-195 cm
        weight: 60 + Math.floor(Math.random() * 30), // 60-90 kg
        dateOfBirth,
        nationality: getWeightedNationality(),
        status: getRandomElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INJURED', 'PROSPECT']) as PlayerStatus,
        marketValue,
        contractUntil: clubId ? new Date(Date.now() + Math.random() * 4 * 365 * 24 * 60 * 60 * 1000) : null,
        biography: `${firstName} ${lastName} is a talented ${age}-year-old ${subPosition} from ${getWeightedNationality()}. Known for their ${playStyle} playing style.`,
        statsJson: {
          current: stats,
          arkaneIndex,
          playStyle,
          overall: overallRating,
          potential: age < 23 ? overallRating + Math.floor(Math.random() * 15) : overallRating
        },
        isPublic: true,
        playerType: 'PUBLIC',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateMatches() {
    console.log('Generating matches...');

    const startDate = new Date('2024-08-01');
    const endDate = new Date('2025-05-31');

    for (let i = 0; i < DATA_CONFIG.matches; i++) {
      const homeClub = getRandomElement(this.clubs);
      let awayClub = getRandomElement(this.clubs);
      while (awayClub.id === homeClub.id) {
        awayClub = getRandomElement(this.clubs);
      }

      const matchDate = generateDateBetween(startDate, endDate);
      const isCompleted = matchDate < new Date();
      const scout = getRandomElement(this.users.filter(u => u.role === 'SCOUT'));

      this.matches.push({
        id: uuidv4(),
        homeClubId: homeClub.id,
        awayClubId: awayClub.id,
        scheduledAt: matchDate,
        matchDate,
        season: '2024-2025',
        status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
        homeScore: isCompleted ? Math.floor(Math.random() * 4) : null,
        awayScore: isCompleted ? Math.floor(Math.random() * 4) : null,
        scoutId: scout?.id,
        venue: homeClub.stadium,
        attendance: 5000 + Math.floor(Math.random() * 50000),
        referee: `${getRandomElement(FRENCH_FIRST_NAMES)} ${getRandomElement(FRENCH_LAST_NAMES)}`,
        round: `Round ${Math.floor(1 + Math.random() * 38)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateScoutingReports() {
    console.log('Generating scouting reports...');

    const completedMatches = this.matches.filter(m => m.status === 'COMPLETED');
    const scouts = this.users.filter(u => u.role === 'SCOUT');

    for (let i = 0; i < DATA_CONFIG.reports && i < completedMatches.length * 2; i++) {
      const match = getRandomElement(completedMatches);
      const scout = getRandomElement(scouts);
      const player = getRandomElement(this.players);

      const technicalRating = 60 + Math.floor(Math.random() * 35);
      const physicalRating = 60 + Math.floor(Math.random() * 35);
      const mentalRating = 60 + Math.floor(Math.random() * 35);
      const tacticalRating = 60 + Math.floor(Math.random() * 35);
      const overallRating = Math.floor((technicalRating + physicalRating + mentalRating + tacticalRating) / 4);

      const strengths = [
        'Excellent ball control and dribbling ability',
        'Strong aerial presence',
        'Exceptional passing range',
        'Clinical finishing in the box',
        'Impressive work rate and stamina'
      ];

      const weaknesses = [
        'Needs to improve defensive positioning',
        'Can be caught out of position',
        'Decision making in final third',
        'Consistency throughout 90 minutes',
        'Weak foot needs development'
      ];

      const recommendations = ['BUY_NOW', 'MONITOR', 'FOLLOW_UP', 'NOT_INTERESTED', 'NEEDS_MORE_DATA'];

      this.scoutingReports.push({
        id: uuidv4(),
        matchId: match.id,
        playerId: player.id,
        scoutId: scout.id,
        status: getRandomElement(['SUBMITTED', 'REVIEWED', 'APPROVED']) as ReportStatus,
        overallRating,
        summary: `Observed ${player.userId} during ${match.homeClubId} vs ${match.awayClubId}. The player showed ${overallRating > 75 ? 'excellent' : overallRating > 65 ? 'good' : 'average'} performance overall.`,
        strengths: getRandomElement(strengths) + '. ' + getRandomElement(strengths),
        weaknesses: getRandomElement(weaknesses),
        technicalRating,
        physicalRating,
        mentalRating,
        tacticalRating,
        playerMinutesPlayed: 45 + Math.floor(Math.random() * 45),
        playerPosition: player.position,
        recommendation: getRandomElement(recommendations),
        recommendationNotes: `Based on the performance, I recommend we ${getRandomElement(['continue monitoring', 'make an offer', 'wait for more data'])} this player.`,
        tags: ['promising', 'technical', 'athletic', 'tactical'].slice(0, Math.floor(Math.random() * 3) + 1),
        submittedAt: new Date(match.matchDate.getTime() + 24 * 60 * 60 * 1000),
        reviewedAt: new Date(match.matchDate.getTime() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateAchievements() {
    console.log('Generating achievements...');

    const achievementTemplates = [
      { category: 'PLAYER_MILESTONE', name: 'First Goal', description: 'Score your first goal', points: 100, rarity: 'COMMON' },
      { category: 'PLAYER_MILESTONE', name: 'Hat Trick Hero', description: 'Score 3 goals in a match', points: 500, rarity: 'RARE' },
      { category: 'PLAYER_MILESTONE', name: 'Century Club', description: 'Play 100 matches', points: 1000, rarity: 'EPIC' },
      { category: 'SCOUT_EXPERTISE', name: 'Eye for Talent', description: 'Submit 10 scouting reports', points: 200, rarity: 'COMMON' },
      { category: 'SCOUT_EXPERTISE', name: 'Diamond Finder', description: 'Discover a player worth over 10M', points: 1000, rarity: 'LEGENDARY' },
      { category: 'CLUB_ACHIEVEMENT', name: 'Champions', description: 'Win the league', points: 2000, rarity: 'MYTHIC' },
      { category: 'SOCIAL_ENGAGEMENT', name: 'Team Player', description: 'Join a club', points: 50, rarity: 'COMMON' },
      { category: 'PERFORMANCE', name: 'Clean Sheet', description: 'Keep a clean sheet as goalkeeper', points: 300, rarity: 'RARE' }
    ];

    for (let i = 0; i < 75; i++) {
      const template = getRandomElement(achievementTemplates);
      this.achievements.push({
        id: uuidv4(),
        code: `ACH_${i.toString().padStart(3, '0')}`,
        name: template.name + (i > 7 ? ` ${i}` : ''),
        description: template.description,
        category: template.category,
        rarity: template.rarity,
        points: template.points,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create user stats for active users
    const activeUsers = this.users.filter(u => u.role !== 'PUBLIC');
    for (const user of activeUsers) {
      this.userStats.push({
        id: uuidv4(),
        userId: user.id,
        totalPoints: Math.floor(Math.random() * 10000),
        currentLevel: Math.floor(1 + Math.random() * 20),
        currentLevelPoints: Math.floor(Math.random() * 1000),
        nextLevelPoints: 1000,
        achievementsCount: Math.floor(Math.random() * 30),
        badgesCount: Math.floor(Math.random() * 10),
        reportsSubmitted: user.role === 'SCOUT' ? Math.floor(Math.random() * 50) : 0,
        loginStreak: Math.floor(Math.random() * 30),
        lastLoginDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateCamps() {
    console.log('Generating camps...');

    const campTypes = ['CAMP', 'DETECTION', 'SHOWCASE', 'TRAINING'];
    const benefits = ['Professional coaching', 'Video analysis', 'Nutrition guidance', 'Match opportunities', 'Scout exposure'];

    for (let i = 0; i < DATA_CONFIG.camps; i++) {
      const club = getRandomElement(this.clubs);
      const startDate = generateDateBetween(new Date(), new Date('2025-08-31'));
      const endDate = new Date(startDate.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000);

      this.camps.push({
        id: uuidv4(),
        name: `${club.name} ${getRandomElement(['Summer', 'Winter', 'Spring', 'Elite'])} Camp 2025`,
        description: `Join us for an intensive training camp at ${club.stadium}. Perfect for aspiring players aged 14-21.`,
        clubId: club.id,
        location: `${club.stadium}, ${club.city}`,
        startDate,
        endDate,
        capacity: 30 + Math.floor(Math.random() * 70),
        ageMin: 14,
        ageMax: 21,
        price: 200 + Math.floor(Math.random() * 800),
        currency: 'EUR',
        type: getRandomElement(campTypes),
        status: startDate > new Date() ? 'PUBLISHED' : 'COMPLETED',
        isPublic: true,
        hasShowcaseGame: Math.random() > 0.5,
        includedBenefits: benefits.slice(0, Math.floor(Math.random() * 3) + 2),
        availableSpots: Math.floor(Math.random() * 30),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateCoaches() {
    console.log('Generating coaches...');

    const coachingTypes = ['MENTAL_COACHING', 'PHYSICAL_TRAINING', 'NUTRITIONIST', 'PHYSIOTHERAPIST', 'TECHNICAL_COACH', 'TACTICAL_COACH'];
    const specialties = {
      MENTAL_COACHING: ['Confidence building', 'Performance anxiety', 'Goal setting', 'Visualization'],
      PHYSICAL_TRAINING: ['Strength training', 'Speed development', 'Injury prevention', 'Endurance'],
      NUTRITIONIST: ['Diet planning', 'Weight management', 'Supplement guidance', 'Recovery nutrition'],
      TECHNICAL_COACH: ['Ball control', 'Shooting technique', 'Passing accuracy', 'Dribbling'],
      TACTICAL_COACH: ['Game reading', 'Positioning', 'Team tactics', 'Set pieces']
    };

    for (let i = 0; i < DATA_CONFIG.coaches; i++) {
      const firstName = getRandomElement(FRENCH_FIRST_NAMES);
      const lastName = getRandomElement(FRENCH_LAST_NAMES);
      const type = getRandomElement(coachingTypes);
      const country = getRandomElement(Object.keys(EUROPEAN_COUNTRIES));

      this.coaches.push({
        id: uuidv4(),
        firstName,
        lastName,
        email: `coach${i + 1}@arcane.com`,
        phone: faker.phone.number(),
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=10b981&color=fff`,
        bio: `Experienced ${type.replace('_', ' ').toLowerCase()} with ${5 + Math.floor(Math.random() * 15)} years of experience working with professional athletes.`,
        coachingType: type,
        specialties: specialties[type] || ['General training'],
        hourlyRate: 50 + Math.floor(Math.random() * 150),
        currency: 'EUR',
        isActive: true,
        city: getRandomElement(EUROPEAN_COUNTRIES[country].cities),
        country,
        canWorkRemote: Math.random() > 0.3,
        languages: ['English', 'French', country === 'Spain' ? 'Spanish' : country === 'Germany' ? 'German' : 'English'],
        certifications: ['UEFA B License', 'Sports Psychology Cert', 'First Aid'].slice(0, Math.floor(Math.random() * 2) + 1),
        yearsExperience: 5 + Math.floor(Math.random() * 15),
        minTierRequired: getRandomElement(['BASIC', 'PRO', 'ENTERPRISE']) as SubscriptionTier,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  private async generateAIData() {
    console.log('Generating AI data...');

    // For each player, generate AI predictions and valuations
    for (const player of this.players.slice(0, 100)) { // Top 100 players only for demo
      // Performance predictions for upcoming matches
      const upcomingMatches = this.matches.filter(m => m.status === 'SCHEDULED').slice(0, 3);
      for (const match of upcomingMatches) {
        const predictedRating = 6.0 + Math.random() * 3.0;
        // Add performance prediction (would be saved separately in real scenario)
      }

      // Market value AI data (already included in player stats)
    }
  }

  private async saveToFiles() {
    console.log('Saving data to files...');

    // Create directories
    const dirs = ['backend/data/json', 'backend/data/sql', 'backend/prisma'];
    for (const dir of dirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    // Save JSON files
    const jsonData = {
      users: this.users,
      clubs: this.clubs,
      players: this.players,
      matches: this.matches,
      scoutingReports: this.scoutingReports,
      achievements: this.achievements,
      userStats: this.userStats,
      camps: this.camps,
      coaches: this.coaches,
      subscriptions: this.subscriptions
    };

    for (const [key, data] of Object.entries(jsonData)) {
      fs.writeFileSync(
        path.join(process.cwd(), `backend/data/json/${key}.json`),
        JSON.stringify(data, null, 2)
      );
    }

    // Generate Prisma seed file
    await this.generatePrismaSeed();

    // Generate SQL files
    await this.generateSQLFiles();

    console.log(`✅ Generated:
      - ${this.users.length} users
      - ${this.clubs.length} clubs
      - ${this.players.length} players
      - ${this.matches.length} matches
      - ${this.scoutingReports.length} scouting reports
      - ${this.achievements.length} achievements
      - ${this.camps.length} camps
      - ${this.coaches.length} coaches
    `);
  }

  private async generatePrismaSeed() {
    const seedContent = `import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Import JSON data
import users from '../data/json/users.json';
import clubs from '../data/json/clubs.json';
import players from '../data/json/players.json';
import matches from '../data/json/matches.json';
import scoutingReports from '../data/json/scoutingReports.json';
import achievements from '../data/json/achievements.json';
import userStats from '../data/json/userStats.json';
import camps from '../data/json/camps.json';
import coaches from '../data/json/coaches.json';
import subscriptions from '../data/json/subscriptions.json';

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.scouting_reports.deleteMany();
  await prisma.matches.deleteMany();
  await prisma.players.deleteMany();
  await prisma.clubs.deleteMany();
  await prisma.user_stats.deleteMany();
  await prisma.achievements.deleteMany();
  await prisma.camps.deleteMany();
  await prisma.coaches.deleteMany();
  await prisma.subscriptions.deleteMany();
  await prisma.users.deleteMany();

  // Create users
  console.log('Creating users...');
  await prisma.users.createMany({
    data: users
  });

  // Create clubs
  console.log('Creating clubs...');
  await prisma.clubs.createMany({
    data: clubs
  });

  // Create players
  console.log('Creating players...');
  await prisma.players.createMany({
    data: players
  });

  // Create matches
  console.log('Creating matches...');
  await prisma.matches.createMany({
    data: matches
  });

  // Create scouting reports
  console.log('Creating scouting reports...');
  await prisma.scouting_reports.createMany({
    data: scoutingReports
  });

  // Create achievements
  console.log('Creating achievements...');
  await prisma.achievements.createMany({
    data: achievements
  });

  // Create user stats
  console.log('Creating user stats...');
  await prisma.user_stats.createMany({
    data: userStats
  });

  // Create camps
  console.log('Creating camps...');
  await prisma.camps.createMany({
    data: camps
  });

  // Create coaches
  console.log('Creating coaches...');
  await prisma.coaches.createMany({
    data: coaches
  });

  // Create subscriptions
  console.log('Creating subscriptions...');
  await prisma.subscriptions.createMany({
    data: subscriptions
  });

  console.log('✅ Seed completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'backend/prisma/seed.ts'),
      seedContent
    );
  }

  private async generateSQLFiles() {
    // Generate SQL insert statements
    // This would be more complex in practice, but for demo:

    const userSQL = this.users.map(u =>
      `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "emailVerified", "isActive", "createdAt", "updatedAt") VALUES ('${u.id}', '${u.email}', '${u.passwordHash}', '${u.firstName}', '${u.lastName}', '${u.role}', ${u.emailVerified}, ${u.isActive}, '${u.createdAt.toISOString()}', '${u.updatedAt.toISOString()}');`
    ).join('\n');

    fs.writeFileSync(
      path.join(process.cwd(), 'backend/data/sql/01_users.sql'),
      userSQL
    );

    // Similar for other entities...
  }
}

// Run the generator
const generator = new DemoDataGenerator();
generator.generate().catch(console.error);
