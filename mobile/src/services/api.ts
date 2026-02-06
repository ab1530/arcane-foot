import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants/config';
import type { AuthResponse, Player, Club, Match, PaginatedResponse } from '../types';
import type { CreateHardwareSessionPayload, HardwareSession } from '../types/hardware';
import { logBridge, logAPI, logError } from '../logging/expoLogBridge';

const generateRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;

// Quiet noisy endpoints (success logs) to avoid log spam (e.g. /auth/me health checks)
const QUIET_ENDPOINTS = ['/auth/me'];
const shouldLogSuccess = (url?: string) =>
  url ? !QUIET_ENDPOINTS.some((endpoint) => url.includes(endpoint)) : false;

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private onAuthInvalid?: () => void | Promise<void>;
  private onTokenRefreshed?: (token: string) => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT || 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and track request start
    this.client.interceptors.request.use(
      async (config) => {
        if ((config.headers as any)?.['x-skip-auth']) {
          return config;
        }
        const token =
          this.authToken || (await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Attach request ID for backend correlation
        const requestId = generateRequestId();
        config.headers['x-request-id'] = requestId;
        (config as any).requestId = requestId;

        // Add timestamp for duration tracking
        (config as any).startTime = Date.now();
        return config;
      },
      (error) => {
        logError('API request interceptor error', error as Error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.client.interceptors.response.use(
      (response) => {
        // Track successful API call
        const duration = Date.now() - ((response.config as any).startTime || Date.now());
        const endpoint = response.config.url || 'unknown';
        const method = (response.config.method || 'GET').toUpperCase();
        const requestId = (response.config as any).requestId;
        if (shouldLogSuccess(endpoint)) {
          logAPI(method, endpoint, response.status, duration, requestId);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Track failed API call
        const duration = Date.now() - ((error.config as any)?.startTime || Date.now());
        const endpoint = error.config?.url || 'unknown';
        const method = (error.config?.method || 'GET').toUpperCase();
        const status = error.response?.status || 0;
        const requestId = (error.config as any)?.requestId;

        logAPI(method, endpoint, status, duration, requestId);
        logError(`API ${method} ${endpoint} failed`, error as Error, {
          status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          requestId,
        });

        if (error.response?.status === 401 && error.config && !(error.config as any)._retry) {
          const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
          originalRequest._retry = true;

          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            logError('Token refresh failed', refreshError as Error);
          }

          await this.handleAuthFailure();
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  setAuthHandlers(handlers: { onAuthInvalid?: () => void | Promise<void>; onTokenRefreshed?: (token: string) => void }) {
    this.onAuthInvalid = handlers.onAuthInvalid;
    this.onTokenRefreshed = handlers.onTokenRefreshed;
  }

  private async handleTokenRefresh(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          {
            timeout: API_TIMEOUT || 10000,
            headers: { Authorization: '' },
          }
        );
        const newAccessToken = (data as any)?.accessToken;
        if (!newAccessToken) return null;

        this.authToken = newAccessToken;
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);
        this.onTokenRefreshed?.(newAccessToken);
        return newAccessToken;
      } catch (err) {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleAuthFailure() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
    this.authToken = null;
    logBridge.warn('Authentication token expired or invalid', 'AUTH');
    if (this.onAuthInvalid) {
      await this.onAuthInvalid();
    }
  }

  private normalizePaginated<T>(payload: any): PaginatedResponse<T> {
    if (Array.isArray(payload)) {
      return {
        data: payload,
        items: payload,
        meta: {
          total: payload.length,
          page: 1,
          limit: payload.length,
          totalPages: 1,
        },
      };
    }

    const items: T[] = payload?.items ?? payload?.data ?? [];
    const meta =
      payload?.meta ??
      {
        total: Array.isArray(items) ? items.length : 0,
        page: payload?.page ?? 1,
        limit: payload?.limit ?? (Array.isArray(items) ? items.length : 0),
        totalPages: payload?.totalPages ?? 1,
      };

    return {
      ...(payload ?? {}),
      data: items,
      items,
      meta,
    };
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  async getRaw<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...(config ?? {}), method: 'GET', url });
  }

  async postRaw<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...(config ?? {}), method: 'POST', url, data });
  }

  async patchRaw<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...(config ?? {}), method: 'PATCH', url, data });
  }

  async putRaw<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...(config ?? {}), method: 'PUT', url, data });
  }

  async deleteRaw<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...(config ?? {}), method: 'DELETE', url });
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', credentials);
    return data;
  }

  async signup(userData: any): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/signup', userData);
    return data;
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        { refreshToken },
        { timeout: API_TIMEOUT || 10000 }
      );
      const newAccessToken = (data as any)?.accessToken ?? null;
      if (newAccessToken) {
        this.authToken = newAccessToken;
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newAccessToken);
        this.onTokenRefreshed?.(newAccessToken);
      }
      return newAccessToken;
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  }

  async getCurrentUser(): Promise<any> {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async updateAuthProfile(profileData: any): Promise<any> {
    const { data } = await this.client.patch('/auth/me', profileData);
    return data;
  }

  // Scouting reports endpoints
  async getScoutingReports(params?: any): Promise<any> {
    const { data } = await this.client.get('/scouting-reports', { params });
    return data;
  }

  async getReports(params?: any): Promise<any> {
    const { data } = await this.client.get('/scouting-reports', { params });
    return data;
  }

  async getReport(id: string): Promise<any> {
    const { data } = await this.client.get(`/scouting-reports/${id}`);
    return data;
  }

  async createReport(reportData: any): Promise<any> {
    const { data } = await this.client.post('/scouting-reports', reportData);
    return data;
  }

  async updateReport(id: string, reportData: any): Promise<any> {
    const { data } = await this.client.patch(`/scouting-reports/${id}`, reportData);
    return data;
  }

  async submitReport(id: string): Promise<any> {
    const { data } = await this.client.post(`/scouting-reports/${id}/submit`);
    return data;
  }

  async reviewReport(id: string, approved: boolean): Promise<any> {
    const { data } = await this.client.post(`/scouting-reports/${id}/review`, {
      approved,
    });
    return data;
  }

  async deleteReport(id: string): Promise<any> {
    const { data } = await this.client.delete(`/scouting-reports/${id}`);
    return data;
  }

  // Aliases for hooks compatibility
  async createScoutingReport(reportData: any): Promise<any> {
    return this.createReport(reportData);
  }

  async updateScoutingReport(id: string, reportData: any): Promise<any> {
    return this.updateReport(id, reportData);
  }

  async deleteScoutingReport(id: string): Promise<any> {
    return this.deleteReport(id);
  }

  // Camps endpoints
  async getCamps(params?: any): Promise<any> {
    const { data } = await this.client.get('/camps', { params });
    return data;
  }

  async getCamp(id: string): Promise<any> {
    const { data } = await this.client.get(`/camps/${id}`);
    return data;
  }

  async getMyCamps(): Promise<any> {
    const { data } = await this.client.get('/camps/my/registrations');
    return data;
  }

  async createCamp(campData: any): Promise<any> {
    const { data } = await this.client.post('/camps', campData);
    return data;
  }

  async updateCamp(id: string, campData: any): Promise<any> {
    const { data } = await this.client.put(`/camps/${id}`, campData);
    return data;
  }

  async registerForCamp(id: string, payload: any): Promise<any> {
    const { data } = await this.client.post(`/camps/${id}/register`, payload);
    return data;
  }

  async cancelRegistration(participationId: string): Promise<any> {
    const { data } = await this.client.delete(`/camps/registrations/${participationId}`);
    return data;
  }

  // AI endpoints
  async getArkaneIndex(playerId: string): Promise<any> {
    const { data } = await this.client.get(`/ai/index/${playerId}`);
    return data;
  }

  async chatWithArkaneGPT(message: string): Promise<any> {
    const { data } = await this.client.post('/ai/summary', { prompt: message });
    return data;
  }

  async generatePlayerReport(playerId: string): Promise<any> {
    const { data } = await this.client.post('/ai/matchmaking', {
      playerIds: [playerId],
    });
    return data;
  }

  async aiMatchmaking(payload: { playerIds?: string[]; clubIds?: string[]; tags?: string[] }): Promise<any> {
    const { data } = await this.client.post('/ai/matchmaking', payload);
    return data;
  }

  // ArkaneMatch endpoints - Conversational AI scout search
  async arkaneMatchChat(message: string, conversationId?: string): Promise<any> {
    const { data } = await this.client.post('/arkane-match/chat', {
      message,
      conversationId,
    });
    return data;
  }

  async getArkaneMatchConversation(conversationId: string): Promise<any> {
    const { data } = await this.client.get(`/arkane-match/conversations/${conversationId}`);
    return data;
  }

  async clearArkaneMatchConversation(conversationId: string): Promise<any> {
    const { data } = await this.client.delete(`/arkane-match/conversations/${conversationId}`);
    return data;
  }

  async getArkaneMatchInfo(): Promise<any> {
    const { data } = await this.client.get('/arkane-match/info');
    return data;
  }

  // AI Usage Stats
  async getAIUsageStats(): Promise<any> {
    try {
      const { data } = await this.client.get('/ai/usage-stats');
      return data;
    } catch (error) {
      // Fallback to empty stats if endpoint doesn't exist yet
      logError('Failed to fetch AI usage stats', error as Error);
      return { totalQueries: 0, reportsAnalyzed: 0 };
    }
  }

  // Analytics endpoints
  async getAnalyticsOverview(): Promise<any> {
    const { data } = await this.client.get('/analytics/overview');
    return data;
  }

  async getPlayersAnalytics(): Promise<any> {
    const { data } = await this.client.get('/analytics/players');
    return data;
  }

  async getClubsAnalytics(): Promise<any> {
    const { data } = await this.client.get('/analytics/clubs');
    return data;
  }

  async getScoutingReportsAnalytics(): Promise<any> {
    const { data } = await this.client.get('/analytics/scouting-reports');
    return data;
  }

  async getActivityTrends(days: number = 30): Promise<any> {
    const { data } = await this.client.get('/analytics/activity-trends', {
      params: { days },
    });
    return data;
  }

  // Market endpoints
  async getMarket(params?: any): Promise<any> {
    const { data } = await this.client.get('/club-requests', { params });
    return data;
  }

  async getMarketRequest(id: string): Promise<any> {
    const { data } = await this.client.get(`/club-requests/${id}`);
    return data;
  }

  // Profile endpoints
  async getProfile(): Promise<any> {
    const { data } = await this.client.get('/profile');
    return data;
  }

  async updateProfile(profileData: any): Promise<any> {
    const { data } = await this.client.put('/profile', profileData);
    return data;
  }

  // Passport endpoints
  async getPassport(token: string): Promise<any> {
    const { data } = await this.client.get(`/passport/token/${token}`);
    return data;
  }

  async getPassportByToken(token: string): Promise<any> {
    const { data } = await this.client.get(`/passport/token/${token}`);
    return data;
  }

  async createPassport(passportData: { playerId: string; additionalData?: any }): Promise<any> {
    const { data } = await this.client.post('/passport', passportData);
    return data;
  }

  async getPassportByPlayer(playerId: string): Promise<any> {
    const { data } = await this.client.get(`/passport/player/${playerId}`);
    return data;
  }

  async getMyPassport(): Promise<any> {
    const { data } = await this.client.get('/passport/me');
    return data;
  }

  async verifyPassport(playerId: string, verificationData: { verified: boolean; verificationStatus: string; adminNotes?: string }): Promise<any> {
    const { data } = await this.client.put(`/passport/player/${playerId}/verify`, verificationData);
    return data;
  }

  async deletePassport(playerId: string): Promise<any> {
    const { data } = await this.client.delete(`/passport/player/${playerId}`);
    return data;
  }

  // Dashboard stats
  // Dashboard / analytics (mock-friendly)
  async getDashboardStats(): Promise<any> {
    const { data } = await this.client.get('/analytics/overview');
    return data;
  }

  // Player endpoints
  async getPlayers(params?: {
    position?: string;
    status?: string;
    nationality?: string;
    clubId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Player>> {
    const data = await this.getRaw<PaginatedResponse<Player>>('/players', { params });
    return this.normalizePaginated<Player>(data);
  }

  async getRecentPlayerViews(limit: number = 12): Promise<any[]> {
    const { data } = await this.client.get('/players/views/recent', { params: { limit } });
    return data;
  }

  async recordPlayerView(playerId: string, payload?: { source?: string }): Promise<{ viewedAt: string }> {
    const { data } = await this.client.post(`/players/${playerId}/view`, payload ?? {});
    return data;
  }

  async getPlayer(id: string): Promise<Player> {
    return this.getRaw<Player>(`/players/${id}`);
  }

  async getPlayerStats(id: string): Promise<any> {
    const { data } = await this.client.get(`/players/${id}/stats`);
    return data;
  }

  async createPlayer(playerData: any): Promise<any> {
    const { data } = await this.client.post('/players', playerData);
    return data;
  }

  async importScoutPlayers(payload: {
    rawText: string;
    dryRun?: boolean;
    defaultNationality?: string;
  }): Promise<{
    created: number;
    updated: number;
    failed: number;
    rows: Array<{
      line: number;
      raw: string;
      action: 'CREATED' | 'UPDATED' | 'FAILED';
      playerId?: string;
      reason?: string;
    }>;
  }> {
    const { data } = await this.client.post('/players/scout-import', payload);
    return data;
  }

  async updatePlayer(id: string, playerData: any): Promise<any> {
    const { data } = await this.client.patch(`/players/${id}`, playerData);
    return data;
  }

  async deletePlayer(id: string): Promise<any> {
    const { data } = await this.client.delete(`/players/${id}`);
    return data;
  }

  // Club endpoints
  async getClubs(params?: {
    country?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Club>> {
    const data = await this.getRaw<PaginatedResponse<Club>>('/clubs', { params });
    return this.normalizePaginated<Club>(data);
  }

  async getClub(id: string): Promise<Club> {
    return this.getRaw<Club>(`/clubs/${id}`);
  }

  // Match endpoints
  async getMatches(params?: {
    status?: string;
    clubId?: string;
    scoutId?: string;
    competition?: string;
    season?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Match>> {
    const data = await this.getRaw<PaginatedResponse<Match>>('/matches', { params });
    return this.normalizePaginated<Match>(data);
  }

  async getMatch(id: string): Promise<Match> {
    return this.getRaw<Match>(`/matches/${id}`);
  }

  async getUpcomingMatches(limit?: number): Promise<Match[]> {
    const data = await this.getRaw<Match[]>('/matches/upcoming', {
      params: { limit },
    });
    return data;
  }

  async getLiveMatches(): Promise<Match[]> {
    return this.getRaw<Match[]>('/matches/live');
  }

  async createMatch(matchData: any): Promise<any> {
    const { data } = await this.client.post('/matches', matchData);
    return data;
  }

  async updateMatch(id: string, matchData: any): Promise<any> {
    const { data } = await this.client.put(`/matches/${id}`, matchData);
    return data;
  }

  async deleteMatch(id: string): Promise<any> {
    const { data } = await this.client.delete(`/matches/${id}`);
    return data;
  }

  async assignScoutToMatch(matchId: string, scoutId: string): Promise<any> {
    const { data } = await this.client.patch(`/matches/${matchId}/assign-scout`, { scoutId });
    return data;
  }

  async updateMatchScore(matchId: string, homeScore: number, awayScore: number): Promise<any> {
    const { data } = await this.client.patch(`/matches/${matchId}/score`, { homeScore, awayScore });
    return data;
  }

  // Users/Scouts endpoints
  async getUsers(params?: { role?: string; page?: number; limit?: number }): Promise<any> {
    const { data } = await this.client.get('/users', { params });
    return data;
  }

  // Subscription pricing
  async getSubscriptionPricing(): Promise<any> {
    const { data } = await this.client.get('/subscriptions/pricing');
    return data;
  }

  // Subscription endpoints
  async getMySubscription(): Promise<any> {
    const { data } = await this.client.get('/subscriptions/me');
    return data;
  }

  async createOrUpdateSubscription(tier: string, billingPeriod: string, stripePaymentMethodId?: string): Promise<any> {
    const { data } = await this.client.post('/subscriptions', {
      tier,
      billingPeriod,
      stripePaymentMethodId,
    });
    return data;
  }

  async cancelSubscription(reason?: string): Promise<any> {
    const { data } = await this.client.put('/subscriptions/cancel', { reason });
    return data;
  }

  async reactivateSubscription(): Promise<any> {
    const { data } = await this.client.put('/subscriptions/reactivate');
    return data;
  }

  async changeTier(tier: string, billingPeriod: string): Promise<any> {
    const { data } = await this.client.put('/subscriptions/change-tier', { tier, billingPeriod });
    return data;
  }

  // Contact endpoint
  async sendContactMessage(contactData: {
    name: string;
    email: string;
    phone?: string;
    type: string;
    message: string;
  }): Promise<any> {
    const { data } = await this.client.post('/contact', contactData);
    return data;
  }

  // Notifications endpoints
  async getNotifications(userId?: string): Promise<any> {
    try {
      // If no userId provided, try to get current user first
      if (!userId) {
        try {
          const user = await this.getCurrentUser();
          userId = user?.id;
        } catch (e) {
          // If getting user fails, return empty array
          logError('Failed to get current user for notifications', e as Error);
          return [];
        }
      }

      // Only proceed if we have a valid userId
      if (!userId) {
        logBridge.warn('No userId available for fetching notifications', 'API');
        return [];
      }

      const endpoint = `/notifications/user/${userId}`;
      const { data } = await this.client.get(endpoint);
      return data;
    } catch (error) {
      // Return empty array on error instead of throwing
      logError('Error fetching notifications', error as Error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const { data } = await this.client.patch(`/notifications/${notificationId}/read`);
    return data;
  }

  async deleteNotification(notificationId: string): Promise<any> {
    const { data } = await this.client.delete(`/notifications/${notificationId}`);
    return data;
  }

  // FCM Push Notification endpoints
  async registerDevice(payload: {
    fcmToken: string;
    platform: 'ios' | 'android';
    deviceInfo?: any;
    userId?: string;
  }): Promise<any> {
    const { data } = await this.client.post('/notifications/register-device', payload);
    return data;
  }

  async unregisterDevice(payload: { fcmToken: string; userId?: string }): Promise<any> {
    const { data } = await this.client.post('/notifications/unregister-device', payload);
    return data;
  }

  async sendNotification(payload: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    data?: any;
  }): Promise<any> {
    const { data } = await this.client.post('/notifications/send', payload);
    return data;
  }

  async sendMultipleNotifications(payload: {
    userIds: string[];
    title: string;
    body: string;
    type?: string;
    data?: any;
  }): Promise<any> {
    const { data } = await this.client.post('/notifications/send-multiple', payload);
    return data;
  }

  async sendTopicNotification(payload: {
    topic: string;
    title: string;
    body: string;
    data?: any;
  }): Promise<any> {
    const { data } = await this.client.post('/notifications/send-topic', payload);
    return data;
  }

  async subscribeToTopic(payload: { topic: string; userIds?: string[] }): Promise<any> {
    const { data } = await this.client.post('/notifications/subscribe-topic', payload);
    return data;
  }

  async unsubscribeFromTopic(payload: { topic: string; userIds?: string[] }): Promise<any> {
    const { data } = await this.client.post('/notifications/unsubscribe-topic', payload);
    return data;
  }

  async scheduleMatchReminder(matchId: string): Promise<any> {
    const { data } = await this.client.post(`/notifications/match/${matchId}/reminder`);
    return data;
  }

  async sendReportNotification(reportId: string): Promise<any> {
    const { data } = await this.client.post(`/notifications/report/${reportId}/notify`);
    return data;
  }

  // Hardware / GPS endpoints
  async getHardwareSessions(playerId: string): Promise<HardwareSession[]> {
    const { data } = await this.client.get(`/hardware/sessions/player/${playerId}`);
    return data;
  }

  async getHardwareSession(sessionId: string): Promise<HardwareSession> {
    const { data } = await this.client.get(`/hardware/sessions/${sessionId}`);
    return data;
  }

  async createHardwareSession(payload: CreateHardwareSessionPayload): Promise<HardwareSession> {
    const { data } = await this.client.post('/hardware/sessions', payload);
    return data;
  }

  async deleteHardwareSession(sessionId: string): Promise<void> {
    await this.client.delete(`/hardware/sessions/${sessionId}`);
  }

  // Kanban endpoints (extended)
  async getBoards(): Promise<any> {
    const { data } = await this.client.get('/kanban/boards');
    return data;
  }

  async getBoard(id: string): Promise<any> {
    const { data } = await this.client.get(`/kanban/boards/${id}`);
    return data;
  }

  async createBoard(boardData: { name: string; description?: string; isPublic?: boolean }): Promise<any> {
    const { data } = await this.client.post('/kanban/boards', boardData);
    return data;
  }

  async updateBoard(id: string, boardData: Partial<{ name: string; description?: string }>): Promise<any> {
    const { data } = await this.client.patch(`/kanban/boards/${id}`, boardData);
    return data;
  }

  async deleteBoard(id: string): Promise<any> {
    const { data } = await this.client.delete(`/kanban/boards/${id}`);
    return data;
  }

  async createColumn(boardId: string, columnData: { name: string; type?: string; color?: string; position?: number }): Promise<any> {
    const { data } = await this.client.post(`/kanban/boards/${boardId}/columns`, columnData);
    return data;
  }

  async updateColumn(id: string, columnData: Partial<{ name: string; color?: string; position?: number }>): Promise<any> {
    const { data } = await this.client.patch(`/kanban/columns/${id}`, columnData);
    return data;
  }

  async deleteColumn(id: string): Promise<any> {
    const { data } = await this.client.delete(`/kanban/columns/${id}`);
    return data;
  }

  async createCard(cardData: {
    columnId: string;
    playerId: string;
    position?: number;
    notes?: string;
    priority?: string;
    tags?: string[];
    dueDate?: string;
  }): Promise<any> {
    const { data } = await this.client.post('/kanban/cards', cardData);
    return data;
  }

  async getCard(id: string): Promise<any> {
    const { data } = await this.client.get(`/kanban/cards/${id}`);
    return data;
  }

  async updateCard(id: string, cardData: Partial<{
    notes?: string;
    priority?: string;
    tags?: string[];
    dueDate?: string;
  }>): Promise<any> {
    const { data } = await this.client.patch(`/kanban/cards/${id}`, cardData);
    return data;
  }

  async moveCard(id: string, moveData: { targetColumnId: string; position?: number }): Promise<any> {
    const { data } = await this.client.post(`/kanban/cards/${id}/move`, moveData);
    return data;
  }

  async deleteCard(id: string): Promise<any> {
    const { data } = await this.client.delete(`/kanban/cards/${id}`);
    return data;
  }

  async getCardActivities(id: string): Promise<any> {
    const { data } = await this.client.get(`/kanban/cards/${id}/activities`);
    return data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const { data } = await this.client.get('/health');
    return data;
  }
}

export const api = new ApiClient();
export default api;
