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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setError(null);
    setIsSubmitting(true);

    try {
      await signup({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
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
