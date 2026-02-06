/**
 * MY CAMPS SCREEN
 * Display user's registered camps (past, current, upcoming)
 *
 * Features:
 * - Tabs for upcoming/past camps
 * - Camp registration cards
 * - QR codes for check-in
 * - Cancel registration
 *
 * @version 1.0.0
 * @date 2025-11-16
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  QrCode,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { tokens, typography } from '../../design';
import type { Camp, CampParticipant, ParticipantStatus } from '../../types/camps';
import type { AppStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

// Mock registered camps data
const mockMyCamps: (Camp & { registration: CampParticipant })[] = [
  {
    id: '1',
    name: 'Summer Elite Training Camp',
    description: 'Intensive 5-day training program',
    type: 'CAMP',
    status: 'PUBLISHED',
    location: 'Camp Nou Training Facility',
    city: 'Barcelona',
    country: 'Spain',
    startDate: '2025-07-15',
    endDate: '2025-07-20',
    capacity: 30,
    availableSpots: 12,
    price: 1500,
    currency: 'EUR',
    requiresPayment: true,
    includedBenefits: [],
    hasShowcaseGame: true,
    club: {
      id: 'fcb',
      name: 'FC Barcelona',
    },
    registration: {
      id: 'reg1',
      campId: '1',
      playerId: 'player1',
      status: 'CONFIRMED' as ParticipantStatus,
      registeredAt: '2025-05-01T10:00:00Z',
      parentalConsentGiven: true,
      medicalWaiverSigned: true,
    },
  },
  {
    id: '2',
    name: 'Spring Detection Day',
    description: 'One-day talent detection',
    type: 'DETECTION',
    status: 'COMPLETED',
    location: 'Stade de France',
    city: 'Paris',
    country: 'France',
    startDate: '2025-03-10',
    endDate: '2025-03-10',
    capacity: 100,
    availableSpots: 0,
    price: 150,
    currency: 'EUR',
    requiresPayment: true,
    includedBenefits: [],
    hasShowcaseGame: false,
    registration: {
      id: 'reg2',
      campId: '2',
      playerId: 'player1',
      status: 'ATTENDED' as ParticipantStatus,
      registeredAt: '2025-02-01T10:00:00Z',
      parentalConsentGiven: true,
      medicalWaiverSigned: true,
    },
  },
];

// Tab Component
const TabSelector: React.FC<{
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => onTabChange(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Camp Registration Card
const CampRegistrationCard: React.FC<{
  camp: Camp & { registration: CampParticipant };
  onPress: () => void;
  onCancel: () => void;
  onShowQR: () => void;
}> = ({ camp, onPress, onCancel, onShowQR }) => {
  const startDate = new Date(camp.startDate);
  const endDate = new Date(camp.endDate);
  const isUpcoming = startDate > new Date();
  const isPast = endDate < new Date();
  const isOngoing = !isUpcoming && !isPast;

  const statusConfig = {
    REGISTERED: {
      color: tokens.colors.blue[500],
      icon: Clock,
      text: 'Registered',
    },
    CONFIRMED: {
      color: tokens.colors.semantic.success,
      icon: CheckCircle,
      text: 'Confirmed',
    },
    CANCELLED: {
      color: tokens.colors.semantic.error,
      icon: XCircle,
      text: 'Cancelled',
    },
    ATTENDED: {
      color: tokens.colors.purple[500],
      icon: CheckCircle,
      text: 'Attended',
    },
    NO_SHOW: {
      color: tokens.colors.gray[500],
      icon: XCircle,
      text: 'No Show',
    },
  };

  const status = statusConfig[camp.registration.status];

  return (
    <TouchableOpacity style={styles.campCard} onPress={onPress} activeOpacity={0.8}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
        <status.icon size={12} color={tokens.colors.white} />
        <Text style={styles.statusBadgeText}>{status.text}</Text>
      </View>

      {/* Camp Type Badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{camp.type}</Text>
      </View>

      {/* Camp Info */}
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

      {/* Time Status */}
      <View style={styles.timeStatusContainer}>
        {isUpcoming && (
          <View style={styles.timeStatus}>
            <Clock size={14} color={tokens.colors.blue[500]} />
            <Text style={[styles.timeStatusText, { color: tokens.colors.blue[500] }]}>
              Starts in {Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </View>
        )}
        {isOngoing && (
          <View style={styles.timeStatus}>
            <AlertCircle size={14} color={tokens.colors.yellow.DEFAULT} />
            <Text style={[styles.timeStatusText, { color: tokens.colors.yellow.DEFAULT }]}>
              Ongoing
            </Text>
          </View>
        )}
        {isPast && (
          <View style={styles.timeStatus}>
            <CheckCircle size={14} color={tokens.colors.gray[500]} />
            <Text style={[styles.timeStatusText, { color: tokens.colors.gray[500] }]}>
              Completed
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {isUpcoming && camp.registration.status === 'CONFIRMED' && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onShowQR}>
            <QrCode size={18} color={tokens.colors.text.primary} />
            <Text style={styles.actionButtonText}>Show QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <XCircle size={18} color={tokens.colors.semantic.error} />
            <Text style={[styles.actionButtonText, { color: tokens.colors.semantic.error }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Main Component
export const MyCampsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [myCamps] = useState(mockMyCamps);

  // Filter camps by tab
  const filteredCamps = useMemo(() => {
    const now = new Date();
    if (activeTab === 'Upcoming') {
      return myCamps.filter((camp) => new Date(camp.startDate) > now);
    } else {
      return myCamps.filter((camp) => new Date(camp.endDate) <= now);
    }
  }, [myCamps, activeTab]);

  // Handlers
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refetch from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCampPress = useCallback(
    (campId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('CampDetail' as any, { campId });
    },
    [navigation]
  );

  const handleCancelRegistration = useCallback((campId: string) => {
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration for this camp?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // TODO: API call to cancel registration
            Alert.alert('Registration Cancelled', 'Your registration has been cancelled.');
          },
        },
      ]
    );
  }, []);

  const handleShowQR = useCallback((campId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Navigate to QR code screen
    Alert.alert('QR Code', 'QR code feature coming soon!');
  }, []);

  const renderCamp = useCallback(
    ({ item }: { item: Camp & { registration: CampParticipant } }) => (
      <CampRegistrationCard
        camp={item}
        onPress={() => handleCampPress(item.id)}
        onCancel={() => handleCancelRegistration(item.id)}
        onShowQR={() => handleShowQR(item.id)}
      />
    ),
    [handleCampPress, handleCancelRegistration, handleShowQR]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Calendar size={48} color={tokens.colors.gray[500]} />
      <Text style={styles.emptyTitle}>
        No {activeTab.toLowerCase()} camps
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'Upcoming'
          ? 'Register for camps to see them here'
          : 'Your past camps will appear here'}
      </Text>
      {activeTab === 'Upcoming' && (
        <TouchableOpacity
          style={styles.browseCampsButton}
          onPress={() => navigation.navigate('Camps' as any)}
        >
          <Text style={styles.browseCampsText}>Browse Camps</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Camps</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <TabSelector
        tabs={['Upcoming', 'Past']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Camps List */}
      <FlatList
        data={filteredCamps}
        renderItem={renderCamp}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredCamps.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.yellow.DEFAULT}
          />
        }
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.heading2,
    fontSize: tokens.fontSize['2xl'],
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: tokens.colors.yellow.DEFAULT,
  },
  tabText: {
    ...typography.bodyBase,
    color: tokens.colors.gray[400],
  },
  tabTextActive: {
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  campCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: tokens.colors.surface.borderLight,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    ...typography.caption,
    color: tokens.colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.arcane.slate,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  typeBadgeText: {
    ...typography.caption,
    color: tokens.colors.gray[300],
    fontWeight: '600',
    fontSize: 10,
  },
  campName: {
    ...typography.heading4,
    marginBottom: 4,
    paddingRight: 80,
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
    marginBottom: 6,
  },
  infoText: {
    ...typography.caption,
    color: tokens.colors.gray[400],
  },
  timeStatusContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  timeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeStatusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: tokens.colors.arcane.slate,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.semantic.error,
  },
  actionButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 24,
  },
  browseCampsButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseCampsText: {
    ...typography.buttonText,
    color: tokens.colors.arcane.black,
    fontWeight: '700',
  },
});

export default MyCampsScreen;