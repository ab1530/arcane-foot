/**
 * COACH PROFILE SCREEN
 * Detailed coach profile with booking capability
 *
 * Features:
 * - Hero section with coach info
 * - About, expertise, availability sections
 * - Pricing and stats
 * - Reviews section
 * - Book session button
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageCircle,
  Share2,
  Heart,
  Clock,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import { useCoach, useCoachReviews } from '../../hooks/useCoaching';
import {
  RatingStars,
  ExpertiseBadge,
  ReviewCard,
  AvailabilityCalendar,
} from './components';
import type { AppStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type CoachProfileRouteProp = RouteProp<AppStackParamList, 'CoachProfile'>;

// ============================================================================
// COMPONENT
// ============================================================================

export const CoachProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CoachProfileRouteProp>();
  const { coachId } = route.params;

  // Queries
  const { data: coach, isLoading } = useCoach(coachId);
  const { data: reviewsData } = useCoachReviews(coachId);

  const reviews = reviewsData?.data || [];
  const displayReviews = reviews.slice(0, 3);

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBookSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('BookSession' as any, { coachId });
  }, [navigation, coachId]);

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to messaging
  }, []);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Share coach profile
  }, []);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Add to favorites
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Coach not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <ArrowLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 size={22} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleFavorite}>
            <Heart size={22} color={tokens.colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Avatar */}
          {coach.avatar ? (
            <Image source={{ uri: coach.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {coach.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Name and Title */}
          <Text style={styles.name}>{coach.name}</Text>
          <Text style={styles.title}>{coach.title}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <MapPin size={16} color={tokens.colors.gray[400]} />
            <Text style={styles.location}>{coach.location}</Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <RatingStars rating={coach.rating} size={20} />
            <Text style={styles.ratingText}>{coach.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({coach.reviewCount} reviews)</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleBookSession}
            >
              <Text style={styles.primaryButtonText}>Book Session</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleMessage}
            >
              <MessageCircle size={20} color={tokens.colors.text.primary} />
              <Text style={styles.secondaryButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{coach.bio}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Award size={16} color={tokens.colors.yellow.DEFAULT} />
              <Text style={styles.statText}>{coach.yearsExperience} years exp</Text>
            </View>
            <View style={styles.statBadge}>
              <Users size={16} color={tokens.colors.yellow.DEFAULT} />
              <Text style={styles.statText}>{coach.totalSessions} sessions</Text>
            </View>
          </View>
        </View>

        {/* Expertise Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.expertiseContainer}>
            {coach.expertise.map((exp, index) => (
              <ExpertiseBadge key={index} expertise={exp} />
            ))}
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Hourly Rate</Text>
              <View style={styles.priceValueContainer}>
                <Text style={styles.priceValue}>${coach.hourlyRate}</Text>
                <Text style={styles.priceUnit}>/hour</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color={tokens.colors.feature.coaching} />
              <Text style={styles.statValue}>{coach.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={24} color={tokens.colors.semantic.info} />
              <Text style={styles.statValue}>{coach.responseTime}</Text>
              <Text style={styles.statLabel}>Response Time</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color={tokens.colors.semantic.success} />
              <Text style={styles.statValue}>{coach.satisfactionRate}%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {displayReviews.map((review) => (
              <ReviewCard key={review.id} review={review} style={styles.reviewCard} />
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Book Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleBookSession}
        >
          <Text style={styles.floatingButtonText}>Book Session</Text>
          <Text style={styles.floatingButtonPrice}>${coach.hourlyRate}/hr</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    ...typography.heading3,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.borderLight,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    borderWidth: 3,
    borderColor: tokens.colors.yellow.DEFAULT,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    backgroundColor: tokens.colors.arcane.slate,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: tokens.colors.yellow.DEFAULT,
    marginBottom: 16,
  },
  avatarInitials: {
    ...typography.displayLarge,
    color: tokens.colors.yellow.DEFAULT,
  },
  name: {
    ...typography.heading1,
    fontSize: tokens.fontSize['3xl'],
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    ...typography.bodyLarge,
    color: tokens.colors.gray[300],
    textAlign: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  location: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingText: {
    ...typography.heading5,
  },
  reviewCount: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...tokens.shadows.glowYellow,
  },
  primaryButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
  },
  secondaryButtonText: {
    ...typography.buttonText,
    color: tokens.colors.text.primary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surface.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: 12,
  },
  bioText: {
    ...typography.bodyBase,
    lineHeight: tokens.fontSize.base * 1.6,
    color: tokens.colors.gray[300],
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.arcane.charcoal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statText: {
    ...typography.bodySmall,
    color: tokens.colors.gray[300],
    fontWeight: '600',
  },
  expertiseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pricingCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.bodyBase,
    color: tokens.colors.gray[300],
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    ...typography.heading2,
    color: tokens.colors.yellow.DEFAULT,
  },
  priceUnit: {
    ...typography.bodySmall,
    color: tokens.colors.gray[400],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    ...typography.heading3,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    textAlign: 'center',
  },
  viewAllText: {
    ...typography.bodySmall,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '600',
  },
  reviewCard: {
    marginBottom: 12,
  },
  bottomSpacing: {
    height: 16,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: tokens.colors.arcane.black,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.surface.borderLight,
  },
  floatingButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...tokens.shadows.glowYellow,
  },
  floatingButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  floatingButtonPrice: {
    ...typography.heading5,
    color: tokens.colors.arcane.black,
  },
  backButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
  },
});

export default CoachProfileScreen;
