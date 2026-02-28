import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import api from '../../services/api';
import { showSuccess, showError } from '../../services/toast';
import { useTheme } from '../../contexts/ThemeContext';
import { ROLE_CONFIG } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';
import { isFeatureEnabled } from '../../constants/features';

type ThemeColorsType = ReturnType<typeof useTheme>['colors'];

type EditableField = 'firstName' | 'lastName' | 'phone';

export const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, logout, updateUser, activeRole, availableRoles, setActiveRole } = useAuth();
  const { dictionary, language, setLanguage } = useLocalization();
  const { colors, themeMode, setThemeMode } = useTheme();
  const t = dictionary.profile;
  const scoutProfileEnabled = isFeatureEnabled('scoutProfileScreen');

  const [profile, setProfile] = useState(user ?? null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const current = await api.getCurrentUser();
      setProfile(current);
      setForm({
        firstName: current.firstName ?? '',
        lastName: current.lastName ?? '',
        phone: current.phone ?? '',
      });
      updateUser(current);
    } catch (err) {
      console.error('Failed to load profile', err);
      setError('Impossible de charger votre profil. Réessayez plus tard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  const handleChange = useCallback((field: EditableField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const normalize = useCallback((value: string) => value.trim(), []);

  const hasChanges = useMemo(() => {
    if (!profile) {
      return true;
    }
    return (
      normalize(form.firstName) !== (profile.firstName ?? '') ||
      normalize(form.lastName) !== (profile.lastName ?? '') ||
      normalize(form.phone) !== (profile.phone ?? '')
    );
  }, [form.firstName, form.lastName, form.phone, normalize, profile]);

  const handleSave = useCallback(async () => {
    if (!hasChanges || saving) {
      return;
    }

    const payload: Record<string, string> = {};
    if (!profile || normalize(form.firstName) !== (profile.firstName ?? '')) {
      payload.firstName = normalize(form.firstName);
    }
    if (!profile || normalize(form.lastName) !== (profile.lastName ?? '')) {
      payload.lastName = normalize(form.lastName);
    }
    if (!profile || normalize(form.phone) !== (profile.phone ?? '')) {
      payload.phone = normalize(form.phone);
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateAuthProfile(payload);
      setProfile(updated);
      setForm({
        firstName: updated.firstName ?? '',
        lastName: updated.lastName ?? '',
        phone: updated.phone ?? '',
      });
      updateUser(updated);
      setError(null);
      showSuccess('Profil mis à jour avec succès');
    } catch (err) {
      console.error('Failed to update profile', err);
      setError('Impossible de mettre à jour votre profil.');
      showError('Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  }, [form.firstName, form.lastName, form.phone, hasChanges, normalize, profile, saving, updateUser]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error', err);
      showError('Impossible de se déconnecter');
    }
  }, [logout]);

  const initials = useMemo(() => {
    const source = profile ?? user;
    if (!source) return 'AR';
    const first = source.firstName?.[0] ?? '';
    const last = source.lastName?.[0] ?? '';
    const label = `${first}${last}`.trim();
    return label ? label.toUpperCase() : (source.email?.[0] ?? 'A').toUpperCase();
  }, [profile, user]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const effectiveRole = useMemo(
    () => activeRole ?? profile?.role ?? user?.role ?? null,
    [activeRole, profile?.role, user?.role],
  );

  const handleThemeToggle = useCallback(() => {
    const nextMode = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'system' : 'dark';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const handleLanguageToggle = useCallback(() => {
    const next = language === 'fr' ? 'en' : 'fr';
    setLanguage(next);
  }, [language, setLanguage]);

  const handleRoleSwitch = useCallback(
    async (role: UserRole) => {
      try {
        await setActiveRole(role);
        showSuccess(`Rôle actif: ${ROLE_CONFIG[role]?.label ?? role}`);
      } catch (error) {
        console.error('Failed to switch role', error);
        showError('Impossible de changer de rôle.');
      }
    },
    [setActiveRole],
  );

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{effectiveRole ?? '---'}</Text>
        </View>
        {profile?.createdAt && (
          <Text style={styles.memberSince}>
            {`Membre depuis ${new Date(profile.createdAt).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })}`}
          </Text>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleThemeToggle}
        >
          <Ionicons
            name={themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sunny' : 'phone-portrait'}
            size={22}
            color={colors.accent}
          />
          <View style={styles.quickActionTextWrapper}>
            <Text style={styles.quickActionLabel}>{t.quickActions?.theme ?? 'Mode couleur'}</Text>
            <Text style={styles.quickActionValue}>
              {themeMode === 'dark'
                ? 'Sombre'
                : themeMode === 'light'
                ? 'Clair'
                : 'Système'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={handleLanguageToggle}
        >
          <Ionicons name="language" size={22} color={colors.accent} />
          <View style={styles.quickActionTextWrapper}>
            <Text style={styles.quickActionLabel}>{t.quickActions?.language ?? 'Langue'}</Text>
            <Text style={styles.quickActionValue}>
              {language === 'fr'
                ? dictionary.common.language.options.fr
                : dictionary.common.language.options.en}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.errorRetry}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {availableRoles.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rôle actif</Text>
          <View style={styles.roleOptions}>
            {availableRoles.map((role) => {
              const selected = role === effectiveRole;
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, selected && styles.roleOptionSelected]}
                  onPress={() => handleRoleSwitch(role)}
                >
                  <Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>
                    {ROLE_CONFIG[role]?.label ?? role}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            value={form.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
            autoCapitalize="words"
            placeholder="Votre prénom"
            placeholderTextColor={theme.colors.text.tertiary}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={form.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            autoCapitalize="words"
            placeholder="Votre nom"
            placeholderTextColor={theme.colors.text.tertiary}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(text) => handleChange('phone', text)}
            keyboardType="phone-pad"
            placeholder="+33 6 00 00 00 00"
            placeholderTextColor={theme.colors.text.tertiary}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || saving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator
              color={colors.darkBg}
              size="small"
            />
          ) : (
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        {effectiveRole === 'PLAYER' && (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('HardwareSessions')}
            >
              <Text style={styles.menuText}>Mes stats GPS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('QCBand')}
            >
              <Text style={styles.menuText}>Mon bracelet QC Band</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuText}>{t.menu.settings}</Text>
        </TouchableOpacity>

        {scoutProfileEnabled && ['SCOUT', 'ADMIN', 'SUPER_ADMIN'].includes(effectiveRole ?? '') && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ScoutProfile')}
          >
            <Text style={styles.menuText}>Profil scout</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Membership')}
        >
          <Text style={styles.menuText}>{t.menu.membership}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('About')}
        >
          <Text style={styles.menuText}>{t.menu.about}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={handleLogout}
          disabled={saving}
        >
          <Text style={[styles.menuText, styles.logoutText]}>{t.menu.logout}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColorsType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.darkBg,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.darkBg,
    },
    header: {
      padding: 32,
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 36,
      fontFamily: theme.typography.fonts.bold,
      color: colors.darkBg,
    },
    name: {
      fontSize: theme.typography.sizes.h2,
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
    },
    email: {
      fontSize: theme.typography.sizes.body,
      fontFamily: theme.typography.fonts.regular,
      color: colors.textSecondary,
    },
    roleBadge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    roleText: {
      fontSize: 12,
      fontFamily: theme.typography.fonts.medium,
      color: colors.textPrimary,
      textTransform: 'uppercase',
    },
    memberSince: {
      fontSize: theme.typography.sizes.caption,
      color: colors.textSecondary,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 12,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: colors.glass,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    quickActionTextWrapper: {
      flex: 1,
    },
    quickActionLabel: {
      fontSize: theme.typography.sizes.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontFamily: theme.typography.fonts.medium,
    },
    quickActionValue: {
      fontSize: theme.typography.sizes.body,
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
    },
    errorBanner: {
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.warning + '20',
      borderWidth: 1,
      borderColor: colors.warning + '40',
    },
    errorMessage: {
      color: colors.warning,
      fontFamily: theme.typography.fonts.medium,
      marginBottom: 4,
    },
    errorRetry: {
      color: colors.accent,
      fontFamily: theme.typography.fonts.bold,
    },
    section: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.h4,
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    roleOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    roleOption: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
    },
    roleOptionSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent + '1A',
    },
    roleOptionText: {
      color: colors.textSecondary,
      fontFamily: theme.typography.fonts.medium,
      fontSize: theme.typography.sizes.caption,
      textTransform: 'uppercase',
    },
    roleOptionTextSelected: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.medium,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: theme.typography.sizes.body,
      color: colors.textPrimary,
      backgroundColor: colors.glass,
      fontFamily: theme.typography.fonts.medium,
    },
    saveButton: {
      marginTop: 8,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: colors.darkBg,
      fontSize: theme.typography.sizes.body,
      fontFamily: theme.typography.fonts.bold,
    },
    menuItem: {
      backgroundColor: colors.glass,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    menuText: {
      fontSize: 16,
      fontFamily: theme.typography.fonts.medium,
      color: colors.textPrimary,
    },
    logoutButton: {
      backgroundColor: colors.error + '15',
      borderColor: colors.error + '35',
      marginTop: 16,
    },
    logoutText: {
      color: colors.error,
    },
  });

export default ProfileScreen;
