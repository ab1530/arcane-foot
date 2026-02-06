/**
 * Script de test complet pour tous les systèmes implémentés
 * Tests : Validation, Gamification, AI, APIs Externes, Cache, WebSocket
 */

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Token admin pour les tests
let adminToken = '';
let testPlayerId = '';
let testUserId = '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function getDemoPassword(): string {
  const demoPassword = process.env.ARCANE_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error(
      'ARCANE_DEMO_PASSWORD is required to run this script (do not commit demo passwords).',
    );
  }
  return demoPassword;
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

function logTest(testName: string, passed: boolean, duration?: number) {
  const icon = passed ? '✓' : '✗';
  const color = passed ? colors.green : colors.red;
  const timeStr = duration ? ` (${duration}ms)` : '';
  log(`${icon} ${testName}${timeStr}`, color);
}

async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  useAuth = true,
) {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (useAuth && adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<boolean> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    logTest(name, true, duration);
    results.push({ name, passed: true, duration });
    return true;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logTest(name, false, duration);
    log(`  Error: ${error.message}`, colors.red);
    results.push({ name, passed: false, error: error.message, duration });
    return false;
  }
}

// ============================================================================
// PHASE 1: Authentification et Setup
// ============================================================================

async function testAuthentication() {
  logSection('PHASE 1: Authentification');

  await runTest('Login Admin', async () => {
    const response = await makeRequest(
      '/auth/login',
      'POST',
      {
        email: 'admin@arcane.com',
        password: getDemoPassword(),
      },
      false,
    );

    if (!response.token) {
      throw new Error('No token received');
    }

    adminToken = response.token;
    testUserId = response.user.id;
    log(`  Token reçu: ${adminToken.substring(0, 20)}...`, colors.yellow);
  });

  await runTest('Verify Admin Access', async () => {
    const response = await makeRequest('/auth/me');

    if (response.role !== 'SUPER_ADMIN' && response.role !== 'ADMIN') {
      throw new Error('Not an admin user');
    }

    log(`  Admin vérifié: ${response.email} (${response.role})`, colors.yellow);
  });
}

// ============================================================================
// PHASE 2: Système de Validation
// ============================================================================

