import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { STORAGE_KEYS } from '../../constants/config';

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

      mock.onGet('/analytics/overview').reply(200, mockStats);

      const result = await api.getDashboardStats();

      expect(result).toEqual(mockStats);
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
