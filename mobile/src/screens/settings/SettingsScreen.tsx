import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization, Language } from '../../contexts/LocalizationContext';
import { GlassCard, GradientText } from '../../components/ui';
import { spacing, typography, radius } from '../../design/theme';

export const SettingsScreen = ({ navigation }: any) => {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { language, setLanguage, dictionary } = useLocalization();
  const t = dictionary.settings;

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const handleLanguageChange = async (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLanguage(lang);
  };

  const handleLogout = () => {
    Alert.alert(
      t.logout.alertTitle,
      t.logout.alertMessage,
      [
        { text: t.logout.cancel, style: 'cancel' },
        {
          text: t.logout.confirm,
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      t.sections.data.clearCache.alertTitle,
      t.sections.data.clearCache.alertMessage,
      [
        { text: dictionary.common.actions.cancel, style: 'cancel' },
        {
          text: dictionary.common.actions.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keysToKeep = ['@arcane_theme_mode', '@arcane_favorite_players', '@arcane_auth_token'];
              const keysToRemove = keys.filter(key => !keysToKeep.includes(key));
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert(t.sections.data.clearCache.successTitle, t.sections.data.clearCache.successMessage);
            } catch (error) {
              Alert.alert(t.sections.data.clearCache.errorTitle, t.sections.data.clearCache.errorMessage);
            }
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: t.sections.appearance.title,
      icon: 'color-palette',
      items: [
        {
          id: 'theme',
          title: t.sections.appearance.theme.title,
          subtitle: t.sections.appearance.theme.subtitle,
          type: 'theme-selector' as const,
        },
      ],
    },
    ...(__DEV__ ? [{
      title: 'Developer Tools',
      icon: 'code-slash',
      items: [
        {
          id: 'logging_test',
          title: 'Logging Test',
          subtitle: 'Test all logging functionality',
          type: 'navigation' as const,
          target: 'LoggingTest',
        },
        {
          id: 'log_console',
          title: 'Log Console',
          subtitle: 'View and search app logs',
          type: 'navigation' as const,
          target: 'LogConsole',
        },
      ],
    }] : []),
    {
      title: t.sections.language.title,
      icon: 'language',
      items: [
        {
          id: 'language',
          title: t.sections.language.subtitle,
          subtitle: t.sections.language.description,
          type: 'language-selector' as const,
        },
      ],
    },
    {
      title: t.sections.notifications.title,
      icon: 'notifications',
      items: [
        {
          id: 'push',
          title: t.sections.notifications.push.title,
          subtitle: t.sections.notifications.push.subtitle,
          type: 'switch' as const,
          value: true,
        },
        {
          id: 'match_reminders',
          title: t.sections.notifications.matchReminders.title,
          subtitle: t.sections.notifications.matchReminders.subtitle,
          type: 'switch' as const,
          value: true,
        },
      ],
    },
    {
      title: t.sections.data.title,
      icon: 'server',
      items: [
        {
          id: 'clear_cache',
          title: t.sections.data.clearCache.title,
          subtitle: t.sections.data.clearCache.subtitle,
          type: 'action' as const,
          action: handleClearCache,
        },
      ],
    },
    {
      title: t.sections.about.title,
      icon: 'information-circle',
      items: [
        {
          id: 'version',
          title: t.sections.about.version.title,
          subtitle: t.sections.about.version.value,
          type: 'info' as const,
        },
        {
          id: 'terms',
          title: t.sections.about.terms.title,
          subtitle: t.sections.about.terms.subtitle,
          type: 'link' as const,
        },
        {
          id: 'privacy',
          title: t.sections.about.privacy.title,
          subtitle: t.sections.about.privacy.subtitle,
          type: 'link' as const,
        },
      ],
    },
  ];

  const ThemeSelector = () => {
    const themeOptions = t.sections?.appearance?.theme?.options;

    const themes: { mode: ThemeMode; label: string; icon: string }[] = [
      { mode: 'light', label: themeOptions?.light ?? (language === 'fr' ? 'Clair' : 'Light'), icon: 'sunny' },
      { mode: 'dark', label: themeOptions?.dark ?? (language === 'fr' ? 'Sombre' : 'Dark'), icon: 'moon' },
      { mode: 'system', label: themeOptions?.system ?? (language === 'fr' ? 'Système' : 'System'), icon: 'phone-portrait' },
    ];

    return (
      <View style={styles.themeSelector}>
        {themes.map((theme) => {
          const isSelected = themeMode === theme.mode;
          return (
            <TouchableOpacity
              key={theme.mode}
              style={[
                styles.themeOption,
                { backgroundColor: colors.glass },
                isSelected && {
                  borderColor: colors.accent,
                  backgroundColor: colors.glassLight,
                },
              ]}
              onPress={() => handleThemeChange(theme.mode)}
            >
              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]} />
              )}
              <Ionicons
                name={theme.icon as any}
                size={24}
                color={isSelected ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.themeLabel,
                  { color: isSelected ? colors.accent : colors.textSecondary },
                ]}
              >
                {theme.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const LanguageSelector = () => {
    const languages: { lang: Language; label: string; flag: string }[] = [
      { lang: 'fr', label: t.sections.language.options.fr, flag: '🇫🇷' },
      { lang: 'en', label: t.sections.language.options.en, flag: '🇬🇧' },
    ];

    return (
      <View style={styles.languageSelector}>
        {languages.map((lang) => {
          const isSelected = language === lang.lang;
          return (
            <TouchableOpacity
              key={lang.lang}
              style={[
                styles.languageOption,
                { backgroundColor: colors.glass },
                isSelected && {
                  borderColor: colors.accent,
                  backgroundColor: colors.glassLight,
                },
              ]}
              onPress={() => handleLanguageChange(lang.lang)}
            >
              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: colors.accent }]} />
              )}
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageLabel,
                  { color: isSelected ? colors.accent : colors.textSecondary },
                ]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'theme-selector':
        return <ThemeSelector />;

      case 'language-selector':
        return <LanguageSelector />;

      case 'switch':
        return (
          <Switch
            value={item.value}
            onValueChange={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            trackColor={{ false: colors.glassBorder, true: colors.accent }}
            thumbColor={isDark ? colors.textPrimary : '#FFF'}
          />
        );

      case 'action':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.glass }]}
            onPress={item.action}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        );

      case 'link':
        return (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        );

      case 'navigation':
        return (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        );

      case 'info':
        return (
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]} edges={['top']}>
      <LinearGradient
        colors={[colors.dark, colors.darkBg]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <GradientText variant="arcane" style={styles.headerTitle}>
            {t.title}
          </GradientText>
          <View style={{ width: 40 }} />
        </View>

        {/* User Profile Card */}
        <GlassCard variant="elevated" style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <LinearGradient
              colors={[colors.accent + '40', colors.secondary + '40']}
              style={styles.avatarGradient}
            >
              <Text style={[styles.avatarText, { color: colors.accent }]}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user?.name || t.profile.defaultName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email || t.profile.defaultEmail}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.glass }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </GlassCard>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as any} size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {section.title}
              </Text>
            </View>

            <GlassCard variant="default" style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  {item.type === 'theme-selector' || item.type === 'language-selector' ? (
                    <View style={styles.themeItem}>
                      <View style={styles.itemLeft}>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                      {renderSettingItem(item)}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.settingItem,
                        index < section.items.length - 1 && {
                          borderBottomColor: colors.glassBorder,
                          borderBottomWidth: 1,
                        },
                      ]}
                      onPress={() => {
                        if (item.type === 'action' && item.action) {
                          item.action();
                        } else if (item.type === 'navigation' && item.target) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate(item.target);
                        } else {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      disabled={item.type === 'switch' || item.type === 'info'}
                    >
                      <View style={styles.itemLeft}>
                        <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                          {item.subtitle}
                        </Text>
                      </View>
                      {renderSettingItem(item)}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error + '20' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>
            {t.logout.button}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  profileAvatar: {
    marginRight: spacing.md,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: typography.sizes.sm,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  itemLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: typography.sizes.sm,
  },
  themeItem: {
    paddingVertical: spacing.sm,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeLabel: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  languageOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: 4,
  },
  languageLabel: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: typography.sizes.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
});
