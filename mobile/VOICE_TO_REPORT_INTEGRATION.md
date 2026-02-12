# Voice-to-Report Integration Guide

## Quick Start

This guide shows how to integrate the Voice-to-Report feature into your navigation and existing screens.

---

## 1. Add to Navigation

### Option A: Add to Reports Stack

If you have a reports navigation stack:

```typescript
// navigation/ReportsNavigator.tsx or similar
import { VoiceToReportScreen } from '../screens/reports/VoiceToReportScreen';

const ReportsStack = createNativeStackNavigator();

function ReportsNavigator() {
  return (
    <ReportsStack.Navigator>
      <ReportsStack.Screen
        name="ReportsList"
        component={ReportsListScreen}
      />
      <ReportsStack.Screen
        name="CreateReport"
        component={CreateReportScreen}
      />
      <ReportsStack.Screen
        name="VoiceToReport"
        component={VoiceToReportScreen}
        options={{
          headerShown: false, // We use custom header
          title: 'Voice Recording',
        }}
      />
    </ReportsStack.Navigator>
  );
}
```

### Option B: Add to Main Navigator

```typescript
// navigation/AppNavigator.tsx or similar
import { VoiceToReportScreen } from '../screens/reports/VoiceToReportScreen';

<Stack.Screen
  name="VoiceToReport"
  component={VoiceToReportScreen}
  options={{
    headerShown: false,
    presentation: 'modal', // Optional: make it a modal
  }}
/>
```

---

## 2. Navigation Type Definitions

Add to your navigation types:

```typescript
// types/navigation.ts
export type RootStackParamList = {
  // ... existing routes
  VoiceToReport: {
    matchId?: string;
    playerId?: string;
  };
  CreateReport: {
    prefillData?: ExtractedReportData;
    fromVoice?: boolean;
  };
};
```

---

## 3. Navigate from Reports List

Add a button to navigate to Voice-to-Report:

```typescript
// screens/reports/ReportsListScreen.tsx
import { Ionicons } from '@expo/vector-icons';

<TouchableOpacity
  style={styles.voiceButton}
  onPress={() => navigation.navigate('VoiceToReport')}
>
  <Ionicons name="mic" size={24} color={COLORS.arcane.dark} />
  <Text style={styles.voiceButtonText}>Voice Report</Text>
</TouchableOpacity>
```

Styled button:
```typescript
const styles = StyleSheet.create({
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.arcane.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.arcane.dark,
  },
});
```

---

## 4. Navigate with Context

Pass match or player ID for context:

```typescript
// From match detail screen
navigation.navigate('VoiceToReport', {
  matchId: match.id,
});

// From player profile screen
navigation.navigate('VoiceToReport', {
  playerId: player.id,
});
```

---

## 5. Integrate with CreateReportScreen

Update CreateReportScreen to accept pre-filled data:

```typescript
// screens/reports/CreateReportScreen.tsx
import type { ExtractedReportData } from '../../types/voice-to-report';

interface CreateReportScreenProps {
  route: {
    params?: {
      prefillData?: ExtractedReportData;
      fromVoice?: boolean;
    };
  };
}

export const CreateReportScreen: React.FC<CreateReportScreenProps> = ({ route }) => {
  const { prefillData, fromVoice } = route.params || {};

  // Initialize form with prefilled data
  useEffect(() => {
    if (prefillData) {
      setPlayerName(prefillData.playerName || '');
      setPosition(prefillData.position || '');
      setTechnicalRating(prefillData.technicalRating || 0);
      setTacticalRating(prefillData.tacticalRating || 0);
      setPhysicalRating(prefillData.physicalRating || 0);
      setMentalRating(prefillData.mentalRating || 0);
      setStrengths(prefillData.strengths || '');
      setWeaknesses(prefillData.weaknesses || '');
      setObservations(prefillData.observations || '');
      // ... other fields

      if (fromVoice) {
        Toast.show({
          type: 'info',
          text1: 'Voice Data Loaded',
          text2: 'Review and submit your report',
        });
      }
    }
  }, [prefillData, fromVoice]);

  // ... rest of component
};
```

