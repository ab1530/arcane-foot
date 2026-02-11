/**
 * Passport Service
 * Service layer for passport operations including creation, verification, and retrieval
 */

import { apiClient } from '@/lib/api-client';
import {
  Passport,
  CreatePassportDto,
  VerifyPassportDto,
  PassportResponse,
  PassportValidationResult,
  PassportValidationError,
} from '@/types/passport';

class PassportService {
  /**
   * Create a new passport for a player
   */
  async createPassport(data: CreatePassportDto): Promise<PassportResponse> {
    try {
      const response = await apiClient.createPassport(data);
      return response;
    } catch (error: any) {
      console.error('Error creating passport:', error);
      throw new Error(error.message || 'Failed to create passport');
    }
  }

  /**
   * Get passport by player ID (requires authentication)
   */
  async getPassportByPlayer(playerId: string): Promise<Passport> {
    try {
      const response = await apiClient.getPassportByPlayer(playerId);
      return response;
    } catch (error: any) {
      console.error('Error fetching passport by player:', error);
      throw new Error(error.message || 'Failed to fetch passport');
    }
  }

  /**
   * Get passport by public token (no authentication required)
   */
  async getPassportByToken(token: string): Promise<Passport> {
    try {
      const response = await apiClient.getPassportByToken(token);
      return response;
    } catch (error: any) {
      console.error('Error fetching passport by token:', error);
      throw new Error(error.message || 'Failed to fetch passport');
    }
  }

  /**
   * Get current user's passport by their player ID (requires authentication)
   * Note: The backend doesn't have a /passport/me endpoint, so you need to pass the player ID
   */
  async getMyPassport(playerId: string): Promise<Passport> {
    try {
      const response = await apiClient.getPassportByPlayer(playerId);
      return response;
    } catch (error: any) {
      console.error('Error fetching my passport:', error);
      throw new Error(error.message || 'Failed to fetch passport');
    }
  }

  /**
   * Verify passport (admin only)
   */
  async verifyPassport(
    playerId: string,
    data: VerifyPassportDto
  ): Promise<PassportResponse> {
    try {
      const response = await apiClient.verifyPassport(playerId, data);
      return response;
    } catch (error: any) {
      console.error('Error verifying passport:', error);
      throw new Error(error.message || 'Failed to verify passport');
    }
  }

  /**
   * Delete passport (requires authentication)
   */
  async deletePassport(playerId: string): Promise<void> {
    try {
      await apiClient.deletePassport(playerId);
    } catch (error: any) {
      console.error('Error deleting passport:', error);
      throw new Error(error.message || 'Failed to delete passport');
    }
  }

  /**
   * Get QR code for passport token
   */
  async getQRCode(token: string): Promise<string> {
    try {
      const response = await apiClient.getPassportQRCode(token);
      return response.qrCodeUrl || response;
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      throw new Error(error.message || 'Failed to fetch QR code');
    }
  }

  /**
   * Generate QR code URL (client-side)
   * Note: QR code generation is handled client-side using qrcode.react component
   */
  generateQRCodeURL(token: string, baseUrl?: string): string {
    const url = baseUrl
      ? `${baseUrl}/passport/${token}`
      : typeof window !== 'undefined'
      ? `${window.location.origin}/passport/${token}`
      : `https://arcane.com/passport/${token}`;

    return url;
  }

  /**
   * Generate QR code data URL (for download/preview)
   * This creates a canvas element and converts it to data URL
   */
  async generateQRCodeDataURL(token: string, baseUrl?: string): Promise<string> {
    try {
      const url = this.generateQRCodeURL(token, baseUrl);

      // Create a temporary canvas for QR code generation
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          reject(new Error('QR code generation requires browser environment'));
          return;
        }

        // We'll use the QRCodeSVG component from qrcode.react in the UI
        // For now, return the URL as a placeholder
        resolve(url);
      });
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate passport data before creation
   */
  validatePassportData(data: CreatePassportDto): PassportValidationResult {
    const errors: PassportValidationError[] = [];

    if (!data.playerId) {
      errors.push({
        field: 'playerId',
        message: 'Player ID is required',
      });
    }

    if (data.playerId && data.playerId.trim().length === 0) {
      errors.push({
        field: 'playerId',
        message: 'Player ID cannot be empty',
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check if passport is expired
   */
  isPassportExpired(passport: Passport): boolean {
    if (!passport.expiresAt) {
      return false;
    }

    const expiryDate = new Date(passport.expiresAt);
    const now = new Date();

    return expiryDate < now;
  }

  /**
   * Check if passport is verified
   */
  isPassportVerified(passport: Passport): boolean {
    return passport.status === 'VERIFIED' && !!passport.verifiedAt;
  }

  /**
   * Get passport status display info
   */
  getPassportStatusInfo(status: string): {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  } {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verified',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
        };
      case 'PENDING':
        return {
          label: 'Pending Verification',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
        };
      case 'REVOKED':
        return {
          label: 'Revoked',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
        };
      default:
        return {
          label: status,
          color: 'text-arcane-grey',
          bgColor: 'bg-arcane-grey/20',
          borderColor: 'border-arcane-grey/30',
        };
    }
  }

  /**
   * Download passport QR code as image
   * Note: This should be called from a component that has access to the QR code canvas
   */
  async downloadQRCode(token: string, filename?: string): Promise<void> {
    try {
      // The actual implementation should use the QR code canvas from the component
      // For now, we'll just provide the URL
      const url = this.generateQRCodeURL(token);

      // In a real implementation, you would:
      // 1. Get the QR code canvas element from the DOM
      // 2. Convert it to a blob/data URL
      // 3. Create a download link

      console.log('Download QR code for:', url);
      throw new Error('QR code download should be implemented in the UI component');
    } catch (error: any) {
      console.error('Error downloading QR code:', error);
      throw new Error('Failed to download QR code');
    }
  }

  /**
   * Get shareable passport URL
   */
  getShareableURL(token: string, baseUrl?: string): string {
    const base =
      baseUrl ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://arcane.com');
    return `${base}/passport/${token}`;
  }

  /**
   * Copy passport URL to clipboard
   */
  async copyPassportURLToClipboard(token: string, baseUrl?: string): Promise<void> {
    try {
      const url = this.getShareableURL(token, baseUrl);
      await navigator.clipboard.writeText(url);
    } catch (error: any) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy URL to clipboard');
    }
  }
}

// Export singleton instance
export const passportService = new PassportService();
export default PassportService;
