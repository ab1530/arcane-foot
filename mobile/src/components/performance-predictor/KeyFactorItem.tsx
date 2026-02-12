import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getImpactIcon,
  getImpactColor,
  formatFactorName,
} from '../../utils/performance-predictor';
import type { KeyFactor } from '../../types/performance-predictor';

interface KeyFactorItemProps {
  factor: KeyFactor;
  rank: number;
}

export const KeyFactorItem: React.FC<KeyFactorItemProps> = ({ factor, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const impactColor = getImpactColor(factor.impact);
  const impactIcon = getImpactIcon(factor.impact);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Rank badge */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        {/* Factor info */}
        <View style={styles.factorInfo}>
          <Text style={styles.factorName}>{formatFactorName(factor.factor)}</Text>
          <Text style={styles.factorValue}>Value: {factor.value.toFixed(2)}</Text>
        </View>

        {/* Impact indicator */}
        <View style={styles.impactContainer}>
          <Text style={[styles.impactIcon, { color: impactColor }]}>
            {impactIcon}
          </Text>
          <Text style={[styles.importanceText, { color: impactColor }]}>
            {(factor.importance * 100).toFixed(0)}%
          </Text>
        </View>

        {/* Expand icon */}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#9CA3AF"
          style={styles.expandIcon}
        />
      </View>

      {/* Impact bar */}
      <View style={styles.impactBarContainer}>
        <View
          style={[
            styles.impactBar,
            {
              width: `${factor.importance * 100}%`,
              backgroundColor: impactColor,
            },
          ]}
        />
      </View>

      {/* Expanded description */}
      {expanded && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{factor.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    backgroundColor: '#374151',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#E4FF3B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  factorInfo: {
    flex: 1,
  },
  factorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  factorValue: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  impactContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  impactIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  importanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 4,
  },
  impactBarContainer: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  impactBar: {
    height: '100%',
    borderRadius: 2,
  },
  descriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 20,
  },
});
