import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import { SuggestionsTab, AutocompleteTab, InsightsTab } from './smart-scout';

type Props = NativeStackScreenProps<AppStackParamList, 'SmartScout'>;

type TabName = 'suggestions' | 'autocomplete' | 'insights';

interface Tab {
  key: TabName;
  title: string;
  icon: string;
  component: React.FC;
}

const TABS: Tab[] = [
  {
    key: 'suggestions',
    title: 'Suggestions',
    icon: 'search',
    component: SuggestionsTab,
  },
  {
    key: 'autocomplete',
    title: 'Autocomplete',
    icon: 'text',
    component: AutocompleteTab,
  },
  {
    key: 'insights',
    title: 'Insights',
    icon: 'analytics',
    component: InsightsTab,
  },
];

export const SmartScoutScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabName>('suggestions');

  const ActiveTabComponent = TABS.find((tab) => tab.key === activeTab)?.component || SuggestionsTab;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>SmartScout AI</Text>
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={14} color={colors.status.warning} />
            <Text style={styles.aiText}>AI</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon as any}
                size={20}
                color={isActive ? colors.brand.primary : colors.text.secondary}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.title}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        <ActiveTabComponent />
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.status.warning + '20',
    borderRadius: radius.sm,
  },
  aiText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.status.warning,
  },
  placeholder: {
    width: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tabActive: {
    // Active state is handled by indicator
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.brand.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.brand.primary,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  content: {
    flex: 1,
  },
});