async function testPlayerValidation() {
  logSection('PHASE 2: Système de Validation des Joueurs');

  await runTest('Get Pending Players', async () => {
    const response = await makeRequest('/admin/players/pending-validation?limit=5');

    log(`  ${response.players.length} joueurs en attente`, colors.yellow);
    log(`  Total: ${response.pagination.total}`, colors.yellow);

    if (response.players.length > 0) {
      testPlayerId = response.players[0].id;
      log(`  Test Player ID: ${testPlayerId}`, colors.yellow);
    }
  });

  await runTest('Get Verification Stats', async () => {
    const response = await makeRequest('/admin/players/verification-stats');

    log(`  Total PUBLIC: ${response.totalPublicPlayers}`, colors.yellow);
    log(`  Pending: ${response.statusBreakdown.pending}`, colors.yellow);
    log(`  Verified: ${response.statusBreakdown.verified}`, colors.yellow);
    log(`  Rejected: ${response.statusBreakdown.rejected}`, colors.yellow);
  });

  if (testPlayerId) {
    await runTest('Get Validation History', async () => {
      const response = await makeRequest(`/admin/players/${testPlayerId}/validation-history`);

      log(`  ${response.history.length} entrées d'historique`, colors.yellow);
    });

    await runTest('Validate Player', async () => {
      const response = await makeRequest(`/admin/players/${testPlayerId}/validate`, 'POST', {
        notes: 'Player validated by automated test',
        notifyPlayer: false,
      });

      if (response.verificationStatus !== 'VERIFIED') {
        throw new Error('Player not verified');
      }

      log(`  Joueur validé avec succès`, colors.yellow);
    });

    await runTest('Get Players by Status', async () => {
      const response = await makeRequest('/admin/players/by-status/VERIFIED?limit=5');

      log(`  ${response.players.length} joueurs vérifiés trouvés`, colors.yellow);
    });
  }

  await runTest('CSV Export', async () => {
    const headers: any = {
      Authorization: `Bearer ${adminToken}`,
    };

    const response = await fetch(`${API_BASE}/admin/players/export-csv`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    log(`  CSV exporté avec ${lines.length} lignes`, colors.yellow);
  });
}

// ============================================================================
// PHASE 3: Système de Gamification
// ============================================================================

async function testGamification() {
  logSection('PHASE 3: Système de Gamification');

  await runTest('Get User Profile', async () => {
    const response = await makeRequest('/gamification/profile');

    log(`  Level: ${response.level}`, colors.yellow);
    log(`  Points: ${response.currentPoints}`, colors.yellow);
    log(`  Achievements: ${response.totalAchievements}`, colors.yellow);
    log(`  Badges: ${response.totalBadges}`, colors.yellow);
  });

  await runTest('Get Achievements', async () => {
    const response = await makeRequest('/gamification/achievements');

    log(`  ${response.length} achievements disponibles`, colors.yellow);

    const unlocked = response.filter((a: any) => a.isUnlocked).length;
    log(`  ${unlocked} achievements débloqués`, colors.yellow);
  });

  await runTest('Get Badges', async () => {
    const response = await makeRequest('/gamification/badges');

    log(`  ${response.length} badges obtenus`, colors.yellow);
  });

  await runTest('Get Leaderboard', async () => {
    const response = await makeRequest('/gamification/leaderboard/WEEKLY_OVERALL?limit=10');

    log(`  Top ${response.leaderboard.length} joueurs`, colors.yellow);

    if (response.userRank) {
      log(`  Votre rang: ${response.userRank}`, colors.yellow);
    }
  });

  await runTest('Get Daily Challenge', async () => {
    const response = await makeRequest('/gamification/daily-challenge');

    if (response.challenge) {
      log(`  Challenge: ${response.challenge.title}`, colors.yellow);
      log(
        `  Progrès: ${response.userProgress.progress}/${response.challenge.target}`,
        colors.yellow,
      );
      log(`  Complété: ${response.userProgress.completed ? 'Oui' : 'Non'}`, colors.yellow);
    }
  });

  await runTest('Get User Stats', async () => {
    const response = await makeRequest('/gamification/stats');

    log(`  Total points: ${response.totalPoints}`, colors.yellow);
    log(`  Level: ${response.currentLevel}`, colors.yellow);
    log(`  Streak: ${response.loginStreak} jours`, colors.yellow);
  });

  await runTest('Track User Action', async () => {
    const response = await makeRequest('/gamification/track-action/PROFILE_COMPLETED', 'POST');

    log(`  Action trackée: ${response.action}`, colors.yellow);

    if (response.pointsEarned) {
      log(`  Points gagnés: +${response.pointsEarned}`, colors.yellow);
    }
  });
}

// ============================================================================
// PHASE 4: Intelligence Artificielle
// ============================================================================

async function testAIIntelligence() {
  logSection('PHASE 4: Intelligence Artificielle');

  if (!testPlayerId) {
    // Get a player for testing
    const players = await prisma.players.findMany({ take: 1 });
    if (players.length > 0) {
      testPlayerId = players[0].id;
    }
  }

  if (testPlayerId) {
    await runTest('AI Player Analysis', async () => {
      const response = await makeRequest(`/ai/player-analysis/${testPlayerId}`);

      log(`  Overall Rating: ${response.overallRating}`, colors.yellow);
      log(`  Market Value: ${response.marketValue}`, colors.yellow);
      log(`  Potential: ${response.potentialScore}`, colors.yellow);
      log(`  Injury Risk: ${response.injuryRisk}`, colors.yellow);
      log(
        `  Strengths: ${response.strengthWeakness.strengths.join(', ') || 'None'}`,
        colors.yellow,
      );
    });

    await runTest('AI Talent Prediction', async () => {
      const response = await makeRequest(`/ai/talent-prediction/${testPlayerId}`);

      log(`  Current Ability: ${response.currentAbility}`, colors.yellow);
      log(`  Potential: ${response.potentialAbility}`, colors.yellow);
      log(`  Peak Age: ${response.peakAge} ans`, colors.yellow);
      log(`  Trajectory: ${response.developmentCurve.trajectory}`, colors.yellow);
      log(`  Confidence: ${(response.confidence * 100).toFixed(1)}%`, colors.yellow);
    });

    await runTest('AI Club Recommendations', async () => {
      const response = await makeRequest(`/ai/match-recommendation/${testPlayerId}`);

      log(`  Player: ${response.playerName}`, colors.yellow);
      log(`  Top ${response.topMatches.length} clubs compatibles:`, colors.yellow);

      response.topMatches.slice(0, 3).forEach((match: any, i: number) => {
        log(
          `    ${i + 1}. ${match.clubName} (${match.compatibilityScore.toFixed(0)}%)`,
          colors.yellow,
        );
      });
    });

    await runTest('AI Suspicious Detection', async () => {
      const response = await makeRequest(`/ai/suspicious-detection/${testPlayerId}`);

      log(`  Suspicion Score: ${response.suspicionScore}/100`, colors.yellow);
      log(`  Is Suspicious: ${response.isSuspicious ? 'Oui' : 'Non'}`, colors.yellow);
      log(`  Recommendation: ${response.recommendation}`, colors.yellow);

      if (response.factors.length > 0) {
        log(`  Facteurs: ${response.factors.join(', ')}`, colors.yellow);
      }
    });

    await runTest('AI Player Index', async () => {
      const response = await makeRequest(`/ai/index/${testPlayerId}`);

      log(`  Overall Score: ${response.overallScore}`, colors.yellow);
      log(`  Source: ${response.source}`, colors.yellow);
    });
  }
}

// ============================================================================
// PHASE 5: APIs Externes
// ============================================================================

async function testExternalAPIs() {
  logSection('PHASE 5: APIs Externes');

  await runTest('OpenLigaDB - Get Matches', async () => {
    const response = await makeRequest('/external-apis/openliga/matches?league=bl1');

    log(`  ${response.length} matches trouvés`, colors.yellow);

    if (response.length > 0) {
      const match = response[0];
      log(`  Exemple: ${match.homeTeam.name} vs ${match.awayTeam.name}`, colors.yellow);
    }
  });

  await runTest('OpenLigaDB - Get Teams', async () => {
    const response = await makeRequest('/external-apis/openliga/teams/2024?league=bl1');

    log(`  ${response.length} équipes trouvées`, colors.yellow);
  });

  await runTest('TheSportsDB - Search Team', async () => {
    const response = await makeRequest('/external-apis/sportsdb/team/search?name=Arsenal');

    if (response) {
      log(`  Team trouvée: ${response.name}`, colors.yellow);
      log(`  League: ${response.league}`, colors.yellow);
      log(`  Stadium: ${response.stadium || 'N/A'}`, colors.yellow);
    }
  });

  await runTest('TheSportsDB - Search Player', async () => {
    const response = await makeRequest('/external-apis/sportsdb/player/search?name=Messi');

    if (response) {
      log(`  Joueur trouvé: ${response.name}`, colors.yellow);
      log(`  Team: ${response.team || 'N/A'}`, colors.yellow);
      log(`  Nationality: ${response.nationality || 'N/A'}`, colors.yellow);
    }
  });

  await runTest('Football-Data - Download League', async () => {
    const response = await makeRequest('/external-apis/footballdata/download/E0');

    log(`  ${response.length} matches téléchargés`, colors.yellow);

    if (response.length > 0) {
      const match = response[0];
      log(`  Exemple: ${match.HomeTeam} vs ${match.AwayTeam}`, colors.yellow);
    }
  });

  await runTest('Football-Data - League Stats', async () => {
    const response = await makeRequest('/external-apis/footballdata/stats/Premier League');

    if (response.totalMatches > 0) {
      log(`  Total matches: ${response.totalMatches}`, colors.yellow);
      log(`  Goals moyens: ${response.averageGoalsPerMatch.toFixed(2)}`, colors.yellow);
      log(`  Home wins: ${response.homeWinPercentage.toFixed(1)}%`, colors.yellow);
    }
  });
}

// ============================================================================
// PHASE 6: Performance et Cache
// ============================================================================

async function testPerformance() {
  logSection('PHASE 6: Performance et Cache');

  await runTest('Response Time Test', async () => {
    const startTime = Date.now();
    await makeRequest('/auth/me');
    const duration = Date.now() - startTime;

    if (duration > 500) {
      throw new Error(`Response too slow: ${duration}ms`);
    }

    log(`  Response time: ${duration}ms`, colors.yellow);
  });

  await runTest('Multiple Concurrent Requests', async () => {
    const startTime = Date.now();

    const promises = [
      makeRequest('/gamification/profile'),
      makeRequest('/gamification/achievements'),
      makeRequest('/gamification/badges'),
      makeRequest('/admin/players/verification-stats'),
    ];

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    log(`  4 requêtes parallèles en ${duration}ms`, colors.yellow);
    log(`  Moyenne: ${(duration / 4).toFixed(0)}ms par requête`, colors.yellow);
  });

  await runTest('Database Connection', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    if (!result) {
      throw new Error('Database query failed');
    }

    log(`  Base de données connectée`, colors.yellow);
  });
}

