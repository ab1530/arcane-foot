import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { seedAchievements } from './seeds/achievements.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Seed achievements first
  await seedAchievements();

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    await prisma.players.deleteMany();
    await prisma.users.deleteMany({ where: { role: 'PLAYER' } });
    await prisma.clubs.deleteMany();
    console.log('✅ Existing data cleared');
  }

  // Hash a common password for all seed users
  const password = await bcrypt.hash('Password123!', 10);

  // NOTE: Using only fields that exist in the initial database migration
  console.log('ℹ️  Seeding with basic schema fields only');

  // ===============================================
  // 1. CREATE CLUBS (20 MAJOR EUROPEAN CLUBS)
  // ===============================================
  console.log('⚽ Creating clubs...');

  // LIGUE 1 (4 clubs)
  const psg = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Paris Saint-Germain',
      shortName: 'PSG',
      country: 'FR',
      city: 'Paris',
      stadium: 'Parc des Princes',
      founded: 1970,
      logo: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
      website: 'https://www.psg.fr',
      updatedAt: new Date(),
    },
  });

  const om = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Olympique de Marseille',
      shortName: 'OM',
      country: 'FR',
      city: 'Marseille',
      stadium: 'Stade Vélodrome',
      founded: 1899,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
      website: 'https://www.om.fr',
      updatedAt: new Date(),
    },
  });

  const ol = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Olympique Lyonnais',
      shortName: 'OL',
      country: 'FR',
      city: 'Lyon',
      stadium: 'Groupama Stadium',
      founded: 1950,
      logo: 'https://upload.wikimedia.org/wikipedia/en/e/e2/Olympique_Lyonnais_logo.svg',
      website: 'https://www.ol.fr',
      updatedAt: new Date(),
    },
  });

  const monaco = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'AS Monaco',
      shortName: 'Monaco',
      country: 'MC',
      city: 'Monaco',
      stadium: 'Stade Louis II',
      founded: 1924,
      logo: 'https://upload.wikimedia.org/wikipedia/en/b/bf/AS_Monaco_FC.svg',
      website: 'https://www.asmonaco.com',
      updatedAt: new Date(),
    },
  });

  // PREMIER LEAGUE (4 clubs)
  const manCity = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Manchester City',
      shortName: 'Man City',
      country: 'GB',
      city: 'Manchester',
      stadium: 'Etihad Stadium',
      founded: 1880,
      logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
      website: 'https://www.mancity.com',
      updatedAt: new Date(),
    },
  });

  const arsenal = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Arsenal FC',
      shortName: 'Arsenal',
      country: 'GB',
      city: 'London',
      stadium: 'Emirates Stadium',
      founded: 1886,
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      website: 'https://www.arsenal.com',
      updatedAt: new Date(),
    },
  });

  const liverpool = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Liverpool FC',
      shortName: 'Liverpool',
      country: 'GB',
      city: 'Liverpool',
      stadium: 'Anfield',
      founded: 1892,
      logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      website: 'https://www.liverpoolfc.com',
      updatedAt: new Date(),
    },
  });

  const chelsea = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Chelsea FC',
      shortName: 'Chelsea',
      country: 'GB',
      city: 'London',
      stadium: 'Stamford Bridge',
      founded: 1905,
      logo: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
      website: 'https://www.chelseafc.com',
      updatedAt: new Date(),
    },
  });

  // LA LIGA (4 clubs)
  const realMadrid = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Real Madrid',
      shortName: 'Real Madrid',
      country: 'ES',
      city: 'Madrid',
      stadium: 'Santiago Bernabéu',
      founded: 1902,
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      website: 'https://www.realmadrid.com',
      updatedAt: new Date(),
    },
  });

  const barcelona = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'FC Barcelona',
      shortName: 'Barcelona',
      country: 'ES',
      city: 'Barcelona',
      stadium: 'Camp Nou',
      founded: 1899,
      logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      website: 'https://www.fcbarcelona.com',
      updatedAt: new Date(),
    },
  });

  const atletico = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Atlético Madrid',
      shortName: 'Atlético',
      country: 'ES',
      city: 'Madrid',
      stadium: 'Cívitas Metropolitano',
      founded: 1903,
      logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
      website: 'https://www.atleticodemadrid.com',
      updatedAt: new Date(),
    },
  });

  const sevilla = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Sevilla FC',
      shortName: 'Sevilla',
      country: 'ES',
      city: 'Sevilla',
      stadium: 'Ramón Sánchez Pizjuán',
      founded: 1890,
      logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
      website: 'https://www.sevillafc.es',
      updatedAt: new Date(),
    },
  });

  // BUNDESLIGA (4 clubs)
  const bayern = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Bayern Munich',
      shortName: 'Bayern',
      country: 'DE',
      city: 'Munich',
      stadium: 'Allianz Arena',
      founded: 1900,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
      website: 'https://www.fcbayern.com',
      updatedAt: new Date(),
    },
  });

  const dortmund = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Borussia Dortmund',
      shortName: 'Dortmund',
      country: 'DE',
      city: 'Dortmund',
      stadium: 'Signal Iduna Park',
      founded: 1909,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
      website: 'https://www.bvb.de',
      updatedAt: new Date(),
    },
  });

  const rbLeipzig = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'RB Leipzig',
      shortName: 'Leipzig',
      country: 'DE',
      city: 'Leipzig',
      stadium: 'Red Bull Arena',
      founded: 2009,
      logo: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
      website: 'https://www.rbleipzig.com',
      updatedAt: new Date(),
    },
  });

  const leverkusen = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Bayer Leverkusen',
      shortName: 'Leverkusen',
      country: 'DE',
      city: 'Leverkusen',
      stadium: 'BayArena',
      founded: 1904,
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
      website: 'https://www.bayer04.de',
      updatedAt: new Date(),
    },
  });

  // SERIE A (4 clubs)
  const inter = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Inter Milan',
      shortName: 'Inter',
      country: 'IT',
      city: 'Milan',
      stadium: 'San Siro',
      founded: 1908,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      website: 'https://www.inter.it',
      updatedAt: new Date(),
    },
  });

  const acMilan = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'AC Milan',
      shortName: 'Milan',
      country: 'IT',
      city: 'Milan',
      stadium: 'San Siro',
      founded: 1899,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
      website: 'https://www.acmilan.com',
      updatedAt: new Date(),
    },
  });

  const juventus = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'Juventus FC',
      shortName: 'Juventus',
      country: 'IT',
      city: 'Turin',
      stadium: 'Allianz Stadium',
      founded: 1897,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_logo.svg',
      website: 'https://www.juventus.com',
      updatedAt: new Date(),
    },
  });

  const napoli = await prisma.clubs.create({
    data: {
      id: randomUUID(),
      name: 'SSC Napoli',
      shortName: 'Napoli',
      country: 'IT',
      city: 'Naples',
      stadium: 'Stadio Diego Armando Maradona',
      founded: 1926,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg',
      website: 'https://www.sscnapoli.it',
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created 20 clubs`);

  // ===============================================
  // 2. CREATE PLAYERS (60 FAMOUS PLAYERS - 3 PER CLUB)
  // Note: Using only fields from initial migration
  // ===============================================
  console.log('👥 Creating players...');

  // Helper function to create a player with user (using basic fields only)
  async function createPlayer(userData: any, playerData: any) {
    const { clubId, ...restPlayerData } = playerData;
    return await prisma.players.create({
      data: {
        id: randomUUID(),
        users: {
          create: {
            id: randomUUID(),
            ...userData,
            passwordHash: password,
            role: 'PLAYER',
            emailVerified: true,
            isActive: true,
            updatedAt: new Date(),
          },
        },
        clubs: clubId ? { connect: { id: clubId } } : undefined,
        status: 'ACTIVE',
        ...restPlayerData,
        updatedAt: new Date(),
      },
    });
  }

  // PSG PLAYERS
  await createPlayer(
    {
      email: 'gianluigi.donnarumma@arcane-demo.com',
      firstName: 'Gianluigi',
      lastName: 'Donnarumma',
    },
    {
      clubId: psg.id,
      position: 'Goalkeeper',
      preferredFoot: 'Right',
      height: 196,
      weight: 90,
      dateOfBirth: new Date('1999-02-25'),
      nationality: 'IT',
      jerseyNumber: 99,
      marketValue: 50000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        cleanSheets: 8,
        goalsConceded: 15,
        saves: 67,
        minutesPlayed: 1800,
        yellowCards: 1,
        redCards: 0,
        rating: 7.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'achraf.hakimi@arcane-demo.com',
      firstName: 'Achraf',
      lastName: 'Hakimi',
    },
    {
      clubId: psg.id,
      position: 'Right Back',
      preferredFoot: 'Right',
      height: 181,
      weight: 73,
      dateOfBirth: new Date('1998-11-04'),
      nationality: 'MA',
      jerseyNumber: 2,
      marketValue: 65000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 3,
        assists: 7,
        minutesPlayed: 1980,
        yellowCards: 4,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'ousmane.dembele@arcane-demo.com',
      firstName: 'Ousmane',
      lastName: 'Dembélé',
    },
    {
      clubId: psg.id,
      position: 'Right Winger',
      preferredFoot: 'Both',
      height: 178,
      weight: 67,
      dateOfBirth: new Date('1997-05-15'),
      nationality: 'FR',
      jerseyNumber: 10,
      marketValue: 50000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 8,
        assists: 12,
        minutesPlayed: 2160,
        yellowCards: 2,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  // MARSEILLE PLAYERS
  await createPlayer(
    {
      email: 'pierre.aubameyang@arcane-demo.com',
      firstName: 'Pierre-Emerick',
      lastName: 'Aubameyang',
    },
    {
      clubId: om.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 187,
      weight: 80,
      dateOfBirth: new Date('1989-06-18'),
      nationality: 'GA',
      jerseyNumber: 10,
      marketValue: 10000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 15,
        assists: 3,
        minutesPlayed: 1800,
        yellowCards: 2,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  await createPlayer(
    {
      email: 'amine.harit@arcane-demo.com',
      firstName: 'Amine',
      lastName: 'Harit',
    },
    {
      clubId: om.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 180,
      weight: 72,
      dateOfBirth: new Date('1997-06-18'),
      nationality: 'MA',
      jerseyNumber: 11,
      marketValue: 12000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 18,
        goals: 4,
        assists: 6,
        minutesPlayed: 1620,
        yellowCards: 3,
        redCards: 0,
        rating: 7.2,
      },
    }
  );

  await createPlayer(
    {
      email: 'jonathan.clauss@arcane-demo.com',
      firstName: 'Jonathan',
      lastName: 'Clauss',
    },
    {
      clubId: om.id,
      position: 'Right Back',
      preferredFoot: 'Right',
      height: 179,
      weight: 71,
      dateOfBirth: new Date('1992-09-25'),
      nationality: 'FR',
      jerseyNumber: 7,
      marketValue: 8000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 2,
        assists: 8,
        minutesPlayed: 1890,
        yellowCards: 5,
        redCards: 1,
        rating: 7.3,
      },
    }
  );

  // LYON PLAYERS
  await createPlayer(
    {
      email: 'alexandre.lacazette@arcane-demo.com',
      firstName: 'Alexandre',
      lastName: 'Lacazette',
    },
    {
      clubId: ol.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 175,
      weight: 73,
      dateOfBirth: new Date('1991-05-28'),
      nationality: 'FR',
      jerseyNumber: 10,
      marketValue: 10000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 14,
        assists: 5,
        minutesPlayed: 1980,
        yellowCards: 3,
        redCards: 0,
        rating: 7.7,
      },
    }
  );

  await createPlayer(
    {
      email: 'rayan.cherki@arcane-demo.com',
      firstName: 'Rayan',
      lastName: 'Cherki',
    },
    {
      clubId: ol.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 178,
      weight: 68,
      dateOfBirth: new Date('2003-08-17'),
      nationality: 'FR',
      jerseyNumber: 18,
      marketValue: 25000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 6,
        assists: 9,
        minutesPlayed: 2070,
        yellowCards: 2,
        redCards: 0,
        rating: 7.4,
      },
    }
  );

  await createPlayer(
    {
      email: 'nicolas.tagliafico@arcane-demo.com',
      firstName: 'Nicolás',
      lastName: 'Tagliafico',
    },
    {
      clubId: ol.id,
      position: 'Left Back',
      preferredFoot: 'Left',
      height: 172,
      weight: 65,
      dateOfBirth: new Date('1992-08-31'),
      nationality: 'AR',
      jerseyNumber: 3,
      marketValue: 5000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 1,
        assists: 4,
        minutesPlayed: 1800,
        yellowCards: 6,
        redCards: 0,
        rating: 7.1,
      },
    }
  );

  // MONACO PLAYERS
  await createPlayer(
    {
      email: 'wissam.benyedder@arcane-demo.com',
      firstName: 'Wissam',
      lastName: 'Ben Yedder',
    },
    {
      clubId: monaco.id,
      position: 'Striker',
      preferredFoot: 'Both',
      height: 170,
      weight: 68,
      dateOfBirth: new Date('1990-08-12'),
      nationality: 'FR',
      jerseyNumber: 10,
      marketValue: 8000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 19,
        goals: 11,
        assists: 4,
        minutesPlayed: 1710,
        yellowCards: 2,
        redCards: 0,
        rating: 7.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'aleksandr.golovin@arcane-demo.com',
      firstName: 'Aleksandr',
      lastName: 'Golovin',
    },
    {
      clubId: monaco.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 179,
      weight: 70,
      dateOfBirth: new Date('1996-05-30'),
      nationality: 'RU',
      jerseyNumber: 17,
      marketValue: 18000000,
      contractUntil: new Date('2024-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 5,
        assists: 7,
        minutesPlayed: 1800,
        yellowCards: 3,
        redCards: 0,
        rating: 7.3,
      },
    }
  );

  await createPlayer(
    {
      email: 'denis.zakaria@arcane-demo.com',
      firstName: 'Denis',
      lastName: 'Zakaria',
    },
    {
      clubId: monaco.id,
      position: 'Defensive Midfielder',
      preferredFoot: 'Right',
      height: 191,
      weight: 85,
      dateOfBirth: new Date('1996-11-20'),
      nationality: 'CH',
      jerseyNumber: 6,
      marketValue: 20000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 2,
        assists: 3,
        minutesPlayed: 1980,
        yellowCards: 7,
        redCards: 0,
        rating: 7.2,
      },
    }
  );

  // MANCHESTER CITY PLAYERS
  await createPlayer(
    {
      email: 'erling.haaland@arcane-demo.com',
      firstName: 'Erling',
      lastName: 'Haaland',
    },
    {
      clubId: manCity.id,
      position: 'Striker',
      preferredFoot: 'Left',
      height: 194,
      weight: 88,
      dateOfBirth: new Date('2000-07-21'),
      nationality: 'NO',
      jerseyNumber: 9,
      marketValue: 180000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 22,
        assists: 3,
        minutesPlayed: 1800,
        yellowCards: 1,
        redCards: 0,
        rating: 8.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'kevin.debruyne@arcane-demo.com',
      firstName: 'Kevin',
      lastName: 'De Bruyne',
    },
    {
      clubId: manCity.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 181,
      weight: 70,
      dateOfBirth: new Date('1991-06-28'),
      nationality: 'BE',
      jerseyNumber: 17,
      marketValue: 70000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 18,
        goals: 6,
        assists: 12,
        minutesPlayed: 1620,
        yellowCards: 2,
        redCards: 0,
        rating: 8.2,
      },
    }
  );

  await createPlayer(
    {
      email: 'rodri.hernandez@arcane-demo.com',
      firstName: 'Rodrigo',
      lastName: 'Hernández',
    },
    {
      clubId: manCity.id,
      position: 'Defensive Midfielder',
      preferredFoot: 'Right',
      height: 191,
      weight: 82,
      dateOfBirth: new Date('1996-06-22'),
      nationality: 'ES',
      jerseyNumber: 16,
      marketValue: 120000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 4,
        assists: 5,
        minutesPlayed: 1890,
        yellowCards: 5,
        redCards: 0,
        rating: 8.3,
      },
    }
  );

  // ARSENAL PLAYERS
  await createPlayer(
    {
      email: 'bukayo.saka@arcane-demo.com',
      firstName: 'Bukayo',
      lastName: 'Saka',
    },
    {
      clubId: arsenal.id,
      position: 'Right Winger',
      preferredFoot: 'Left',
      height: 178,
      weight: 70,
      dateOfBirth: new Date('2001-09-05'),
      nationality: 'GB',
      jerseyNumber: 7,
      marketValue: 120000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 10,
        assists: 9,
        minutesPlayed: 2070,
        yellowCards: 3,
        redCards: 0,
        rating: 8.1,
      },
    }
  );

  await createPlayer(
    {
      email: 'martin.odegaard@arcane-demo.com',
      firstName: 'Martin',
      lastName: 'Ødegaard',
    },
    {
      clubId: arsenal.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Left',
      height: 178,
      weight: 68,
      dateOfBirth: new Date('1998-12-17'),
      nationality: 'NO',
      jerseyNumber: 8,
      marketValue: 110000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 7,
        assists: 10,
        minutesPlayed: 1980,
        yellowCards: 2,
        redCards: 0,
        rating: 8.0,
      },
    }
  );

  await createPlayer(
    {
      email: 'william.saliba@arcane-demo.com',
      firstName: 'William',
      lastName: 'Saliba',
    },
    {
      clubId: arsenal.id,
      position: 'Center Back',
      preferredFoot: 'Right',
      height: 192,
      weight: 83,
      dateOfBirth: new Date('2001-03-24'),
      nationality: 'FR',
      jerseyNumber: 2,
      marketValue: 80000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 2,
        assists: 1,
        minutesPlayed: 2160,
        yellowCards: 4,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  // LIVERPOOL PLAYERS
  await createPlayer(
    {
      email: 'mohamed.salah@arcane-demo.com',
      firstName: 'Mohamed',
      lastName: 'Salah',
    },
    {
      clubId: liverpool.id,
      position: 'Right Winger',
      preferredFoot: 'Left',
      height: 175,
      weight: 71,
      dateOfBirth: new Date('1992-06-15'),
      nationality: 'EG',
      jerseyNumber: 11,
      marketValue: 65000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 18,
        assists: 11,
        minutesPlayed: 2160,
        yellowCards: 2,
        redCards: 0,
        rating: 8.4,
      },
    }
  );

  await createPlayer(
    {
      email: 'virgil.vandijk@arcane-demo.com',
      firstName: 'Virgil',
      lastName: 'van Dijk',
    },
    {
      clubId: liverpool.id,
      position: 'Center Back',
      preferredFoot: 'Right',
      height: 193,
      weight: 92,
      dateOfBirth: new Date('1991-07-08'),
      nationality: 'NL',
      jerseyNumber: 4,
      marketValue: 45000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 3,
        assists: 2,
        minutesPlayed: 2070,
        yellowCards: 3,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'trent.alexanderarnold@arcane-demo.com',
      firstName: 'Trent',
      lastName: 'Alexander-Arnold',
    },
    {
      clubId: liverpool.id,
      position: 'Right Back',
      preferredFoot: 'Right',
      height: 180,
      weight: 69,
      dateOfBirth: new Date('1998-10-07'),
      nationality: 'GB',
      jerseyNumber: 66,
      marketValue: 70000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 2,
        assists: 8,
        minutesPlayed: 1980,
        yellowCards: 4,
        redCards: 0,
        rating: 7.7,
      },
    }
  );

  // CHELSEA PLAYERS
  await createPlayer(
    {
      email: 'cole.palmer@arcane-demo.com',
      firstName: 'Cole',
      lastName: 'Palmer',
    },
    {
      clubId: chelsea.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Left',
      height: 189,
      weight: 75,
      dateOfBirth: new Date('2002-05-06'),
      nationality: 'GB',
      jerseyNumber: 20,
      marketValue: 80000000,
      contractUntil: new Date('2031-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 13,
        assists: 8,
        minutesPlayed: 2160,
        yellowCards: 3,
        redCards: 0,
        rating: 8.0,
      },
    }
  );

  await createPlayer(
    {
      email: 'enzo.fernandez@arcane-demo.com',
      firstName: 'Enzo',
      lastName: 'Fernández',
    },
    {
      clubId: chelsea.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 178,
      weight: 78,
      dateOfBirth: new Date('2001-01-17'),
      nationality: 'AR',
      jerseyNumber: 8,
      marketValue: 75000000,
      contractUntil: new Date('2032-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 4,
        assists: 5,
        minutesPlayed: 2070,
        yellowCards: 6,
        redCards: 0,
        rating: 7.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'reece.james@arcane-demo.com',
      firstName: 'Reece',
      lastName: 'James',
    },
    {
      clubId: chelsea.id,
      position: 'Right Back',
      preferredFoot: 'Right',
      height: 182,
      weight: 85,
      dateOfBirth: new Date('1999-12-08'),
      nationality: 'GB',
      jerseyNumber: 24,
      marketValue: 45000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 15,
        goals: 1,
        assists: 4,
        minutesPlayed: 1350,
        yellowCards: 2,
        redCards: 1,
        rating: 7.3,
      },
    }
  );

  // REAL MADRID PLAYERS
  await createPlayer(
    {
      email: 'vinicius.junior@arcane-demo.com',
      firstName: 'Vinícius',
      lastName: 'Júnior',
    },
    {
      clubId: realMadrid.id,
      position: 'Left Winger',
      preferredFoot: 'Right',
      height: 176,
      weight: 73,
      dateOfBirth: new Date('2000-07-12'),
      nationality: 'BR',
      jerseyNumber: 7,
      marketValue: 180000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 16,
        assists: 9,
        minutesPlayed: 2070,
        yellowCards: 5,
        redCards: 1,
        rating: 8.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'jude.bellingham@arcane-demo.com',
      firstName: 'Jude',
      lastName: 'Bellingham',
    },
    {
      clubId: realMadrid.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 186,
      weight: 75,
      dateOfBirth: new Date('2003-06-29'),
      nationality: 'GB',
      jerseyNumber: 5,
      marketValue: 180000000,
      contractUntil: new Date('2029-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 12,
        assists: 7,
        minutesPlayed: 1980,
        yellowCards: 4,
        redCards: 0,
        rating: 8.3,
      },
    }
  );

  await createPlayer(
    {
      email: 'antonio.rudiger@arcane-demo.com',
      firstName: 'Antonio',
      lastName: 'Rüdiger',
    },
    {
      clubId: realMadrid.id,
      position: 'Center Back',
      preferredFoot: 'Right',
      height: 190,
      weight: 85,
      dateOfBirth: new Date('1993-03-03'),
      nationality: 'DE',
      jerseyNumber: 22,
      marketValue: 35000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 2,
        assists: 1,
        minutesPlayed: 2160,
        yellowCards: 7,
        redCards: 0,
        rating: 7.7,
      },
    }
  );

  // BARCELONA PLAYERS
  await createPlayer(
    {
      email: 'robert.lewandowski@arcane-demo.com',
      firstName: 'Robert',
      lastName: 'Lewandowski',
    },
    {
      clubId: barcelona.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 185,
      weight: 79,
      dateOfBirth: new Date('1988-08-21'),
      nationality: 'PL',
      jerseyNumber: 9,
      marketValue: 15000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 19,
        assists: 5,
        minutesPlayed: 2070,
        yellowCards: 2,
        redCards: 0,
        rating: 8.2,
      },
    }
  );

  await createPlayer(
    {
      email: 'pedri.gonzalez@arcane-demo.com',
      firstName: 'Pedro',
      lastName: 'González',
    },
    {
      clubId: barcelona.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 174,
      weight: 60,
      dateOfBirth: new Date('2002-11-25'),
      nationality: 'ES',
      jerseyNumber: 8,
      marketValue: 80000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 3,
        assists: 7,
        minutesPlayed: 1890,
        yellowCards: 3,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'gavi.paez@arcane-demo.com',
      firstName: 'Pablo',
      lastName: 'Páez',
    },
    {
      clubId: barcelona.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 173,
      weight: 69,
      dateOfBirth: new Date('2004-08-05'),
      nationality: 'ES',
      jerseyNumber: 6,
      marketValue: 90000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 10,
        goals: 1,
        assists: 2,
        minutesPlayed: 900,
        yellowCards: 2,
        redCards: 0,
        rating: 7.3,
      },
    }
  );

  // ATLETICO MADRID PLAYERS
  await createPlayer(
    {
      email: 'antoine.griezmann@arcane-demo.com',
      firstName: 'Antoine',
      lastName: 'Griezmann',
    },
    {
      clubId: atletico.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Left',
      height: 176,
      weight: 72,
      dateOfBirth: new Date('1991-03-21'),
      nationality: 'FR',
      jerseyNumber: 7,
      marketValue: 20000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 11,
        assists: 10,
        minutesPlayed: 2160,
        yellowCards: 3,
        redCards: 0,
        rating: 8.0,
      },
    }
  );

  await createPlayer(
    {
      email: 'jan.oblak@arcane-demo.com',
      firstName: 'Jan',
      lastName: 'Oblak',
    },
    {
      clubId: atletico.id,
      position: 'Goalkeeper',
      preferredFoot: 'Right',
      height: 188,
      weight: 87,
      dateOfBirth: new Date('1993-01-07'),
      nationality: 'SI',
      jerseyNumber: 13,
      marketValue: 35000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        cleanSheets: 12,
        goalsConceded: 18,
        saves: 81,
        minutesPlayed: 2160,
        yellowCards: 1,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'alvaro.morata@arcane-demo.com',
      firstName: 'Álvaro',
      lastName: 'Morata',
    },
    {
      clubId: atletico.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 190,
      weight: 84,
      dateOfBirth: new Date('1992-10-23'),
      nationality: 'ES',
      jerseyNumber: 19,
      marketValue: 18000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 13,
        assists: 4,
        minutesPlayed: 1980,
        yellowCards: 4,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  // SEVILLA PLAYERS
  await createPlayer(
    {
      email: 'youssef.ennesyri@arcane-demo.com',
      firstName: 'Youssef',
      lastName: 'En-Nesyri',
    },
    {
      clubId: sevilla.id,
      position: 'Striker',
      preferredFoot: 'Left',
      height: 189,
      weight: 82,
      dateOfBirth: new Date('1997-06-01'),
      nationality: 'MA',
      jerseyNumber: 15,
      marketValue: 20000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 10,
        assists: 2,
        minutesPlayed: 1890,
        yellowCards: 2,
        redCards: 0,
        rating: 7.3,
      },
    }
  );

  await createPlayer(
    {
      email: 'ivan.rakitic@arcane-demo.com',
      firstName: 'Ivan',
      lastName: 'Rakitić',
    },
    {
      clubId: sevilla.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 184,
      weight: 78,
      dateOfBirth: new Date('1988-03-10'),
      nationality: 'HR',
      jerseyNumber: 10,
      marketValue: 3000000,
      contractUntil: new Date('2024-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 18,
        goals: 3,
        assists: 5,
        minutesPlayed: 1620,
        yellowCards: 4,
        redCards: 0,
        rating: 7.0,
      },
    }
  );

  await createPlayer(
    {
      email: 'jesus.navas@arcane-demo.com',
      firstName: 'Jesús',
      lastName: 'Navas',
    },
    {
      clubId: sevilla.id,
      position: 'Right Back',
      preferredFoot: 'Right',
      height: 172,
      weight: 68,
      dateOfBirth: new Date('1985-11-21'),
      nationality: 'ES',
      jerseyNumber: 16,
      marketValue: 1000000,
      contractUntil: new Date('2024-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 0,
        assists: 6,
        minutesPlayed: 1800,
        yellowCards: 5,
        redCards: 0,
        rating: 7.1,
      },
    }
  );

  // BAYERN MUNICH PLAYERS
  await createPlayer(
    {
      email: 'harry.kane@arcane-demo.com',
      firstName: 'Harry',
      lastName: 'Kane',
    },
    {
      clubId: bayern.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 188,
      weight: 86,
      dateOfBirth: new Date('1993-07-28'),
      nationality: 'GB',
      jerseyNumber: 9,
      marketValue: 100000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 24,
        assists: 8,
        minutesPlayed: 1980,
        yellowCards: 2,
        redCards: 0,
        rating: 8.7,
      },
    }
  );

  await createPlayer(
    {
      email: 'jamal.musiala@arcane-demo.com',
      firstName: 'Jamal',
      lastName: 'Musiala',
    },
    {
      clubId: bayern.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 183,
      weight: 70,
      dateOfBirth: new Date('2003-02-26'),
      nationality: 'DE',
      jerseyNumber: 42,
      marketValue: 130000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 9,
        assists: 7,
        minutesPlayed: 1890,
        yellowCards: 1,
        redCards: 0,
        rating: 8.1,
      },
    }
  );

  await createPlayer(
    {
      email: 'joshua.kimmich@arcane-demo.com',
      firstName: 'Joshua',
      lastName: 'Kimmich',
    },
    {
      clubId: bayern.id,
      position: 'Defensive Midfielder',
      preferredFoot: 'Right',
      height: 177,
      weight: 73,
      dateOfBirth: new Date('1995-02-08'),
      nationality: 'DE',
      jerseyNumber: 6,
      marketValue: 50000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 2,
        assists: 9,
        minutesPlayed: 2070,
        yellowCards: 6,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  // BORUSSIA DORTMUND PLAYERS
  await createPlayer(
    {
      email: 'karim.adeyemi@arcane-demo.com',
      firstName: 'Karim',
      lastName: 'Adeyemi',
    },
    {
      clubId: dortmund.id,
      position: 'Left Winger',
      preferredFoot: 'Left',
      height: 180,
      weight: 70,
      dateOfBirth: new Date('2002-01-18'),
      nationality: 'DE',
      jerseyNumber: 27,
      marketValue: 35000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 7,
        assists: 5,
        minutesPlayed: 1800,
        yellowCards: 3,
        redCards: 0,
        rating: 7.4,
      },
    }
  );

  await createPlayer(
    {
      email: 'julian.brandt@arcane-demo.com',
      firstName: 'Julian',
      lastName: 'Brandt',
    },
    {
      clubId: dortmund.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 185,
      weight: 80,
      dateOfBirth: new Date('1996-05-02'),
      nationality: 'DE',
      jerseyNumber: 19,
      marketValue: 30000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 5,
        assists: 8,
        minutesPlayed: 1980,
        yellowCards: 2,
        redCards: 0,
        rating: 7.5,
      },
    }
  );

  await createPlayer(
    {
      email: 'mats.hummels@arcane-demo.com',
      firstName: 'Mats',
      lastName: 'Hummels',
    },
    {
      clubId: dortmund.id,
      position: 'Center Back',
      preferredFoot: 'Right',
      height: 191,
      weight: 90,
      dateOfBirth: new Date('1988-12-16'),
      nationality: 'DE',
      jerseyNumber: 15,
      marketValue: 5000000,
      contractUntil: new Date('2024-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 2,
        assists: 1,
        minutesPlayed: 1890,
        yellowCards: 5,
        redCards: 1,
        rating: 7.3,
      },
    }
  );

  // RB LEIPZIG PLAYERS
  await createPlayer(
    {
      email: 'dani.olmo@arcane-demo.com',
      firstName: 'Daniel',
      lastName: 'Olmo',
    },
    {
      clubId: rbLeipzig.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 179,
      weight: 72,
      dateOfBirth: new Date('1998-05-07'),
      nationality: 'ES',
      jerseyNumber: 7,
      marketValue: 40000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 18,
        goals: 6,
        assists: 4,
        minutesPlayed: 1620,
        yellowCards: 2,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  await createPlayer(
    {
      email: 'xavi.simons@arcane-demo.com',
      firstName: 'Xavi',
      lastName: 'Simons',
    },
    {
      clubId: rbLeipzig.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 171,
      weight: 64,
      dateOfBirth: new Date('2003-04-21'),
      nationality: 'NL',
      jerseyNumber: 10,
      marketValue: 80000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 8,
        assists: 9,
        minutesPlayed: 1800,
        yellowCards: 3,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  await createPlayer(
    {
      email: 'benjamin.sesko@arcane-demo.com',
      firstName: 'Benjamin',
      lastName: 'Šeško',
    },
    {
      clubId: rbLeipzig.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 195,
      weight: 87,
      dateOfBirth: new Date('2003-05-31'),
      nationality: 'SI',
      jerseyNumber: 30,
      marketValue: 50000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 12,
        assists: 3,
        minutesPlayed: 1890,
        yellowCards: 2,
        redCards: 0,
        rating: 7.7,
      },
    }
  );

  // BAYER LEVERKUSEN PLAYERS
  await createPlayer(
    {
      email: 'florian.wirtz@arcane-demo.com',
      firstName: 'Florian',
      lastName: 'Wirtz',
    },
    {
      clubId: leverkusen.id,
      position: 'Attacking Midfielder',
      preferredFoot: 'Right',
      height: 176,
      weight: 64,
      dateOfBirth: new Date('2003-05-03'),
      nationality: 'DE',
      jerseyNumber: 10,
      marketValue: 130000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 11,
        assists: 13,
        minutesPlayed: 1980,
        yellowCards: 2,
        redCards: 0,
        rating: 8.4,
      },
    }
  );

  await createPlayer(
    {
      email: 'victor.boniface@arcane-demo.com',
      firstName: 'Victor',
      lastName: 'Boniface',
    },
    {
      clubId: leverkusen.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 188,
      weight: 80,
      dateOfBirth: new Date('2000-12-23'),
      nationality: 'NG',
      jerseyNumber: 22,
      marketValue: 50000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 19,
        goals: 14,
        assists: 6,
        minutesPlayed: 1710,
        yellowCards: 3,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  await createPlayer(
    {
      email: 'granit.xhaka@arcane-demo.com',
      firstName: 'Granit',
      lastName: 'Xhaka',
    },
    {
      clubId: leverkusen.id,
      position: 'Defensive Midfielder',
      preferredFoot: 'Left',
      height: 185,
      weight: 82,
      dateOfBirth: new Date('1992-09-27'),
      nationality: 'CH',
      jerseyNumber: 34,
      marketValue: 18000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 3,
        assists: 6,
        minutesPlayed: 2070,
        yellowCards: 8,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  // INTER MILAN PLAYERS
  await createPlayer(
    {
      email: 'lautaro.martinez@arcane-demo.com',
      firstName: 'Lautaro',
      lastName: 'Martínez',
    },
    {
      clubId: inter.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 174,
      weight: 72,
      dateOfBirth: new Date('1997-08-22'),
      nationality: 'AR',
      jerseyNumber: 10,
      marketValue: 110000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 17,
        assists: 4,
        minutesPlayed: 2070,
        yellowCards: 4,
        redCards: 0,
        rating: 8.1,
      },
    }
  );

  await createPlayer(
    {
      email: 'nicolo.barella@arcane-demo.com',
      firstName: 'Nicolò',
      lastName: 'Barella',
    },
    {
      clubId: inter.id,
      position: 'Central Midfielder',
      preferredFoot: 'Right',
      height: 172,
      weight: 68,
      dateOfBirth: new Date('1997-02-07'),
      nationality: 'IT',
      jerseyNumber: 23,
      marketValue: 80000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 5,
        assists: 7,
        minutesPlayed: 1980,
        yellowCards: 5,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'marcus.thuram@arcane-demo.com',
      firstName: 'Marcus',
      lastName: 'Thuram',
    },
    {
      clubId: inter.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 192,
      weight: 88,
      dateOfBirth: new Date('1997-08-06'),
      nationality: 'FR',
      jerseyNumber: 9,
      marketValue: 65000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 13,
        assists: 9,
        minutesPlayed: 2160,
        yellowCards: 3,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  // AC MILAN PLAYERS
  await createPlayer(
    {
      email: 'rafael.leao@arcane-demo.com',
      firstName: 'Rafael',
      lastName: 'Leão',
    },
    {
      clubId: acMilan.id,
      position: 'Left Winger',
      preferredFoot: 'Right',
      height: 188,
      weight: 84,
      dateOfBirth: new Date('1999-06-10'),
      nationality: 'PT',
      jerseyNumber: 10,
      marketValue: 90000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 10,
        assists: 7,
        minutesPlayed: 2070,
        yellowCards: 3,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'mike.maignan@arcane-demo.com',
      firstName: 'Mike',
      lastName: 'Maignan',
    },
    {
      clubId: acMilan.id,
      position: 'Goalkeeper',
      preferredFoot: 'Right',
      height: 191,
      weight: 89,
      dateOfBirth: new Date('1995-07-03'),
      nationality: 'FR',
      jerseyNumber: 16,
      marketValue: 55000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        cleanSheets: 10,
        goalsConceded: 19,
        saves: 76,
        minutesPlayed: 2070,
        yellowCards: 2,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  await createPlayer(
    {
      email: 'theo.hernandez@arcane-demo.com',
      firstName: 'Theo',
      lastName: 'Hernández',
    },
    {
      clubId: acMilan.id,
      position: 'Left Back',
      preferredFoot: 'Left',
      height: 184,
      weight: 78,
      dateOfBirth: new Date('1997-10-06'),
      nationality: 'FR',
      jerseyNumber: 19,
      marketValue: 60000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 24,
        goals: 4,
        assists: 6,
        minutesPlayed: 2160,
        yellowCards: 7,
        redCards: 1,
        rating: 7.7,
      },
    }
  );

  // JUVENTUS PLAYERS
  await createPlayer(
    {
      email: 'dusan.vlahovic@arcane-demo.com',
      firstName: 'Dušan',
      lastName: 'Vlahović',
    },
    {
      clubId: juventus.id,
      position: 'Striker',
      preferredFoot: 'Left',
      height: 190,
      weight: 86,
      dateOfBirth: new Date('2000-01-28'),
      nationality: 'RS',
      jerseyNumber: 9,
      marketValue: 70000000,
      contractUntil: new Date('2026-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 21,
        goals: 14,
        assists: 3,
        minutesPlayed: 1890,
        yellowCards: 3,
        redCards: 0,
        rating: 7.7,
      },
    }
  );

  await createPlayer(
    {
      email: 'federico.chiesa@arcane-demo.com',
      firstName: 'Federico',
      lastName: 'Chiesa',
    },
    {
      clubId: juventus.id,
      position: 'Right Winger',
      preferredFoot: 'Right',
      height: 175,
      weight: 70,
      dateOfBirth: new Date('1997-10-25'),
      nationality: 'IT',
      jerseyNumber: 7,
      marketValue: 40000000,
      contractUntil: new Date('2025-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 17,
        goals: 6,
        assists: 4,
        minutesPlayed: 1530,
        yellowCards: 2,
        redCards: 0,
        rating: 7.4,
      },
    }
  );

  await createPlayer(
    {
      email: 'gleison.bremer@arcane-demo.com',
      firstName: 'Gleison',
      lastName: 'Bremer',
    },
    {
      clubId: juventus.id,
      position: 'Center Back',
      preferredFoot: 'Right',
      height: 188,
      weight: 84,
      dateOfBirth: new Date('1997-03-18'),
      nationality: 'BR',
      jerseyNumber: 3,
      marketValue: 60000000,
      contractUntil: new Date('2028-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 3,
        assists: 1,
        minutesPlayed: 1980,
        yellowCards: 5,
        redCards: 0,
        rating: 7.6,
      },
    }
  );

  // NAPOLI PLAYERS
  await createPlayer(
    {
      email: 'victor.osimhen@arcane-demo.com',
      firstName: 'Victor',
      lastName: 'Osimhen',
    },
    {
      clubId: napoli.id,
      position: 'Striker',
      preferredFoot: 'Right',
      height: 186,
      weight: 80,
      dateOfBirth: new Date('1998-12-29'),
      nationality: 'NG',
      jerseyNumber: 9,
      marketValue: 100000000,
      contractUntil: new Date('2026-12-31'),
      statsJson: {
        season: '2024-2025',
        appearances: 20,
        goals: 15,
        assists: 4,
        minutesPlayed: 1800,
        yellowCards: 4,
        redCards: 0,
        rating: 7.9,
      },
    }
  );

  await createPlayer(
    {
      email: 'khvicha.kvaratskhelia@arcane-demo.com',
      firstName: 'Khvicha',
      lastName: 'Kvaratskhelia',
    },
    {
      clubId: napoli.id,
      position: 'Left Winger',
      preferredFoot: 'Right',
      height: 183,
      weight: 75,
      dateOfBirth: new Date('2001-02-12'),
      nationality: 'GE',
      jerseyNumber: 77,
      marketValue: 80000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 22,
        goals: 9,
        assists: 8,
        minutesPlayed: 1980,
        yellowCards: 3,
        redCards: 0,
        rating: 7.8,
      },
    }
  );

  await createPlayer(
    {
      email: 'stanislav.lobotka@arcane-demo.com',
      firstName: 'Stanislav',
      lastName: 'Lobotka',
    },
    {
      clubId: napoli.id,
      position: 'Defensive Midfielder',
      preferredFoot: 'Right',
      height: 173,
      weight: 70,
      dateOfBirth: new Date('1994-11-25'),
      nationality: 'SK',
      jerseyNumber: 68,
      marketValue: 28000000,
      contractUntil: new Date('2027-06-30'),
      statsJson: {
        season: '2024-2025',
        appearances: 23,
        goals: 1,
        assists: 4,
        minutesPlayed: 2070,
        yellowCards: 6,
        redCards: 0,
        rating: 7.5,
      },
    }
  );

  console.log(`✅ Created 60 players`);

  // ===============================================
  // 3. CREATE ADMIN/SCOUT USERS FOR TESTING
  // ===============================================
  console.log('👤 Creating admin and scout users...');

  const superAdmin = await prisma.users.upsert({
    where: { email: 'admin@arcane.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'admin@arcane.com',
      passwordHash: password,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+33600000001',
      emailVerified: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const scout1 = await prisma.users.upsert({
    where: { email: 'scout1@arcane.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'scout1@arcane.com',
      passwordHash: password,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'SCOUT',
      phone: '+33600000002',
      emailVerified: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const scout2 = await prisma.users.upsert({
    where: { email: 'scout2@arcane.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'scout2@arcane.com',
      passwordHash: password,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'SCOUT',
      phone: '+33600000003',
      emailVerified: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const agent = await prisma.users.upsert({
    where: { email: 'agent@arcane.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'agent@arcane.com',
      passwordHash: password,
      firstName: 'Pierre',
      lastName: 'Bernard',
      role: 'AGENT',
      phone: '+33600000004',
      emailVerified: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created 4 staff users`);

  // ===============================================
  // 4. CREATE SCOUT MARKETPLACE DATA
  // ===============================================
  console.log('🤝 Creating marketplace scout listings...');

  // Scout1 Listing - La Liga & Ligue 1 Expert
  const listing1 = await prisma.scout_listings.create({
    data: {
      id: randomUUID(),
      userId: scout1.id,
      headline: 'La Liga & Ligue 1 Specialist - 15+ Years Experience',
      bio: 'Experienced football scout with extensive network in Spanish and French leagues. Former professional player turned scout. Specialized in identifying young talents and providing detailed tactical analysis.',
      expertise: {
        leagues: ['LaLiga', 'Ligue 1', 'LaLiga 2'],
        positions: ['CB', 'LB', 'RB', 'CDM'],
        ageGroups: ['U17', 'U19', 'U21', 'Senior'],
      },
      languages: ['French', 'Spanish', 'English'],
      availability: {
        countries: ['FR', 'ES', 'PT'],
        travelRadius: 500,
      },
      hourlyRate: 120,
      matchRate: 800,
      reportRate: 350,
      currency: 'EUR',
      portfolio: {
        successStories: [
          'Discovered current LaLiga starter playing in Segunda División',
          'Provided scouting reports for 3 successful U21 signings',
        ],
        certifications: ['UEFA Coaching License', 'Advanced Scout Certification'],
      },
      stats: null,
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Scout2 Listing - Bundesliga & Premier League Expert
  const listing2 = await prisma.scout_listings.create({
    data: {
      id: randomUUID(),
      userId: scout2.id,
      headline: 'Bundesliga & Premier League Talent Scout',
      bio: 'Data-driven scout specializing in German and English football. Strong analytical skills combined with traditional scouting methods. Expert in goalkeeper and forward assessment.',
      expertise: {
        leagues: ['Bundesliga', 'Premier League', '2. Bundesliga', 'Championship'],
        positions: ['GK', 'ST', 'RW', 'LW'],
        ageGroups: ['U19', 'U21', 'U23', 'Senior'],
      },
      languages: ['French', 'German', 'English'],
      availability: {
        countries: ['DE', 'GB', 'FR', 'BE', 'NL'],
        travelRadius: 800,
      },
      hourlyRate: 150,
      matchRate: 950,
      reportRate: 425,
      currency: 'EUR',
      portfolio: {
        successStories: [
          'Identified Bundesliga top scorer 2 seasons before breakthrough',
          'Consulted for Premier League club on goalkeeper recruitment',
        ],
        certifications: ['DFB Scouting Certificate', 'Performance Analysis Diploma'],
      },
      stats: null,
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created 2 scout listings`);

  // ===============================================
  // 5. CREATE MARKETPLACE OFFERS
  // ===============================================
  console.log('📋 Creating marketplace offers...');

  // PSG offers Scout1 for match assignment in Ligue 1
  const offer1 = await prisma.marketplace_offers.create({
    data: {
      id: randomUUID(),
      scoutListingId: listing1.id,
      clubId: psg.id,
      offerType: 'MATCH_ASSIGNMENT',
      title: 'Scout Ligue 1 Match: OM vs Lyon',
      description: 'Need detailed scouting report on Lyon defensive midfielder for upcoming transfer window. Focus on tactical awareness, passing range, and defensive positioning.',
      budget: 800,
      currency: 'EUR',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-15'),
      location: 'Marseille, France',
      requirements: {
        playerToScout: 'Lyon #6 - Defensive Midfielder',
        focusAreas: ['Tactical Awareness', 'Passing', 'Defensive Positioning'],
        deliveryDeadline: '2025-02-17',
      },
      status: 'ACCEPTED',
      sentAt: new Date('2025-01-10'),
      respondedAt: new Date('2025-01-11'),
      acceptedAt: new Date('2025-01-11'),
      matchingScore: 85,
    },
  });

  // Real Madrid offers Scout1 for player report
  const offer2 = await prisma.marketplace_offers.create({
    data: {
      id: randomUUID(),
      scoutListingId: listing1.id,
      clubId: realMadrid.id,
      offerType: 'PLAYER_REPORT',
      title: 'Detailed Report on Ligue 1 Center Back',
      description: 'Comprehensive scouting report needed on promising center back currently playing in Ligue 1. Include physical attributes, technical skills, and mental aspects.',
      budget: 400,
      currency: 'EUR',
      requirements: {
        playerToScout: 'Ligue 1 Center Back - Top 6 club',
        reportSections: ['Physical', 'Technical', 'Tactical', 'Mental', 'Overall Assessment'],
        videoAnalysis: true,
      },
      status: 'COMPLETED',
      sentAt: new Date('2025-01-05'),
      respondedAt: new Date('2025-01-06'),
      acceptedAt: new Date('2025-01-06'),
      completedAt: new Date('2025-01-20'),
      matchingScore: 92,
    },
  });

  // Bayern Munich offers Scout2 for retainer
  const offer3 = await prisma.marketplace_offers.create({
    data: {
      id: randomUUID(),
      scoutListingId: listing2.id,
      clubId: bayern.id,
      offerType: 'RETAINER',
      title: '3-Month Bundesliga Scouting Retainer',
      description: 'Looking for ongoing scouting services to monitor Bundesliga attackers for next season. Monthly reports and ad-hoc requests included.',
      budget: 4500,
      currency: 'EUR',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
      requirements: {
        scope: 'Bundesliga attackers monitoring',
        deliverables: ['Monthly summary reports', 'Ad-hoc player assessments', 'Transfer recommendations'],
        meetingsPerMonth: 2,
      },
      status: 'PENDING',
      sentAt: new Date('2025-01-25'),
      matchingScore: 88,
    },
  });

  // Manchester City offers Scout2 - Recently viewed
  const offer4 = await prisma.marketplace_offers.create({
    data: {
      id: randomUUID(),
      scoutListingId: listing2.id,
      clubId: manCity.id,
      offerType: 'CONSULTATION',
      title: 'Premier League Goalkeeper Consultation',
      description: 'One-time consultation to discuss potential goalkeeper targets in Premier League and Bundesliga. Virtual meeting preferred.',
      budget: 600,
      currency: 'EUR',
      requirements: {
        format: 'Virtual Meeting (2 hours)',
        topics: ['Goalkeeper market overview', 'Specific player assessments', 'Transfer feasibility'],
      },
      status: 'VIEWED',
      sentAt: new Date('2025-01-28'),
      respondedAt: new Date('2025-01-29'),
      matchingScore: 78,
    },
  });

  console.log(`✅ Created 4 marketplace offers`);

  // ===============================================
  // 6. CREATE MARKETPLACE REVIEWS
  // ===============================================
  console.log('⭐ Creating marketplace reviews...');

  // Real Madrid reviews Scout1 after completed player report
  const review1 = await prisma.marketplace_reviews.create({
    data: {
      id: randomUUID(),
      scoutListingId: listing1.id,
      offerId: offer2.id,
      clubId: realMadrid.id,
      rating: 5,
      comment: 'Exceptional work! The scouting report was incredibly detailed and helped us make an informed decision. Jean\'s analysis of the player\'s tactical awareness was spot-on. Highly recommend!',
      tags: ['Professional', 'Detailed', 'Punctual', 'Insightful'],
      isVerified: true,
      reviewedAt: new Date('2025-01-21'),
    },
  });

  // Update Scout1 listing stats with review
  await prisma.scout_listings.update({
    where: { id: listing1.id },
    data: {
      stats: {
        avgRating: 5.0,
        totalReviews: 1,
        completionRate: 100,
        responseTime: 24, // hours
        totalAssignments: 1,
      },
    },
  });

  console.log(`✅ Created 1 marketplace review`);

  // ===============================================
  // 7. CREATE SCOUT FAVORITES
  // ===============================================
  console.log('⭐ Creating scout favorites...');

  // PSG adds Scout2 to favorites
  const favorite1 = await prisma.scout_favorites.create({
    data: {
      id: randomUUID(),
      clubId: psg.id,
      scoutListingId: listing2.id,
      notes: 'Strong Bundesliga network. Consider for future German market scouting.',
      tags: ['Bundesliga', 'Attackers', 'Data-driven'],
      addedAt: new Date('2025-01-15'),
    },
  });

  // Barcelona adds Scout1 to favorites
  const favorite2 = await prisma.scout_favorites.create({
    data: {
      id: randomUUID(),
      clubId: barcelona.id,
      scoutListingId: listing1.id,
      notes: 'Perfect for La Liga Segunda scouting. Excellent track record.',
      tags: ['LaLiga', 'Defenders', 'Youth'],
      addedAt: new Date('2025-01-18'),
    },
  });

  console.log(`✅ Created 2 scout favorites`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Clubs: 20 major European clubs`);
  console.log(`  - Players: 60 famous players (3 per club)`);
  console.log(`  - Staff Users: 4 (1 admin, 2 scouts, 1 agent)`);
  console.log(`  - Scout Listings: 2 active verified listings`);
  console.log(`  - Marketplace Offers: 4 offers (1 completed, 1 accepted, 1 viewed, 1 pending)`);
  console.log(`  - Reviews: 1 verified 5-star review`);
  console.log(`  - Favorites: 2 scout favorites`);
  console.log('\n🏆 Clubs by league:');
  console.log('  Ligue 1: PSG, OM, OL, Monaco');
  console.log('  Premier League: Manchester City, Arsenal, Liverpool, Chelsea');
  console.log('  La Liga: Real Madrid, Barcelona, Atlético Madrid, Sevilla');
  console.log('  Bundesliga: Bayern Munich, Dortmund, RB Leipzig, Leverkusen');
  console.log('  Serie A: Inter Milan, AC Milan, Juventus, Napoli');
  console.log('\n🔐 Login credentials (all users):');
  console.log('  Password: Password123!');
  console.log('\n📧 Staff users:');
  console.log('  - admin@arcane.com (SUPER_ADMIN)');
  console.log('  - scout1@arcane.com (SCOUT) - Has active marketplace listing');
  console.log('  - scout2@arcane.com (SCOUT) - Has active marketplace listing');
  console.log('  - agent@arcane.com (AGENT)');
  console.log('\n⚽ Sample player accounts:');
  console.log('  - erling.haaland@arcane-demo.com (Manchester City)');
  console.log('  - vinicius.junior@arcane-demo.com (Real Madrid)');
  console.log('  - mohamed.salah@arcane-demo.com (Liverpool)');
  console.log('  - harry.kane@arcane-demo.com (Bayern Munich)');
  console.log('  - florian.wirtz@arcane-demo.com (Bayer Leverkusen)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
