import React, { useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInRight,
  SlideInUp,
  ZoomIn,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Text,
  Display,
  Heading,
  Caption,
  theme,
} from '../../design/components';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const HomeScreen = ({ navigation }: any) => {
  const { isAuthenticated, user } = useAuth();
  const { dictionary } = useLocalization();
  const t = dictionary.home || {
    header: { userFallback: 'User', login: 'Login' },
    hero: {
      badge: 'AI-POWERED',
      title: 'Elevate Your',
      subtitle: 'Scouting Game',
      tagline: 'Discover football talent through',
      performance: 'performance',
      precision: 'precision',
      and: 'and',
      ambition: 'ambition',
      ctaAuth: 'Explore Players',
      ctaGuest: 'Start Your Journey',
    },
    stats: {
      elitePlayers: 'Elite Players',
      topClubs: 'Top Clubs',
      successRate: 'Success Rate',
    },
    services: {
      title: 'Powered by Advanced Technology',
      subtitle: 'Everything you need to discover and evaluate talent',
      playerManagement: {
        title: 'Player Management',
        description: 'Comprehensive profiles and performance tracking',
      },
      performanceAnalytics: {
        title: 'Performance Analytics',
        description: 'AI-powered insights and match analysis',
      },
      globalNetwork: {
        title: 'Global Network',
        description: 'Connect with scouts and clubs worldwide',
      },
    },
    cta: {
      badge: 'LIMITED ACCESS',
      title: 'Ready to transform your scouting?',
      description: 'Join thousands of scouts using AI to discover the next generation of talent',
      button: 'Create Free Account',
    },
    footer: {
      copyright: '© 2025 ARCANE. All rights reserved.',
    },
  };
  const [refreshing, setRefreshing] = React.useState(false);

  // Animation values
  const heroScale = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const servicesTranslateY = useSharedValue(50);
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    // Hero entrance animation
    heroScale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });

    // Stats fade in
    statsOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 800 })
    );

    // Services slide up
    servicesTranslateY.value = withDelay(
      500,
      withSpring(0, theme.animations.springs.bouncy)
    );

    // Pulse effect for CTA
    pulseAnimation.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      )
    );
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: interpolate(
      heroScale.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const servicesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: servicesTranslateY.value }],
    opacity: interpolate(
      servicesTranslateY.value,
      [50, 0],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const stats = [
    {
      icon: 'people',
      label: t.stats.elitePlayers,
      value: 500,
      suffix: '+',
      color: theme.colors.brand.primary,
      delay: 0,
    },
    {
      icon: 'trophy',
      label: t.stats.topClubs,
      value: 50,
      suffix: '+',
      color: theme.colors.brand.accent,
      delay: 100,
    },
    {
      icon: 'shield-checkmark',
      label: t.stats.successRate,
      value: 98,
      suffix: '%',
      color: theme.colors.semantic.success,
      delay: 200,
    },
  ];

  const services = [
    {
      icon: 'analytics',
      title: t.services.playerManagement.title,
      description: t.services.playerManagement.description,
      gradient: [theme.colors.brand.primary, theme.colors.brand.accent],
    },
    {
      icon: 'trending-up',
      title: t.services.performanceAnalytics.title,
      description: t.services.performanceAnalytics.description,
      gradient: [theme.colors.brand.accent, theme.colors.semantic.info],
    },
    {
      icon: 'globe',
      title: t.services.globalNetwork.title,
      description: t.services.globalNetwork.description,
      gradient: [theme.colors.semantic.info, theme.colors.brand.primary],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Background Elements */}
      <View style={styles.backgroundElements}>
        <AnimatedLinearGradient
          colors={[theme.colors.brand.primary + '20', 'transparent']}
          style={[styles.bgGradient1, heroAnimatedStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <AnimatedLinearGradient
          colors={[theme.colors.brand.accent + '15', 'transparent']}
          style={[styles.bgGradient2, heroAnimatedStyle]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
              style={styles.logo}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.logoText}>A</Text>
            </LinearGradient>
            <Display variant="display3" style={styles.appName}>
              ARCANE
            </Display>
          </View>

          {isAuthenticated ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Profile');
              }}
            >
              <Avatar
                source={user?.avatar}
                name={user?.name || t.header.userFallback}
                size="md"
                status="online"
              />
            </Pressable>
          ) : (
            <Button
              size="md"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
            >
              {t.header.login}
            </Button>
          )}
        </Animated.View>

        {/* Hero Section */}
        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <Badge variant="gradient" rounded style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color={theme.colors.text.inverse} />
            <Text style={styles.badgeText}>{t.hero.badge}</Text>
          </Badge>

          <Display variant="display1" style={styles.heroTitle}>
            {t.hero.title}
          </Display>

          <LinearGradient
            colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
            style={styles.heroAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Display variant="display1" style={styles.heroAccentText}>
              {t.hero.subtitle}
            </Display>
          </LinearGradient>

          <Text variant="body-lg" color="secondary" style={styles.heroSubtitle}>
            {t.hero.tagline} <Text weight="bold" color="primary">{t.hero.performance}</Text>, {' '}
            <Text weight="bold" color="primary">{t.hero.precision}</Text> {t.hero.and} {' '}
            <Text weight="bold" style={{ color: theme.colors.brand.primary }}>
              {t.hero.ambition}
            </Text>
          </Text>

          <Animated.View style={[styles.ctaContainer, pulseStyle]}>
            <Button
              variant="gradient"
              size="xl"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                isAuthenticated
                  ? navigation.navigate('Players')
                  : navigation.navigate('Signup');
              }}
              icon={<Ionicons name="flash" size={20} color={theme.colors.text.inverse} />}
              fullWidth
            >
              {isAuthenticated ? t.hero.ctaAuth : t.hero.ctaGuest}
            </Button>
          </Animated.View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View style={[styles.stats, statsAnimatedStyle]}>
          {stats.map((stat, index) => (
            <Animated.View
              key={index}
              entering={SlideInUp.delay(stat.delay).springify()}
            >
              <Card
                variant="glass"
                size="md"
                style={styles.statCard}
                onPress={() => Haptics.selectionAsync()}
              >
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons
                    name={stat.icon as any}
                    size={28}
                    color={stat.color}
                  />
                </View>
                <AnimatedCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  style={styles.statValue}
                />
                <Caption color="secondary">{stat.label}</Caption>
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Services Section */}
        <Animated.View style={[styles.services, servicesAnimatedStyle]}>
          <Heading variant="h2" style={styles.sectionTitle}>
            {t.services.title}
          </Heading>
          <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
            {t.services.subtitle}
          </Text>

          {services.map((service, index) => (
            <Animated.View
              key={index}
              entering={SlideInRight.delay(index * 100).springify()}
            >
              <Card
                variant="glass"
                size="lg"
                style={styles.serviceCard}
                glowOnPress
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Services');
                }}
              >
                <LinearGradient
                  colors={service.gradient}
                  style={styles.serviceIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={service.icon as any} size={32} color={theme.colors.text.inverse} />
                </LinearGradient>
                <View style={styles.serviceContent}>
                  <Heading variant="h4">{service.title}</Heading>
                  <Text variant="body-sm" color="secondary" style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.text.tertiary}
                />
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        {/* CTA Section */}
        <Animated.View
          entering={ZoomIn.delay(800).springify()}
          style={styles.ctaSection}
        >
          <Card variant="gradient" size="lg" style={styles.ctaCard}>
            <Badge variant="primary" rounded style={styles.ctaBadge}>
              <Ionicons name="flash" size={14} color={theme.colors.text.inverse} />
              <Text style={styles.ctaBadgeText}>{t.cta.badge}</Text>
            </Badge>

            <Display variant="display3" style={styles.ctaTitle}>
              {t.cta.title}
            </Display>

            <Text
              variant="body"
              color="secondary"
              align="center"
              style={styles.ctaDescription}
            >
              {t.cta.description}
            </Text>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Signup');
              }}
            >
              {t.cta.button}
            </Button>
          </Card>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Caption color="muted" align="center">
            {t.footer.copyright}
          </Caption>
        </View>
      </ScrollView>
    </View>
  );
};

