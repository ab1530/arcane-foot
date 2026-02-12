/**
 * Toast Service - Elegant notification system
 * Provides consistent feedback throughout the app
 */

import Toast from 'react-native-toast-message';

export const showSuccess = (message: string, description?: string) => {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
    visibilityTime: 3000,
    position: 'top',
    topOffset: 60,
  });
};

export const showError = (message: string, description?: string) => {
  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    visibilityTime: 4000,
    position: 'top',
    topOffset: 60,
  });
};

export const showInfo = (message: string, description?: string) => {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    visibilityTime: 3000,
    position: 'top',
    topOffset: 60,
  });
};

export const showWarning = (message: string, description?: string) => {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    visibilityTime: 3000,
    position: 'top',
    topOffset: 60,
  });
};

export const hideToast = () => {
  Toast.hide();
};
