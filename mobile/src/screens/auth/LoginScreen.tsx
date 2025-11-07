import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GradientText } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import { showSuccess, showError } from '../../services/toast';
import api from '../../services/api';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError('Veuillez remplir tous les champs');
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
        // Store the token
        await api.setAuthToken(response.accessToken);

        // Login the user
        await login(response.user, response.accessToken);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showSuccess('Connexion réussie !');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (error.response?.status === 401) {
        showError('Email ou mot de passe incorrect');
      } else if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.message === 'Network Error') {
        showError('Erreur de connexion au serveur');
      } else {
        showError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Mot de passe oublié',
      'La réinitialisation du mot de passe sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.primary + '80']}
                style={styles.logoGradient}
              >
                <Ionicons name="football" size={50} color={colors.background.primary} />
              </LinearGradient>
            </View>
            <GradientText variant="arcane" style={styles.appName}>
              Arcane Football
            </GradientText>
            <Text style={styles.tagline}>Plateforme de Scouting Professionnel</Text>
          </View>

          {/* Login Form */}
          <GlassCard variant="elevated" style={styles.formCard}>
            <Text style={styles.formTitle}>Connexion</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.text.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colors.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.primary + 'DD']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background.primary} />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Test Credentials Info */}
            <View style={styles.testInfo}>
              <Ionicons name="information-circle" size={16} color={colors.semantic.info} />
              <Text style={styles.testInfoText}>
                Test: admin@arcane.com / Password123!
              </Text>
            </View>
          </GlassCard>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Pas encore de compte ?</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Signup');
              }}
            >
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing["2xl"],
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: colors.text.primary,
    fontSize: typography.sizes.base,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loginButtonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
  testInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.semantic.info + '20',
    borderRadius: radius.sm,
  },
  testInfoText: {
    color: colors.semantic.info,
    fontSize: typography.sizes.xs,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
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
