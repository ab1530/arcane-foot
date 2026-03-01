import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SinglePredictionTab } from './performance-predictor/SinglePredictionTab';
import { TeamLineupTab } from './performance-predictor/TeamLineupTab';
import { AccuracyTab } from './performance-predictor/AccuracyTab';

type TabType = 'single' | 'team' | 'accuracy';

export const PerformancePredictorScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('single');

  const renderContent = () => {
    switch (activeTab) {
      case 'single':
        return <SinglePredictionTab />;
      case 'team':
        return <TeamLineupTab />;
      case 'accuracy':
        return <AccuracyTab />;
      default:
        return <SinglePredictionTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance Predictor</Text>
        <Text style={styles.headerSubtitle}>
          AI-powered player performance forecasting
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'single' && styles.tabActive]}
          onPress={() => setActiveTab('single')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'single' && styles.tabTextActive,
            ]}
          >
            Single
          </Text>
          {activeTab === 'single' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
        >
          <Text
            style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}
          >
            Team Lineup
          </Text>
          {activeTab === 'team' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'accuracy' && styles.tabActive]}
          onPress={() => setActiveTab('accuracy')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'accuracy' && styles.tabTextActive,
            ]}
          >
            Accuracy
          </Text>
          {activeTab === 'accuracy' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#e6ff3c',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#e6ff3c',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});
