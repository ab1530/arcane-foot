import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_TIMEOUT, STORAGE_KEYS } from '../constants/config';
import type {
  AuthResponse,
  Player,
  Club,
  Match,
  PaginatedResponse,
  PlayerSpacePayload,
  PlayerSpaceSubmitPayload,
  AgentRequestListResponse,
  AgentRequestItem,
  AgentRequestCreatePayload,
  AgentRequestUpdateStatusPayload,
  AgentRequestMarketProfileRulesResponse,
  AgentRequestMarketProfileRule,
  MobileHomeDashboardResponse,
  DashboardScoutDirectoryResponse,
  NewsFeedItem,
  NewsFeedResponse,
} from '../types';
import type { CreateHardwareSessionPayload, HardwareSession } from '../types/hardware';
import type {
  PlayerProfileAuditTrail,
  PlayerProfileView,
  ProfileContentStatus,
} from '../types/player-profile';
import type {
  CreateTransferRequestInput,
  CreateTransferSuggestionInput,
  TransferMarketCountryItem,
  TransferMarketFilters,
  TransferMarketLeagueItem,
  TransferRequest,
  TransferRequestActivity,
  TransferSuggestion,
  TransferSuggestionStatus,
  UpdateTransferRequestInput,
} from '../types/transfer-market';
import { logBridge, logAPI, logError } from '../logging/expoLogBridge';

const generateRequestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;

// Quiet noisy endpoints (success logs) to avoid log spam (e.g. /auth/me health checks)
const QUIET_ENDPOINTS = ['/auth/me'];
const shouldLogSuccess = (url?: string) =>
  url ? !QUIET_ENDPOINTS.some((endpoint) => url.includes(endpoint)) : false;

export const extractPayloadItems = <T = any>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.results)) return payload.results as T[];
  return [];
};

