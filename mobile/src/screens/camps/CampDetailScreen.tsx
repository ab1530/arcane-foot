/**
 * CAMP DETAIL SCREEN
 * Detailed view of a training camp with registration functionality
 *
 * Features:
 * - Camp information display
 * - Image gallery
 * - Benefits list
 * - Registration form
 * - Participant list (for scouts/coaches)
 *
 * @version 1.0.0
 * @date 2025-11-16
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Check,
  Info,
  Shield,
  Award,
  Clock,
  ChevronRight,
  Share2,
  Heart,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import type { Camp } from '../../types/camps';
import type { AppStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Mock data - will be replaced with API call
const mockCamp: Camp = {
  id: '1',
  name: 'Summer Elite Training Camp',
  description: `Join us for an intensive 5-day training program designed specifically for elite players looking to take their game to the next level.

This camp offers professional-level coaching, state-of-the-art facilities, and the opportunity to train alongside other talented players from around the world.

Our experienced coaches will focus on technical skills, tactical understanding, physical conditioning, and mental preparation. Each day includes multiple training sessions, video analysis, and individual feedback.`,
  type: 'CAMP',
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
  requiredTier: 'GOLD',
  coverImage: 'https://via.placeholder.com/400x200',
  includedBenefits: [
    'Professional coaching from UEFA licensed coaches',
    'Full board accommodation in 4-star hotel',
    'All meals (breakfast, lunch, dinner)',
    'Official training kit (jersey, shorts, socks)',
    'Video analysis sessions',
    'Individual performance reports',
    'Certificate of participation',
    'Showcase game with scouts attending',
  ],
  hasShowcaseGame: true,
  club: {
    id: 'fcb',
    name: 'FC Barcelona',
    logo: 'https://via.placeholder.com/50x50',
  },
};

// Registration Form Component
const RegistrationForm: React.FC<{ camp: Camp; onSubmit: () => void }> = ({
  camp,
  onSubmit,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Registration Successful',
        'You have been registered for this camp. You will receive a confirmation email shortly.',
        [{ text: 'OK', onPress: onSubmit }]
      );
    }, 1500);
  };

  return (
    <View style={styles.registrationForm}>
      <Text style={styles.formTitle}>Register for this Camp</Text>

      {/* Terms Agreement */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreed(!agreed)}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Check size={16} color={tokens.colors.arcane.black} />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the terms and conditions and camp policies
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.registerButton, !agreed && styles.registerButtonDisabled]}
        onPress={handleSubmit}
        disabled={!agreed || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tokens.colors.arcane.black} />
        ) : (
          <Text style={styles.registerButtonText}>
            Register Now - {camp.price} {camp.currency}
          </Text>
        )}
      </TouchableOpacity>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Shield size={16} color={tokens.colors.gray[400]} />
        <Text style={styles.paymentInfoText}>
          Secure payment processed by Stripe
        </Text>
      </View>
    </View>
  );
};

