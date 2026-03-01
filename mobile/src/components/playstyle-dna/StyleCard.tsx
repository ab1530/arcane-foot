/**
 * Style Card Component
 * Displays player style with confidence meter and real-world examples
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import type { PlayStyleName } from '../../types/playstyle-dna';
import { getStyleColor, getStyleIcon, getConfidenceColor, getConfidenceLevel } from '../../utils/playStyleColors';
import { StyleBadge } from './StyleBadge';

interface StyleCardProps {
  primaryStyle: PlayStyleName;
  secondaryStyle?: PlayStyleName;
  confidence: number;
  cluster?: number;
  realWorldExamples?: string[];
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const StyleCard: React.FC<StyleCardProps> = ({
  primaryStyle,
  secondaryStyle,
  confidence,
  cluster,
  realWorldExamples = [],
  onPress,
  containerStyle,
}) => {
  const styleColor = getStyleColor(primaryStyle);
  const iconName = getStyleIcon(primaryStyle);
  const confidenceColor = getConfidenceColor(confidence);
  const confidenceLevel = getConfidenceLevel(confidence);

  // Circular progress for confidence
  const radius = 40;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence * circumference);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {/* Header with Icon and Style Name */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${styleColor}20` }]}>
          <Ionicons name={iconName as any} size={48} color={styleColor} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.styleLabel}>Primary Style</Text>
          <Text style={[styles.styleName, { color: styleColor }]}>
            {primaryStyle}
          </Text>
          {cluster !== undefined && (
            <Text style={styles.cluster}>Cluster {cluster}</Text>
          )}
        </View>
      </View>

      {/* Confidence Meter */}
      <View style={styles.confidenceSection}>
        <View style={styles.circularProgress}>
          <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
            {/* Background circle */}
            <Circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress circle */}
            <Circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              stroke={confidenceColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
            />
          </Svg>
          <View style={styles.confidenceTextContainer}>
            <Text style={styles.confidencePercentage}>
              {Math.round(confidence * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.confidenceInfo}>
          <Text style={styles.confidenceLabel}>Classification Confidence</Text>
          <Text style={[styles.confidenceLevel, { color: confidenceColor }]}>
            {confidenceLevel}
          </Text>
          <Text style={styles.confidenceDescription}>
            The AI is {Math.round(confidence * 100)}% confident in this classification
          </Text>
        </View>
      </View>

      {/* Secondary Style */}
      {secondaryStyle && (
        <View style={styles.secondaryStyleSection}>
          <Text style={styles.sectionLabel}>Secondary Style</Text>
          <StyleBadge style={secondaryStyle} size="medium" variant="outlined" />
        </View>
      )}

      {/* Real World Examples */}
      {realWorldExamples.length > 0 && (
        <View style={styles.examplesSection}>
          <Text style={styles.sectionLabel}>Similar Players</Text>
          <View style={styles.examplesList}>
            {realWorldExamples.slice(0, 3).map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Ionicons name="person" size={14} color="#b3afb2" />
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tap hint */}
      {onPress && (
        <View style={styles.tapHint}>
          <Ionicons name="chevron-forward" size={20} color="#b3afb2" />
          <Text style={styles.tapHintText}>Tap for details</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1117',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  styleLabel: {
    fontSize: 12,
    color: '#b3afb2',
    fontWeight: '500',
    marginBottom: 4,
  },
  styleName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cluster: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  confidenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circularProgress: {
    position: 'relative',
    marginRight: 20,
  },
  confidenceTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidencePercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confidenceInfo: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#b3afb2',
    fontWeight: '500',
    marginBottom: 4,
  },
  confidenceLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  secondaryStyleSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#b3afb2',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  examplesSection: {
    marginBottom: 12,
  },
  examplesList: {
    gap: 8,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tapHintText: {
    fontSize: 12,
    color: '#b3afb2',
    marginLeft: 4,
  },
});

export default StyleCard;
