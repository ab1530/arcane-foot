import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  Alert,
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

  // Mock player data - in production, fetch based on playerId
  const player = passedPlayer || {
    id: playerId || '1',
    name: 'Kylian Mbappé',
    position: 'ST',
    number: 7,
    club: {
      name: 'Paris Saint-Germain',
      logo: '🔴🔵',
    },
    nationality: {
      country: 'France',
      flag: '🇫🇷',
    },
    age: 25,
    height: '178 cm',
    weight: '75 kg',
    foot: 'Right',
    marketValue: '€180M',
    contractUntil: '2028',
    image: null, // Would be a URL in production
    stats: {
      overall: 92,
      pace: 97,
      shooting: 89,
      passing: 80,
      dribbling: 92,
      defending: 36,
      physical: 76,
    },
    performance: {
      goals: 28,
      assists: 12,
      matches: 34,
      yellowCards: 3,
      redCards: 0,
      minutesPlayed: 2890,
    },
    achievements: [
      { icon: 'trophy', title: 'World Cup', year: '2018' },
      { icon: 'medal', title: 'Golden Boot', year: '2023' },
      { icon: 'star', title: 'Best Player', year: '2024' },
    ],
    career: [
      { club: 'Monaco', period: '2015-2017', apps: 60, goals: 27 },
      { club: 'PSG', period: '2017-Present', apps: 260, goals: 212 },
    ],
  };

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
          {player.image ? (
            <Image source={{ uri: player.image }} style={styles.playerImage} />
          ) : (
            <LinearGradient
              colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
              style={styles.playerImagePlaceholder}
            >
              <Text style={styles.playerNumber}>{player.number}</Text>
            </LinearGradient>
          )}
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

        {/* Share Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Share', 'Share player profile');
          }}
          style={styles.shareButton}
        >
          <BlurView intensity={80} style={styles.shareButtonBlur}>
            <Ionicons name="share-social" size={24} color={theme.colors.text.primary} />
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
              <View>
                <Heading variant="h1">{player.name}</Heading>
                <View style={styles.playerMeta}>
                  <Badge variant="gradient" rounded size="sm">
                    <Text style={styles.positionBadge}>{player.position}</Text>
                  </Badge>
                  <Text variant="body" color="secondary">
                    {player.nationality.flag} {player.nationality.country}
                  </Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <LinearGradient
                  colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
                  style={styles.ratingGradient}
                >
                  <Text style={styles.ratingText}>{player.stats.overall}</Text>
                  <Caption color="inverse">RATING</Caption>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Age</Caption>
                <Text variant="body" weight="bold">{player.age}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Height</Caption>
                <Text variant="body" weight="bold">{player.height}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Weight</Caption>
                <Text variant="body" weight="bold">{player.weight}</Text>
              </View>
              <View style={styles.infoItem}>
                <Caption color="tertiary">Foot</Caption>
                <Text variant="body" weight="bold">{player.foot}</Text>
              </View>
            </View>

            <View style={styles.clubInfo}>
              <View style={styles.clubLeft}>
                <Text style={styles.clubLogo}>{player.club.logo}</Text>
                <View>
                  <Text variant="body" weight="bold">{player.club.name}</Text>
                  <Caption color="secondary">Contract until {player.contractUntil}</Caption>
                </View>
              </View>
              <View>
                <Caption color="tertiary">Market Value</Caption>
                <Text variant="h3" style={{ color: theme.colors.brand.primary }}>
                  {player.marketValue}
                </Text>
              </View>
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
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: SCREEN_WIDTH * 0.25,
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
    top: theme.layout.safeArea.top + theme.spacing.md,
    left: theme.spacing.lg,
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
  shareButton: {
    position: 'absolute',
    top: theme.layout.safeArea.top + theme.spacing.md,
    right: theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface.glass + '80',
  },
  infoCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  positionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.text.inverse,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  infoItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  clubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  clubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  clubLogo: {
    fontSize: 32,
  },
  clubEmoji: {
    fontSize: 24,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface.glass,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  activeTab: {
    backgroundColor: theme.colors.surface.elevated,
  },
  tabContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  statsCard: {
    padding: theme.spacing.xl,
  },
  cardTitle: {
    marginBottom: theme.spacing.xl,
  },
  statRow: {
    marginBottom: theme.spacing.lg,
  },
  statLabel: {
    marginBottom: theme.spacing.xs,
  },
  statBarContainer: {
    height: 28,
    backgroundColor: theme.colors.surface.glass,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBar: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  statValue: {
    position: 'absolute',
    right: theme.spacing.sm,
    color: theme.colors.text.primary,
  },
  performanceCard: {
    padding: theme.spacing.xl,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  performanceStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  performanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  cardItem: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  card: {
    width: 40,
    height: 56,
    borderRadius: theme.radius.sm,
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
    padding: theme.spacing.xl,
  },
  careerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  careerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  careerRight: {
    flexDirection: 'row',
    gap: theme.spacing.xl,
  },
  careerStat: {
    alignItems: 'center',
  },
  achievementsSection: {
    marginTop: theme.spacing.xl,
  },
  achievementsTitle: {
    marginBottom: theme.spacing.lg,
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievement: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
});

export default PlayerPassport;