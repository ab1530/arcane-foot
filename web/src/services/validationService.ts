import {
  Player,
  ValidationHistory,
  VerificationStats,
  PaginatedResponse,
  ValidatePlayerDto,
  RejectPlayerDto,
  ConvertToAgencyDto,
  BulkImportPlayer,
  BulkImportResult,
  VerificationStatus,
  FilterOptions,
} from '@/app/admin/player-validation/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ValidationService {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('arcane_auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    // Handle CSV responses
    if (response.headers.get('content-type')?.includes('text/csv')) {
      const text = await response.text();
      return text as T;
    }

    return response.json();
  }

  // Get pending players
  async getPendingPlayers(page = 1, limit = 20): Promise<PaginatedResponse<Player>> {
    return this.request<PaginatedResponse<Player>>(
      `/api/admin/players/pending-validation?page=${page}&limit=${limit}`
    );
  }

  // Get players by status
  async getPlayersByStatus(
    status: VerificationStatus,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Player>> {
    return this.request<PaginatedResponse<Player>>(
      `/api/admin/players/by-status/${status}?page=${page}&limit=${limit}`
    );
  }

  // Get verification statistics
  async getVerificationStats(): Promise<VerificationStats> {
    return this.request<VerificationStats>('/api/admin/players/verification-stats');
  }

  // Get validation history for a player
  async getValidationHistory(playerId: string): Promise<ValidationHistory[]> {
    return this.request<ValidationHistory[]>(
      `/api/admin/players/${playerId}/validation-history`
    );
  }

  // Validate a player
  async validatePlayer(playerId: string, data: ValidatePlayerDto): Promise<Player> {
    return this.request<Player>(`/api/admin/players/${playerId}/validate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reject a player
  async rejectPlayer(playerId: string, data: RejectPlayerDto): Promise<Player> {
    return this.request<Player>(`/api/admin/players/${playerId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Mark player as suspicious
  async markAsSuspicious(playerId: string, reason: string): Promise<Player> {
    return this.request<Player>(`/api/admin/players/${playerId}/mark-suspicious`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Convert to agency
  async convertToAgency(playerId: string, data: ConvertToAgencyDto): Promise<Player> {
    return this.request<Player>(`/api/admin/players/${playerId}/convert-to-agency`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Bulk import players
  async bulkImport(
    players: BulkImportPlayer[],
    autoVerify = false
  ): Promise<BulkImportResult> {
    return this.request<BulkImportResult>('/api/admin/players/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ players, autoVerify }),
    });
  }

  // Bulk import from CSV
  async bulkImportCsv(csvContent: string, autoVerify = false): Promise<BulkImportResult> {
    return this.request<BulkImportResult>('/api/admin/players/bulk-import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent, autoVerify }),
    });
  }

  // Export to CSV
  async exportToCsv(status?: VerificationStatus): Promise<string> {
    const query = status ? `?status=${status}` : '';
    return this.request<string>(`/api/admin/players/export-csv${query}`);
  }

  // Helper function to download CSV
  downloadCsv(csvContent: string, filename = 'players-export.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const validationService = new ValidationService();
export default ValidationService;
