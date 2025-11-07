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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const HomeScreen = ({ navigation }: any) => {
  const { isAuthenticated, user } = useAuth();
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
      label: 'Elite Players',
      value: 500,
      suffix: '+',
      color: theme.colors.brand.primary,
      delay: 0,
    },
    {
      icon: 'trophy',
      label: 'Top Clubs',
      value: 50,
      suffix: '+',
      color: theme.colors.brand.accent,
      delay: 100,
    },
    {
      icon: 'shield-checkmark',
      label: 'Success Rate',
      value: 98,
      suffix: '%',
      color: theme.colors.semantic.success,
      delay: 200,
    },
  ];

  const services = [
    {
      icon: 'analytics',
      title: 'Player Management',
      description: 'End-to-end career development with personalized strategies',
      gradient: [theme.colors.brand.primary, theme.colors.brand.accent],
    },
    {
      icon: 'trending-up',
      title: 'Performance Analytics',
      description: 'AI-powered tracking and insights for peak performance',
      gradient: [theme.colors.brand.accent, theme.colors.semantic.info],
    },
    {
      icon: 'globe',
      title: 'Global Network',
      description: 'Connect with elite clubs and scouts worldwide',
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
                name={user?.name || 'User'}
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
              Login
            </Button>
          )}
        </Animated.View>

        {/* Hero Section */}
        <Animated.View style={[styles.hero, heroAnimatedStyle]}>
          <Badge variant="gradient" rounded style={styles.heroBadge}>
            <Ionicons name="sparkles" size={14} color={theme.colors.text.inverse} />
            <Text style={styles.badgeText}>REDEFINING FOOTBALL</Text>
          </Badge>

          <Display variant="display1" style={styles.heroTitle}>
            EMPOWERING
          </Display>

          <LinearGradient
            colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
            style={styles.heroAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Display variant="display1" style={styles.heroAccentText}>
              FOOTBALL
            </Display>
          </LinearGradient>

          <Text variant="body-lg" color="secondary" style={styles.heroSubtitle}>
            Through <Text weight="bold" color="primary">performance</Text>, {' '}
            <Text weight="bold" color="primary">precision</Text> and {' '}
            <Text weight="bold" style={{ color: theme.colors.brand.primary }}>
              bold ambition
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
              {isAuthenticated ? 'Explore Players' : 'Start Your Journey'}
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
            OUR SERVICES
          </Heading>
          <Text variant="body" color="secondary" style={styles.sectionSubtitle}>
            Comprehensive solutions for modern football
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
              <Text style={styles.ctaBadgeText}>JOIN THE ELITE</Text>
            </Badge>

            <Display variant="display3" style={styles.ctaTitle}>
              Ready to Elevate?
            </Display>

            <Text
              variant="body"
              color="secondary"
              align="center"
              style={styles.ctaDescription}
            >
              Join the elite network of players, scouts, and clubs
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
              Get Started Now
            </Button>
          </Card>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Caption color="muted" align="center">
            © 2025 Arcane Football GmbH. All rights reserved.
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.layout.safeArea.top + theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing['3xl'],
    zIndex: 0,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    flexDirection: 'row',
    gap: theme.spacing.xs,
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
    marginBottom: theme.spacing.sm,
  },
  heroAccent: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  heroAccentText: {
    color: theme.colors.text.inverse,
    letterSpacing: -2,
  },
  heroSubtitle: {
    lineHeight: 28,
    marginBottom: theme.spacing['2xl'],
  },
  ctaContainer: {
    marginBottom: theme.spacing.xl,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing['3xl'],
    zIndex: 0,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    marginVertical: theme.spacing.xs,
  },
  services: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
    zIndex: 0,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    marginBottom: theme.spacing['2xl'],
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  serviceContent: {
    flex: 1,
  },
  serviceDescription: {
    marginTop: theme.spacing.xs,
  },
  ctaSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
    zIndex: 0,
  },
  ctaCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  ctaBadge: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  ctaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.inverse,
    letterSpacing: 0.5,
  },
  ctaTitle: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  ctaDescription: {
    marginBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  footer: {
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
});