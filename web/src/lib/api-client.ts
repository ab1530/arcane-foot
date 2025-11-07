/**
 * API Client for connecting to the NestJS backend
 * Base URL: http://localhost:3000
 */

import * as Sentry from "@sentry/nextjs";
import { analytics } from "./analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ApiConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("arcane_auth_token");
  }

  private async request<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const { method = "GET", headers = {}, body, token } = config;
    const startTime = Date.now();

    const authToken = token || this.getAuthToken();

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (authToken) {
      requestHeaders["Authorization"] = `Bearer ${authToken}`;
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== "GET") {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig);
      const duration = Date.now() - startTime;

      // Track API call performance
      analytics.apiCall(endpoint, method, duration, response.status);

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          this.handleError(error, endpoint, method, response.status);
          throw error;
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        this.handleError(error, endpoint, method, response.status, data);
        throw error;
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track failed API call
      analytics.apiCall(endpoint, method, duration, 0);

      // Log and track error
      console.error(`API request failed: ${method} ${endpoint}`, error);
      this.handleError(error as Error, endpoint, method, 0);

      throw error;
    }
  }

  private handleError(error: Error, endpoint: string, method: string, status: number, data?: any) {
    // Track error in analytics
    analytics.error('api_error', error.message, endpoint);

    // Send to Sentry with context
    Sentry.captureException(error, {
      tags: {
        api_endpoint: endpoint,
        api_method: method,
        api_status: status,
      },
      contexts: {
        api: {
          endpoint,
          method,
          status,
          response: data,
        },
      },
      level: status >= 500 ? 'error' : 'warning',
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; tokenType?: string; user: any; token?: string }>(
      "/api/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
    );
  }

  async signup(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth: string;
    accountType: string;
  }) {
    return this.request<{ accessToken: string; tokenType?: string; user: any; token?: string }>(
      "/api/auth/signup",
      {
        method: "POST",
        body: data,
      },
    );
  }

  async logout() {
    return this.request("/api/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    return this.request<any>("/api/auth/me");
  }

  async updateProfile(data: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    organization?: string;
    role?: string;
    website?: string;
    bio?: string;
  }) {
    return this.request<any>("/api/auth/profile", {
      method: "PATCH",
      body: data,
    });
  }

  // Player endpoints
  async getPlayers(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return this.request<{ data: any[]; meta?: any }>(
      `/api/players${query ? `?${query}` : ""}`
    );
  }

  async getPlayer(id: string) {
    return this.request<{ player: any }>(`/api/players/${id}`);
  }

  async createPlayer(data: any) {
    return this.request<{ player: any }>("/api/players", {
      method: "POST",
      body: data,
    });
  }

  async updatePlayer(id: string, data: any) {
    return this.request<{ player: any }>(`/api/players/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/api/players/${id}`, {
      method: "DELETE",
    });
  }

  // Contact endpoints
  async sendContactMessage(data: {
    name: string;
    email: string;
    phone?: string;
    type: string;
    message: string;
  }) {
    return this.request<{ success: boolean }>("/api/contact", {
      method: "POST",
      body: data,
    });
  }

  // Membership endpoints
  async getMembershipPlans() {
    return this.request<{ plans: any[] }>("/api/membership/plans");
  }

  async createSubscription(planId: string) {
    return this.request<{ subscription: any }>("/api/membership/subscribe", {
      method: "POST",
      body: { planId },
    });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{ stats: any }>("/api/dashboard/stats");
  }

  async getUpcomingMatches() {
    return this.request<{ matches: any[] }>("/api/dashboard/matches");
  }

  async getNotifications(userId?: string) {
    // If no userId provided and we're authenticated, the backend should infer from JWT
    // For now, return empty array if no userId (will use mock data in component)
    if (!userId) {
      return { notifications: [] };
    }
    return this.request<{ notifications: any[] }>(`/api/notifications/user/${userId}`);
  }

  // Analytics endpoints
  async getPlayerAnalytics(playerId: string, period?: string) {
    const query = period ? `?period=${period}` : "";
    return this.request<{ analytics: any }>(`/api/analytics/player/${playerId}${query}`);
  }

  async getAnalyticsOverview() {
    return this.request<{
      overview: {
        totalUsers: number;
        totalPlayers: number;
        totalClubs: number;
        totalMatches: number;
        totalScoutingReports: number;
        totalEvents: number;
        totalKanbanBoards: number;
        totalClubRequests: number;
      };
      recentActivity: {
        newUsersLast7Days: number;
        newPlayersLast7Days: number;
        newScoutingReportsLast7Days: number;
        newClubRequestsLast7Days: number;
      };
      timestamp: string;
    }>("/api/analytics/overview");
  }

  async getAnalyticsPlayers() {
    return this.request<any>("/api/analytics/players");
  }

  async getAnalyticsClubs() {
    return this.request<any>("/api/analytics/clubs");
  }

  async getAnalyticsScoutingReports() {
    return this.request<{
      byStatus: Array<{ status: string; count: number }>;
      ratingStats: {
        average: number;
        min: number;
        max: number;
        total: number;
      };
      mostActiveScouts: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
        _count: { scoutingReports: number };
      }>;
      recentCount: number;
    }>("/api/analytics/scouting-reports");
  }

  async getAnalyticsClubRequests() {
    return this.request<any>("/api/analytics/club-requests");
  }

  async getAnalyticsEvents() {
    return this.request<any>("/api/analytics/events");
  }

  async getAnalyticsActivityTrends(days?: number) {
    const query = days ? `?days=${days}` : "";
    return this.request<any>(`/api/analytics/activity-trends${query}`);
  }

  // Matches endpoints
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
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.clubId) queryParams.append("clubId", params.clubId);
    if (params?.scoutId) queryParams.append("scoutId", params.scoutId);
    if (params?.competition) queryParams.append("competition", params.competition);
    if (params?.season) queryParams.append("season", params.season);
    if (params?.from) queryParams.append("from", params.from);
    if (params?.to) queryParams.append("to", params.to);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/matches${query ? `?${query}` : ""}`
    );
  }

  async getMatch(id: string) {
    return this.request<any>(`/api/matches/${id}`);
  }

  async createMatch(data: {
    homeClubId: string;
    awayClubId: string;
    scheduledAt: string;
    venueOld?: string;
    competitionOld?: string;
    season: string;
    status?: string;
    scoutId?: string;
    notes?: string;
  }) {
    return this.request<any>("/api/matches", {
      method: "POST",
      body: data,
    });
  }

  async updateMatch(id: string, data: Partial<{
    homeClubId: string;
    awayClubId: string;
    scheduledAt: string;
    venueOld?: string;
    competitionOld?: string;
    season: string;
    status?: string;
    scoutId?: string;
    notes?: string;
    homeScore?: number;
    awayScore?: number;
  }>) {
    return this.request<any>(`/api/matches/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  async deleteMatch(id: string) {
    return this.request(`/api/matches/${id}`, {
      method: "DELETE",
    });
  }

  async assignScoutToMatch(matchId: string, scoutId: string) {
    return this.request<any>(`/api/matches/${matchId}/assign-scout`, {
      method: "PATCH",
      body: { scoutId },
    });
  }

  async updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
    return this.request<any>(`/api/matches/${matchId}/score`, {
      method: "PATCH",
      body: { homeScore, awayScore },
    });
  }

  async getUpcomingMatchesList(limit?: number) {
    const query = limit ? `?limit=${limit}` : "";
    return this.request<any[]>(`/api/matches/upcoming${query}`);
  }

  async getLiveMatches() {
    return this.request<any[]>("/api/matches/live");
  }

  // Clubs endpoints
  async getClubs(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return this.request<{ data: any[]; meta: any }>(
      `/api/clubs${query ? `?${query}` : ""}`
    );
  }

  async getClub(id: string) {
    return this.request<any>(`/api/clubs/${id}`);
  }

  // Users/Scouts endpoints
  async getUsers(params?: { role?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append("role", params.role);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ data: any[]; meta: any }>(
      `/api/users${query ? `?${query}` : ""}`
    );
  }

  // Scouting Reports endpoints
  async getReports(params?: {
    status?: string;
    playerId?: string;
    scoutId?: string;
    matchId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getScoutingReports(params);
  }

  async getScoutingReports(params?: {
    status?: string;
    playerId?: string;
    scoutId?: string;
    matchId?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.playerId) queryParams.append("playerId", params.playerId);
    if (params?.scoutId) queryParams.append("scoutId", params.scoutId);
    if (params?.matchId) queryParams.append("matchId", params.matchId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ data: any[]; meta: any }>(
      `/api/scouting-reports${query ? `?${query}` : ""}`
    );
  }

  async getScoutingReport(id: string) {
    return this.request<any>(`/api/scouting-reports/${id}`);
  }

  async createScoutingReport(data: {
    matchId: string;
    playerId: string;
    status?: string;
    overallRating?: number;
    summary?: string;
    strengths?: string;
    weaknesses?: string;
    technicalRating?: number;
    physicalRating?: number;
    mentalRating?: number;
    tacticalRating?: number;
    recommendation?: string;
    recommendationNotes?: string;
    tags?: string[];
    similarPlayerIds?: string[];
    playerMinutesPlayed?: number;
    playerPosition?: string;
  }) {
    return this.request<any>("/api/scouting-reports", {
      method: "POST",
      body: data,
    });
  }

  async updateScoutingReport(id: string, data: any) {
    return this.request<any>(`/api/scouting-reports/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async deleteScoutingReport(id: string) {
    return this.request(`/api/scouting-reports/${id}`, {
      method: "DELETE",
    });
  }

  async submitScoutingReport(id: string) {
    return this.request<any>(`/api/scouting-reports/${id}/submit`, {
      method: "POST",
    });
  }

  async reviewScoutingReport(id: string, approved: boolean) {
    return this.request<any>(`/api/scouting-reports/${id}/review`, {
      method: "POST",
      body: { approved },
    });
  }

  async getPlayerReports(playerId: string) {
    return this.request<any[]>(`/api/scouting-reports/player/${playerId}`);
  }

  async getScoutReports(scoutId: string) {
    return this.request<any[]>(`/api/scouting-reports/scout/${scoutId}`);
  }

  async getMatchReports(matchId: string) {
    return this.request<any[]>(`/api/scouting-reports/match/${matchId}`);
  }

  // AI endpoints
  async generateAiSummary(prompt: string) {
    return this.request<{ summary: string; confidence: number; source: string }>(
      "/api/ai/summary",
      {
        method: "POST",
        body: { prompt },
      },
    );
  }

  async getAiPlayerIndex(playerId: string) {
    return this.request<{
      playerId: string;
      overallScore: number;
      breakdown: any[];
      updatedAt: string;
      source: string;
    }>(`/api/ai/index/${playerId}`);
  }

  async aiMatchmaking(data: { playerIds?: string[]; clubIds?: string[]; tags?: string[] }) {
    return this.request<{
      matches: any[];
      filters: typeof data;
      generatedAt: string;
      source: string;
    }>("/api/ai/matchmaking", {
      method: "POST",
      body: data,
    });
  }

  // Camps endpoints
  async getCamps(params?: {
    type?: string;
    status?: string;
    upcoming?: boolean;
    isPublic?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append("type", params.type);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.upcoming !== undefined) queryParams.append("upcoming", params.upcoming.toString());
    if (params?.isPublic !== undefined) queryParams.append("isPublic", params.isPublic.toString());

    const query = queryParams.toString();
    return this.request<any[]>(`/api/camps${query ? `?${query}` : ""}`);
  }

  async getCamp(id: string) {
    return this.request<any>(`/api/camps/${id}`);
  }

  async registerForCamp(campId: string, data: {
    playerId: string;
    parentalConsentGiven?: boolean;
    parentalConsentUrl?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    medicalWaiverSigned?: boolean;
    medicalWaiverUrl?: string;
    medicalConditions?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    notes?: string;
  }) {
    return this.request<any>(`/api/camps/${campId}/register`, {
      method: "POST",
      body: data,
    });
  }

  async getMyRegistrations() {
    return this.request<any[]>("/api/camps/my/registrations");
  }

  async cancelRegistration(participationId: string) {
    return this.request<{ message: string }>(`/api/camps/registrations/${participationId}`, {
      method: "DELETE",
    });
  }

  // Subscriptions endpoints
  async getMySubscription() {
    return this.request<any>("/api/subscriptions/me");
  }

  async createOrUpdateSubscription(tier: string, billingPeriod: string, stripePaymentMethodId?: string) {
    return this.request<any>("/api/subscriptions", {
      method: "POST",
      body: { tier, billingPeriod, stripePaymentMethodId },
    });
  }

  async cancelSubscription(reason?: string) {
    return this.request<any>("/api/subscriptions/cancel", {
      method: "PUT",
      body: { reason },
    });
  }

  async reactivateSubscription() {
    return this.request<any>("/api/subscriptions/reactivate", {
      method: "PUT",
    });
  }

  async changeTier(tier: string, billingPeriod: string) {
    return this.request<any>("/api/subscriptions/change-tier", {
      method: "PUT",
      body: { tier, billingPeriod },
    });
  }

  // Kanban endpoints
  async getBoards() {
    return this.request<any[]>("/api/kanban/boards");
  }

  async getBoard(id: string) {
    return this.request<any>(`/api/kanban/boards/${id}`);
  }

  async createBoard(data: { name: string; description?: string; isPublic?: boolean }) {
    return this.request<any>("/api/kanban/boards", {
      method: "POST",
      body: data,
    });
  }

  async updateBoard(id: string, data: Partial<{ name: string; description?: string }>) {
    return this.request<any>(`/api/kanban/boards/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async deleteBoard(id: string) {
    return this.request(`/api/kanban/boards/${id}`, {
      method: "DELETE",
    });
  }

  async createColumn(boardId: string, data: { name: string; type?: string; color?: string; position?: number }) {
    return this.request<any>(`/api/kanban/boards/${boardId}/columns`, {
      method: "POST",
      body: data,
    });
  }

  async updateColumn(id: string, data: Partial<{ name: string; color?: string; position?: number }>) {
    return this.request<any>(`/api/kanban/columns/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async deleteColumn(id: string) {
    return this.request(`/api/kanban/columns/${id}`, {
      method: "DELETE",
    });
  }

  async createCard(data: {
    columnId: string;
    playerId: string;
    position?: number;
    notes?: string;
    priority?: string;
    tags?: string[];
    dueDate?: string;
  }) {
    return this.request<any>("/api/kanban/cards", {
      method: "POST",
      body: data,
    });
  }

  async getCard(id: string) {
    return this.request<any>(`/api/kanban/cards/${id}`);
  }

  async updateCard(id: string, data: Partial<{
    notes?: string;
    priority?: string;
    tags?: string[];
    dueDate?: string;
  }>) {
    return this.request<any>(`/api/kanban/cards/${id}`, {
      method: "PATCH",
      body: data,
    });
  }

  async moveCard(id: string, data: { targetColumnId: string; position?: number }) {
    return this.request<any>(`/api/kanban/cards/${id}/move`, {
      method: "POST",
      body: data,
    });
  }

  async deleteCard(id: string) {
    return this.request(`/api/kanban/cards/${id}`, {
      method: "DELETE",
    });
  }

  async getCardActivities(id: string) {
    return this.request<any[]>(`/api/kanban/cards/${id}/activities`);
  }

  // Marketplace endpoints
  async searchScoutListings(params?: {
    leagues?: string[];
    positions?: string[];
    country?: string;
    languages?: string[];
    maxBudget?: number;
    minRating?: number;
    verifiedOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();

    if (params?.leagues && params.leagues.length > 0) {
      params.leagues.forEach(league => queryParams.append("leagues", league));
    }
    if (params?.positions && params.positions.length > 0) {
      params.positions.forEach(position => queryParams.append("positions", position));
    }
    if (params?.country) queryParams.append("country", params.country);
    if (params?.languages && params.languages.length > 0) {
      params.languages.forEach(lang => queryParams.append("languages", lang));
    }
    if (params?.maxBudget !== undefined) queryParams.append("maxBudget", params.maxBudget.toString());
    if (params?.minRating !== undefined) queryParams.append("minRating", params.minRating.toString());
    if (params?.verifiedOnly !== undefined) queryParams.append("verifiedOnly", params.verifiedOnly.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    return this.request<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/marketplace/listings${query ? `?${query}` : ""}`
    );
  }

  async getScoutListing(id: string) {
    return this.request<any>(`/api/marketplace/listings/${id}`);
  }

  async getListingReviews(listingId: string) {
    return this.request<{
      reviews: any[];
      stats: {
        totalReviews: number;
        avgRating: number;
        ratingDistribution: Record<string, number>;
      };
    }>(`/api/marketplace/reviews/listing/${listingId}`);
  }

  async addFavorite(scoutListingId: string, notes?: string, tags?: string[]) {
    return this.request<any>("/api/marketplace/favorites", {
      method: "POST",
      body: { scoutListingId, notes, tags },
    });
  }

  async removeFavorite(favoriteId: string) {
    return this.request(`/api/marketplace/favorites/${favoriteId}`, {
      method: "DELETE",
    });
  }

  async getFavorites() {
    return this.request<any[]>("/api/marketplace/favorites");
  }

  async checkFavorite(scoutListingId: string) {
    return this.request<{ isFavorite: boolean; favoriteId?: string }>(
      `/api/marketplace/favorites/check/${scoutListingId}`
    );
  }

  // ArkaneMatch endpoints
  async arkaneMatchChat(data: {
    message: string;
    conversationId?: string;
  }) {
    return this.request<{
      response: string;
      scouts?: any[];
      extractedCriteria?: {
        leagues?: string[];
        positions?: string[];
        maxBudget?: number;
        countries?: string[];
        minRating?: number;
        verifiedOnly?: boolean;
        languages?: string[];
      };
      suggestions?: string[];
      conversationId: string;
      totalMatches?: number;
    }>("/api/arkane-match/chat", {
      method: "POST",
      body: data,
    });
  }

  async getArkaneMatchConversation(conversationId: string) {
    return this.request<{
      id: string;
      clubId: string;
      messages: any[];
      createdAt: string;
      updatedAt: string;
    }>(`/api/arkane-match/conversations/${conversationId}`);
  }

  async clearArkaneMatchConversation(conversationId: string) {
    return this.request<void>(`/api/arkane-match/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  async getArkaneMatchConversations() {
    return this.request<any[]>("/api/arkane-match/conversations");
  }

  // Voice-to-Report endpoints
  async processVoiceReport(formData: FormData): Promise<{
    transcription: string;
    extractedData: any;
    confidence: number;
    suggestions?: string[];
    audioUrl?: string;
    useClientSide?: boolean;
  }> {
    // For FormData, we don't set Content-Type header (browser sets it automatically with boundary)
    const authToken = this.getAuthToken();

    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/api/voice-to-report/process`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getVoiceReportLanguages(): Promise<string[]> {
    return this.request<string[]>("/api/voice-to-report/languages");
  }

  async getVoiceReportExamples(): Promise<{ [language: string]: string[] }> {
    return this.request<{ [language: string]: string[] }>("/api/voice-to-report/examples");
  }

  // AutoScout endpoints
  async generateAutoScoutReport(data: {
    playerId: string;
    matchId?: string;
    reportType?: string;
    customContext?: string;
    autoSave?: boolean;
    temperature?: number;
    includeComparisons?: boolean;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
      costWarning: string;
      qualityGrade: string;
    }>("/api/auto-scout/generate", {
      method: "POST",
      body: data,
    });
  }

  async bulkGenerateAutoScoutReports(data: {
    playerIds: string[];
    matchId?: string;
  }) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
      estimatedCost: string;
    }>("/api/auto-scout/bulk-generate", {
      method: "POST",
      body: data,
    });
  }

  async enhanceAutoScoutReport(reportId: string) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/api/auto-scout/enhance/${reportId}`, {
      method: "POST",
    });
  }

  async getAutoScoutTemplates() {
    return this.request<{
      success: boolean;
      data: any[];
      count: number;
    }>("/api/auto-scout/templates");
  }

  async previewAutoScoutReport(playerId: string, matchId?: string) {
    const query = matchId ? `?matchId=${matchId}` : "";
    return this.request<{
      success: boolean;
      data: any;
      message: string;
      note: string;
    }>(`/api/auto-scout/preview/${playerId}${query}`);
  }

  async getAutoScoutAnalytics(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      data: any;
      period: { start: string; end: string };
    }>(`/api/auto-scout/analytics${query ? `?${query}` : ""}`);
  }

  async getPlayerAutoScoutHistory(playerId: string) {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/api/auto-scout/player/${playerId}/history`);
  }

  async getAutoScoutCostEstimate(reportType?: string) {
    const query = reportType ? `?reportType=${reportType}` : "";
    return this.request<{
      success: boolean;
      data: {
        reportType: string;
        estimatedTokens: number;
        estimatedCost: string;
        note: string;
      };
    }>(`/api/auto-scout/cost-estimate${query}`);
  }

  async regenerateAutoScoutReport(reportId: string, temperature?: number) {
    const query = temperature !== undefined ? `?temperature=${temperature}` : "";
    return this.request<{
      success: boolean;
      data?: any;
      message: string;
    }>(`/api/auto-scout/regenerate/${reportId}${query}`, {
      method: "POST",
    });
  }

  // Market Value AI endpoints
  async getPlayerValuation(playerId: string) {
    return this.request<any>(`/api/market-value/player/${playerId}`);
  }

  async getValuationTrend(playerId: string) {
    return this.request<any>(`/api/market-value/trend/${playerId}`);
  }

  async comparePlayers(playerIds: string[]) {
    return this.request<any>('/api/market-value/compare', {
      method: 'POST',
      body: { playerIds },
    });
  }

  async checkMarketValueHealth() {
    return this.request<any>('/api/market-value/health');
  }

  async triggerModelRetrain() {
    return this.request<{ message: string; status: string }>(
      '/api/market-value/retrain',
      {
        method: 'POST',
      }
    );
  }

  // Performance Predictor endpoints
  async predictPerformance(playerId: string, matchId: string) {
    return this.request<any>(`/api/performance-predictor/predict/${playerId}/${matchId}`, {
      method: 'POST',
    });
  }

  async batchPredictPerformance(matchId: string) {
    return this.request<any[]>(`/api/performance-predictor/batch-predict/${matchId}`, {
      method: 'POST',
    });
  }

  async getPerformancePredictorAccuracy(playerId?: string, dateRange?: string) {
    const params = new URLSearchParams();
    if (playerId) params.append('playerId', playerId);
    if (dateRange) params.append('dateRange', dateRange);
    const query = params.toString();
    return this.request<any[]>(`/api/performance-predictor/accuracy${query ? `?${query}` : ''}`);
  }

  async getFeatureImportance() {
    return this.request<any[]>('/api/performance-predictor/feature-importance');
  }

  async getPlayerPredictions(playerId: string) {
    return this.request<any>(`/api/performance-predictor/predictions/${playerId}`);
  }

  async getPerformanceInsights(playerId: string) {
    return this.request<any>(`/api/performance-predictor/insights/${playerId}`);
  }

  async retrainPerformanceModel() {
    return this.request<any>('/api/performance-predictor/retrain', {
      method: 'POST',
    });
  }

  // SmartScout endpoints
  async getSmartScoutSuggestions(partialReport: any, context?: any) {
    return this.request<any>('/api/smart-scout/suggestions', {
      method: 'POST',
      body: {
        partialReport,
        context: context || {},
      },
    });
  }

  async getSmartScoutAutocomplete(fieldName: string, partialValue: string, context?: any) {
    return this.request<any>('/api/smart-scout/autocomplete', {
      method: 'POST',
      body: {
        fieldName,
        partialValue,
        context: context || {},
      },
    });
  }

  async getSmartScoutInsights(playerId: string) {
    return this.request<any>(`/api/smart-scout/insights/${playerId}`, {
      method: 'GET',
    });
  }

  async indexSmartScoutReport(reportId: string) {
    return this.request<{ message: string; reportId: string }>(`/api/smart-scout/index/${reportId}`, {
      method: 'POST',
    });
  }

  async reindexAllSmartScoutReports() {
    return this.request<{
      message: string;
      indexed: number;
      failed: number;
      totalProcessed: number;
    }>('/api/smart-scout/reindex-all', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export class for testing or custom instances
export default ApiClient;