// Main Component
export const CampDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [camp] = useState(mockCamp);
  const [loading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const startDate = new Date(camp.startDate);
  const endDate = new Date(camp.endDate);
  const duration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
  );
  const spotsPercentage = ((camp.capacity - camp.availableSpots) / camp.capacity) * 100;

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon');
  }, []);

  const handleFavorite = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFavorite(!isFavorite);
  }, [isFavorite]);

  const handleLocationPress = useCallback(() => {
    const address = `${camp.location}, ${camp.city}, ${camp.country}`;
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  }, [camp]);

  const handleRegistrationComplete = useCallback(() => {
    navigation.navigate('MyCamps' as any);
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.yellow.DEFAULT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Cover Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: camp.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ArrowLeft size={24} color={tokens.colors.white} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={20} color={tokens.colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
                <Heart
                  size={20}
                  color={tokens.colors.white}
                  fill={isFavorite ? tokens.colors.white : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Camp Info */}
        <View style={styles.content}>
          {/* Title and Type */}
          <View style={styles.titleSection}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{camp.type}</Text>
            </View>
            <Text style={styles.campName}>{camp.name}</Text>
            {camp.club && (
              <View style={styles.clubRow}>
                <Image source={{ uri: camp.club.logo }} style={styles.clubLogo} />
                <Text style={styles.clubName}>{camp.club.name}</Text>
              </View>
            )}
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            {/* Location */}
            <TouchableOpacity style={styles.infoItem} onPress={handleLocationPress}>
              <MapPin size={18} color={tokens.colors.gray[400]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {camp.city}, {camp.country}
                </Text>
              </View>
              <ChevronRight size={16} color={tokens.colors.gray[400]} />
            </TouchableOpacity>

            {/* Dates */}
            <View style={styles.infoItem}>
              <Calendar size={18} color={tokens.colors.gray[400]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dates</Text>
                <Text style={styles.infoValue}>
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.infoItem}>
              <Clock size={18} color={tokens.colors.gray[400]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{duration} days</Text>
              </View>
            </View>

            {/* Age Range */}
            {camp.ageMin && camp.ageMax && (
              <View style={styles.infoItem}>
                <Users size={18} color={tokens.colors.gray[400]} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Age Range</Text>
                  <Text style={styles.infoValue}>
                    {camp.ageMin} - {camp.ageMax} years
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Availability */}
          <View style={styles.availabilitySection}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityText}>
                {camp.availableSpots} of {camp.capacity} spots remaining
              </Text>
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
              {spotsPercentage > 75 && (
                <View style={styles.warningRow}>
                  <Info size={14} color={tokens.colors.semantic.error} />
                  <Text style={styles.warningText}>Limited spots available!</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Camp</Text>
            <Text style={styles.description}>{camp.description}</Text>
          </View>

          {/* Benefits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {camp.includedBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Check size={16} color={tokens.colors.semantic.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Showcase Game Badge */}
          {camp.hasShowcaseGame && (
            <View style={styles.showcaseSection}>
              <Award size={24} color={tokens.colors.yellow.DEFAULT} />
              <View style={styles.showcaseContent}>
                <Text style={styles.showcaseTitle}>Showcase Game Included</Text>
                <Text style={styles.showcaseText}>
                  Professional scouts will attend the final showcase game
                </Text>
              </View>
            </View>
          )}

          {/* Registration Form */}
          <RegistrationForm camp={camp} onSubmit={handleRegistrationComplete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.arcane.black,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9999,
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9999,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 24,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.blue[500],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  typeBadgeText: {
    ...typography.caption,
    color: tokens.colors.white,
    fontWeight: '700',
    fontSize: 10,
  },
  campName: {
    ...typography.heading1,
    fontSize: tokens.fontSize['3xl'],
    marginBottom: 8,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clubLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  clubName: {
    ...typography.bodyBase,
    color: tokens.colors.yellow.DEFAULT,
  },
  quickInfo: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: tokens.colors.gray[400],
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodyBase,
    color: tokens.colors.text.primary,
  },
  availabilitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.heading3,
    marginBottom: 12,
  },
  availabilityInfo: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
  },
  availabilityText: {
    ...typography.bodySmall,
    color: tokens.colors.text.secondary,
    marginBottom: 12,
  },
  availabilityBar: {
    height: 8,
    backgroundColor: tokens.colors.arcane.slate,
    borderRadius: 4,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  warningText: {
    ...typography.caption,
    color: tokens.colors.semantic.error,
  },
  section: {
    marginBottom: 24,
  },
  description: {
    ...typography.bodyBase,
    color: tokens.colors.text.secondary,
    lineHeight: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    ...typography.bodyBase,
    color: tokens.colors.text.secondary,
    flex: 1,
  },
  showcaseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  showcaseContent: {
    flex: 1,
  },
  showcaseTitle: {
    ...typography.heading4,
    marginBottom: 4,
  },
  showcaseText: {
    ...typography.bodySmall,
    color: tokens.colors.text.secondary,
  },
  registrationForm: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    ...typography.heading3,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: tokens.colors.surface.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderColor: tokens.colors.yellow.DEFAULT,
  },
  checkboxText: {
    ...typography.bodySmall,
    color: tokens.colors.text.secondary,
    flex: 1,
  },
  registerButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentInfoText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
});

export default CampDetailScreen;
