/**
 * ErrorBoundary Component
 *
 * Catches unhandled React errors and provides:
 * 1. Graceful error UI for users
 * 2. Detailed error logging
 * 3. Recovery mechanism (try again)
 * 4. Integration with logging system
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { logBridge } from '../logging/expoLogBridge';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error with full context
    logBridge.error(
      `Component Error: ${error.message}`,
      'ERROR',
      error,
      {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }
    );

    // Update state with error info for display (dev mode)
    this.setState({
      errorInfo,
    });

    // In production, you might want to send this to Sentry
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  }

  handleReset = () => {
    logBridge.info('User reset error boundary', 'UI', {
      previousError: this.state.error?.message,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>

            {/* User-friendly message */}
            <Text style={styles.message}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>

            {/* Try Again Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Developer Info (only in dev mode) */}
            {__DEV__ && this.state.error && (
              <View style={styles.devInfo}>
                <Text style={styles.devTitle}>Developer Info:</Text>

                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>Error: </Text>
                    {this.state.error.name}
                  </Text>

                  <Text style={styles.errorText}>
                    <Text style={styles.errorLabel}>Message: </Text>
                    {this.state.error.message}
                  </Text>

                  {this.state.error.stack && (
                    <Text style={styles.errorText}>
                      <Text style={styles.errorLabel}>Stack: {'\n'}</Text>
                      {this.state.error.stack}
                    </Text>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <Text style={styles.errorText}>
                      <Text style={styles.errorLabel}>Component Stack: {'\n'}</Text>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devInfo: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    maxHeight: 300,
  },
  devTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 12,
  },
  errorDetails: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#ff4444',
  },
});

export default ErrorBoundary;
