import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInDown,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import {
  Card,
  Text,
  Heading,
  Caption,
  Badge,
  Button,
  theme,
} from '../../design/components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PlayerPassportProps {
  navigation: any;
  route: {
    params: {
      playerId?: string;
      player?: any;
    };
  };
}

export const PlayerPassport: React.FC<PlayerPassportProps> = ({ navigation, route }) => {
  const { playerId, player: passedPlayer } = route.params || {};

  // Transform real player data to passport format
  const player = useMemo(() => {
    if (!passedPlayer) {
      return {
        id: playerId || '1',
        name: 'Unknown Player',
        position: 'N/A',
        number: '?',
        club: { name: 'Free Agent', logo: '⚽' },
        nationality: { country: 'Unknown', flag: '🌍' },
        age: 0,
        height: 'N/A',
        weight: 'N/A',
        foot: 'N/A',
        marketValue: 'N/A',
        contractUntil: 'N/A',
        image: null,
        stats: {},
        performance: {},
        achievements: [],
        career: [],
      };
    }

    const realPlayer = passedPlayer;
    const arkaneIndex = realPlayer.statsJson?.arkaneIndex || {};

    // Calculate birth year from dateOfBirth
    const birthDate = realPlayer.dateOfBirth ? new Date(realPlayer.dateOfBirth) : null;
    const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : null;

    // Format contract date
    const contractDate = realPlayer.contractUntil ? new Date(realPlayer.contractUntil) : null;
    const contractYear = contractDate ? contractDate.getFullYear() : null;

    return {
      id: realPlayer.id,
      name: `${realPlayer.user?.firstName || realPlayer.users?.firstName || ''} ${realPlayer.user?.lastName || realPlayer.users?.lastName || ''}`.trim(),
      position: realPlayer.position || 'N/A',
      number: realPlayer.jerseyNumber || realPlayer.number || '?',
      club: {
        name: realPlayer.club?.name || realPlayer.clubs?.name || 'Free Agent',
        logo: realPlayer.club?.logo || realPlayer.clubs?.logo || '⚽',
      },
      nationality: {
        country: realPlayer.nationality || 'Unknown',
        flag: '🌍', // Could map country to flag
      },
      age: age || 0,
      height: realPlayer.height ? `${realPlayer.height} cm` : 'N/A',
      weight: realPlayer.weight ? `${realPlayer.weight} kg` : 'N/A',
      foot: realPlayer.preferredFoot || 'N/A',
      marketValue: realPlayer.marketValue ? `€${(realPlayer.marketValue / 1000000).toFixed(1)}M` : 'N/A',
      contractUntil: contractYear ? contractYear.toString() : 'N/A',
      image: realPlayer.photoUrl || realPlayer.user?.avatar || realPlayer.users?.avatar || null,
      stats: {
        overall: Math.round((arkaneIndex.technical + arkaneIndex.physical + arkaneIndex.mental + arkaneIndex.tactical) / 4) || 75,
        technical: arkaneIndex.technical || 0,
        physical: arkaneIndex.physical || 0,
        mental: arkaneIndex.mental || 0,
        tactical: arkaneIndex.tactical || 0,
        potential: arkaneIndex.potential || 0,
        consistency: arkaneIndex.consistency || 0,
      },
      performance: {
        goals: realPlayer.statsJson?.goals || 0,
        assists: realPlayer.statsJson?.assists || 0,
        matches: realPlayer.statsJson?.matchesPlayed || 0,
        yellowCards: realPlayer.statsJson?.yellowCards || 0,
        redCards: realPlayer.statsJson?.redCards || 0,
        minutesPlayed: realPlayer.statsJson?.minutesPlayed || 0,
      },
      achievements: [],
      career: [],
    };
  }, [passedPlayer, playerId]);

  const [activeTab, setActiveTab] = useState('stats');
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(SCREEN_HEIGHT * 0.4);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, 200],
      [headerHeight.value, headerHeight.value * 0.6],
      Extrapolate.CLAMP
    ),
    opacity: interpolate(
      scrollY.value,
      [0, 150],
      [1, 0.9],
      Extrapolate.CLAMP
    ),
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [0, 200],
          [1, 0.8],
          Extrapolate.CLAMP
        ),
      },
      {
        translateY: interpolate(
          scrollY.value,
          [0, 200],
          [0, -30],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const renderStatBar = (label: string, value: number, color: string, delay: number) => (
    <Animated.View
      entering={SlideInRight.delay(delay).springify()}
      style={styles.statRow}
    >
      <Text variant="body" style={styles.statLabel}>
        {label}
      </Text>
      <View style={styles.statBarContainer}>
        <LinearGradient
          colors={[color, color + '80']}
          style={[styles.statBar, { width: `${value}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Text variant="caption" weight="bold" style={styles.statValue}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );

  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      <Card variant="glass" size="lg" style={styles.statsCard}>
        <Heading variant="h3" style={styles.cardTitle}>
          Player Attributes
        </Heading>
        {Object.entries(player.stats || {}).map(([key, value], index) => {
          const color = value >= 80 ? theme.colors.semantic.success :
                       value >= 60 ? theme.colors.semantic.warning :
                       theme.colors.semantic.error;
          return (
            <React.Fragment key={key}>
              {renderStatBar(
                key.charAt(0).toUpperCase() + key.slice(1),
                value as number,
                color,
                index * 50
              )}
            </React.Fragment>
          );
        })}
      </Card>
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      <Card variant="glass" size="lg" style={styles.performanceCard}>
        <Heading variant="h3" style={styles.cardTitle}>
          Season Performance
        </Heading>

        <View style={styles.performanceGrid}>
          <Animated.View entering={ZoomIn.delay(0).springify()} style={styles.performanceStat}>
            <LinearGradient
              colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
              style={styles.performanceIcon}
            >
              <Ionicons name="football" size={24} color={theme.colors.text.inverse} />
            </LinearGradient>
            <Heading variant="h2">{player.performance?.goals || 0}</Heading>
            <Caption color="secondary">Goals</Caption>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.performanceStat}>
            <LinearGradient
              colors={[theme.colors.brand.accent, theme.colors.semantic.info]}
              style={styles.performanceIcon}
            >
              <MaterialIcons name="sports-soccer" size={24} color={theme.colors.text.inverse} />
            </LinearGradient>
            <Heading variant="h2">{player.performance?.assists || 0}</Heading>
            <Caption color="secondary">Assists</Caption>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.performanceStat}>
            <LinearGradient
              colors={[theme.colors.semantic.info, theme.colors.semantic.success]}
              style={styles.performanceIcon}
            >
              <Ionicons name="shirt" size={24} color={theme.colors.text.inverse} />
            </LinearGradient>
            <Heading variant="h2">{player.performance?.matches || 0}</Heading>
            <Caption color="secondary">Matches</Caption>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.performanceStat}>
            <LinearGradient
              colors={[theme.colors.semantic.warning, theme.colors.semantic.error]}
              style={styles.performanceIcon}
            >
              <Ionicons name="time" size={24} color={theme.colors.text.inverse} />
            </LinearGradient>
            <Heading variant="h2">{player.performance?.minutesPlayed || 0}</Heading>
            <Caption color="secondary">Minutes</Caption>
          </Animated.View>
        </View>

        <View style={styles.cardsSection}>
          <View style={styles.cardItem}>
            <View style={[styles.card, styles.yellowCard]}>
              <Ionicons name="card" size={20} color="#FFD700" />
            </View>
            <Text variant="body">{player.performance?.yellowCards || 0} Yellow</Text>
          </View>
          <View style={styles.cardItem}>
            <View style={[styles.card, styles.redCard]}>
              <Ionicons name="card" size={20} color="#FF0000" />
            </View>
            <Text variant="body">{player.performance?.redCards || 0} Red</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderCareerTab = () => (
    <View style={styles.tabContent}>
      <Card variant="glass" size="lg" style={styles.careerCard}>
        <Heading variant="h3" style={styles.cardTitle}>
          Career History
        </Heading>

        {(player.career || []).map((club: any, index: number) => (
          <Animated.View
            key={index}
            entering={SlideInRight.delay(index * 100).springify()}
            style={styles.careerItem}
          >
            <View style={styles.careerLeft}>
              <View style={styles.clubLogo}>
                <Text style={styles.clubEmoji}>⚽</Text>
              </View>
              <View>
                <Heading variant="h4">{club.club}</Heading>
                <Caption color="secondary">{club.period}</Caption>
              </View>
            </View>
            <View style={styles.careerRight}>
              <View style={styles.careerStat}>
                <Text variant="body" weight="bold">{club.apps}</Text>
                <Caption color="tertiary">Apps</Caption>
              </View>
              <View style={styles.careerStat}>
                <Text variant="body" weight="bold" style={{ color: theme.colors.brand.primary }}>
                  {club.goals}
                </Text>
                <Caption color="tertiary">Goals</Caption>
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={styles.achievementsSection}>
          <Heading variant="h4" style={styles.achievementsTitle}>
            Major Achievements
          </Heading>
          <View style={styles.achievementsGrid}>
            {(player.achievements || []).map((achievement: any, index: number) => (
              <Animated.View
                key={index}
                entering={ZoomIn.delay(index * 100).springify()}
                style={styles.achievement}
              >
                <LinearGradient
                  colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                  style={styles.achievementIcon}
                >
                  <Ionicons name={achievement.icon as any} size={20} color={theme.colors.text.inverse} />
                </LinearGradient>
                <Text variant="caption" weight="bold">{achievement.title}</Text>
                <Caption color="tertiary">{achievement.year}</Caption>
              </Animated.View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header with Player Image */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.brand.primary + '40', theme.colors.brand.accent + '20']}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />

        <Animated.View style={[styles.playerImageContainer, imageAnimatedStyle]}>
          <LinearGradient
            colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
            style={styles.playerImagePlaceholder}
          >
            <Text style={styles.playerNumber}>{player.number}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Back Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <BlurView intensity={80} style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </BlurView>
        </Pressable>

      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {/* Spacer for header */}
        <View style={{ height: SCREEN_HEIGHT * 0.35 }} />

        {/* Player Info Card */}
        <Animated.View entering={FadeInDown.springify()}>
          <Card variant="glass" size="lg" style={styles.infoCard}>
            <View style={styles.playerHeader}>
              <View style={styles.playerInfoSection}>
                <Heading variant="h1" numberOfLines={2}>{player.name || `${player.user?.firstName} ${player.user?.lastName}` || 'Unknown Player'}</Heading>
                <View style={styles.playerMeta}>
                  <View style={styles.positionBadgeContainer}>
                    <LinearGradient
                      colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                      style={styles.positionBadgeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.positionBadgeText}>{player.position || 'N/A'}</Text>
                    </LinearGradient>
                  </View>
                  <Text variant="body" color="secondary">
                    {player.nationality?.flag || '🌍'} {player.nationality?.country || player.nationality || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <LinearGradient
                  colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                  style={styles.ratingGradient}
                >
                  <Text style={styles.ratingText}>{player.stats?.overall || player.overallRating || 75}</Text>
                  <Text style={styles.ratingLabel}>RATING</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Age</Caption>
                <Text variant="body" weight="bold">{player.age || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Height</Caption>
                <Text variant="body" weight="bold">{player.height || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Weight</Caption>
                <Text variant="body" weight="bold">{player.weight || 'N/A'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Foot</Caption>
                <Text variant="body" weight="bold">{player.foot || player.preferredFoot || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.clubInfo}>
              <View style={styles.clubLeft}>
                <View style={styles.clubLogoCircle}>
                  <Text style={styles.clubLogoEmoji}>⚽</Text>
                </View>
                <View>
                  <Text variant="body" weight="bold">{player.club?.name || 'Free Agent'}</Text>
                  <Caption color="secondary">Contract until {player.contractUntil || 'N/A'}</Caption>
                </View>
              </View>
              <View style={styles.marketValueContainer}>
                <Caption color="tertiary">Market Value</Caption>
                <Text variant="h3" style={{ color: theme.colors.brand.primary }}>
                  {player.marketValue || 'N/A'}
                </Text>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrCodeSection}>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={JSON.stringify({
                    id: player.id,
                    name: player.name,
                    position: player.position,
                    club: player.club?.name,
                    passportUrl: `https://arcane.app/passport/${player.id}`,
                  })}
                  size={120}
                  backgroundColor="white"
                  color={theme.colors.brand.primary}
                />
              </View>
              <Caption color="tertiary" style={styles.qrCodeLabel}>
                Scan to view digital passport
              </Caption>
            </View>
          </Card>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.tabs}>
          {['stats', 'performance', 'career'].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              {activeTab === tab && (
                <LinearGradient
                  colors={[theme.colors.brand.primary + '30', theme.colors.brand.accent + '30']}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text
                variant="body"
                weight={activeTab === tab ? 'bold' : 'medium'}
                style={{ color: activeTab === tab ? theme.colors.brand.primary : theme.colors.text.secondary }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Tab Content */}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'career' && renderCareerTab()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  playerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    resizeMode: 'contain',
  },
  playerImagePlaceholder: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.35,
    borderRadius: SCREEN_WIDTH * 0.175,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: theme.colors.text.inverse,
  },
  backButton: {
    position: 'absolute',
    top: theme.layout.safeArea.top + 16,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.glass + '80',
  },
  infoCard: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 32,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    gap: 16,
  },
  playerInfoSection: {
    flex: 1,
    maxWidth: '65%',
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  positionBadgeContainer: {
    alignSelf: 'flex-start',
  },
  positionBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  positionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  positionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  ratingContainer: {
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 85,
  },
  ratingGradient: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    lineHeight: 34,
  },
  ratingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
    marginTop: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  clubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  clubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clubLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clubLogoEmoji: {
    fontSize: 24,
  },
  marketValueContainer: {
    alignItems: 'flex-end',
  },
  clubLogo: {
    fontSize: 32,
  },
  clubEmoji: {
    fontSize: 24,
  },
  qrCodeSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCodeLabel: {
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginVertical: 32,
    backgroundColor: theme.colors.surface.glass,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  activeTab: {
    backgroundColor: theme.colors.surface.elevated,
  },
  tabContent: {
    paddingHorizontal: 24,
  },
  statsCard: {
    padding: 32,
  },
  cardTitle: {
    marginBottom: 32,
  },
  statRow: {
    marginBottom: 24,
  },
  statLabel: {
    marginBottom: 4,
  },
  statBarContainer: {
    height: 28,
    backgroundColor: theme.colors.surface.glass,
    borderRadius: 9999,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBar: {
    height: '100%',
    borderRadius: 9999,
  },
  statValue: {
    position: 'absolute',
    right: 8,
    color: theme.colors.text.primary,
  },
  performanceCard: {
    padding: 32,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  performanceStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 32,
  },
  performanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  cardItem: {
    alignItems: 'center',
    gap: 8,
  },
  card: {
    width: 40,
    height: 56,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowCard: {
    backgroundColor: '#FFD700' + '30',
  },
  redCard: {
    backgroundColor: '#FF0000' + '30',
  },
  careerCard: {
    padding: 32,
  },
  careerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  careerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  careerRight: {
    flexDirection: 'row',
    gap: 32,
  },
  careerStat: {
    alignItems: 'center',
  },
  achievementsSection: {
    marginTop: 32,
  },
  achievementsTitle: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievement: {
    alignItems: 'center',
    gap: 4,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default PlayerPassport;
