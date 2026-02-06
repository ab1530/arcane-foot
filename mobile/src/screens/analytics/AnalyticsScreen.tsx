import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../design/theme';

export const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Performance insights and statistics</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Total Players</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>42</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>89%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>23</Text>
          <Text style={styles.statLabel}>Active Scouts</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.sectionText}>No recent activity to display</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: theme.typography.sizes.h1,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface.glass,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.brand.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h3,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
});

export default AnalyticsScreen;
