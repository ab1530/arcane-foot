import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError } from '../../services/toast';
import api from '../../services/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useLocalization } from '../../contexts/LocalizationContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const { dictionary } = useLocalization();
  const loginCopy = dictionary.auth.login;

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError(loginCopy.toasts.missingFields);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const response = await api.login({
        email: email.toLowerCase().trim(),
        password,
      });

      if (response.accessToken && response.user) {
        api.setAuthToken(response.accessToken);
        await login(response.user, response.accessToken, response.refreshToken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess(loginCopy.toasts.success);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.response?.status === 401) {
        showError(loginCopy.toasts.invalidCredentials);
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message === 'Network Error') {
        showError(loginCopy.toasts.network);
      } else {
        showError(loginCopy.toasts.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Ionicons name="football" size={60} color={colors.brand.primary} />
              <Text style={styles.appName}>{loginCopy.appName}</Text>
              <Text style={styles.tagline}>{loginCopy.tagline}</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{loginCopy.title}</Text>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.text.secondary} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={loginCopy.inputs.email}
                    placeholderTextColor={colors.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.text.secondary} style={styles.icon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder={loginCopy.inputs.password}
                    placeholderTextColor={colors.text.secondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                testID="login-submit-button"
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ disabled: loading }}
              >
                {loading ? (
                  <ActivityIndicator testID="login-loading-indicator" color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>{loginCopy.button}</Text>
                )}
              </TouchableOpacity>

              {/* Test Info */}
              <View style={styles.testInfo}>
                <Ionicons name="information-circle-outline" size={16} color={colors.semantic.info} />
                <Text style={styles.testInfoText}>{loginCopy.testCredentials}</Text>
              </View>
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>{loginCopy.noAccount} </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup')}
                disabled={loading}
              >
                <Text style={styles.registerLink}>{loginCopy.signupCta}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  appName: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  formTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    paddingVertical: spacing.sm,
  },
  loginButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: colors.semantic.info + '20',
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  testInfoText: {
    color: colors.semantic.info,
    fontSize: typography.sizes.xs,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  registerLink: {
    color: colors.brand.primary,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});

export default LoginScreen;
