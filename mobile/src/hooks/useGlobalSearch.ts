import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { logger, logError } from '../utils/logger';

export type SearchEntityType = 'player' | 'club' | 'camp' | 'report' | 'user' | 'all';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface SearchFilters {
  types?: SearchEntityType[];
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  position?: string;
  nationality?: string;
  ageMin?: number;
  ageMax?: number;
  rating?: number;
}

export interface RecentSearch {
  query: string;
  timestamp: number;
  filters?: SearchFilters;
}

const RECENT_SEARCHES_KEY = '@arcane_recent_searches';
const MAX_RECENT_SEARCHES = 10;
const SEARCH_DEBOUNCE_MS = 300;

// Mock data generator
const generateMockResults = (query: string, filters?: SearchFilters): SearchResult[] => {
  const results: SearchResult[] = [];
  const searchLower = query.toLowerCase();

  // Mock Players
  const mockPlayers = [
    { id: '1', name: 'Kylian Mbappé', position: 'ST', club: 'PSG', nationality: 'France', age: 25, rating: 95 },
    { id: '2', name: 'Erling Haaland', position: 'ST', club: 'Man City', nationality: 'Norway', age: 23, rating: 94 },
    { id: '3', name: 'Jude Bellingham', position: 'CM', club: 'Real Madrid', nationality: 'England', age: 20, rating: 91 },
    { id: '4', name: 'Bukayo Saka', position: 'RW', club: 'Arsenal', nationality: 'England', age: 22, rating: 89 },
    { id: '5', name: 'Pedri González', position: 'CM', club: 'Barcelona', nationality: 'Spain', age: 21, rating: 90 },
  ];

  mockPlayers
    .filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.position.toLowerCase().includes(searchLower) ||
      p.club.toLowerCase().includes(searchLower)
    )
    .forEach(player => {
      if (!filters?.types || filters.types.includes('player') || filters.types.includes('all')) {
        results.push({
          id: player.id,
          type: 'player',
          title: player.name,
          subtitle: `${player.position} • ${player.club}`,
          description: `${player.age} years • ${player.nationality} • Rating: ${player.rating}`,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=E4FF3B&color=0A0A0A`,
          metadata: player,
          score: 0.9
        });
      }
    });

  // Mock Clubs
  const mockClubs = [
    { id: '1', name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'France', founded: 1970 },
    { id: '2', name: 'Manchester City', league: 'Premier League', country: 'England', founded: 1880 },
    { id: '3', name: 'Real Madrid', league: 'La Liga', country: 'Spain', founded: 1902 },
    { id: '4', name: 'Arsenal', league: 'Premier League', country: 'England', founded: 1886 },
    { id: '5', name: 'Barcelona', league: 'La Liga', country: 'Spain', founded: 1899 },
  ];

  mockClubs
    .filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.league.toLowerCase().includes(searchLower) ||
      c.country.toLowerCase().includes(searchLower)
    )
    .forEach(club => {
      if (!filters?.types || filters.types.includes('club') || filters.types.includes('all')) {
        results.push({
          id: club.id,
          type: 'club',
          title: club.name,
          subtitle: club.league,
          description: `${club.country} • Founded: ${club.founded}`,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=3B82F6&color=FFFFFF`,
          metadata: club,
          score: 0.85
        });
      }
    });

  // Mock Camps
  const mockCamps = [
    { id: '1', name: 'Elite Summer Camp', location: 'Paris', type: 'Training', price: 899, startDate: '2025-07-01' },
    { id: '2', name: 'Youth Development Program', location: 'Lyon', type: 'Development', price: 499, startDate: '2025-06-15' },
    { id: '3', name: 'Pro Tryouts', location: 'Marseille', type: 'Tryout', price: 299, startDate: '2025-08-01' },
  ];

  mockCamps
    .filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.location.toLowerCase().includes(searchLower) ||
      c.type.toLowerCase().includes(searchLower)
    )
    .forEach(camp => {
      if (!filters?.types || filters.types.includes('camp') || filters.types.includes('all')) {
        results.push({
          id: camp.id,
          type: 'camp',
          title: camp.name,
          subtitle: `${camp.type} • ${camp.location}`,
          description: `Starts: ${camp.startDate} • €${camp.price}`,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(camp.name)}&background=10B981&color=FFFFFF`,
          metadata: camp,
          score: 0.8
        });
      }
    });

  // Mock Reports
  const mockReports = [
    { id: '1', title: 'Mbappé Performance Analysis', type: 'Performance', date: '2025-01-15', author: 'John Scout' },
    { id: '2', title: 'Youth Talent Report Q1', type: 'Scouting', date: '2025-01-10', author: 'Marie Analyst' },
    { id: '3', title: 'Transfer Market Overview', type: 'Market', date: '2025-01-05', author: 'Pierre Expert' },
  ];

  mockReports
    .filter(r =>
      r.title.toLowerCase().includes(searchLower) ||
      r.type.toLowerCase().includes(searchLower) ||
      r.author.toLowerCase().includes(searchLower)
    )
    .forEach(report => {
      if (!filters?.types || filters.types.includes('report') || filters.types.includes('all')) {
        results.push({
          id: report.id,
          type: 'report',
          title: report.title,
          subtitle: `${report.type} Report`,
          description: `By ${report.author} • ${report.date}`,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(report.type)}&background=F59E0B&color=FFFFFF`,
          metadata: report,
          score: 0.75
        });
      }
    });

  // Sort by score
  results.sort((a, b) => (b.score || 0) - (a.score || 0));

  return results;
};

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const searches = JSON.parse(stored);
        setRecentSearches(searches);
      }
    } catch (err) {
      logError('Failed to load recent searches', err);
    }
  };

  const saveRecentSearch = async (searchQuery: string, searchFilters?: SearchFilters) => {
    if (!searchQuery.trim()) return;

    try {
      const newSearch: RecentSearch = {
        query: searchQuery,
        timestamp: Date.now(),
        filters: searchFilters
      };

      const updated = [newSearch, ...recentSearches.filter(s => s.query !== searchQuery)]
        .slice(0, MAX_RECENT_SEARCHES);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      logError('Failed to save recent search', err);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      logger.info('Recent searches cleared');
    } catch (err) {
      logError('Failed to clear recent searches', err);
    }
  };

  const performSearch = useCallback(async (searchQuery: string, searchFilters?: SearchFilters) => {
    if (!searchQuery.trim() && (!searchFilters || Object.keys(searchFilters).length === 0)) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For now, using mock data
      const mockResults = generateMockResults(searchQuery, searchFilters);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setResults(mockResults);

      // Save to recent searches
      if (searchQuery.trim()) {
        await saveRecentSearch(searchQuery, searchFilters);
      }

      // Generate suggestions based on results
      const uniqueTitles = [...new Set(mockResults.map(r => r.title))];
      setSuggestions(uniqueTitles.slice(0, 5));

      logger.info('Search completed', {
        query: searchQuery,
        resultsCount: mockResults.length,
        filters: searchFilters
      });
    } catch (err) {
      logError('Search failed', err);
      setError('Failed to perform search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const search = useCallback((searchQuery: string, searchFilters?: SearchFilters) => {
    setQuery(searchQuery);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery, searchFilters || filters);
    }, SEARCH_DEBOUNCE_MS);
  }, [filters, performSearch]);

  // Immediate search (no debounce)
  const searchImmediate = useCallback((searchQuery: string, searchFilters?: SearchFilters) => {
    setQuery(searchQuery);
    performSearch(searchQuery, searchFilters || filters);
  }, [filters, performSearch]);

  // Update filters and re-search
  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query, newFilters);
    }
  }, [query, performSearch]);

  // Get trending searches
  const getTrendingSearches = useCallback(() => {
    return [
      'Mbappé',
      'Elite camps',
      'Paris tryouts',
      'Youth development',
      'Transfer reports',
      'Performance analysis'
    ];
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setFilters({});
  }, []);

  // Get result by ID and type
  const getResultById = useCallback((id: string, type: SearchEntityType) => {
    return results.find(r => r.id === id && r.type === type);
  }, [results]);

  return {
    // State
    query,
    results,
    loading,
    error,
    filters,
    recentSearches,
    suggestions,

    // Actions
    search,
    searchImmediate,
    updateFilters,
    clearSearch,
    clearRecentSearches,
    getTrendingSearches,
    getResultById,

    // Direct setters
    setQuery
  };
};