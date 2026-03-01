import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { colors, spacing, typography, radius } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useLocalization } from '../../contexts/LocalizationContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup } = useAuth();
  const { dictionary } = useLocalization();
  const signupCopy = dictionary.auth.signup;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [rolePickerVisible, setRolePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signupRoles = [
    { value: 'PLAYER', label: signupCopy.roles.player },
    { value: 'SCOUT', label: signupCopy.roles.scout },
    { value: 'AGENT', label: signupCopy.roles.agent },
    { value: 'ADMIN', label: signupCopy.roles.admin },
  ];

  const selectedRoleLabel =
    signupRoles.find((item) => item.value === selectedRole)?.label ?? '';

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword &&
    Boolean(selectedRole);

  const handleSignup = async () => {
    if (!isValid) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: selectedRole,
      });
    } catch (err: any) {
      console.error('Mobile signup failed:', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        signupCopy.errors.generic;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onChangeSafe = (setter: (value: string) => void) => (value: string) => {
    if (error) {
      setError(null);
    }
    setter(value);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{signupCopy.title}</Text>
            <Text style={styles.subtitle}>{signupCopy.subtitle}</Text>
          </View>

          <Input
            label={signupCopy.inputs.firstName}
            value={firstName}
            onChangeText={onChangeSafe(setFirstName)}
            placeholder={signupCopy.placeholders.firstName}
          />
          <Input
            label={signupCopy.inputs.lastName}
            value={lastName}
            onChangeText={onChangeSafe(setLastName)}
            placeholder={signupCopy.placeholders.lastName}
          />
          <Input
            label={signupCopy.inputs.email}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={onChangeSafe(setEmail)}
            placeholder={signupCopy.placeholders.email}
          />
          <Input
            label={signupCopy.inputs.password}
            secureTextEntry
            value={password}
            onChangeText={onChangeSafe(setPassword)}
            placeholder={signupCopy.placeholders.password}
          />
          <Input
            label={signupCopy.inputs.confirmPassword}
            secureTextEntry
            value={confirmPassword}
            onChangeText={onChangeSafe(setConfirmPassword)}
            placeholder={signupCopy.placeholders.confirmPassword}
            error={
              confirmPassword && confirmPassword !== password
                ? signupCopy.errors.mismatch
                : undefined
            }
          />

          <Select
            label={signupCopy.inputs.role}
            value={selectedRoleLabel}
            placeholder={signupCopy.placeholders.role}
            onPress={() => setRolePickerVisible(true)}
          />

          <Text style={styles.roleHint}>{signupCopy.roleHint}</Text>

          <Modal
            visible={rolePickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setRolePickerVisible(false)}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setRolePickerVisible(false)}
            />
            <View style={styles.modalContentWrapper}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{signupCopy.roleModalTitle}</Text>

                {signupRoles.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={styles.roleOption}
                    onPress={() => {
                      setSelectedRole(role.value);
                      setRolePickerVisible(false);
                    }}
                  >
                    <Text style={styles.roleOptionText}>{role.label}</Text>
                    {selectedRole === role.value ? <Text style={styles.roleOptionCheck}>✓</Text> : null}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setRolePickerVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>{signupCopy.roleModalClose}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            testID="signup-submit-button"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || isSubmitting }}
            style={[styles.primaryButton, (!isValid || isSubmitting) && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator testID="signup-loading-indicator" color={colors.background.primary} />
            ) : (
              <Text style={styles.primaryButtonText}>{signupCopy.button}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchAuthText}>{signupCopy.haveAccount}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  inner: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  roleHint: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background.primary,
    fontWeight: '700',
    fontSize: typography.sizes.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchAuth: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchAuthText: {
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.semantic.error,
    fontSize: typography.sizes.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContentWrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: '35%',
  },
  modalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  roleOptionText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  roleOptionCheck: {
    color: colors.brand.primary,
    fontWeight: '700',
    fontSize: typography.sizes.base,
  },
  modalCloseButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  modalCloseButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: typography.sizes.base,
  },
});

export default SignupScreen;