// ============================================================================
// RÉSULTATS FINAUX
// ============================================================================

function displayFinalResults() {
  logSection('RÉSULTATS FINAUX');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const successRate = ((passed / total) * 100).toFixed(1);

  log(`Total tests: ${total}`, colors.bright);
  log(`Tests réussis: ${passed}`, colors.green);
  log(`Tests échoués: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`Taux de réussite: ${successRate}%`, colors.bright + colors.cyan);

  if (failed > 0) {
    log('\nTests échoués:', colors.red);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        log(`  • ${r.name}`, colors.red);
        if (r.error) {
          log(`    ${r.error}`, colors.red);
        }
      });
  }

  // Statistiques de performance
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / total;

  log(`\nPerformance moyenne: ${avgDuration.toFixed(0)}ms par test`, colors.yellow);

  const slowTests = results
    .filter((r) => (r.duration || 0) > 1000)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0));

  if (slowTests.length > 0) {
    log('\nTests les plus lents:', colors.yellow);
    slowTests.forEach((r) => {
      log(`  • ${r.name}: ${r.duration}ms`, colors.yellow);
    });
  }
}

// ============================================================================
// EXECUTION PRINCIPALE
// ============================================================================

async function main() {
  log(
    `
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║     🚀 ARCANE FOOTBALL PLATFORM - TESTS COMPLETS 🚀       ║
    ║                                                            ║
    ║     Tests de tous les systèmes implémentés                ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
  `,
    colors.bright + colors.cyan,
  );

  log('\nDémarrage des tests...', colors.yellow);
  log(`Backend: ${API_BASE}`, colors.yellow);

  try {
    // Exécuter tous les tests
    await testAuthentication();
    await testPlayerValidation();
    await testGamification();
    await testAIIntelligence();
    await testExternalAPIs();
    await testPerformance();

    // Afficher les résultats
    displayFinalResults();

    // Exit code
    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error: any) {
    log(`\nErreur fatale: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
main();
