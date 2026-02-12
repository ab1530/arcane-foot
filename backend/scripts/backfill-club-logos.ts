import 'dotenv/config';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = 'https://v3.football.api-sports.io';

const TEAM_NAME_MAP: Record<string, string> = {
  'Paris FC': 'Paris Saint Germain',
  'Lyon FC': 'Lyon',
  'Marseille FC': 'Marseille',
  'Lille FC': 'Lille',
  'Nice FC': 'Nice',
  'London FC': 'Chelsea',
  'Manchester FC': 'Manchester City',
  'Liverpool FC': 'Liverpool',
  'Birmingham FC': 'Aston Villa',
  'Leeds FC': 'Leeds',
  'Madrid FC': 'Real Madrid',
  'Barcelona FC': 'Barcelona',
  'Valencia FC': 'Valencia',
  'Sevilla FC': 'Sevilla',
  'Bilbao FC': 'Athletic Club',
  'Milan FC': 'AC Milan',
  'Rome FC': 'Roma',
  'Turin FC': 'Juventus',
  'Naples FC': 'Napoli',
  'Florence FC': 'Fiorentina',
  'Berlin FC': 'Hertha BSC',
  'Munich FC': 'Bayern Munich',
  'Hamburg FC': 'Hamburger SV',
  'Cologne FC': 'FC Koln',
  'Frankfurt FC': 'Eintracht Frankfurt',
};

if (!API_KEY) {
  throw new Error('API_FOOTBALL_KEY is missing in environment variables');
}

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 40;
const RATE_DELAY_MS = Number(process.env.API_FOOTBALL_DELAY_MS || 6500);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTeamById(teamId: string) {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/teams`, {
      params: { id: teamId },
      headers: { 'x-apisports-key': API_KEY },
    });
    return data?.response?.[0] ?? null;
  } catch (error) {
    console.error(`Failed to fetch team by id ${teamId}:`, error.message);
    return null;
  }
}

async function fetchTeamBySearch(name: string) {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/teams`, {
      params: { search: name },
      headers: { 'x-apisports-key': API_KEY },
    });
    return data?.response?.[0] ?? null;
  } catch (error) {
    console.error(`Failed to search team by name "${name}":`, error.message);
    return null;
  }
}

async function updateClubLogo(club: any) {
  let remoteTeam = null;

  if (club.externalId) {
    remoteTeam = await fetchTeamById(club.externalId);
  }

  const lookupName = TEAM_NAME_MAP[club.name] || club.name;

  if (!remoteTeam) {
    remoteTeam = await fetchTeamBySearch(lookupName);
  }

  if (!remoteTeam?.team) {
    console.warn(`No remote data found for club "${club.name}" (id ${club.id})`);
    return false;
  }

  const { team, venue } = remoteTeam;

  await prisma.clubs.update({
    where: { id: club.id },
    data: {
      logo: team.logo,
      city: club.city || venue?.city || null,
      stadium: club.stadium || venue?.name || null,
      country: club.country || team.country || null,
      founded: club.founded || team.founded || null,
      externalId: club.externalId || team.id?.toString(),
      externalSource: club.externalSource || 'api-football',
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`Updated club ${club.name} with logo ${team.logo}`);
  return true;
}

async function main() {
const clubs = await prisma.clubs.findMany({
    where: {
      OR: [
        { logo: null },
        { logo: '' },
        { logo: { contains: 'ui-avatars.com' } },
      ],
    },
    take: LIMIT,
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${clubs.length} clubs missing logos (processing up to ${LIMIT}).`);

  let success = 0;
  for (const club of clubs) {
    const updated = await updateClubLogo(club);
    if (updated) {
      success += 1;
    }
    await sleep(RATE_DELAY_MS); // respect rate limits
  }

  console.log(`Finished. Updated ${success}/${clubs.length} clubs.`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