export const pickDateValue = (
  payload: Record<string, any> | null | undefined,
  keys: string[] = ['scheduledAt', 'startDate', 'date', 'createdAt'],
): string | null => {
  if (!payload) return null;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

export interface ScoutCalendarMissionItem {
  assignmentId: string;
  matchId: string;
  missionType: 'PRIORITY' | 'VOLUNTARY';
  status: string;
  mobileStatus: 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED';
  reportSubmitted: boolean;
  country?: string | null;
  league?: string | null;
  match: any;
  scout?: any;
  assignedBy?: any;
}

export interface ScoutCalendarDiscoverItem {
  matchId: string;
  country?: string | null;
  league?: string | null;
  match: any;
  sharedScouts?: Array<{
    id?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }>;
}

export interface ScoutCalendarResponse {
  filters: {
    countries: string[];
    leagues: string[];
  };
  myCalendar: ScoutCalendarMissionItem[];
  sharedCalendar: ScoutCalendarMissionItem[];
  discover: ScoutCalendarDiscoverItem[];
  meta: {
    totalMy: number;
    totalShared: number;
    totalDiscover: number;
  };
}

export interface MatchMissionRequest {
  id: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  missionType: 'PRIORITY' | 'VOLUNTARY';
  note?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string | null;
  matchId: string;
  match?: any;
  requestedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  targetScout?: {
    id: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  } | null;
  decidedById?: string | null;
}

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private onAuthInvalid?: () => void | Promise<void>;
  private onTokenRefreshed?: (token: string) => void;
  private readonly playerCacheTtlMs = 60000;
  private playerCache = new Map<string, { data: Player; expiresAt: number }>();
  private inFlightPlayerRequests = new Map<string, Promise<Player>>();

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

  private getCachedPlayer(id: string): Player | null {
    const cached = this.playerCache.get(id);
    if (!cached) return null;
    if (cached.expiresAt <= Date.now()) {
      this.playerCache.delete(id);
      return null;
    }
    return cached.data;
  }

  private setCachedPlayer(id: string, data: Player) {
    this.playerCache.set(id, {
      data,
      expiresAt: Date.now() + this.playerCacheTtlMs,
    });
  }

  private invalidateCachedPlayer(id?: string | null) {
    if (!id) return;
    this.playerCache.delete(id);
    this.inFlightPlayerRequests.delete(id);
  }

  // ============================================================================
  // MEDIA (Highlights Videos)
  // ============================================================================

  async getPlayerMedia(playerId: string): Promise<any[]> {
    const { data } = await this.client.get(`/media/player/${playerId}`);
    return data;
  }

  async uploadPlayerHighlightVideo(params: {
    playerId: string;
    uri: string;
    mimeType?: string;
    name?: string;
  }): Promise<any> {
    const formData = new FormData();

    // @ts-ignore React Native FormData file shape
    formData.append('file', {
      uri: params.uri,
      type: params.mimeType ?? 'video/mp4',
      name: params.name ?? `highlight-${Date.now()}.mp4`,
    });

    formData.append('type', 'VIDEO');
    formData.append('playerId', params.playerId);

    const { data } = await this.client.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  }

  async deleteMedia(mediaId: string): Promise<any> {
    const { data } = await this.client.delete(`/media/${mediaId}`);
    return data;
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

  private parseNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private parseBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }
    return fallback;
  }

  private toSafeString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value.trim();
    return fallback;
  }

  private async resolveCurrentPlayerId(): Promise<string | null> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser?.playerId ?? null;
    } catch {
      return null;
    }
  }

  private mapMatchesToPlayerSpaceCalendar(
    matches: Match[],
    player: Player,
  ): PlayerSpacePayload['upcomingCalendar'] {
    if (!Array.isArray(matches) || matches.length === 0) {
      return [];
    }

    const playerClubId = this.toSafeString(
      (player.club as any)?.id ?? (player as any)?.clubId ?? '',
    );

    const mapped = matches
      .map((match: any) => {
        const homeClub = match?.homeClub ?? match?.clubs_matches_homeClubIdToclubs ?? null;
        const awayClub = match?.awayClub ?? match?.clubs_matches_awayClubIdToclubs ?? null;
        const homeClubId = this.toSafeString(match?.homeClubId ?? homeClub?.id ?? '');
        const awayClubId = this.toSafeString(match?.awayClubId ?? awayClub?.id ?? '');
        const isPlayerClubMatch =
          !!playerClubId && (homeClubId === playerClubId || awayClubId === playerClubId);
        const isHome = isPlayerClubMatch ? homeClubId === playerClubId : false;
        const homeName = this.toSafeString(homeClub?.name, 'Club domicile');
        const awayName = this.toSafeString(awayClub?.name, 'Club extérieur');
        const opponent = isPlayerClubMatch
          ? this.toSafeString(isHome ? awayClub?.name : homeClub?.name, '—')
          : `${homeName} vs ${awayName}`;
        const competitionRaw = match?.competition;
        const competition =
          typeof competitionRaw === 'string'
            ? competitionRaw
            : this.toSafeString(competitionRaw?.name, this.toSafeString(match?.competitionOld, '—'));
        const scheduledAt = pickDateValue(match, ['scheduledAt', 'startDate', 'date', 'createdAt']) || '';
        if (!this.toSafeString(match?.id, '') || !scheduledAt) {
          return null;
        }
        return {
          id: String(match.id),
          scheduledAt,
          opponent,
          opponentLogo: isPlayerClubMatch
            ? this.toSafeString((isHome ? awayClub?.logo : homeClub?.logo) ?? '', null)
            : null,
          isHome,
          status: this.toSafeString(match?.status, ''),
          competition,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((left, right) => {
        const leftTime = new Date(left.scheduledAt).getTime();
        const rightTime = new Date(right.scheduledAt).getTime();
        if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
        if (Number.isNaN(leftTime)) return 1;
        if (Number.isNaN(rightTime)) return -1;
        return leftTime - rightTime;
      });

    return mapped.slice(0, 10);
  }

  public buildPlayerSpacePayloadFromPlayer(
    player: Player,
    options?: {
      upcomingCalendar?: PlayerSpacePayload['upcomingCalendar'];
    },
  ): PlayerSpacePayload {
    const rawStats = player.statsJson as Record<string, any>;
    const safeStats = rawStats && typeof rawStats === 'object' ? rawStats : {};
    const firstName = this.toSafeString(player.firstName);
    const lastName = this.toSafeString(player.lastName);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Joueur';
    const clubName = this.toSafeString((player.club as any)?.name);
    const isInjured = this.parseBoolean(safeStats.isInjured, false);

    return {
      playerId: player.id,
      player: {
        id: player.id,
        firstName: firstName || null,
        lastName: lastName || null,
        fullName,
        position: this.toSafeString(player.position) || '—',
        nationality: this.toSafeString(player.nationality) || '—',
        clubId: this.toSafeString((player.club as any)?.id, null),
        clubName: clubName || null,
        photoUrl: this.toSafeString((player as any).photoUrl, null),
      },
      snapshot: {
        matchesPlayed: this.parseNumber((safeStats as any).matchesPlayed, 0),
        matchesNotPlayed: this.parseNumber((safeStats as any).matchesNotPlayed, 0),
        goals: this.parseNumber((safeStats as any).goals, 0),
        assists: this.parseNumber((safeStats as any).assists, 0),
        minutesPlayed: this.parseNumber((safeStats as any).minutesPlayed, 0),
        isInjured,
        injuryStatus: safeStats.injuryStatus ? String(safeStats.injuryStatus) : null,
      },
      performanceTrend: [],
      upcomingCalendar: options?.upcomingCalendar ?? [],
      health: {
        status: isInjured ? 'Blessé' : 'Disponible',
        lastDeviceSync: this.toSafeString((safeStats as any).lastWeeklyUpdateAt, null),
        syncSource: this.toSafeString((player as any).syncSource, null),
      },
      weekly: {
        latest: null,
        totalUpdates: 0,
      },
      news: [],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compatibility helper for older API versions that do not expose dedicated player-space routes.
   */
  public async getPlayerSpaceFromProfile(playerId: string): Promise<PlayerSpacePayload> {
    const player = await this.getPlayer(playerId);
    const nowIso = new Date().toISOString();
    let fallbackMatches: Match[] = [];

    try {
      const upcoming = await this.getMatches({
        from: nowIso,
        status: 'SCHEDULED',
        limit: 50,
      });
      fallbackMatches = extractPayloadItems<Match>(upcoming);

      if (fallbackMatches.length === 0) {
        const live = await this.getMatches({
          from: nowIso,
          status: 'LIVE',
          limit: 20,
        });
        fallbackMatches = extractPayloadItems<Match>(live);
      }

      if (fallbackMatches.length === 0) {
        const recent = await this.getMatches({
          limit: 50,
          page: 1,
        });
        fallbackMatches = extractPayloadItems<Match>(recent);
      }
    } catch {
      fallbackMatches = [];
    }

    return this.buildPlayerSpacePayloadFromPlayer(player, {
      upcomingCalendar: this.mapMatchesToPlayerSpaceCalendar(fallbackMatches, player),
    });
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

  async bulkSubmitScoutingReports(payload: {
    matchId: string;
    playerIds: string[];
    assignmentId?: string;
    template?: Record<string, any>;
    voice?: {
      transcription?: string;
      confidence?: number;
      audioUrl?: string;
      warnings?: string[];
    };
  }): Promise<any> {
    const { data } = await this.client.post('/scouting-reports/bulk-submit', payload);
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

  // Transfer Market V1 (requests-first)
  async listTransferMarketCountries(): Promise<{ data: TransferMarketCountryItem[] }> {
    return this.getRaw('/transfer-market/countries');
  }

  async listTransferMarketLeagues(country?: string): Promise<{ data: TransferMarketLeagueItem[] }> {
    return this.getRaw('/transfer-market/leagues', {
      params: country ? { country } : undefined,
    });
  }

  async listTransferMarketRequests(
    filters?: TransferMarketFilters,
  ): Promise<{ data: TransferRequest[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    return this.getRaw('/transfer-market/requests', {
      params: {
        ...(filters ?? {}),
        createdByMe:
          filters?.createdByMe === undefined
            ? undefined
            : filters.createdByMe
            ? 'true'
            : 'false',
      },
    });
  }

  async createTransferMarketRequest(payload: CreateTransferRequestInput): Promise<TransferRequest> {
    return this.postRaw('/transfer-market/requests', payload);
  }

  async getTransferMarketRequest(id: string): Promise<TransferRequest> {
    return this.getRaw(`/transfer-market/requests/${id}`);
  }

  async updateTransferMarketRequest(id: string, payload: UpdateTransferRequestInput): Promise<TransferRequest> {
    return this.patchRaw(`/transfer-market/requests/${id}`, payload);
  }

  async createTransferMarketSuggestion(
    requestId: string,
    payload: CreateTransferSuggestionInput,
  ): Promise<TransferSuggestion> {
    return this.postRaw(`/transfer-market/requests/${requestId}/suggestions`, payload);
  }

  async listTransferMarketSuggestions(
    requestId: string,
  ): Promise<{ data: TransferSuggestion[]; meta: { total: number } }> {
    return this.getRaw(`/transfer-market/requests/${requestId}/suggestions`);
  }

  async updateTransferMarketSuggestionStatus(
    suggestionId: string,
    status: TransferSuggestionStatus,
  ): Promise<TransferSuggestion> {
    return this.patchRaw(`/transfer-market/suggestions/${suggestionId}`, { status });
  }

  async listTransferMarketActivity(
    requestId: string,
  ): Promise<{ data: TransferRequestActivity[]; meta: { total: number } }> {
    return this.getRaw(`/transfer-market/requests/${requestId}/activity`);
  }

  async createTransferMarketShortlist(
    requestId: string,
    payload?: { playerIds?: string[] },
  ): Promise<{ id: string; token: string; shareUrl: string; requestId: string; playersCount: number }> {
    return this.postRaw(`/transfer-market/requests/${requestId}/shortlist`, payload ?? {});
  }

  async exportTransferMarketShortlistCsv(requestId: string): Promise<string> {
    const { data } = await this.client.get(`/transfer-market/requests/${requestId}/shortlist.csv`, {
      responseType: 'text',
      transformResponse: [(value) => value],
    });
    return typeof data === 'string' ? data : String(data ?? '');
  }

  // Agent requests / demandes à l'agent
  async listAgentRequests(params?: {
    status?: string;
    category?: string;
    creatorRole?: string;
    page?: number;
    limit?: number;
    myOnly?: boolean;
  }): Promise<AgentRequestListResponse> {
    const { data } = await this.client.get<AgentRequestListResponse>('/agent-requests', { params });
    return this.normalizePaginated<AgentRequestItem>(data);
  }

  async createAgentRequest(payload: AgentRequestCreatePayload): Promise<AgentRequestItem> {
    const { data } = await this.client.post<AgentRequestItem>('/agent-requests', payload);
    return data;
  }

  async getAgentRequest(id: string): Promise<AgentRequestItem> {
    const { data } = await this.client.get<AgentRequestItem>(`/agent-requests/${id}`);
    return data;
  }

  async updateAgentRequestStatus(
    id: string,
    payload: AgentRequestUpdateStatusPayload,
  ): Promise<AgentRequestItem> {
    const { data } = await this.client.patch<AgentRequestItem>(`/agent-requests/${id}/status`, payload);
    return data;
  }

  async getMarketProfileRules(): Promise<AgentRequestMarketProfileRulesResponse> {
    const { data } = await this.client.get<AgentRequestMarketProfileRulesResponse>('/agent-requests/market-rules');
    return data;
  }

  async updateMarketProfileRules(
    rules: AgentRequestMarketProfileRule[],
  ): Promise<AgentRequestMarketProfileRulesResponse> {
    const { data } = await this.client.post<AgentRequestMarketProfileRulesResponse>(
      '/agent-requests/market-rules',
      rules,
    );
    return data;
  }

  // Club Needs (Admin-only)
  async createClubNeedRequest(rawText: string, topN: number = 5): Promise<any> {
    const { data } = await this.client.post('/club-needs', { rawText, topN });
    return data;
  }

  async listClubNeedRequests(
    pageOrParams:
      | number
      | {
          page?: number;
          limit?: number;
          month?: string;
          league?: 'LIGUE_1' | 'BUNDESLIGA' | 'SERIE_A' | 'LALIGA';
          status?: 'ACTIVE' | 'PARTIAL' | 'COMPLETED';
        } = 1,
    limit: number = 20,
    month?: string,
  ): Promise<any> {
    const params =
      typeof pageOrParams === 'number'
        ? { page: pageOrParams, limit, month }
        : {
            page: pageOrParams.page ?? 1,
            limit: pageOrParams.limit ?? 20,
            month: pageOrParams.month,
            league: pageOrParams.league,
            status: pageOrParams.status,
          };
    try {
      const { data } = await this.client.get('/club-needs/requests', {
        params,
      });
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
      const { data } = await this.client.get('/club-needs', {
        params,
      });
      return data;
    }
  }

  async getClubNeedRequest(id: string, topN: number = 5): Promise<any> {
    const { data } = await this.client.get(`/club-needs/${id}`, { params: { topN } });
    return data;
  }

  async updateClubNeedLineStatus(
    requestId: string,
    lineNumber: number,
    isCompleted: boolean,
  ): Promise<any> {
    const { data } = await this.client.patch(
      `/club-needs/${requestId}/lines/${lineNumber}/status`,
      { isCompleted },
    );
    return data;
  }

  // Passport share sets (Admin-only create, public read on web)
  async createPassportShareSet(payload: {
    playerIds: string[];
    title?: string;
    clubName?: string;
    sourceFeature?: 'CLUB_NEEDS' | 'TRANSFER_MARKET_REQUEST';
    sourceRequestId?: string;
    sourceRequestLineNumber?: number;
  }): Promise<any> {
    const { data } = await this.client.post('/passport-shares', payload);
    return data;
  }

  async listPassportShareSets(params?: {
    sourceRequestId?: string;
    sourceRequestLineNumber?: number;
    includeRevoked?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { data } = await this.client.get('/passport-shares', { params });
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
    const { data } = await this.client.get('/analytics/dashboard');
    return data;
  }

  async getDashboardMobileHome(params?: {
    scope?: 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'SCOUT';
  }): Promise<MobileHomeDashboardResponse> {
    const { data } = await this.client.get<MobileHomeDashboardResponse>('/dashboard/mobile-home', {
      params,
    });
    return data;
  }

  async getDashboardScouts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<DashboardScoutDirectoryResponse> {
    const { data } = await this.client.get<DashboardScoutDirectoryResponse>('/dashboard/scouts', {
      params,
    });
    return this.normalizePaginated(data);
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

  async getPlayer(id: string, options?: { forceRefresh?: boolean }): Promise<Player> {
    const playerId = String(id ?? '').trim();
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    if (!options?.forceRefresh) {
      const cached = this.getCachedPlayer(playerId);
      if (cached) {
        return cached;
      }

      const pending = this.inFlightPlayerRequests.get(playerId);
      if (pending) {
        return pending;
      }
    } else {
      this.invalidateCachedPlayer(playerId);
    }

    const request = this.getRaw<Player>(`/players/${playerId}`)
      .then((player) => {
        this.setCachedPlayer(playerId, player);
        return player;
      })
      .finally(() => {
        this.inFlightPlayerRequests.delete(playerId);
      });

    this.inFlightPlayerRequests.set(playerId, request);
    return request;
  }

  async getPlayerStats(id: string): Promise<any> {
    const { data } = await this.client.get(`/players/${id}/stats`);
    return data;
  }

  async getPlayerProfileView(
    playerId: string,
    params?: { includeUnpublished?: boolean },
  ): Promise<PlayerProfileView> {
    return this.getRaw<PlayerProfileView>(`/player-profiles/${playerId}`, {
      params,
    });
  }

  async getPlayerProfileAudit(playerId: string): Promise<PlayerProfileAuditTrail> {
    return this.getRaw<PlayerProfileAuditTrail>(`/player-profiles/${playerId}/audit`);
  }

  async getMyPlayerSpace(playerIdHint?: string | null): Promise<PlayerSpacePayload> {
    const endpoints = [
      '/players/me/space',
      '/players/space/me',
      '/players/me/dashboard',
      '/players/dashboard/me',
    ];
    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        const { data } = await this.client.get<PlayerSpacePayload>(endpoint);
        return data;
      } catch (error) {
        lastError = error;
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }
      }
    }

    let playerId = playerIdHint ?? null;
    if (!playerId) {
      playerId = await this.resolveCurrentPlayerId();
    } else {
      const resolvedPlayerId = await this.resolveCurrentPlayerId();
      if (resolvedPlayerId && resolvedPlayerId !== playerId) {
        playerId = resolvedPlayerId;
      }
    }

    if (!playerId) {
      throw lastError;
    }

    return this.getPlayerSpaceFromProfile(playerId);
  }

  async submitMyPlayerWeeklyUpdate(
    payload: PlayerSpaceSubmitPayload,
  ): Promise<PlayerSpacePayload> {
    const endpoints = [
      '/players/me/space/weekly-update',
      '/players/space/me/weekly-update',
      '/players/me/dashboard/weekly-update',
      '/players/dashboard/me/weekly-update',
    ];

    for (const endpoint of endpoints) {
      try {
        const { data } = await this.client.post<PlayerSpacePayload>(endpoint, payload);
        return data;
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }
      }
    }

    throw new Error(
      "La route de mise à jour hebdomadaire n'est pas encore disponible sur le serveur.",
    );
  }

  async updatePlayerProfileMeta(playerId: string, payload: {
    mainPosition?: string;
    otherPositions?: string[];
    agentName?: string;
    pronunciation?: string;
    outfitter?: string;
    socialLinks?: Record<string, string | null>;
    externalMarketUrl?: string | null;
  }): Promise<any> {
    const { data } = await this.client.patch(`/player-profiles/${playerId}/meta`, payload);
    return data;
  }

  async createPlayerProfileSectionItem(
    playerId: string,
    section: 'performance-rows' | 'transfers' | 'career' | 'achievements' | 'national-team' | 'news' | 'rumours',
    payload: Record<string, any>,
  ): Promise<any> {
    const { data } = await this.client.post(`/player-profiles/${playerId}/${section}`, payload);
    return data;
  }

  async updatePlayerProfileSectionItem(
    playerId: string,
    section: 'performance-rows' | 'transfers' | 'career' | 'achievements' | 'national-team' | 'news' | 'rumours',
    itemId: string,
    payload: Record<string, any>,
  ): Promise<any> {
    const { data } = await this.client.patch(
      `/player-profiles/${playerId}/${section}/${itemId}`,
      payload,
    );
    return data;
  }

  async deletePlayerProfileSectionItem(
    playerId: string,
    section: 'performance-rows' | 'transfers' | 'career' | 'achievements' | 'national-team' | 'news' | 'rumours',
    itemId: string,
  ): Promise<any> {
    const { data } = await this.client.delete(`/player-profiles/${playerId}/${section}/${itemId}`);
    return data;
  }

  async updatePlayerProfileSectionStatus(
    playerId: string,
    section:
      | 'performance-rows'
      | 'transfers'
      | 'career'
      | 'achievements'
      | 'national-team'
      | 'news'
      | 'rumours',
    itemId: string,
    status: ProfileContentStatus,
  ): Promise<any> {
    const { data } = await this.client.patch(
      `/player-profiles/${playerId}/${section}/${itemId}/status`,
      { status },
    );
    return data;
  }

  async bulkUpsertPlayerProfiles(
    payload: { players: Array<Record<string, any>> },
    internalSyncKey: string,
  ): Promise<any> {
    const { data } = await this.client.post('/internal/player-profiles/bulk-upsert', payload, {
      headers: { 'x-internal-sync-key': internalSyncKey },
    });
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
    if (data && typeof data === 'object') {
      this.setCachedPlayer(id, data as Player);
    } else {
      this.invalidateCachedPlayer(id);
    }
    return data;
  }

  async deletePlayer(id: string): Promise<any> {
    const { data } = await this.client.delete(`/players/${id}`);
    this.invalidateCachedPlayer(id);
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

  async getMyAssignedMatches(params?: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Match>> {
    const data = await this.getRaw<PaginatedResponse<Match>>('/matches/my-assignments', {
      params,
    });
    return this.normalizePaginated<Match>(data);
  }

  async getScoutCalendar(params?: {
    country?: string;
    league?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<ScoutCalendarResponse> {
    return this.getRaw<ScoutCalendarResponse>('/matches/scout-calendar', { params });
  }

  async addMatchToMyCalendar(matchId: string): Promise<{
    assignmentId: string;
    matchId: string;
    scoutId: string;
    missionType: 'PRIORITY' | 'VOLUNTARY';
    status: string;
    mobileStatus: 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED';
    reportSubmitted: boolean;
  }> {
    return this.postRaw(`/matches/${matchId}/my-calendar`);
  }

  async startAssignmentMission(assignmentId: string): Promise<{
    assignmentId: string;
    matchId: string;
    scoutId: string;
    missionType: 'PRIORITY' | 'VOLUNTARY';
    status: string;
    mobileStatus: 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED';
    reportSubmitted: boolean;
  }> {
    return this.patchRaw(`/match-assignments/${assignmentId}/start`);
  }

  async createMissionRequest(
    matchId: string,
    payload: {
      targetScoutId?: string;
      missionType?: 'PRIORITY' | 'VOLUNTARY';
      note?: string;
    },
  ): Promise<MatchMissionRequest> {
    return this.postRaw(`/matches/${matchId}/mission-requests`, payload);
  }

  async getMissionRequests(params?: {
    status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  }): Promise<{ data: MatchMissionRequest[]; meta: { total: number } }> {
    return this.getRaw('/matches/mission-requests', { params });
  }

  async listMissionRequests(params?: {
    status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  }): Promise<{ data: MatchMissionRequest[]; meta: { total: number } }> {
    return this.getMissionRequests(params);
  }

  async getMatchMissionRequests(
    matchId: string,
    params?: { status?: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' },
  ): Promise<{ data: MatchMissionRequest[]; meta: { total: number } }> {
    return this.getRaw(`/matches/${matchId}/mission-requests`, { params });
  }

  async approveMissionRequest(
    requestId: string,
    payload?: { scoutId?: string; note?: string },
  ): Promise<any> {
    return this.patchRaw(`/matches/mission-requests/${requestId}/approve`, payload ?? {});
  }

  async rejectMissionRequest(requestId: string, payload?: { note?: string }): Promise<MatchMissionRequest> {
    return this.patchRaw(`/matches/mission-requests/${requestId}/reject`, payload ?? {});
  }

  async cancelMissionRequest(requestId: string, payload?: { note?: string }): Promise<MatchMissionRequest> {
    return this.patchRaw(`/matches/mission-requests/${requestId}/cancel`, payload ?? {});
  }

  async completeAssignmentMission(assignmentId: string): Promise<{
    assignmentId: string;
    matchId: string;
    scoutId: string;
    missionType: 'PRIORITY' | 'VOLUNTARY';
    status: string;
    mobileStatus: 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED';
    reportSubmitted: boolean;
  }> {
    return this.patchRaw(`/match-assignments/${assignmentId}/complete`);
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
  private normalizeNewsLimit(input?: number): number {
    if (!Number.isInteger(input) || !input) return 20;
    return Math.min(50, Math.max(5, input));
  }

  private normalizeNewsCategory(value: unknown): NewsFeedItem['category'] {
    if (value === 'clubs' || value === 'players' || value === 'market' || value === 'notifications') {
      return value;
    }
    return 'notifications';
  }

  private normalizeNewsFeedPayload(
    payload: unknown,
    categories: NewsFeedItem['category'][],
    limit: number,
  ): NewsFeedResponse {
    const generatedAt =
      typeof (payload as any)?.generatedAt === 'string'
        ? (payload as any).generatedAt
        : new Date().toISOString();

    const items = extractPayloadItems<Record<string, any>>(payload)
      .map((item, index): NewsFeedItem => {
        const title =
          typeof item.title === 'string' && item.title.trim().length > 0
            ? item.title
            : typeof item.headline === 'string' && item.headline.trim().length > 0
              ? item.headline
              : 'Actualité';
        const summary =
          typeof item.summary === 'string' && item.summary.trim().length > 0
            ? item.summary
            : typeof item.body === 'string' && item.body.trim().length > 0
              ? item.body
              : null;
        const source =
          typeof item.source === 'string' && item.source.trim().length > 0
            ? item.source
            : typeof item.type === 'string' && item.type.trim().length > 0
              ? item.type
              : 'Arcane';
        const timestampCandidate =
          (typeof item.timestamp === 'string' && item.timestamp) ||
          (typeof item.createdAt === 'string' && item.createdAt) ||
          (typeof item.updatedAt === 'string' && item.updatedAt);
        return {
          id:
            typeof item.id === 'string' && item.id.trim().length > 0
              ? item.id
              : `news-${index}`,
          category: this.normalizeNewsCategory(item.category),
          title,
          summary,
          source,
          details:
            typeof item.details === 'string' && item.details.trim().length > 0
              ? item.details
              : summary,
          timestamp: timestampCandidate || generatedAt,
          link:
            typeof item.link === 'string' && item.link.trim().length > 0
              ? item.link
              : null,
        };
      })
      .filter((item) => categories.includes(item.category))
      .slice(0, limit);

    const include = {
      players: items.filter((item) => item.category === 'players').length,
      clubs: items.filter((item) => item.category === 'clubs').length,
      market: items.filter((item) => item.category === 'market').length,
      notifications: items.filter((item) => item.category === 'notifications').length,
    };

    return {
      data: items,
      generatedAt,
      meta: {
        limit,
        total: items.length,
        categories,
        include,
      },
    };
  }

  private buildNotificationsFallbackNewsFeed(
    payload: unknown,
    categories: NewsFeedItem['category'][],
    limit: number,
  ): NewsFeedResponse {
    if (!categories.includes('notifications')) {
      return {
        data: [],
        generatedAt: new Date().toISOString(),
        meta: {
          limit,
          total: 0,
          categories,
          include: {
            players: 0,
            clubs: 0,
            market: 0,
            notifications: 0,
          },
        },
      };
    }

    const generatedAt = new Date().toISOString();
    const items = extractPayloadItems<Record<string, any>>(payload)
      .map((item, index): NewsFeedItem => {
        const title =
          typeof item.title === 'string' && item.title.trim().length > 0
            ? item.title
            : 'Notification';
        const summary =
          typeof item.body === 'string' && item.body.trim().length > 0
            ? item.body
            : typeof item.summary === 'string' && item.summary.trim().length > 0
              ? item.summary
              : null;
        const source =
          typeof item.type === 'string' && item.type.trim().length > 0
            ? item.type
            : 'Notifications';
        const timestamp =
          (typeof item.createdAt === 'string' && item.createdAt) ||
          (typeof item.timestamp === 'string' && item.timestamp) ||
          generatedAt;

        return {
          id:
            typeof item.id === 'string' && item.id.trim().length > 0
              ? `notifications-${item.id}`
              : `notifications-${index}`,
          category: 'notifications',
          title,
          summary,
          source,
          details: summary,
          timestamp,
          link: '/notifications',
        };
      })
      .slice(0, limit);

    return {
      data: items,
      generatedAt,
      meta: {
        limit,
        total: items.length,
        categories,
        include: {
          players: 0,
          clubs: 0,
          market: 0,
          notifications: items.length,
        },
      },
    };
  }

  async getNewsFeed(params?: {
    limit?: number;
    categories?: NewsFeedItem['category'][];
  }): Promise<NewsFeedResponse> {
    const categories = params?.categories?.length
      ? params.categories
      : ['clubs', 'players', 'market', 'notifications'];
    const limit = this.normalizeNewsLimit(params?.limit);
    const requestParams = {
      limit,
      categories: categories.join(','),
    };

    try {
      const { data } = await this.client.get('/news/feed', { params: requestParams });
      return this.normalizeNewsFeedPayload(data, categories, limit);
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }

    try {
      const { data } = await this.client.get('/news', { params: requestParams });
      return this.normalizeNewsFeedPayload(data, categories, limit);
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }

    try {
      const { data } = await this.client.get('/notifications/me');
      return this.buildNotificationsFallbackNewsFeed(data, categories, limit);
    } catch (error) {
      logError('News fallback failed, returning empty feed', error as Error);
      return this.buildNotificationsFallbackNewsFeed([], categories, limit);
    }
  }

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
