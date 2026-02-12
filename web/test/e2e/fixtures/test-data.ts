/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  valid: {
    email: 'scout@arcane.li',
    password: 'ArcaneScout2024!',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  newUser: {
    email: 'newuser@example.com',
    password: 'NewUser2024!',
    firstName: 'Test',
    lastName: 'User',
  },
};

export const TEST_PLAYERS = [
  {
    id: 'player-1',
    firstName: 'Lionel',
    lastName: 'Messi',
    position: 'FORWARD',
    age: 36,
    nationality: 'Argentina',
    currentClub: 'Inter Miami',
    rating: 95,
  },
  {
    id: 'player-2',
    firstName: 'Kylian',
    lastName: 'Mbappé',
    position: 'FORWARD',
    age: 25,
    nationality: 'France',
    currentClub: 'Real Madrid',
    rating: 94,
  },
  {
    id: 'player-3',
    firstName: 'Erling',
    lastName: 'Haaland',
    position: 'FORWARD',
    age: 23,
    nationality: 'Norway',
    currentClub: 'Manchester City',
    rating: 93,
  },
];

export const TEST_REPORTS = [
  {
    id: 'report-1',
    title: 'Performance Analysis - Q1 2024',
    player: TEST_PLAYERS[0],
    status: 'PUBLISHED',
    rating: 8.5,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'report-2',
    title: 'Tactical Analysis - Champions League',
    player: TEST_PLAYERS[1],
    status: 'DRAFT',
    rating: 9.0,
    createdAt: '2024-02-20T14:30:00Z',
  },
];

export const TEST_CAMPS = [
  {
    id: 'camp-1',
    name: 'Elite Summer Training Camp',
    location: 'Barcelona',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    status: 'ACTIVE',
    capacity: 50,
    enrolled: 35,
  },
  {
    id: 'camp-2',
    name: 'Youth Development Program',
    location: 'Madrid',
    startDate: '2024-08-01',
    endDate: '2024-08-30',
    status: 'UPCOMING',
    capacity: 30,
    enrolled: 12,
  },
];

export const DASHBOARD_STATS = {
  totalPlayers: 42,
  totalReports: 18,
  totalCamps: 5,
  activeCamps: 3,
  upcomingMatches: 7,
  pendingReports: 4,
};

export const PLAYER_FILTERS = {
  positions: ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER'],
  statuses: ['ACTIVE', 'INACTIVE', 'INJURED', 'ON_LOAN'],
  nationalities: ['Argentina', 'France', 'Brazil', 'Spain', 'England'],
  minAge: 16,
  maxAge: 40,
};

export const API_ENDPOINTS = {
  login: '**/api/auth/login',
  players: '**/api/players',
  player: '**/api/players/*',
  reports: '**/api/reports',
  camps: '**/api/camps',
  dashboard: '**/api/dashboard',
};
