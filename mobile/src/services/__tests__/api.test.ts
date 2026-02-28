import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { STORAGE_KEYS } from '../../constants/config';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: null,
    manifest2: null,
    manifest: null,
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/tmp',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('ApiClient', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    // Use the singleton instance
    // @ts-ignore - Access private client for mocking
    mock = new MockAdapter(api.client);
    // Clear auth token to reset state between tests
    api.setAuthToken(null);
    // @ts-ignore - reset getPlayer cache/in-flight maps for deterministic tests
    api.playerCache?.clear?.();
    // @ts-ignore - reset getPlayer cache/in-flight maps for deterministic tests
    api.inFlightPlayerRequests?.clear?.();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.reset();
  });

  describe('Authentication', () => {
    it('should login successfully and return auth response', async () => {
      const credentials = { email: 'test@arcane.gg', password: 'password123' };
      const authResponse = {
        accessToken: 'token-123',
        user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'test@arcane.gg' },
      };

      mock.onPost('/auth/login').reply(200, authResponse);

      const result = await api.login(credentials);

      expect(result).toEqual(authResponse);
      expect(mock.history.post[0].data).toBe(JSON.stringify(credentials));
    });

    it('should signup successfully', async () => {
      const userData = {
        email: 'new@arcane.gg',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Scout',
      };
      const authResponse = {
        accessToken: 'new-token',
        user: { id: '2', ...userData },
      };

      mock.onPost('/auth/signup').reply(201, authResponse);

      const result = await api.signup(userData);

      expect(result).toEqual(authResponse);
    });

    it('should set auth token', () => {
      api.setAuthToken('test-token');
      // @ts-ignore - Access private property
      expect(api.authToken).toBe('test-token');
    });

    it('should add auth token to request headers', async () => {
      api.setAuthToken('bearer-token-123');
      mock.onGet('/players').reply(200, { data: [] });

      await api.getPlayers();

      expect(mock.history.get[0].headers?.Authorization).toBe('Bearer bearer-token-123');
    });

    it('should get auth token from AsyncStorage if not set', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('stored-token');
      mock.onGet('/players').reply(200, { data: [] });

      await api.getPlayers();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
      expect(mock.history.get[0].headers?.Authorization).toBe('Bearer stored-token');
    });

    it('should clear auth data on logout', async () => {
      await api.logout();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    });

    it('should handle 401 unauthorized by clearing storage', async () => {
      mock.onGet('/players').reply(401);

      await expect(api.getPlayers()).rejects.toBeDefined();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    });
  });

  describe('Players API', () => {
    it('should get paginated players list', async () => {
      const mockResponse = {
        data: [
          { id: '1', firstName: 'Player', lastName: 'One' },
          { id: '2', firstName: 'Player', lastName: 'Two' },
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      mock.onGet('/players').reply(200, mockResponse);

      const result = await api.getPlayers();

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should get players with filters', async () => {
      const params = {
        position: 'FORWARD',
        status: 'AVAILABLE',
        search: 'John',
        page: 2,
        limit: 20,
      };

      mock.onGet('/players').reply(200, { data: [], meta: {} });

      await api.getPlayers(params);

      expect(mock.history.get[0].params).toEqual(params);
    });

    it('should get single player by ID', async () => {
      const mockPlayer = {
        id: '123',
        firstName: 'Star',
        lastName: 'Player',
        position: 'MIDFIELDER',
      };

      mock.onGet('/players/123').reply(200, mockPlayer);

      const result = await api.getPlayer('123');

      expect(result).toEqual(mockPlayer);
    });

    it('should reuse cached player response for a short interval', async () => {
      const mockPlayer = {
        id: '123',
        firstName: 'Cached',
        lastName: 'Player',
      };

      mock.onGet('/players/123').reply(200, mockPlayer);

      const first = await api.getPlayer('123');
      const second = await api.getPlayer('123');

      expect(first).toEqual(mockPlayer);
      expect(second).toEqual(mockPlayer);
      expect(mock.history.get.filter((entry) => entry.url === '/players/123')).toHaveLength(1);
    });

    it('should dedupe concurrent getPlayer calls for the same player', async () => {
      const mockPlayer = {
        id: '123',
        firstName: 'Concurrent',
        lastName: 'Player',
      };

      let replyCount = 0;
      mock.onGet('/players/123').reply(async () => {
        replyCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return [200, mockPlayer];
      });

      const [first, second, third] = await Promise.all([
        api.getPlayer('123'),
        api.getPlayer('123'),
        api.getPlayer('123'),
      ]);

      expect(first).toEqual(mockPlayer);
      expect(second).toEqual(mockPlayer);
      expect(third).toEqual(mockPlayer);
      expect(replyCount).toBe(1);
      expect(mock.history.get.filter((entry) => entry.url === '/players/123')).toHaveLength(1);
    });

    it('should get player stats', async () => {
      const mockStats = {
        goals: 15,
        assists: 8,
        appearances: 25,
      };

      mock.onGet('/players/123/stats').reply(200, mockStats);

      const result = await api.getPlayerStats('123');

      expect(result).toEqual(mockStats);
    });

    it('should normalize array response to paginated format', async () => {
      const mockPlayers = [
        { id: '1', firstName: 'P1' },
        { id: '2', firstName: 'P2' },
      ];

      mock.onGet('/players').reply(200, mockPlayers);

      const result = await api.getPlayers();

      expect(result.data).toEqual(mockPlayers);
      expect(result.items).toEqual(mockPlayers);
      expect(result.meta.total).toBe(2);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should get player space dashboard', async () => {
      const mockPayload = {
        playerId: 'player-1',
        player: {
          id: 'player-1',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          position: 'Attaquant',
          nationality: 'FR',
        },
        snapshot: {
          matchesPlayed: 4,
          matchesNotPlayed: 1,
          goals: 2,
          assists: 1,
          minutesPlayed: 360,
          isInjured: false,
          injuryStatus: null,
        },
        performanceTrend: [],
        upcomingCalendar: [],
        health: { status: 'Connecté', lastDeviceSync: '2026-02-20T18:00:00.000Z', syncSource: 'Tracker' },
        weekly: { latest: null, totalUpdates: 0 },
        news: [],
        generatedAt: '2026-02-20T18:00:00.000Z',
      };

      mock.onGet('/players/me/space').reply(200, mockPayload);

      const result = await api.getMyPlayerSpace();

      expect(result).toEqual(mockPayload);
      expect(mock.history.get).toHaveLength(1);
      expect(mock.history.get[0].url).toBe('/players/me/space');
    });

    it('should fallback to player profile when player space endpoint returns 404', async () => {
      const fallbackPlayer = {
        id: 'player-1',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        position: 'Attaquant',
        nationality: 'FR',
        club: { id: 'club-1', name: 'FC Alpha' },
        photoUrl: 'https://example.com/photo.jpg',
        statsJson: {
          matchesPlayed: 4,
          matchesNotPlayed: 1,
          goals: 2,
          assists: 1,
          minutesPlayed: 360,
          isInjured: false,
          injuryStatus: 'NORMAL',
          lastWeeklyUpdateAt: '2026-02-20T18:00:00.000Z',
        },
      };

      mock.onGet('/players/me/space').reply(404, { message: 'Cannot GET /api/players/me/space' });
      mock.onGet('/players/space/me').reply(404, { message: 'Cannot GET /api/players/space/me' });
      mock.onGet('/auth/me').reply(200, { playerId: 'player-1' });
      mock.onGet('/players/player-1').reply(200, fallbackPlayer);

      const result = await api.getMyPlayerSpace();

      expect(result.playerId).toBe('player-1');
      expect(result.player.position).toBe('Attaquant');
      expect(result.snapshot.matchesPlayed).toBe(4);
      expect(result.health.status).toBe('Disponible');
      expect(mock.history.get.map((entry) => entry.url)).toEqual([
        '/players/me/space',
        '/players/space/me',
        '/players/me/dashboard',
        '/players/dashboard/me',
        '/auth/me',
        '/players/player-1',
        '/matches',
      ]);
    });

    it('should try compatibility dashboard aliases when standard space endpoints return 404', async () => {
      const legacyPayload = {
        playerId: 'player-1',
        player: {
          id: 'player-1',
          firstName: 'Léo',
          lastName: 'Mercier',
          fullName: 'Léo Mercier',
          position: 'Milieu',
          nationality: 'FR',
          clubId: null,
          clubName: null,
          photoUrl: null,
        },
        snapshot: {
          matchesPlayed: 6,
          matchesNotPlayed: 0,
          goals: 2,
          assists: 4,
          minutesPlayed: 540,
          isInjured: false,
          injuryStatus: null,
        },
        performanceTrend: [],
        upcomingCalendar: [],
        health: {
          status: 'Disponible',
          lastDeviceSync: '2026-02-20T20:00:00.000Z',
          syncSource: 'Tracker',
        },
        weekly: { latest: null, totalUpdates: 0 },
        news: [],
        generatedAt: '2026-02-20T20:00:00.000Z',
      };

      mock.onGet('/players/me/space').reply(404, { message: 'Cannot GET /api/players/me/space' });
      mock.onGet('/players/space/me').reply(404, { message: 'Cannot GET /api/players/space/me' });
      mock
        .onGet('/players/me/dashboard')
        .reply(200, legacyPayload);

      const result = await api.getMyPlayerSpace('player-1');

      expect(result.playerId).toBe('player-1');
      expect(result.player.fullName).toBe('Léo Mercier');
      expect(mock.history.get.map((entry) => entry.url)).toEqual([
        '/players/me/space',
        '/players/space/me',
        '/players/me/dashboard',
      ]);
    });

    it('should refresh player id from current user when hinted id is stale and space endpoints return 404', async () => {
      const fallbackPlayer = {
        id: 'player-2',
        firstName: 'Mila',
        lastName: 'K.',
        fullName: 'Mila K.',
        position: 'Milieu',
        nationality: 'ES',
        club: { id: 'club-2', name: 'FC Beta' },
        photoUrl: 'https://example.com/mila.png',
        statsJson: {
          matchesPlayed: 2,
          matchesNotPlayed: 0,
          goals: 1,
          assists: 3,
          minutesPlayed: 220,
          isInjured: false,
          injuryStatus: null,
        },
      };

      mock.onGet('/players/me/space').reply(404, { message: 'Cannot GET /api/players/me/space' });
      mock.onGet('/players/space/me').reply(404, { message: 'Cannot GET /api/players/space/me' });
      mock.onGet('/auth/me').reply(200, { playerId: 'player-2' });
      mock.onGet('/players/player-2').reply(200, fallbackPlayer);

      const result = await api.getMyPlayerSpace('player-1');

      expect(result.playerId).toBe('player-2');
      expect(result.player.fullName).toBe('Mila K.');
      expect(mock.history.get.map((entry) => entry.url)).toEqual([
        '/players/me/space',
        '/players/space/me',
        '/players/me/dashboard',
        '/players/dashboard/me',
        '/auth/me',
        '/players/player-2',
        '/matches',
      ]);
    });

    it('should submit player weekly update', async () => {
      const payload = {
        minutesPlayed: 480,
        goals: 1,
        assists: 2,
        matchesPlayed: 3,
        matchesNotPlayed: 1,
        isInjured: false,
        healthStatus: 'NORMAL',
      };
      const mockResponse = {
        playerId: 'player-1',
        player: {
          id: 'player-1',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          position: 'Attaquant',
          nationality: 'FR',
        },
        snapshot: {
          matchesPlayed: 3,
          matchesNotPlayed: 1,
          goals: 1,
          assists: 2,
          minutesPlayed: 480,
          isInjured: false,
          injuryStatus: 'NORMAL',
        },
        performanceTrend: [],
        upcomingCalendar: [],
        health: { status: 'Connecté', lastDeviceSync: null, syncSource: null },
        weekly: {
          latest: {
            weekStartDate: '2026-02-15',
            submittedAt: '2026-02-20T18:00:00.000Z',
            updatedBy: 'player-1',
            minutesPlayed: 480,
            goals: 1,
            assists: 2,
            matchesPlayed: 3,
            matchesNotPlayed: 1,
            isInjured: false,
            healthStatus: 'NORMAL',
            remarks: null,
          },
          totalUpdates: 1,
        },
        news: [],
        generatedAt: '2026-02-20T18:00:00.000Z',
      };

      mock.onPost('/players/me/space/weekly-update').reply(200, mockResponse);

      const result = await api.submitMyPlayerWeeklyUpdate(payload as any);

      expect(result).toEqual(mockResponse);
      expect(JSON.parse(mock.history.post[0].data)).toMatchObject(payload);
    });

    it('should fallback weekly update to dashboard alias when primary endpoint returns 404', async () => {
      const payload = {
        minutesPlayed: 360,
        goals: 0,
        assists: 0,
        matchesPlayed: 2,
        matchesNotPlayed: 1,
        isInjured: false,
      };
      const mockResponse = {
        playerId: 'player-1',
        player: {
          id: 'player-1',
          firstName: 'Nina',
          lastName: 'Durand',
          fullName: 'Nina Durand',
          position: 'Ailier',
          nationality: 'FR',
        },
        snapshot: {
          matchesPlayed: 2,
          matchesNotPlayed: 1,
          goals: 0,
          assists: 0,
          minutesPlayed: 360,
          isInjured: false,
          injuryStatus: null,
        },
        performanceTrend: [],
        upcomingCalendar: [],
        health: { status: 'Disponible', lastDeviceSync: null, syncSource: null },
        weekly: {
          latest: {
            weekStartDate: '2026-02-15',
            submittedAt: '2026-02-20T20:00:00.000Z',
            updatedBy: 'player-1',
            minutesPlayed: 360,
            goals: 0,
            assists: 0,
            matchesPlayed: 2,
            matchesNotPlayed: 1,
            isInjured: false,
            healthStatus: 'NORMAL',
            remarks: null,
          },
          totalUpdates: 1,
        },
        news: [],
        generatedAt: '2026-02-20T20:00:00.000Z',
      };

      mock.onPost('/players/me/space/weekly-update').reply(404, { message: 'Cannot GET /api/players/me/space/weekly-update' });
      mock.onPost('/players/space/me/weekly-update').reply(404, { message: 'Cannot GET /api/players/space/me/weekly-update' });
      mock.onPost('/players/me/dashboard/weekly-update').reply(200, mockResponse);

      const result = await api.submitMyPlayerWeeklyUpdate(payload as any);

      expect(result).toEqual(mockResponse);
      expect(JSON.parse(mock.history.post[0].data)).toMatchObject(payload);
      expect(mock.history.post.map((entry) => entry.url)).toEqual([
        '/players/me/space/weekly-update',
        '/players/space/me/weekly-update',
        '/players/me/dashboard/weekly-update',
      ]);
    });
  });

  describe('News API', () => {
    it('should get news feed', async () => {
      const mockResponse = {
        data: [
          {
            id: 'news-1',
            category: 'clubs',
            title: 'Update club',
            summary: 'Un point important',
            source: 'Clubs',
            details: 'Les dernières infos',
            timestamp: '2026-02-20T10:00:00.000Z',
            link: '/clubs/club-1',
          },
        ],
        generatedAt: '2026-02-20T12:00:00.000Z',
        meta: {
          limit: 10,
          total: 1,
          categories: ['clubs', 'players', 'market', 'notifications'],
          include: {
            players: 0,
            clubs: 1,
            market: 0,
            notifications: 0,
          },
        },
      };

      mock.onGet('/news/feed').reply(200, mockResponse);

      const result = await api.getNewsFeed({
        limit: 10,
        categories: ['clubs', 'market'],
      });

      expect(result.data).toEqual(mockResponse.data);
      expect(result.meta.categories).toEqual(['clubs', 'market']);
      expect(result.meta.include.clubs).toBe(1);
      expect(mock.history.get[0].url).toBe('/news/feed');
      expect(mock.history.get[0].params).toMatchObject({
        limit: 10,
        categories: 'clubs,market',
      });
    });

    it('should fallback to /news when /news/feed is unavailable', async () => {
      const mockResponse = {
        data: [
          {
            id: 'legacy-1',
            category: 'market',
            title: 'Legacy market item',
            summary: 'Legacy summary',
            source: 'Legacy',
            details: 'Legacy details',
            timestamp: '2026-02-20T12:00:00.000Z',
            link: '/legacy/1',
          },
        ],
        generatedAt: '2026-02-20T12:00:00.000Z',
      };

      mock.onGet('/news/feed').reply(404, { message: 'Not Found' });
      mock.onGet('/news').reply(200, mockResponse);

      const result = await api.getNewsFeed({
        limit: 10,
        categories: ['market'],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('legacy-1');
      expect(mock.history.get.map((entry) => entry.url)).toEqual(['/news/feed', '/news']);
      expect(mock.history.get[1].params).toMatchObject({
        limit: 10,
        categories: 'market',
      });
    });

    it('should fallback to notifications when news endpoints are unavailable', async () => {
      mock.onGet('/news/feed').reply(404, { message: 'Not Found' });
      mock.onGet('/news').reply(404, { message: 'Not Found' });
      mock.onGet('/notifications/me').reply(200, [
        {
          id: 'notif-1',
          title: 'Alerte médicale',
          body: 'Le suivi santé doit être complété',
          type: 'HEALTH',
          createdAt: '2026-02-20T12:00:00.000Z',
        },
      ]);

      const result = await api.getNewsFeed({
        limit: 10,
        categories: ['notifications'],
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'notifications-notif-1',
        category: 'notifications',
        title: 'Alerte médicale',
        source: 'HEALTH',
      });
      expect(result.meta.include.notifications).toBe(1);
      expect(mock.history.get.map((entry) => entry.url)).toEqual([
        '/news/feed',
        '/news',
        '/notifications/me',
      ]);
    });
  });

  describe('Scouting Reports API', () => {
    it('should get reports list', async () => {
      const mockReports = {
        data: [{ id: 'r1', playerId: 'p1' }],
      };

      mock.onGet('/scouting-reports').reply(200, mockReports);

      const result = await api.getReports();

      expect(result).toEqual(mockReports);
    });

    it('should get single report', async () => {
      const mockReport = { id: 'r1', playerId: 'p1', status: 'DRAFT' };

      mock.onGet('/scouting-reports/r1').reply(200, mockReport);

      const result = await api.getReport('r1');

      expect(result).toEqual(mockReport);
    });

    it('should create new report', async () => {
      const reportData = {
        playerId: 'p1',
        overallRating: 85,
        notes: 'Excellent player',
      };

      const createdReport = { id: 'new-r1', ...reportData };

      mock.onPost('/scouting-reports').reply(201, createdReport);

      const result = await api.createReport(reportData);

      expect(result).toEqual(createdReport);
      expect(JSON.parse(mock.history.post[0].data)).toMatchObject(reportData);
    });

    it('should update existing report', async () => {
      const updateData = { overallRating: 90 };
      const updatedReport = { id: 'r1', ...updateData };

      mock.onPatch('/scouting-reports/r1').reply(200, updatedReport);

      const result = await api.updateReport('r1', updateData);

      expect(result).toEqual(updatedReport);
    });

    it('should submit report for review', async () => {
      mock.onPost('/scouting-reports/r1/submit').reply(200, { status: 'SUBMITTED' });

      const result = await api.submitReport('r1');

      expect(result.status).toBe('SUBMITTED');
    });

    it('should review and approve report', async () => {
      mock.onPost('/scouting-reports/r1/review').reply(200, { approved: true });

      const result = await api.reviewReport('r1', true);

      expect(result.approved).toBe(true);
      expect(JSON.parse(mock.history.post[0].data).approved).toBe(true);
    });

    it('should delete report', async () => {
      mock.onDelete('/scouting-reports/r1').reply(204);

      await api.deleteReport('r1');

      expect(mock.history.delete).toHaveLength(1);
      expect(mock.history.delete[0].url).toBe('/scouting-reports/r1');
    });
  });

  describe('AI Endpoints', () => {
    it('should get ArkaneIndex for player', async () => {
      const mockIndex = {
        playerId: 'p1',
        overallScore: 87,
        breakdown: [
          { name: 'Technical', score: 90 },
          { name: 'Physical', score: 85 },
        ],
      };

      mock.onGet('/ai/index/p1').reply(200, mockIndex);

      const result = await api.getArkaneIndex('p1');

      expect(result).toEqual(mockIndex);
    });

    it('should chat with ArkaneGPT', async () => {
      const message = 'What makes a good scout?';
      const mockResponse = {
        summary: 'A good scout needs...',
        confidence: 0.95,
      };

      mock.onPost('/ai/summary').reply(200, mockResponse);

      const result = await api.chatWithArkaneGPT(message);

      expect(result).toEqual(mockResponse);
      expect(JSON.parse(mock.history.post[0].data).prompt).toBe(message);
    });

    it('should call AI matchmaking', async () => {
      const payload = {
        playerIds: ['p1', 'p2'],
        clubIds: ['c1'],
        tags: ['young', 'technical'],
      };
      const mockMatches = {
        matches: [
          { playerId: 'p1', clubId: 'c1', score: 0.92 },
        ],
      };

      mock.onPost('/ai/matchmaking').reply(200, mockMatches);

      const result = await api.aiMatchmaking(payload);

      expect(result).toEqual(mockMatches);
    });
  });

  describe('Analytics Endpoints', () => {
    it('should get analytics overview', async () => {
      const mockOverview = {
        totalPlayers: 150,
        totalClubs: 45,
        totalReports: 320,
      };

      mock.onGet('/analytics/overview').reply(200, mockOverview);

      const result = await api.getAnalyticsOverview();

      expect(result).toEqual(mockOverview);
    });

    it('should get players analytics', async () => {
      const mockAnalytics = {
        byPosition: [{ position: 'FORWARD', count: 50 }],
      };

      mock.onGet('/analytics/players').reply(200, mockAnalytics);

      const result = await api.getPlayersAnalytics();

      expect(result).toEqual(mockAnalytics);
    });

    it('should get scouting reports analytics', async () => {
      const mockAnalytics = {
        byStatus: [{ status: 'APPROVED', count: 100 }],
        ratingStats: { average: 78.5 },
      };

      mock.onGet('/analytics/scouting-reports').reply(200, mockAnalytics);

      const result = await api.getScoutingReportsAnalytics();

      expect(result).toEqual(mockAnalytics);
    });

    it('should get activity trends with custom days', async () => {
      const mockTrends = {
        newPlayers: [10, 15, 12],
        newReports: [20, 25, 18],
      };

      mock.onGet('/analytics/activity-trends').reply(200, mockTrends);

      await api.getActivityTrends(90);

      expect(mock.history.get[0].params.days).toBe(90);
    });
  });

  describe('Camps Endpoints', () => {
    it('should get camps list', async () => {
      const mockCamps = {
        data: [{ id: 'c1', name: 'Summer Camp 2024' }],
      };

      mock.onGet('/camps').reply(200, mockCamps);

      const result = await api.getCamps();

      expect(result).toEqual(mockCamps);
    });

    it('should get single camp', async () => {
      const mockCamp = {
        id: 'c1',
        name: 'Elite Training',
        startDate: '2024-07-01',
      };

      mock.onGet('/camps/c1').reply(200, mockCamp);

      const result = await api.getCamp('c1');

      expect(result).toEqual(mockCamp);
    });

    it('should get my camp registrations', async () => {
      const mockRegistrations = {
        data: [{ campId: 'c1', status: 'CONFIRMED' }],
      };

      mock.onGet('/camps/my/registrations').reply(200, mockRegistrations);

      const result = await api.getMyCamps();

      expect(result).toEqual(mockRegistrations);
    });

    it('should register for camp', async () => {
      const registrationData = {
        playerIds: ['p1'],
        paymentMethod: 'CARD',
      };

      mock.onPost('/camps/c1/register').reply(201, { status: 'CONFIRMED' });

      const result = await api.registerForCamp('c1', registrationData);

      expect(result.status).toBe('CONFIRMED');
    });

    it('should cancel camp registration', async () => {
      mock.onDelete('/camps/registrations/reg-123').reply(204);

      await api.cancelRegistration('reg-123');

      expect(mock.history.delete[0].url).toBe('/camps/registrations/reg-123');
    });

    it('should create new camp', async () => {
      const campData = {
        name: 'New Camp',
        startDate: '2024-08-01',
        endDate: '2024-08-07',
      };

      mock.onPost('/camps').reply(201, { id: 'new-c', ...campData });

      const result = await api.createCamp(campData);

      expect(result.id).toBe('new-c');
    });

    it('should update camp', async () => {
      const updateData = { name: 'Updated Camp Name' };

      mock.onPut('/camps/c1').reply(200, { id: 'c1', ...updateData });

      const result = await api.updateCamp('c1', updateData);

      expect(result.name).toBe('Updated Camp Name');
    });
  });

  describe('Clubs and Matches', () => {
    it('should get clubs with pagination', async () => {
      const mockResponse = {
        data: [{ id: 'club1', name: 'FC Test' }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      mock.onGet('/clubs').reply(200, mockResponse);

      const result = await api.getClubs();

      expect(result.data).toHaveLength(1);
    });

    it('should get single club', async () => {
      const mockClub = { id: 'club1', name: 'FC Arcane' };

      mock.onGet('/clubs/club1').reply(200, mockClub);

      const result = await api.getClub('club1');

      expect(result).toEqual(mockClub);
    });

    it('should get matches with filters', async () => {
      const params = {
        status: 'COMPLETED',
        clubId: 'club1',
        season: '2023-24',
      };

      mock.onGet('/matches').reply(200, { data: [], meta: {} });

      await api.getMatches(params);

      expect(mock.history.get[0].params).toEqual(params);
    });

    it('should get my assigned matches with filters', async () => {
      const params = {
        status: 'ASSIGNED',
        from: '2026-02-01',
        to: '2026-02-28',
      };

      mock.onGet('/matches/my-assignments').reply(200, { data: [], meta: {} });

      await api.getMyAssignedMatches(params);

      expect(mock.history.get[0].params).toEqual(params);
    });

    it('should get upcoming matches', async () => {
      const mockMatches = [
        { id: 'm1', date: '2024-12-01' },
        { id: 'm2', date: '2024-12-05' },
      ];

      mock.onGet('/matches/upcoming').reply(200, mockMatches);

      const result = await api.getUpcomingMatches(10);

      expect(result).toEqual(mockMatches);
      expect(mock.history.get[0].params.limit).toBe(10);
    });

    it('should get live matches', async () => {
      const mockLiveMatches = [{ id: 'live1', minute: 67 }];

      mock.onGet('/matches/live').reply(200, mockLiveMatches);

      const result = await api.getLiveMatches();

      expect(result).toEqual(mockLiveMatches);
    });
  });

  describe('Other Endpoints', () => {
    it('should list agent requests', async () => {
      const mockPayload = {
        data: [
          {
            id: 'req-1',
            title: 'Équipement chaussures',
            category: 'EQUIPMENT',
            status: 'CREATED',
            priority: 'MEDIUM',
            playerId: null,
            dueAt: null,
            details: 'Baskets',
            content: {
              equipment: 'Baskets',
              medicalDetails: null,
              preferredFoot: null,
            },
            createdAt: '2026-02-20T20:00:00.000Z',
            updatedAt: '2026-02-20T20:00:00.000Z',
            creator: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
            assignee: null,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mock.onGet('/agent-requests').reply(200, mockPayload);

      const result = await api.listAgentRequests();

      expect(result.meta.total).toBe(1);
      expect(result.data[0].id).toBe('req-1');
    });

    it('should create an agent request', async () => {
      const payload = {
        title: 'Nouvelle demande',
        category: 'EQUIPMENT',
      };
      const created = {
        id: 'req-2',
        title: 'Nouvelle demande',
        category: 'EQUIPMENT',
        status: 'CREATED',
        priority: 'MEDIUM',
        playerId: null,
        dueAt: null,
        details: 'Baskets légères',
        content: { equipment: 'Baskets légères', medicalDetails: null, preferredFoot: null },
        createdAt: '2026-02-20T20:01:00.000Z',
        updatedAt: '2026-02-20T20:01:00.000Z',
        creator: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
        assignee: null,
      };

      mock.onPost('/agent-requests').reply(201, created);

      const result = await api.createAgentRequest(payload as any);

      expect(result.id).toBe('req-2');
      expect(mock.history.post[0].url).toBe('/agent-requests');
      expect(JSON.parse(mock.history.post[0].data)).toMatchObject(payload);
    });

    it('should update an agent request status', async () => {
      const updated = {
        id: 'req-1',
        title: 'Équipement chaussures',
        category: 'EQUIPMENT',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        playerId: null,
        dueAt: null,
        details: 'Baskets',
        content: {
          equipment: 'Baskets',
          medicalDetails: null,
          preferredFoot: null,
        },
        createdAt: '2026-02-20T20:00:00.000Z',
        updatedAt: '2026-02-20T20:03:00.000Z',
        creator: { id: 'user-1', firstName: 'Ana', lastName: 'Test' },
        assignee: null,
      };

      mock.onPatch('/agent-requests/req-1/status').reply(200, updated);

      const result = await api.updateAgentRequestStatus('req-1', {
        status: 'IN_PROGRESS',
      });

      expect(result.status).toBe('IN_PROGRESS');
      expect(mock.history.patch[0].url).toBe('/agent-requests/req-1/status');
    });

    it('should get and update market profile rules', async () => {
      const rulesPayload = {
        rules: [
          {
            id: 'italy-forward',
            label: 'Marché italien',
            market: 'Italie',
            positions: ['ATTAQUANT'],
            minHeightCm: 185,
            preferredFoot: 'RIGHT',
            minEndurance: 78,
            isActive: true,
          },
        ],
      };

      mock.onGet('/agent-requests/market-rules').reply(200, rulesPayload);

      const rules = await api.getMarketProfileRules();
      expect(rules.rules).toHaveLength(1);

      mock.onPost('/agent-requests/market-rules').reply(200, rulesPayload);
      const updatedRules = await api.updateMarketProfileRules(rulesPayload.rules);
      expect(updatedRules.rules[0].market).toBe('Italie');
    });

    it('should get market/club requests', async () => {
      const mockRequests = {
        data: [{ id: 'req1', status: 'PENDING' }],
      };

      mock.onGet('/club-requests').reply(200, mockRequests);

      const result = await api.getMarket();

      expect(result).toEqual(mockRequests);
    });

    it('should get user profile', async () => {
      const mockProfile = {
        id: 'user1',
        email: 'user@arcane.gg',
        role: 'SCOUT',
      };

      mock.onGet('/profile').reply(200, mockProfile);

      const result = await api.getProfile();

      expect(result).toEqual(mockProfile);
    });

    it('should update profile', async () => {
      const updateData = { firstName: 'Updated' };

      mock.onPut('/profile').reply(200, { ...updateData });

      const result = await api.updateProfile(updateData);

      expect(result.firstName).toBe('Updated');
    });

    it('should get player passport (legacy helper)', async () => {
      const mockPassport = {
        playerId: 'p1',
        qrCode: 'base64...',
      };

      mock.onGet('/passport/token/token-123').reply(200, mockPassport);

      const result = await api.getPassport('token-123');

      expect(result).toEqual(mockPassport);
    });

    it('should get player passport by public token helper', async () => {
      const mockPassport = {
        playerId: 'p1',
        qrCode: 'base64...',
      };

      mock.onGet('/passport/token/token-123').reply(200, mockPassport);

      const result = await api.getPassportByToken('token-123');

      expect(result).toEqual(mockPassport);
    });

    it('should get current user passport via /passport/me', async () => {
      const mockPassport = {
        id: 'passport-123',
        playerId: 'player-123',
        status: 'VERIFIED',
      };

      mock.onGet('/passport/me').reply(200, mockPassport);

      const result = await api.getMyPassport();

      expect(result).toEqual(mockPassport);
    });

    it('should perform health check', async () => {
      mock.onGet('/health').reply(200, { status: 'ok' });

      const result = await api.healthCheck();

      expect(result.status).toBe('ok');
    });

    it('should get dashboard stats', async () => {
      const mockStats = {
        totalPlayers: 150,
        totalReports: 320,
      };

      mock.onGet('/analytics/dashboard').reply(200, mockStats);

      const result = await api.getDashboardStats();

      expect(result).toEqual(mockStats);
    });

    it('should get mobile home dashboard aggregate', async () => {
      const mockPayload = {
        scope: 'AGENT',
        cards: [],
        quickActions: [],
        pending: {
          agentRequests: 2,
          clubRequests: 4,
          reportsToReview: 1,
        },
        meta: {
          totalPlayers: 120,
          totalScouts: 14,
        },
        generatedAt: '2026-02-20T20:00:00.000Z',
      };

      mock.onGet('/dashboard/mobile-home').reply(200, mockPayload);

      const result = await api.getDashboardMobileHome({ scope: 'AGENT' });

      expect(result).toEqual(mockPayload);
      expect(mock.history.get[mock.history.get.length - 1].url).toBe('/dashboard/mobile-home');
      expect(mock.history.get[mock.history.get.length - 1].params).toEqual({ scope: 'AGENT' });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mock.onGet('/players').networkError();

      await expect(api.getPlayers()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/players').timeout();

      await expect(api.getPlayers()).rejects.toThrow();
    });

    it('should handle 404 not found', async () => {
      mock.onGet('/players/nonexistent').reply(404);

      await expect(api.getPlayer('nonexistent')).rejects.toBeDefined();
    });

    it('should handle 500 server error', async () => {
      mock.onGet('/players').reply(500);

      await expect(api.getPlayers()).rejects.toBeDefined();
    });
  });

  describe('Raw HTTP Methods', () => {
    it('should perform GET request', async () => {
      mock.onGet('/test').reply(200, { success: true });

      const result = await api.getRaw('/test');

      expect(result.success).toBe(true);
    });

    it('should perform POST request', async () => {
      const payload = { data: 'test' };
      mock.onPost('/test').reply(201, { created: true });

      const result = await api.postRaw('/test', payload);

      expect(result.created).toBe(true);
    });

    it('should perform PATCH request', async () => {
      const payload = { update: 'test' };
      mock.onPatch('/test').reply(200, { updated: true });

      const result = await api.patchRaw('/test', payload);

      expect(result.updated).toBe(true);
    });

    it('should perform PUT request', async () => {
      const payload = { replace: 'test' };
      mock.onPut('/test').reply(200, { replaced: true });

      const result = await api.putRaw('/test', payload);

      expect(result.replaced).toBe(true);
    });

    it('should perform DELETE request', async () => {
      mock.onDelete('/test').reply(204);

      await api.deleteRaw('/test');

      expect(mock.history.delete[0].url).toBe('/test');
    });
  });
});
