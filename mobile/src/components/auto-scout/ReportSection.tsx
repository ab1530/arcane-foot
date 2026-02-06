import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Icon } from '../ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { ReportSection as ReportSectionType } from '../../types/auto-scout';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ReportSectionProps {
  title: string;
  section: ReportSectionType;
  icon?: string;
  defaultExpanded?: boolean;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  section,
  icon,
  defaultExpanded = false,
}) => {
  const { dictionary } = useLocalization();
  const copy = dictionary.autoScout.wizard.preview.sectionDetails;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={16} color={colors.status.warning} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Icon
          key="half"
          name="star"
          size={16}
          color={colors.status.warning}
        />
      );
    }

    const emptyStars = 10 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon
          key={`empty-${i}`}
          name="starOutline"
          size={16}
          color={colors.text.tertiary}
        />
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <View style={styles.iconContainer}>
              <Icon name={icon as any} size={24} color={colors.brand.primary} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>{renderStars(section.rating)}</View>
              <Text style={styles.ratingText}>
                {section.rating.toFixed(1)}/10
              </Text>
            </View>
          </View>
        </View>
        <Icon
          name={isExpanded ? 'chevronUp' : 'chevronDown'}
          size={24}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Strengths */}
          {section.strengths.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{copy.strengths}</Text>
              <View style={styles.list}>
                {section.strengths.map((strength, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.bullet, styles.bulletGreen]}>
                      <Icon name="checkmark" size={12} color={colors.background.primary} />
                    </View>
                    <Text style={styles.listItemText}>{strength}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Weaknesses */}
          {section.weaknesses.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{copy.weaknesses}</Text>
              <View style={styles.list}>
                {section.weaknesses.map((weakness, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={[styles.bullet, styles.bulletRed]}>
                      <Icon name="close" size={12} color={colors.background.primary} />
                    </View>
                    <Text style={styles.listItemText}>{weakness}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details */}
          {section.details && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{copy.details}</Text>
              <Text style={styles.detailsText}>{section.details}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: colors.background.tertiary,
    padding: spacing.md,
    gap: spacing.lg,
  },
  subsection: {
    gap: spacing.sm,
  },
  subsectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  list: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletGreen: {
    backgroundColor: colors.status.success,
  },
  bulletRed: {
    backgroundColor: colors.status.error,
  },
  listItemText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 20,
  },
  detailsText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
