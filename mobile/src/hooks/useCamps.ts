import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

export interface Camp {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  price: number;
  capacity: number;
  enrolled: number;
  type: 'TRAINING' | 'TOURNAMENT' | 'WORKSHOP' | 'TRYOUT';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
  ageGroups: string[];
  coaches?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  features?: string[];
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  participants?: Array<{
    id: string;
    name: string;
    age: number;
    registrationDate: string;
  }>;
}

export interface CampFilters {
  type?: string;
  level?: string;
  status?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface CampRegistration {
  campId: string;
  participantName: string;
  participantAge: number;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  medicalConditions?: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export const useCamps = (initialFilters?: CampFilters) => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CampFilters>(initialFilters || {});
  const [refreshing, setRefreshing] = useState(false);

  const fetchCamps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, using mock data as camps endpoint might not exist yet
      const mockCamps: Camp[] = [
        {
          id: '1',
          name: 'Summer Elite Training Camp',
          description: 'Intensive 2-week training program for elite players',
          location: 'Paris Training Center',
          startDate: '2025-07-01',
          endDate: '2025-07-14',
          price: 899,
          capacity: 30,
          enrolled: 22,
          type: 'TRAINING',
          level: 'ELITE',
          ageGroups: ['U16', 'U18', 'U21'],
          coaches: [
            { id: '1', name: 'Jean Dupont', role: 'Head Coach' },
            { id: '2', name: 'Marie Martin', role: 'Technical Coach' }
          ],
          features: [
            'Professional coaching',
            'Video analysis',
            'Nutrition planning',
            'Physical conditioning',
            'Match simulations'
          ],
          status: 'UPCOMING'
        },
        {
          id: '2',
          name: 'Youth Development Workshop',
          description: 'Weekend workshop focusing on technical skills',
          location: 'Lyon Academy',
          startDate: '2025-06-15',
          endDate: '2025-06-16',
          price: 299,
          capacity: 50,
          enrolled: 35,
          type: 'WORKSHOP',
          level: 'INTERMEDIATE',
          ageGroups: ['U12', 'U14'],
          coaches: [
            { id: '3', name: 'Pierre Blanc', role: 'Youth Coach' }
          ],
          features: [
            'Technical drills',
            'Team building',
            'Parent sessions',
            'Certificate of participation'
          ],
          status: 'UPCOMING'
        },
        {
          id: '3',
          name: 'Professional Club Tryouts',
          description: 'Official tryouts for professional club selection',
          location: 'Marseille Stadium',
          startDate: '2025-08-20',
          endDate: '2025-08-22',
          price: 499,
          capacity: 100,
          enrolled: 87,
          type: 'TRYOUT',
          level: 'ADVANCED',
          ageGroups: ['U18', 'U21', 'Senior'],
          coaches: [
            { id: '4', name: 'Claude Bernard', role: 'Scout' },
            { id: '5', name: 'Sophie Leroy', role: 'Technical Director' }
          ],
          features: [
            'Professional scouts present',
            'Performance evaluation',
            'Individual feedback',
            'Contract opportunities'
          ],
          status: 'UPCOMING'
        },
        {
          id: '4',
          name: 'Spring Tournament Camp',
          description: 'Competitive tournament with training sessions',
          location: 'Nice Sports Complex',
          startDate: '2025-04-10',
          endDate: '2025-04-14',
          price: 599,
          capacity: 80,
          enrolled: 65,
          type: 'TOURNAMENT',
          level: 'INTERMEDIATE',
          ageGroups: ['U14', 'U16', 'U18'],
          features: [
            'Minimum 5 matches',
            'Training between matches',
            'Awards ceremony',
            'Professional photography'
          ],
          status: 'UPCOMING'
        },
        {
          id: '5',
          name: 'Winter Skills Camp',
          description: 'Indoor training focusing on technical skills',
          location: 'Bordeaux Indoor Arena',
          startDate: '2025-02-15',
          endDate: '2025-02-20',
          price: 449,
          capacity: 40,
          enrolled: 28,
          type: 'TRAINING',
          level: 'INTERMEDIATE',
          ageGroups: ['U14', 'U16'],
          features: [
            'Indoor facilities',
            'Small group training',
            'Individual skill assessment',
            'Progress tracking'
          ],
          status: 'UPCOMING'
        }
      ];

      logger.info('Camps fetched', {
        count: mockCamps.length,
        filters
      });

      let filteredCamps = mockCamps;

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        filteredCamps = filteredCamps.filter(c => c.type === filters.type);
      }

      if (filters.level && filters.level !== 'all') {
        filteredCamps = filteredCamps.filter(c => c.level === filters.level);
      }

      if (filters.status && filters.status !== 'all') {
        filteredCamps = filteredCamps.filter(c => c.status === filters.status);
      }

      if (filters.ageGroup) {
        filteredCamps = filteredCamps.filter(c => c.ageGroups.includes(filters.ageGroup!));
      }

      if (filters.minPrice !== undefined) {
        filteredCamps = filteredCamps.filter(c => c.price >= filters.minPrice!);
      }

      if (filters.maxPrice !== undefined) {
        filteredCamps = filteredCamps.filter(c => c.price <= filters.maxPrice!);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCamps = filteredCamps.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.location.toLowerCase().includes(searchLower)
        );
      }

      // Sort by start date
      filteredCamps.sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      setCamps(filteredCamps);
    } catch (err) {
      logError('Failed to fetch camps', err);
      setError('Failed to load camps');
      setCamps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const updateFilters = useCallback((newFilters: CampFilters) => {
    setFilters(newFilters);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCamps();
  }, [fetchCamps]);

  const registerForCamp = useCallback(async (registration: CampRegistration) => {
    try {
      // In a real app, this would call the API
      logger.info('Camp registration submitted', registration);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Refresh camps to update enrollment count
      await fetchCamps();

      return { success: true, message: 'Registration successful' };
    } catch (err) {
      logError('Failed to register for camp', err);
      throw err;
    }
  }, [fetchCamps]);

  const getCampById = useCallback((campId: string) => {
    return camps.find(c => c.id === campId);
  }, [camps]);

  const getUpcomingCamps = useCallback((limit: number = 10) => {
    const today = new Date();
    return camps
      .filter(camp => new Date(camp.startDate) > today && camp.status === 'UPCOMING')
      .slice(0, limit);
  }, [camps]);

  const getOngoingCamps = useCallback(() => {
    return camps.filter(camp => camp.status === 'ONGOING');
  }, [camps]);

  const getAvailableSpots = useCallback((campId: string) => {
    const camp = getCampById(campId);
    if (!camp) return 0;
    return camp.capacity - camp.enrolled;
  }, [getCampById]);

  const getCampStats = useCallback(() => {
    const total = camps.length;
    const upcoming = camps.filter(c => c.status === 'UPCOMING').length;
    const ongoing = camps.filter(c => c.status === 'ONGOING').length;
    const completed = camps.filter(c => c.status === 'COMPLETED').length;

    const totalCapacity = camps.reduce((sum, c) => sum + c.capacity, 0);
    const totalEnrolled = camps.reduce((sum, c) => sum + c.enrolled, 0);
    const fillRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    return {
      total,
      upcoming,
      ongoing,
      completed,
      totalCapacity,
      totalEnrolled,
      fillRate
    };
  }, [camps]);

  return {
    camps,
    loading,
    error,
    refreshing,
    filters,
    updateFilters,
    refresh,
    registerForCamp,
    getCampById,
    getUpcomingCamps,
    getOngoingCamps,
    getAvailableSpots,
    getCampStats
  };
};