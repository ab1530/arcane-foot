import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_CONFIG } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';
import { showError } from '../../services/toast';

const RoleSelectorScreen: React.FC = () => {
  const { availableRoles, setActiveRole, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedRole && availableRoles.length > 0) {
      setSelectedRole(availableRoles[0]);
    }
  }, [availableRoles, selectedRole]);

  const handleConfirm = async () => {
    if (!selectedRole || saving) {
      return;
    }

    try {
      setSaving(true);
      await setActiveRole(selectedRole);
    } catch (error) {
      console.error('Failed to select role:', error);
      showError('Impossible de sélectionner ce rôle.');
    } finally {
      setSaving(false);
    }
  };

  if (availableRoles.length <= 1) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="role-selector-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Choisissez votre rôle actif</Text>
        <Text style={styles.subtitle}>
          {user?.firstName ? `${user.firstName}, ` : ''}vous pourrez le changer ensuite depuis le profil.
        </Text>
      </View>

      <View style={styles.rolesList}>
        {availableRoles.map((role) => {
          const isActive = selectedRole === role;
          const roleMeta = ROLE_CONFIG[role];
          return (
            <TouchableOpacity
              key={role}
              style={[styles.roleCard, isActive && styles.roleCardActive]}
              onPress={() => setSelectedRole(role)}
              accessibilityRole="button"
            >
              <Text style={[styles.roleTitle, isActive && styles.roleTitleActive]}>
                {roleMeta?.label ?? role}
              </Text>
              <Text style={styles.roleDescription}>{roleMeta?.description ?? 'Rôle Arcane'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!selectedRole || saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.arcane.black} />
        ) : (
          <Text style={styles.confirmText}>Continuer</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  rolesList: {
    flex: 1,
    gap: spacing.md,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  roleCardActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + '12',
  },
  roleTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  roleTitleActive: {
    color: colors.brand.primary,
  },
  roleDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.arcane.black,
  },
});

export default RoleSelectorScreen;
