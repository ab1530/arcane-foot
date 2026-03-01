/**
 * Similar Player Card Component
 * Shows a player similar to current player with mini radar preview
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { SimilarPlayer } from '../../types/playstyle-dna';
import { getStyleColor } from '../../utils/playStyleColors';
import { StyleBadge } from './StyleBadge';

interface SimilarPlayerCardProps {
  player: SimilarPlayer;
  onPress?: () => void;
  containerStyle?: ViewStyle;
  showMiniRadar?: boolean;
}

export const SimilarPlayerCard: React.FC<SimilarPlayerCardProps> = ({
  player,
  onPress,
  containerStyle,
  showMiniRadar = false,
}) => {
  const styleColor = getStyleColor(player.style);
  const similarityPercentage = Math.round(player.similarity * 100);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Player Photo */}
        <View style={styles.photoContainer}>
          {player.photo ? (
            <Image source={{ uri: player.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: `${styleColor}20` }]}>
              <Ionicons name="person" size={32} color={styleColor} />
            </View>
          )}

          {/* Similarity Badge */}
          <View style={[styles.similarityBadge, { backgroundColor: styleColor }]}>
            <Text style={styles.similarityText}>{similarityPercentage}%</Text>
          </View>
        </View>

        {/* Player Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>

          <View style={styles.metadata}>
            <Text style={styles.position}>{player.position}</Text>
            {player.nationality && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.nationality}>{player.nationality}</Text>
              </>
            )}
          </View>

          {player.club && (
            <Text style={styles.club} numberOfLines={1}>
              {player.club}
            </Text>
          )}

          {/* Style Badge */}
          <View style={styles.styleBadgeContainer}>
            <StyleBadge style={player.style} size="small" variant="ghost" />
          </View>
        </View>

        {/* Similarity Bar */}
        <View style={styles.similarityBar}>
          <View style={styles.similarityBarBg}>
            <View
              style={[
                styles.similarityBarFill,
                {
                  width: `${similarityPercentage}%`,
                  backgroundColor: styleColor,
                },
              ]}
            />
          </View>
          <Text style={styles.similarityLabel}>Match</Text>
        </View>

        {/* Arrow Icon */}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#b3afb2"
            style={styles.arrow}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gradient: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0D1117',
  },
  similarityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  position: {
    fontSize: 12,
    color: '#e6ff3c',
    fontWeight: '600',
  },
  separator: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 6,
  },
  nationality: {
    fontSize: 12,
    color: '#b3afb2',
  },
  club: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  styleBadgeContainer: {
    alignSelf: 'flex-start',
  },
  similarityBar: {
    alignItems: 'center',
    marginRight: 8,
  },
  similarityBarBg: {
    width: 40,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  similarityBarFill: {
    borderRadius: 20,
  },
  similarityLabel: {
    fontSize: 9,
    color: '#b3afb2',
    fontWeight: '600',
  },
  arrow: {
    marginLeft: 4,
  },
});

export default SimilarPlayerCard;
