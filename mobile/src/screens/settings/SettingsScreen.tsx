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
import { GlassCard, GradientText } from '../../components/ui';
import { spacing, typography, radius } from '../../design/theme';

export const SettingsScreen = ({ navigation }: any) => {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const { user, logout } = useAuth();

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Vider le cache',
      'Cela supprimera toutes les données temporaires. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const keysToKeep = ['@arcane_theme_mode', '@arcane_favorite_players', '@arcane_auth_token'];
              const keysToRemove = keys.filter(key => !keysToKeep.includes(key));
              await AsyncStorage.multiRemove(keysToRemove);
              Alert.alert('Succès', 'Le cache a été vidé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider le cache');
            }
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Apparence',
      icon: 'color-palette',
      items: [
        {
          id: 'theme',
          title: 'Thème',
          subtitle: 'Choisir le thème de l\'application',
          type: 'theme-selector' as const,
        },
      ],
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      items: [
        {
          id: 'push',
          title: 'Notifications push',
          subtitle: 'Recevoir des alertes',
          type: 'switch' as const,
          value: true,
        },
        {
          id: 'match_reminders',
          title: 'Rappels de matchs',
          subtitle: 'Alertes avant les matchs',
          type: 'switch' as const,
          value: true,
        },
      ],
    },
    {
      title: 'Données',
      icon: 'server',
      items: [
        {
          id: 'clear_cache',
          title: 'Vider le cache',
          subtitle: 'Libérer de l\'espace',
          type: 'action' as const,
          action: handleClearCache,
        },
      ],
    },
    {
      title: 'À propos',
      icon: 'information-circle',
      items: [
        {
          id: 'version',
          title: 'Version',
          subtitle: '1.0.0',
          type: 'info' as const,
        },
        {
          id: 'terms',
          title: 'Conditions d\'utilisation',
          subtitle: 'Lire les CGU',
          type: 'link' as const,
        },
        {
          id: 'privacy',
          title: 'Politique de confidentialité',
          subtitle: 'Gestion de vos données',
          type: 'link' as const,
        },
      ],
    },
  ];

  const ThemeSelector = () => {
    const themes: { mode: ThemeMode; label: string; icon: string }[] = [
      { mode: 'light', label: 'Clair', icon: 'sunny' },
      { mode: 'dark', label: 'Sombre', icon: 'moon' },
      { mode: 'system', label: 'Système', icon: 'phone-portrait' },
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

  const renderSettingItem = (item: any) => {
    switch (item.type) {
      case 'theme-selector':
        return <ThemeSelector />;

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
            Paramètres
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
              {user?.name || 'Utilisateur'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              {user?.email || 'email@example.com'}
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
                  {item.type === 'theme-selector' ? (
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
            Déconnexion
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