---

## 6. Add to Dashboard/Home Screen

Add quick access button:

```typescript
// screens/dashboard/DashboardScreen.tsx
<View style={styles.quickActions}>
  <QuickActionCard
    icon="mic"
    title="Voice Report"
    description="Record a quick report"
    color={COLORS.arcane.accent}
    onPress={() => navigation.navigate('VoiceToReport')}
  />
  {/* ... other quick actions */}
</View>
```

---

## 7. Add to Tab Bar (Optional)

Add as a center action button:

```typescript
// navigation/TabNavigator.tsx
<Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      if (route.name === 'VoiceToReport') {
        return (
          <View style={styles.centerButton}>
            <Ionicons name="mic" size={28} color={COLORS.arcane.dark} />
          </View>
        );
      }
      // ... other icons
    },
  })}
>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Reports" component={ReportsScreen} />
  <Tab.Screen
    name="VoiceToReport"
    component={VoiceToReportScreen}
    options={{
      tabBarButton: (props) => (
        <TouchableOpacity
          {...props}
          style={styles.centerButtonContainer}
        >
          <View style={styles.centerButton}>
            <Ionicons name="mic" size={28} color={COLORS.arcane.dark} />
          </View>
        </TouchableOpacity>
      ),
    }}
  />
  <Tab.Screen name="Players" component={PlayersScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>

const styles = StyleSheet.create({
  centerButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.arcane.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

---

## 8. Floating Action Button (FAB)

Add as FAB on reports list:

```typescript
// screens/reports/ReportsListScreen.tsx
import { Ionicons } from '@expo/vector-icons';

return (
  <View style={styles.container}>
    {/* ... existing content */}

    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate('VoiceToReport')}
      activeOpacity={0.8}
    >
      <Ionicons name="mic" size={28} color={COLORS.arcane.dark} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  // ... other styles
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.arcane.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

---

## 9. Deep Linking (Optional)

Add deep link support:

```typescript
// app.json or app.config.js
{
  "expo": {
    "scheme": "arcane",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "arcane",
              "host": "voice-report"
            }
          ]
        }
      ]
    }
  }
}
```

Handle deep links:

```typescript
// navigation/linking.ts
const linking = {
  prefixes: ['arcane://'],
  config: {
    screens: {
      VoiceToReport: 'voice-report',
      // ... other screens
    },
  },
};
```

Usage: `arcane://voice-report?matchId=123`

---

## 10. Add to Onboarding/Tutorial

Show feature in onboarding:

```typescript
// screens/onboarding/OnboardingScreen.tsx
const slides = [
  // ... other slides
  {
    title: 'Voice Reports',
    description: 'Record scouting reports with your voice. We\'ll transcribe and extract the data for you.',
    image: require('../../assets/onboarding/voice-report.png'),
    action: {
      label: 'Try It',
      onPress: () => navigation.navigate('VoiceToReport'),
    },
  },
];
```

---

## 11. Settings/Preferences

Add voice settings:

```typescript
// screens/settings/SettingsScreen.tsx
<SettingSection title="Voice Reports">
  <SettingItem
    label="Default Language"
    value={defaultLanguage}
    onPress={() => showLanguagePicker()}
  />
  <SettingItem
    label="Keep Audio Files"
    value={keepAudio}
    type="switch"
    onValueChange={setKeepAudio}
  />
  <SettingItem
    label="Auto-process After Recording"
    value={autoProcess}
    type="switch"
    onValueChange={setAutoProcess}
  />
</SettingSection>
```

---

## 12. Analytics Integration

Track voice report usage:

