/**
 * CAMPS LIST SCREEN
 * Main screen for browsing and filtering training camps
 *
 * Features:
 * - Search bar with debounced search
 * - Filter by type, location, price
 * - Featured/upcoming camps carousel
 * - Camps grid with cards
 * - Pull-to-refresh
 *
 * @version 1.0.0
 * @date 2025-11-16
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  X,
  MapPin,
  Calendar,
  Users,
  DollarSign,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDebounce } from '../../hooks/useDebounce';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import type { Camp, CampType, CampFilters } from '../../types/camps';
import type { AppStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Mock data for now - will be replaced with API calls
const mockCamps: Camp[] = [
  {
    id: '1',
    name: 'Summer Elite Training Camp',
    description: 'Intensive 5-day training program for elite players',
    type: 'CAMP' as CampType,
    status: 'PUBLISHED',
    location: 'Camp Nou Training Facility',
    city: 'Barcelona',
    country: 'Spain',
    startDate: '2025-07-15',
    endDate: '2025-07-20',
    capacity: 30,
    availableSpots: 12,
    ageMin: 14,
    ageMax: 18,
    price: 1500,
    currency: 'EUR',
    requiresPayment: true,
    coverImage: 'https://example.com/camp1.jpg',
    includedBenefits: ['Professional coaching', 'Accommodation', 'Meals', 'Kit'],
    hasShowcaseGame: true,
    club: {
      id: 'fcb',
      name: 'FC Barcelona',
      logo: 'https://example.com/fcb.png',
    },
  },
  {
    id: '2',
    name: 'Detection Day Paris',
    description: 'One-day talent detection event',
    type: 'DETECTION' as CampType,
    status: 'PUBLISHED',
    location: 'Stade de France',
    city: 'Paris',
    country: 'France',
    startDate: '2025-06-10',
    endDate: '2025-06-10',
    capacity: 100,
    availableSpots: 45,
    ageMin: 12,
    ageMax: 16,
    price: 150,
    currency: 'EUR',
    requiresPayment: true,
    includedBenefits: ['Professional evaluation', 'Lunch', 'Certificate'],
    hasShowcaseGame: false,
  },
];

// Camp Card Component
const CampCard: React.FC<{ camp: Camp; onPress: () => void }> = ({ camp, onPress }) => {
  const startDate = new Date(camp.startDate);
  const endDate = new Date(camp.endDate);
  const isUpcoming = startDate > new Date();
  const spotsPercentage = ((camp.capacity - camp.availableSpots) / camp.capacity) * 100;

  const typeColors: Record<string, string> = {
    CAMP: '#3B82F6', // Blue
    DETECTION: '#A855F7', // Purple
    SHOWCASE: '#F97316', // Orange
    TRAINING: '#10B981', // Green
  };

  return (
    <TouchableOpacity style={styles.campCard} onPress={onPress} activeOpacity={0.8}>
      {/* Type Badge */}
      <View style={[styles.typeBadge, { backgroundColor: typeColors[camp.type] }]}>
        <Text style={styles.typeBadgeText}>{camp.type}</Text>
      </View>

      {/* Camp Info */}
      <View style={styles.cardContent}>
        <Text style={styles.campName} numberOfLines={2}>
          {camp.name}
        </Text>

        {camp.club && (
          <Text style={styles.clubName}>{camp.club.name}</Text>
        )}

        {/* Location */}
        <View style={styles.infoRow}>
          <MapPin size={14} color={tokens.colors.gray[400]} />
          <Text style={styles.infoText}>
            {camp.city}, {camp.country}
          </Text>
        </View>

        {/* Dates */}
        <View style={styles.infoRow}>
          <Calendar size={14} color={tokens.colors.gray[400]} />
          <Text style={styles.infoText}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </Text>
        </View>

        {/* Capacity */}
        <View style={styles.infoRow}>
          <Users size={14} color={tokens.colors.gray[400]} />
          <Text style={styles.infoText}>
            {camp.availableSpots} / {camp.capacity} spots available
          </Text>
        </View>

        {/* Age Range */}
        {camp.ageMin && camp.ageMax && (
          <Text style={styles.ageRange}>
            Ages {camp.ageMin} - {camp.ageMax}
          </Text>
        )}

        {/* Availability Bar */}
        <View style={styles.availabilityContainer}>
          <View style={styles.availabilityBar}>
            <View
              style={[
                styles.availabilityFill,
                {
                  width: `${spotsPercentage}%`,
                  backgroundColor:
                    spotsPercentage > 75
                      ? tokens.colors.semantic.error
                      : spotsPercentage > 50
                      ? tokens.colors.yellow.DEFAULT
                      : tokens.colors.semantic.success,
                },
              ]}
            />
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <DollarSign size={16} color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.price}>
            {camp.price} {camp.currency}
          </Text>
          {camp.hasShowcaseGame && (
            <View style={styles.showcaseBadge}>
              <Text style={styles.showcaseText}>SHOWCASE</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Component
export const CampsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CampFilters>({});
  const [refreshing, setRefreshing] = useState(false);
  const [camps] = useState(mockCamps);
  const [loading] = useState(false);

  // Debounced search
  const [debouncedSearch] = useDebounce(searchQuery, 500);

  // Filtered camps
  const filteredCamps = useMemo(() => {
    let result = [...camps];

    // Apply search
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (camp) =>
          camp.name.toLowerCase().includes(search) ||
          camp.city.toLowerCase().includes(search) ||
          camp.country.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (filters.type) {
      result = result.filter((camp) => camp.type === filters.type);
    }
    if (filters.city) {
      result = result.filter((camp) => camp.city === filters.city);
    }
    if (filters.minPrice !== undefined) {
      result = result.filter((camp) => camp.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((camp) => camp.price <= filters.maxPrice!);
    }

    return result;
  }, [camps, debouncedSearch, filters]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refetch camps from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCampPress = useCallback(
    (campId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('CampDetail' as any, { campId });
    },
    [navigation]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderCamp = useCallback(
    ({ item }: { item: Camp }) => (
      <CampCard camp={item} onPress={() => handleCampPress(item.id)} />
    ),
    [handleCampPress]
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.loadingText}>Loading camps...</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <MapPin size={48} color={tokens.colors.gray[500]} />
        <Text style={styles.emptyTitle}>No camps found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Training Camps</Text>
        <Text style={styles.headerSubtitle}>
          Find the perfect camp to improve your skills
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={tokens.colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search camps..."
            placeholderTextColor={tokens.colors.gray[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={tokens.colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={tokens.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
        contentContainerStyle={styles.quickFiltersContent}
      >
        {['All', 'Camp', 'Detection', 'Showcase', 'Training'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.quickFilterChip,
              filters.type === type && styles.quickFilterChipActive,
            ]}
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                type: type === 'All' ? undefined : (type.toUpperCase() as CampType),
              }))
            }
          >
            <Text
              style={[
                styles.quickFilterText,
                filters.type === type && styles.quickFilterTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Camps List */}
      <FlatList
        data={filteredCamps}
        renderItem={renderCamp}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      />

      {/* My Camps Button */}
      <TouchableOpacity
        style={styles.myCampsButton}
        onPress={() => navigation.navigate('MyCamps' as any)}
      >
        <Text style={styles.myCampsText}>My Camps</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    ...typography.heading1,
    fontSize: tokens.fontSize['4xl'],
    marginBottom: 8,
  },
  headerSubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyBase,
    color: tokens.colors.text.primary,
  },
  filterButton: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  quickFilters: {
    maxHeight: 40,
    marginBottom: 16,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  quickFilterChipActive: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  quickFilterText: {
    ...typography.bodySmall,
    color: tokens.colors.text.secondary,
  },
  quickFilterTextActive: {
    color: tokens.colors.arcane.black,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  campCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    overflow: 'hidden',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  typeBadgeText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  cardContent: {
    padding: 16,
  },
  campName: {
    ...typography.heading3,
    marginBottom: 4,
    marginRight: 80,
  },
  clubName: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  ageRange: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginTop: 4,
    marginBottom: 8,
  },
  availabilityContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  availabilityBar: {
    height: 4,
    backgroundColor: tokens.colors.arcane.slate,
    borderRadius: 2,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    ...typography.heading4,
    color: tokens.colors.yellow.DEFAULT,
  },
  showcaseBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F97316', // Orange
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  showcaseText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    marginTop: 12,
  },
  emptyTitle: {
    ...typography.heading3,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
  myCampsButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  myCampsText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
});

export default CampsListScreen;