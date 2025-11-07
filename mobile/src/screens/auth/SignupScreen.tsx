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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../../components/ui/Input';
import { colors, spacing, typography, radius } from '../../design/theme';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSignup = async () => {
    if (!isValid) {
      return;
    }

    try {
      await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (err) {
      console.error('Mobile signup failed:', err);
    }
  };

  const onChangeSafe = (setter: (value: string) => void) => (value: string) => {
    if (error) {
      clearError();
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
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoins la plateforme Arkane</Text>
          </View>

          <Input
            label="Prénom"
            value={firstName}
            onChangeText={onChangeSafe(setFirstName)}
            placeholder="Abdou"
          />
          <Input
            label="Nom"
            value={lastName}
            onChangeText={onChangeSafe(setLastName)}
            placeholder="Lakhdari"
          />
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={onChangeSafe(setEmail)}
            placeholder="club@arcane.gg"
          />
          <Input
            label="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={onChangeSafe(setPassword)}
            placeholder="••••••••"
          />
          <Input
            label="Confirmer le mot de passe"
            secureTextEntry
            value={confirmPassword}
            onChangeText={onChangeSafe(setConfirmPassword)}
            placeholder="••••••••"
            error={
              confirmPassword && confirmPassword !== password
                ? 'Les mots de passe ne correspondent pas'
                : undefined
            }
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            testID="signup-submit-button"
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || isLoading }}
            style={[styles.primaryButton, (!isValid || isLoading) && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator testID="signup-loading-indicator" color={colors.background.primary} />
            ) : (
              <Text style={styles.primaryButtonText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAuth}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.switchAuthText}>Déjà inscrit ? Se connecter</Text>
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
    paddingBottom: spacing["2xl"],
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
});

export default SignupScreen;