```typescript
// utils/analytics.ts
export const trackVoiceReport = {
  recordingStarted: () => {
    analytics.track('voice_recording_started');
  },
  recordingCompleted: (duration: number) => {
    analytics.track('voice_recording_completed', { duration });
  },
  processingStarted: () => {
    analytics.track('voice_processing_started');
  },
  processingCompleted: (confidence: number) => {
    analytics.track('voice_processing_completed', { confidence });
  },
  reportGenerated: () => {
    analytics.track('voice_report_generated');
  },
};
```

Use in VoiceToReportScreen:

```typescript
const startRecording = async () => {
  trackVoiceReport.recordingStarted();
  // ... recording logic
};
```

---

## 13. Permissions Setup

### iOS (Info.plist)

Already configured if using expo-av, but verify:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone to record voice notes for scouting reports.</string>
```

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

---

## 14. Environment Configuration

Add to `.env`:

```bash
# Voice-to-Report Settings
VOICE_MAX_DURATION=300
VOICE_AUTO_PROCESS=false
VOICE_KEEP_AUDIO=false
VOICE_DEFAULT_LANGUAGE=en
```

Access in app:

```typescript
// constants/config.ts
export const VOICE_CONFIG = {
  MAX_DURATION: parseInt(process.env.VOICE_MAX_DURATION || '300'),
  AUTO_PROCESS: process.env.VOICE_AUTO_PROCESS === 'true',
  KEEP_AUDIO: process.env.VOICE_KEEP_AUDIO === 'true',
  DEFAULT_LANGUAGE: process.env.VOICE_DEFAULT_LANGUAGE || 'en',
};
```

---

## 15. Testing

Create test navigation:

```typescript
// __tests__/VoiceToReport.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { VoiceToReportScreen } from '../src/screens/reports/VoiceToReportScreen';

describe('VoiceToReportScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <VoiceToReportScreen navigation={mockNavigation} />
      </NavigationContainer>
    );

    expect(getByText('Voice to Report')).toBeTruthy();
  });

  it('navigates to CreateReport after processing', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <NavigationContainer>
        <VoiceToReportScreen navigation={{ navigate: mockNavigate }} />
      </NavigationContainer>
    );

    // Simulate processing complete
    fireEvent.press(getByText('Generate Report'));

    expect(mockNavigate).toHaveBeenCalledWith('CreateReport', {
      prefillData: expect.any(Object),
      fromVoice: true,
    });
  });
});
```

---

## Complete Example

Here's a complete integration example:

```typescript
// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Screens
import { ReportsListScreen } from '../screens/reports/ReportsListScreen';
import { CreateReportScreen } from '../screens/reports/CreateReportScreen';
import { VoiceToReportScreen } from '../screens/reports/VoiceToReportScreen';

// Types
import type { ExtractedReportData } from '../types/voice-to-report';

export type RootStackParamList = {
  ReportsList: undefined;
  CreateReport: {
    prefillData?: ExtractedReportData;
    fromVoice?: boolean;
  };
  VoiceToReport: {
    matchId?: string;
    playerId?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="ReportsList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#080C1D',
          },
          headerTintColor: '#E4FF3B',
        }}
      >
        <Stack.Screen
          name="ReportsList"
          component={ReportsListScreen}
          options={{ title: 'Scouting Reports' }}
        />
        <Stack.Screen
          name="CreateReport"
          component={CreateReportScreen}
          options={{ title: 'Create Report' }}
        />
        <Stack.Screen
          name="VoiceToReport"
          component={VoiceToReportScreen}
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Next Steps

1. Add navigation route
2. Test on iOS and Android devices
3. Configure permissions
4. Test with backend API
5. Add analytics tracking
6. Create onboarding/tutorial
7. Add to release notes

---

## Support

For integration help:
- Main documentation: `VOICE_TO_REPORT_DOCUMENTATION.md`
- Backend API: `/backend/src/modules/voice-to-report/README.md`
- Component examples: `/mobile/src/components/voice/`
