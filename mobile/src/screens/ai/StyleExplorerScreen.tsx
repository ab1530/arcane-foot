/**
 * Style Explorer Screen
 * Browse all 12 playing styles with descriptions and examples
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StyleBadge } from '../../components/playstyle-dna';
import { playStyleDnaApi } from '../../services/api/playstyle-dna';
import type { PlayStyleInfo, PlayStyleName } from '../../types/playstyle-dna';
import {
  getStyleColor,
  getStyleIcon,
  getStyleGradient,
  getStyleEmoji,
  ALL_STYLES,
} from '../../utils/playStyleColors';

type Props = NativeStackScreenProps<any, 'StyleExplorer'>;

export const StyleExplorerScreen: React.FC<Props> = ({ navigation, route }) => {
  const selectedStyle = route.params?.selectedStyle;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [styles, setStyles] = useState<PlayStyleInfo[]>([]);
  const [selectedStyleInfo, setSelectedStyleInfo] = useState<PlayStyleInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadStyles();
  }, []);

  useEffect(() => {
    if (selectedStyle && styles.length > 0) {
      const styleInfo = styles.find(s => s.name === selectedStyle);
      if (styleInfo) {
        openStyleModal(styleInfo);
      }
    }
  }, [selectedStyle, styles]);

  const loadStyles = async () => {
    try {
      setLoading(true);
      const stylesData = await playStyleDnaApi.getStyles();
      setStyles(stylesData);
    } catch (err) {
      console.error('Error loading styles:', err);
      // Fallback to mock data if API fails
      setStyles(getMockStyles());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStyles();
    setRefreshing(false);
  };

  const openStyleModal = (style: PlayStyleInfo) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyleInfo(style);
    setModalVisible(true);
  };

  const closeStyleModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedStyleInfo(null), 300);
  };

  const renderStyleCard = ({ item: style }: { item: PlayStyleInfo }) => {
    const styleColor = getStyleColor(style.name);
    const iconName = getStyleIcon(style.name);
    const emoji = getStyleEmoji(style.name);
    const [gradientStart, gradientEnd] = getStyleGradient(style.name);

    return (
      <TouchableOpacity
        style={styles.styleCard}
        onPress={() => openStyleModal(style)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[`${styleColor}20`, `${styleColor}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.styleCardGradient}
        >
          <View style={[styles.styleIcon, { backgroundColor: `${styleColor}30` }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <Text style={styles.styleName}>{style.name}</Text>

          <Text style={styles.styleDescription} numberOfLines={2}>
            {style.description}
          </Text>

          {style.playerCount !== undefined && (
            <View style={styles.playerCount}>
              <Ionicons name="people" size={14} color="#9FA1A9" />
              <Text style={styles.playerCountText}>{style.playerCount} players</Text>
            </View>
          )}

          <View style={styles.styleCardFooter}>
            <Ionicons name="chevron-forward" size={16} color={styleColor} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading && styles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E4FF3B" />
        <Text style={styles.loadingText}>Loading playing styles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0A0E1F', '#080C1D']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Style Explorer</Text>
        <Text style={styles.headerSubtitle}>
          Discover 12 unique playing styles
        </Text>
      </LinearGradient>

      {/* Styles Grid */}
      <FlatList
        data={styles.length > 0 ? styles : getMockStyles()}
        renderItem={renderStyleCard}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#E4FF3B"
          />
        }
      />

      {/* Style Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStyleModal}
      >
        {selectedStyleInfo && (
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#0A0E1F', '#080C1D']}
              style={styles.modalContent}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeStyleModal}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[
                  styles.modalIconContainer,
                  { backgroundColor: `${getStyleColor(selectedStyleInfo.name)}30` }
                ]}>
                  <Text style={styles.modalEmoji}>
                    {getStyleEmoji(selectedStyleInfo.name)}
                  </Text>
                </View>

                <Text style={[
                  styles.modalTitle,
                  { color: getStyleColor(selectedStyleInfo.name) }
                ]}>
                  {selectedStyleInfo.name}
                </Text>

                <StyleBadge
                  style={selectedStyleInfo.name}
                  size="large"
                  variant="outlined"
                  containerStyle={styles.modalBadge}
                />
              </View>

              {/* Modal Body */}
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalText}>
                    {selectedStyleInfo.description}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Key Characteristics</Text>
                  {selectedStyleInfo.characteristics.map((char, index) => (
                    <View key={index} style={styles.listItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={styles.listItemText}>{char}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Strengths</Text>
                  {selectedStyleInfo.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <Ionicons name="trending-up" size={18} color="#3B82F6" />
                      <Text style={styles.listItemText}>{strength}</Text>
                    </View>
                  ))}
                </View>

                {selectedStyleInfo.weaknesses && selectedStyleInfo.weaknesses.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Areas for Development</Text>
                    {selectedStyleInfo.weaknesses.map((weakness, index) => (
                      <View key={index} style={styles.listItem}>
                        <Ionicons name="trending-down" size={18} color="#F97316" />
                        <Text style={styles.listItemText}>{weakness}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Real-World Examples</Text>
                  {selectedStyleInfo.realWorldExamples.map((example, index) => (
                    <View key={index} style={styles.exampleItem}>
                      <Ionicons name="star" size={16} color="#E4FF3B" />
                      <Text style={styles.exampleText}>{example}</Text>
                    </View>
                  ))}
                </View>

                {selectedStyleInfo.playerCount !== undefined && (
                  <View style={styles.statsCard}>
                    <Ionicons name="people" size={24} color="#E4FF3B" />
                    <View style={styles.statsContent}>
                      <Text style={styles.statsNumber}>{selectedStyleInfo.playerCount}</Text>
                      <Text style={styles.statsLabel}>Players with this style</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        )}
      </Modal>
    </View>
  );
};

// Mock data fallback
const getMockStyles = (): PlayStyleInfo[] => {
  return ALL_STYLES.map(name => ({
    name,
    description: `A ${name.toLowerCase()} excels in their unique approach to the game.`,
    characteristics: ['High technical ability', 'Strong positioning', 'Game intelligence'],
    strengths: ['Technical skills', 'Decision making', 'Consistency'],
    weaknesses: ['Physical challenges', 'Adaptability'],
    realWorldExamples: ['Player A', 'Player B', 'Player C'],
    icon: getStyleIcon(name),
    color: getStyleColor(name),
    playerCount: Math.floor(Math.random() * 100) + 10,
  }));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080C1D',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#080C1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9FA1A9',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 255, 59, 0.2)',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9FA1A9',
  },
  grid: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  styleCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  styleCardGradient: {
    padding: 16,
    minHeight: 180,
  },
  styleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  styleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  styleDescription: {
    fontSize: 12,
    color: '#9FA1A9',
    lineHeight: 16,
    marginBottom: 12,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerCountText: {
    fontSize: 11,
    color: '#9FA1A9',
    fontWeight: '500',
  },
  styleCardFooter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#080C1D',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 56,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBadge: {
    alignSelf: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#9FA1A9',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  exampleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(228, 255, 59, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.3)',
    marginBottom: 20,
    gap: 16,
  },
  statsContent: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E4FF3B',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#9FA1A9',
  },
});

export default StyleExplorerScreen;
