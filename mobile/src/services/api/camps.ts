/**
 * CAMPS API SERVICE
 * Handles all camp-related API calls
 *
 * @version 1.0.0
 * @date 2025-11-16
 */

import { apiClient } from '../api';
import type { Camp, CampParticipant, CampRegistrationData, CampFilters } from '../../types/camps';

// ============================================================================
// CAMPS ENDPOINTS
// ============================================================================

/**
 * Get all camps with optional filters
 */
export const getCamps = async (filters?: CampFilters): Promise<Camp[]> => {
  try {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.upcoming !== undefined) params.append('upcoming', String(filters.upcoming));
      if (filters.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));
      if (filters.city) params.append('city', filters.city);
      if (filters.country) params.append('country', filters.country);
      if (filters.minPrice !== undefined) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice !== undefined) params.append('maxPrice', String(filters.maxPrice));
      if (filters.search) params.append('search', filters.search);
    }

    const response = await apiClient.get(`/camps?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching camps:', error);
    throw error;
  }
};

/**
 * Get featured/upcoming camps
 */
export const getFeaturedCamps = async (): Promise<Camp[]> => {
  try {
    const response = await apiClient.get('/camps/featured');
    return response.data;
  } catch (error) {
    console.error('Error fetching featured camps:', error);
    throw error;
  }
};

/**
 * Get a single camp by ID
 */
export const getCampById = async (campId: string): Promise<Camp> => {
  try {
    const response = await apiClient.get(`/camps/${campId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching camp ${campId}:`, error);
    throw error;
  }
};

/**
 * Get camps the current user is registered for
 */
export const getMyCamps = async (): Promise<(Camp & { registration: CampParticipant })[]> => {
  try {
    const response = await apiClient.get('/camps/my-camps');
    return response.data;
  } catch (error) {
    console.error('Error fetching my camps:', error);
    throw error;
  }
};

/**
 * Register for a camp
 */
export const registerForCamp = async (
  campId: string,
  data: CampRegistrationData
): Promise<CampParticipant> => {
  try {
    const response = await apiClient.post(`/camps/${campId}/register`, data);
    return response.data;
  } catch (error) {
    console.error(`Error registering for camp ${campId}:`, error);
    throw error;
  }
};

/**
 * Cancel registration for a camp
 */
export const cancelCampRegistration = async (
  campId: string,
  registrationId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/camps/${campId}/registrations/${registrationId}`);
  } catch (error) {
    console.error(`Error cancelling registration ${registrationId}:`, error);
    throw error;
  }
};

/**
 * Get participants for a camp (scout/coach only)
 */
export const getCampParticipants = async (campId: string): Promise<CampParticipant[]> => {
  try {
    const response = await apiClient.get(`/camps/${campId}/participants`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching participants for camp ${campId}:`, error);
    throw error;
  }
};

/**
 * Update participant status (scout/coach only)
 */
export const updateParticipantStatus = async (
  campId: string,
  participantId: string,
  status: 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW'
): Promise<CampParticipant> => {
  try {
    const response = await apiClient.patch(
      `/camps/${campId}/participants/${participantId}`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating participant ${participantId} status:`, error);
    throw error;
  }
};

/**
 * Create a new camp (scout/coach only)
 */
export const createCamp = async (campData: Partial<Camp>): Promise<Camp> => {
  try {
    const response = await apiClient.post('/camps', campData);
    return response.data;
  } catch (error) {
    console.error('Error creating camp:', error);
    throw error;
  }
};

/**
 * Update a camp (scout/coach only)
 */
export const updateCamp = async (
  campId: string,
  updates: Partial<Camp>
): Promise<Camp> => {
  try {
    const response = await apiClient.patch(`/camps/${campId}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating camp ${campId}:`, error);
    throw error;
  }
};

/**
 * Delete a camp (scout/coach only)
 */
export const deleteCamp = async (campId: string): Promise<void> => {
  try {
    await apiClient.delete(`/camps/${campId}`);
  } catch (error) {
    console.error(`Error deleting camp ${campId}:`, error);
    throw error;
  }
};

/**
 * Generate QR code for camp check-in
 */
export const getCampQRCode = async (
  campId: string,
  registrationId: string
): Promise<string> => {
  try {
    const response = await apiClient.get(
      `/camps/${campId}/registrations/${registrationId}/qr-code`
    );
    return response.data.qrCode; // Base64 encoded image
  } catch (error) {
    console.error(`Error generating QR code for registration ${registrationId}:`, error);
    throw error;
  }
};