// Animated Counter Component
const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  style?: any;
}> = ({ value, suffix = '', style }) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 2000,
    });
  }, [value]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentValue = Math.floor(animatedValue.value);
      if (currentValue !== displayValue) {
        setDisplayValue(currentValue);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [displayValue, animatedValue]);

  return (
    <Text variant="h1" weight="black" style={style}>
      {displayValue}{suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: -1,
  },
  bgGradient1: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    borderRadius: SCREEN_WIDTH * 0.75,
    top: -SCREEN_WIDTH * 0.5,
    left: -SCREEN_WIDTH * 0.25,
  },
  bgGradient2: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: SCREEN_WIDTH * 0.5,
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: theme.layout.safeArea.top + 24,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...theme.shadows.lg,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text.inverse,
  },
  appName: {
    letterSpacing: -1,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 64,
    zIndex: 0,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    marginBottom: 32,
    flexDirection: 'row',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
    letterSpacing: 1,
    marginLeft: 4,
  },
  heroTitle: {
    letterSpacing: -2,
    marginBottom: 8,
  },
  heroAccent: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 32,
  },
  heroAccentText: {
    color: theme.colors.text.inverse,
    letterSpacing: -2,
  },
  heroSubtitle: {
    lineHeight: 28,
    marginBottom: 48,
  },
  ctaContainer: {
    marginBottom: 32,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 64,
    zIndex: 0,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 32,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    marginVertical: 4,
  },
  services: {
    paddingHorizontal: 24,
    marginBottom: 64,
    zIndex: 0,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionSubtitle: {
    marginBottom: 48,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  serviceContent: {
    flex: 1,
  },
  serviceDescription: {
    marginTop: 4,
  },
  ctaSection: {
    paddingHorizontal: 24,
    marginBottom: 64,
    zIndex: 0,
  },
  ctaCard: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  ctaBadge: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 32,
  },
  ctaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
    letterSpacing: 0.5,
  },
  ctaTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaDescription: {
    marginBottom: 48,
    paddingHorizontal: 32,
  },
  footer: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
});