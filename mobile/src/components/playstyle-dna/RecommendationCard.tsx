/**
 * Recommendation Card Component
 * Displays training recommendations with expandable details
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface RecommendationCardProps {
  recommendation: string;
  type?: 'technical' | 'tactical' | 'physical' | 'mental';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  details?: string;
  containerStyle?: ViewStyle;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  type = 'technical',
  priority = 'medium',
  details,
  containerStyle,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const typeConfig = {
    technical: {
      icon: 'football',
      color: '#3B82F6',
      label: 'Technical',
    },
    tactical: {
      icon: 'grid',
      color: '#A855F7',
      label: 'Tactical',
    },
    physical: {
      icon: 'fitness',
      color: '#EF4444',
      label: 'Physical',
    },
    mental: {
      icon: 'brain',
      color: '#14B8A6',
      label: 'Mental',
    },
  };

  const priorityConfig = {
    low: {
      color: '#6B7280',
      label: 'Low Priority',
      dots: 1,
    },
    medium: {
      color: '#3B82F6',
      label: 'Medium Priority',
      dots: 2,
    },
    high: {
      color: '#F97316',
      label: 'High Priority',
      dots: 3,
    },
    critical: {
      color: '#EF4444',
      label: 'Critical Priority',
      dots: 4,
    },
  };

  const config = typeConfig[type];
  const priorityInfo = priorityConfig[priority];

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={toggleExpanded}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>

        <View style={styles.headerText}>
          <View style={styles.topRow}>
            <Text style={styles.typeLabel}>{config.label}</Text>
            <View style={styles.priorityIndicator}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.priorityDot,
                    {
                      backgroundColor:
                        index < priorityInfo.dots
                          ? priorityInfo.color
                          : 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.recommendation} numberOfLines={expanded ? undefined : 2}>
            {recommendation}
          </Text>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#9FA1A9"
          style={styles.expandIcon}
        />
      </View>

      {/* Expanded Details */}
      {expanded && details && (
        <View style={styles.details}>
          <View style={styles.divider} />
          <Text style={styles.detailsText}>{details}</Text>

          {/* Priority Label */}
          <View style={styles.priorityLabel}>
            <View
              style={[styles.priorityDotLarge, { backgroundColor: priorityInfo.color }]}
            />
            <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
              {priorityInfo.label}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1117',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: '#9FA1A9',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityIndicator: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  recommendation: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 20,
  },
  expandIcon: {
    marginLeft: 4,
    marginTop: 14,
  },
  details: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 13,
    color: '#9FA1A9',
    lineHeight: 18,
    marginBottom: 12,
  },
  priorityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RecommendationCard;
