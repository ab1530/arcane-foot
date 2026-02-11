/**
 * Logging Test Screen
 *
 * Quick test screen to verify logging is working
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  log,
  logInfo,
  logWarn,
  logError,
  logDebug,
  logAPI,
  logNavigation,
  logUserAction,
  logAI,
  logPerformance,
} from '../../logging/expoLogBridge';

export function LoggingTestScreen() {
  const testBasicLogging = () => {
    log('This is a basic log message', 'SYSTEM');
    logInfo('This is an info message', 'SYSTEM');
    logWarn('This is a warning message', 'SYSTEM');
    logError('This is an error message', new Error('Test error'));
    logDebug('This is a debug message (dev only)', 'SYSTEM');
  };

  const testAPILogging = () => {
    logAPI('GET', '/api/players', 200, 234);
    logAPI('POST', '/api/reports', 201, 456);
    logAPI('GET', '/api/players/invalid', 404, 123);
    logAPI('POST', '/api/data', 500, 789);
  };

  const testNavigationLogging = () => {
    logNavigation('Home', 'Players', { playerId: '123' });
    logNavigation('Players', 'PlayerDetail', { playerId: '456', tab: 'stats' });
    logNavigation('PlayerDetail', 'Home');
  };

  const testUserActionLogging = () => {
    logUserAction('button_click', 'TestScreen', { button: 'test_logs' });
    logUserAction('form_submit', 'TestScreen', { form: 'search', query: 'Messi' });
    logUserAction('swipe', 'TestScreen', { direction: 'left' });
  };

  const testAILogging = () => {
    logAI('OpenAI', 'completion', 1456, 120);
    logAI('OpenAI', 'report_generation', 3200, 450);
    logAI('Claude', 'analysis', 890, 0);
  };

  const testPerformanceLogging = () => {
    logPerformance('data_fetch', 234, { count: 50 });
    logPerformance('screen_render', 567, { screen: 'TestScreen' });
    logPerformance('slow_operation', 2500, { operation: 'heavy_calc' });
  };

  const testErrorLogging = () => {
    try {
      throw new Error('Simulated error for testing');
    } catch (error) {
      logError('Test error caught', error as Error, {
        screen: 'TestScreen',
        action: 'testErrorLogging',
        timestamp: Date.now(),
      });
    }
  };

  const testAllLogs = () => {
    testBasicLogging();
    setTimeout(() => testAPILogging(), 500);
    setTimeout(() => testNavigationLogging(), 1000);
    setTimeout(() => testUserActionLogging(), 1500);
    setTimeout(() => testAILogging(), 2000);
    setTimeout(() => testPerformanceLogging(), 2500);
    setTimeout(() => testErrorLogging(), 3000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🧪 Logging Test Screen</Text>
        <Text style={styles.subtitle}>
          Press buttons below to generate test logs.{'\n'}
          Check your Metro Bundler terminal to see colored logs!
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Individual Tests</Text>

          <TouchableOpacity style={styles.button} onPress={testBasicLogging}>
            <Text style={styles.buttonText}>Test Basic Logging</Text>
            <Text style={styles.buttonSubtext}>log, info, warn, error, debug</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAPILogging}>
            <Text style={styles.buttonText}>Test API Logging</Text>
            <Text style={styles.buttonSubtext}>Success, error, various status codes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testNavigationLogging}>
            <Text style={styles.buttonText}>Test Navigation Logging</Text>
            <Text style={styles.buttonSubtext}>Screen transitions with params</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testUserActionLogging}>
            <Text style={styles.buttonText}>Test User Action Logging</Text>
            <Text style={styles.buttonSubtext}>Clicks, forms, swipes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAILogging}>
            <Text style={styles.buttonText}>Test AI Logging</Text>
            <Text style={styles.buttonSubtext}>AI service calls with tokens</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testPerformanceLogging}>
            <Text style={styles.buttonText}>Test Performance Logging</Text>
            <Text style={styles.buttonSubtext}>Timing, slow operations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testErrorLogging}>
            <Text style={styles.buttonText}>Test Error Logging</Text>
            <Text style={styles.buttonSubtext}>Error with stack trace</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Tests</Text>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testAllLogs}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              🚀 RUN ALL TESTS
            </Text>
            <Text style={[styles.buttonSubtext, styles.primaryButtonSubtext]}>
              Will execute all tests sequentially
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 How to View Logs</Text>
          <Text style={styles.infoText}>
            1. Open your Metro Bundler terminal{'\n'}
            2. Press any test button above{'\n'}
            3. Watch for colored logs with emojis!{'\n\n'}

            Expected format:{'\n'}
            14:32:15 ℹ️ INFO [SYSTEM] This is an info message{'\n'}
            14:32:16 ✅ API [API] GET /api/players - 200 (234ms){'\n'}
            14:32:17 🧭 NAVIGATION [NAVIGATION] Home → Players
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#999',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
});

export default LoggingTestScreen;
