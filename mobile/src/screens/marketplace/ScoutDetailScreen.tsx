import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  Star,
  Heart,
  MapPin,
  BadgeCheck,
  Mail,
  Phone,
  Globe,
  Award,
  FileText,
  TrendingUp,
  MessageCircle,
  Share2,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design/theme';
import { Button, GlassCard, LoadingSpinner } from '../../components/ui';
import ExpertiseBadge from '../../components/marketplace/ExpertiseBadge';
import StatsCard from '../../components/marketplace/StatsCard';
import { marketplaceApi } from '../../services/marketplace.api';
import type { MarketplaceListing, MarketplaceReview } from '../../types/marketplace';
import { logError } from '../../utils/logger';

const ScoutDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { listingId } = route.params;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchListingDetails();
    fetchReviews();
  }, [listingId]);

  const fetchListingDetails = async () => {
    try {
      setLoading(true);
      const data = await marketplaceApi.getListingById(listingId);
      setListing(data);
      setIsFavorite(data.isFavorite || false);
    } catch (error) {
      logError('Failed to fetch listing details', error);
      Alert.alert('Error', 'Failed to load scout details. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await marketplaceApi.getListingReviews(listingId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      logError('Failed to fetch reviews', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const result = await marketplaceApi.toggleFavorite(listingId);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      logError('Failed to toggle favorite', error);
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const handleContact = () => {
    Alert.alert(
      'Contact Scout',
      'Would you like to send an offer to this scout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Offer',
          onPress: () => {
            // Navigate to offer creation screen
            navigation.navigate('CreateOffer', { listingId: listing?.id });
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      const scoutUser = listing.scout?.user ?? (listing as any).users;
      const first = scoutUser?.firstName ?? '';
      const last = scoutUser?.lastName ?? '';
      const name = `${first} ${last}`.trim() || 'Scout';
      await Share.share({
        message: `Check out ${name} on Arcane Football - ${listing.headline}`,
        title: 'Scout Profile',
      });
    } catch (error) {
      logError('Failed to share', error);
    }
  };

  const getAvatarUri = () => {
    if (!listing) return '';
    const scoutUser = listing.scout?.user ?? (listing as any).users;
    const first = scoutUser?.firstName ?? '';
    const last = scoutUser?.lastName ?? '';
    const avatar = scoutUser?.avatar ?? null;
    if (avatar) return avatar;
    const seed = `${first}+${last}`.trim() || listing.headline || 'Scout';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=E4FF3B&color=080C1D&size=400`;
  };

  const formatPrice = () => {
    if (!listing) return '';
    const pricing =
      listing.pricing ?? ({
        hourlyRate: (listing as any).hourlyRate,
        matchRate: (listing as any).matchRate,
        reportRate: (listing as any).reportRate,
        currency: (listing as any).currency ?? 'EUR',
      } as any);
    const parts = [];
    if (pricing.hourlyRate) parts.push(`€${pricing.hourlyRate}/hr`);
    if (pricing.matchRate) parts.push(`€${pricing.matchRate}/match`);
    if (pricing.reportRate) parts.push(`€${pricing.reportRate}/report`);
    return parts.length > 0 ? parts.join(' • ') : 'Contact for pricing';
  };

  const renderReviewItem = (review: MarketplaceReview) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewClubInfo}>
          {((review as any).club?.logo ?? (review as any).clubs?.logo) && (
            <Image
              source={{ uri: ((review as any).club?.logo ?? (review as any).clubs?.logo) as string }}
              style={styles.reviewClubLogo}
            />
          )}
          <View>
            <Text style={styles.reviewClubName}>
              {((review as any).club?.name ?? (review as any).clubs?.name) || 'Club'}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date((review as any).reviewedAt ?? review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          <Star size={16} color={colors.semantic.warning} fill={colors.semantic.warning} />
          <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
        </View>
      </View>
      {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
      {typeof review.professionalism === 'number' &&
      typeof review.communication === 'number' &&
      typeof review.qualityOfWork === 'number' &&
      typeof review.timeliness === 'number' ? (
        <View style={styles.reviewMetrics}>
          <View style={styles.reviewMetric}>
            <Text style={styles.reviewMetricLabel}>Professionalism</Text>
            <Text style={styles.reviewMetricValue}>{review.professionalism}/5</Text>
          </View>
          <View style={styles.reviewMetric}>
            <Text style={styles.reviewMetricLabel}>Communication</Text>
            <Text style={styles.reviewMetricValue}>{review.communication}/5</Text>
          </View>
          <View style={styles.reviewMetric}>
            <Text style={styles.reviewMetricLabel}>Quality</Text>
            <Text style={styles.reviewMetricValue}>{review.qualityOfWork}/5</Text>
          </View>
          <View style={styles.reviewMetric}>
            <Text style={styles.reviewMetricLabel}>Timeliness</Text>
            <Text style={styles.reviewMetricValue}>{review.timeliness}/5</Text>
          </View>
        </View>
      ) : null}
    </View>
  );

  if (loading || !listing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const scoutUser = listing.scout?.user ?? (listing as any).users;
  const isVerified = (listing.scout?.isVerified ?? (listing as any).isVerified) as boolean;
  const country =
    scoutUser?.country ??
    (listing.availability as any)?.countries?.[0] ??
    null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image source={{ uri: getAvatarUri() }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                style={styles.heroButton}
              >
                <Heart
                  size={24}
                  color={isFavorite ? colors.semantic.error : colors.text.primary}
                  fill={isFavorite ? colors.semantic.error : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.heroButton}>
                <Share2 size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.heroInfo}>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>
                    {(scoutUser?.firstName ?? '')} {(scoutUser?.lastName ?? '')}
                  </Text>
                  {isVerified && (
                    <BadgeCheck
                      size={24}
                      color={colors.brand.primary}
                      fill={colors.brand.primary}
                    />
                  )}
                </View>
                <Text style={styles.heroHeadline}>{listing.headline}</Text>
                {country && (
                  <View style={styles.heroLocation}>
                    <MapPin size={16} color={colors.text.secondary} />
                    <Text style={styles.heroLocationText}>
                      {country}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatsCard
            icon={Star}
            value={listing.stats.avgRating.toFixed(1)}
            label="Rating"
            iconColor={colors.semantic.warning}
            size="sm"
          />
          <StatsCard
            icon={FileText}
            value={listing.stats.totalReports}
            label="Reports"
            iconColor={colors.semantic.info}
            size="sm"
          />
          <StatsCard
            icon={Award}
            value={listing.stats.completedOffers}
            label="Completed"
            iconColor={colors.semantic.success}
            size="sm"
          />
        </View>

        {/* Pricing */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <Text style={styles.pricingText}>{formatPrice()}</Text>
        </GlassCard>

        {/* About */}
        {listing.bio && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{listing.bio}</Text>
          </GlassCard>
        )}

        {/* Expertise */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>

          <View style={styles.expertiseBlock}>
            <Text style={styles.expertiseLabel}>Leagues</Text>
            <View style={styles.expertiseTags}>
              {listing.expertise.leagues.map((league, index) => (
                <ExpertiseBadge key={index} label={league} type="league" />
              ))}
            </View>
          </View>

          <View style={styles.expertiseBlock}>
            <Text style={styles.expertiseLabel}>Positions</Text>
            <View style={styles.expertiseTags}>
              {listing.expertise.positions.map((position, index) => (
                <ExpertiseBadge key={index} label={position} type="position" />
              ))}
            </View>
          </View>

          <View style={styles.expertiseBlock}>
            <Text style={styles.expertiseLabel}>Age Groups</Text>
            <View style={styles.expertiseTags}>
              {listing.expertise.ageGroups.map((ageGroup, index) => (
                <ExpertiseBadge key={index} label={ageGroup} type="ageGroup" />
              ))}
            </View>
          </View>

          <View style={styles.expertiseBlock}>
            <Text style={styles.expertiseLabel}>Languages</Text>
            <View style={styles.expertiseTags}>
              {listing.languages.map((language, index) => (
                <ExpertiseBadge key={index} label={language} type="language" />
              ))}
            </View>
          </View>
        </GlassCard>

        {/* Availability */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.expertiseTags}>
            {listing.availability.countries.map((country, index) => (
              <ExpertiseBadge key={index} label={country} type="country" />
            ))}
          </View>
          {listing.availability.travelRadius && (
            <Text style={styles.travelRadiusText}>
              Travel radius: {listing.availability.travelRadius} km
            </Text>
          )}
        </GlassCard>

        {/* Reviews */}
        {reviews.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>
              Reviews ({listing.stats.totalReviews})
            </Text>
            {reviews.map(renderReviewItem)}
          </GlassCard>
        )}
      </ScrollView>

      {/* Contact CTA */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleContact}
          icon={<MessageCircle size={20} color={colors.background.primary} />}
          style={styles.contactButton}
        >
          Send Offer
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  hero: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 12, 29, 0.6)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroName: {
    fontSize: typography.sizes.h2,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroHeadline: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroLocationText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.h5,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  pricingText: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.brand.primary,
  },
  bioText: {
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
  },
  expertiseBlock: {
    marginBottom: spacing.lg,
  },
  expertiseLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  travelRadiusText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  reviewCard: {
    backgroundColor: colors.surface.glass,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewClubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewClubLogo: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
  },
  reviewClubName: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  reviewDate: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  reviewRatingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  reviewComment: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  reviewMetrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  reviewMetric: {
    flex: 1,
  },
  reviewMetricLabel: {
    fontSize: typography.sizes.xxs,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    marginBottom: spacing.xxs,
  },
  reviewMetricValue: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.semiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.text.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    ...shadows.lg,
  },
  contactButton: {
    width: '100%',
  },
});

export default ScoutDetailScreen;
