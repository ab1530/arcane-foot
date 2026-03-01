import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Filter,
  TrendingUp,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  ChevronRight,
  Sparkles,
  Target,
  Trophy,
  Calendar,
  DollarSign,
  Globe,
  Star
} from 'lucide-react-native';
import { useGlobalSearch, SearchEntityType, SearchResult, SearchFilters } from '../../hooks/useGlobalSearch';
import { tokens } from '../../design/tokens';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../types/navigation';
import { useLocalization } from '../../contexts/LocalizationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { t } = useLocalization();
  const {
    query,
    results,
    loading,
    error,
    filters,
    recentSearches,
    suggestions,
    search,
    searchImmediate,
    updateFilters,
    clearSearch,
    clearRecentSearches,
    getTrendingSearches,
    setQuery
  } = useGlobalSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<SearchEntityType[]>(['all']);
  const [activeTab, setActiveTab] = useState<'all' | 'players' | 'clubs' | 'camps' | 'reports'>('all');
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Focus search input on mount
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    // Animate content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleSearch = (text: string) => {
    search(text, filters);
  };

  const handleTypeToggle = (type: SearchEntityType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];

    if (newTypes.length === 0) {
      setSelectedTypes(['all']);
      updateFilters({ ...filters, types: ['all'] });
    } else {
      setSelectedTypes(newTypes);
      updateFilters({ ...filters, types: newTypes });
    }
  };

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'player':
        navigation.navigate('Players', {
          viewMode: 'LIST',
          initialSearch: result.title,
        });
        break;
      case 'club':
        navigation.navigate('ClubDetail', { clubId: result.id });
        break;
      case 'camp':
        navigation.navigate('CampDetail', { campId: result.id });
        break;
      case 'report':
        navigation.navigate('ReportDetail', { reportId: result.id });
        break;
      default:
        break;
    }
  };

  const handleRecentSearchPress = (recentSearch: any) => {
    setQuery(recentSearch.query);
    searchImmediate(recentSearch.query, recentSearch.filters);
  };

  const getEntityIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'player':
        return <User size={16} color={tokens.colors.gray[400]} />;
      case 'club':
        return <Users size={16} color={tokens.colors.gray[400]} />;
      case 'camp':
        return <MapPin size={16} color={tokens.colors.gray[400]} />;
      case 'report':
        return <FileText size={16} color={tokens.colors.gray[400]} />;
      default:
        return <Search size={16} color={tokens.colors.gray[400]} />;
    }
  };

  const getEntityColor = (type: SearchEntityType) => {
    switch (type) {
      case 'player':
        return tokens.colors.blue[500];
      case 'club':
        return tokens.colors.purple[500];
      case 'camp':
        return tokens.colors.semantic.success;
      case 'report':
        return tokens.colors.orange[500];
      default:
        return tokens.colors.yellow.DEFAULT;
    }
  };

  const renderResultCard = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.resultImage} />
        ) : (
          <View style={[styles.resultImagePlaceholder, { backgroundColor: getEntityColor(item.type) }]}>
            {getEntityIcon(item.type)}
          </View>
        )}
        <View style={[styles.resultTypeBadge, { backgroundColor: getEntityColor(item.type) }]}>
          <Text style={styles.resultTypeText}>
            {item.type.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
        {item.description && (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.score && (
          <View style={styles.resultScore}>
            <Star size={12} color={tokens.colors.yellow.DEFAULT} fill={tokens.colors.yellow.DEFAULT} />
            <Text style={styles.resultScoreText}>
              {(item.score * 100).toFixed(0)}% match
            </Text>
          </View>
        )}
      </View>

      <ChevronRight size={20} color={tokens.colors.gray[400]} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (query && !loading) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color={tokens.colors.gray[500]} />
          <Text style={styles.emptyStateTitle}>No results found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    const trendingSearches = getTrendingSearches();

    return (
      <ScrollView style={styles.emptyContainer} showsVerticalScrollIndicator={false}>
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={tokens.colors.gray[400]} />
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.slice(0, 5).map((recent, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => handleRecentSearchPress(recent)}
              >
                <Clock size={16} color={tokens.colors.gray[500]} />
                <Text style={styles.recentText}>{recent.query}</Text>
                <ChevronRight size={16} color={tokens.colors.gray[500]} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Trending Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={tokens.colors.yellow.DEFAULT} />
            <Text style={styles.sectionTitle}>Trending</Text>
          </View>
          <View style={styles.trendingGrid}>
            {trendingSearches.map((trending, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingChip}
                onPress={() => {
                  setQuery(trending);
                  searchImmediate(trending);
                }}
              >
                <Sparkles size={14} color={tokens.colors.yellow.DEFAULT} />
                <Text style={styles.trendingText}>{trending}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={tokens.colors.blue[500]} />
            <Text style={styles.sectionTitle}>Quick Search</Text>
          </View>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                setSelectedTypes(['player']);
                updateFilters({ types: ['player'] });
              }}
            >
              <User size={24} color={tokens.colors.blue[500]} />
              <Text style={styles.quickActionText}>Players</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                setSelectedTypes(['club']);
                updateFilters({ types: ['club'] });
              }}
            >
              <Users size={24} color={tokens.colors.purple[500]} />
              <Text style={styles.quickActionText}>Clubs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                setSelectedTypes(['camp']);
                updateFilters({ types: ['camp'] });
              }}
            >
              <MapPin size={24} color={tokens.colors.semantic.success} />
              <Text style={styles.quickActionText}>Camps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                setSelectedTypes(['report']);
                updateFilters({ types: ['report'] });
              }}
            >
              <FileText size={24} color={tokens.colors.orange[500]} />
              <Text style={styles.quickActionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={tokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Entity Types */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Search In</Text>
              <View style={styles.filterChips}>
                {(['all', 'player', 'club', 'camp', 'report'] as SearchEntityType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      selectedTypes.includes(type) && styles.filterChipActive
                    ]}
                    onPress={() => handleTypeToggle(type)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedTypes.includes(type) && styles.filterChipTextActive
                    ]}>
                      {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* More filters can be added here */}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSelectedTypes(['all']);
                updateFilters({});
              }}
            >
              <Text style={styles.modalButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.modalButtonTextPrimary}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Search size={20} color={tokens.colors.gray[400]} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search players, clubs, camps..."
              placeholderTextColor={tokens.colors.gray[500]}
              value={query}
              onChangeText={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <X size={20} color={tokens.colors.gray[400]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <Filter size={20} color={tokens.colors.text.primary} />
              {Object.keys(filters).length > 0 && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
          </View>

          {/* Type Tabs */}
          {results.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsContainer}
            >
              {['all', 'players', 'clubs', 'camps', 'reports'].map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    activeTab === tab && styles.tabActive
                  ]}
                  onPress={() => setActiveTab(tab as any)}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive
                  ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                  {activeTab === tab && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results.filter(r => activeTab === 'all' || r.type === activeTab.slice(0, -1))}
              renderItem={renderResultCard}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            renderEmptyState()
          )}
        </Animated.View>

        {renderFiltersModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    paddingHorizontal: tokens.spacing[4],
    paddingBottom: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.fontSize.base,
    color: tokens.colors.text.primary,
    marginHorizontal: tokens.spacing[2],
  },
  filterButton: {
    marginLeft: tokens.spacing[2],
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.yellow.DEFAULT,
  },
  tabsContainer: {
    marginTop: tokens.spacing[2],
  },
  tab: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    marginRight: tokens.spacing[2],
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.yellow.DEFAULT,
  },
  tabText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  tabTextActive: {
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: tokens.fontWeight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: tokens.colors.yellow.DEFAULT,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: tokens.spacing[3],
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  resultsList: {
    paddingVertical: tokens.spacing[2],
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.background.secondary,
    marginHorizontal: tokens.spacing[4],
  },
  resultImageContainer: {
    position: 'relative',
    marginRight: tokens.spacing[3],
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: tokens.radius.md,
  },
  resultImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: tokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTypeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: tokens.spacing[1],
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
  },
  resultTypeText: {
    fontSize: 10,
    color: tokens.colors.white,
    fontWeight: tokens.fontWeight.bold,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.tertiary,
    lineHeight: tokens.lineHeight.snug,
  },
  resultScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultScoreText: {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.yellow.DEFAULT,
    marginLeft: 4,
  },
  separator: {
    height: tokens.spacing[2],
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[6],
  },
  emptyStateTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[4],
  },
  emptyStateText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[2],
    textAlign: 'center',
  },
  section: {
    padding: tokens.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  sectionTitle: {
    flex: 1,
    fontSize: tokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing[2],
  },
  clearButton: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.yellow.DEFAULT,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.borderLight,
  },
  recentText: {
    flex: 1,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginLeft: tokens.spacing[2],
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -tokens.spacing[1],
    marginRight: -tokens.spacing[1],
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    marginTop: tokens.spacing[1],
    marginRight: tokens.spacing[1],
  },
  trendingText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.primary,
    marginLeft: tokens.spacing[1],
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -tokens.spacing[2],
    marginRight: -tokens.spacing[2],
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - tokens.spacing[4] * 2 - tokens.spacing[2] * 2) / 2,
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    marginTop: tokens.spacing[2],
    marginRight: tokens.spacing[2],
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[2],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: tokens.colors.background.primary,
    borderTopLeftRadius: tokens.radius['2xl'],
    borderTopRightRadius: tokens.radius['2xl'],
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.border,
  },
  modalTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  modalBody: {
    padding: tokens.spacing[4],
  },
  filterSection: {
    marginBottom: tokens.spacing[4],
  },
  filterSectionTitle: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[2],
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -tokens.spacing[1],
    marginRight: -tokens.spacing[1],
  },
  filterChip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    backgroundColor: tokens.colors.background.tertiary,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    borderColor: tokens.colors.surface.border,
    marginTop: tokens.spacing[1],
    marginRight: tokens.spacing[1],
  },
  filterChipActive: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  filterChipText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  filterChipTextActive: {
    color: tokens.colors.background.primary,
    fontWeight: tokens.fontWeight.semibold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: tokens.colors.surface.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.surface.border,
    alignItems: 'center',
    marginRight: tokens.spacing[2],
  },
  modalButtonPrimary: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
    marginRight: 0,
  },
  modalButtonText: {
    fontSize: tokens.fontSize.base,
    color: tokens.colors.text.secondary,
  },
  modalButtonTextPrimary: {
    fontSize: tokens.fontSize.base,
    color: tokens.colors.background.primary,
    fontWeight: tokens.fontWeight.semibold,
  },
});

export default GlobalSearchScreen;
