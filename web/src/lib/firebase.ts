/**
 * Firebase Configuration for Push Notifications
 * Initializes Firebase app and messaging service for FCM
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

/**
 * Initialize Firebase app (singleton pattern)
 */
export const initializeFirebase = (): FirebaseApp | null => {
  if (typeof window === 'undefined') {
    // Firebase cannot be initialized on the server
    return null;
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration is incomplete. Push notifications will not work.');
    return null;
  }

  try {
    // Check if Firebase app is already initialized
    if (!app && getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else if (!app) {
      app = getApps()[0];
    }

    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

/**
 * Get Firebase messaging instance
 * Returns null if messaging is not supported or app is not initialized
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Check if messaging is supported in this browser
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.warn('Firebase messaging is not supported in this browser');
      return null;
    }

    // Initialize Firebase if needed
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      return null;
    }

    // Get or create messaging instance
    if (!messaging) {
      messaging = getMessaging(firebaseApp);
    }

    return messaging;
  } catch (error) {
    console.error('Error getting Firebase messaging:', error);
    return null;
  }
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

export { app, messaging };
