/**
 * Haptics Service - Tactile feedback for iOS-like experience
 * Provides consistent haptic feedback throughout the app
 */

import * as Haptics from 'expo-haptics';

/**
 * Light impact - for subtle interactions
 * Use for: button taps, selections, toggles
 */
export const lightImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium impact - for standard interactions
 * Use for: confirmations, list item selections
 */
export const mediumImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Heavy impact - for important actions
 * Use for: delete actions, major changes
 */
export const heavyImpact = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Success notification
 * Use for: successful operations, completions
 */
export const success = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Warning notification
 * Use for: warnings, important alerts
 */
export const warning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Error notification
 * Use for: errors, failures
 */
export const error = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection changed
 * Use for: picker changes, segmented control
 */
export const selectionChanged = () => {
  Haptics.selectionAsync();
};
