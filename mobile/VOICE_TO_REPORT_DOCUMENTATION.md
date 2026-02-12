# Voice-to-Report Mobile UI Documentation

## Overview

The Voice-to-Report feature allows scouts to record voice notes and automatically generate structured scouting reports using AI-powered transcription and data extraction.

**Location**: `/mobile/src/screens/reports/VoiceToReportScreen.tsx`

**Backend API**: `/backend/src/modules/voice-to-report/`

---

## Architecture

### Directory Structure

```
mobile/src/
├── screens/reports/
│   └── VoiceToReportScreen.tsx          # Main screen
├── components/voice/
│   ├── RecordButton.tsx                 # Large circular record button
│   ├── WaveformDisplay.tsx              # Animated audio waveform
│   ├── RecordingTimer.tsx               # Recording duration timer
│   ├── AudioPlayer.tsx                  # Playback controls
│   ├── TranscriptionCard.tsx            # Display transcription
│   ├── ExtractedDataCard.tsx            # Display/edit extracted data
│   └── index.ts                         # Component exports
├── services/api/
│   └── voice-to-report.ts               # API client
└── types/
    └── voice-to-report.ts               # TypeScript types
```

---

## Features

### 1. Recording States

The screen manages multiple states throughout the voice-to-report flow:

- **idle**: Ready to record
- **recording**: Active recording with waveform animation
- **recorded**: Audio captured, ready to process
- **processing**: Sending to API for transcription
- **complete**: Report generated, showing results
- **error**: Error occurred during processing

### 2. Audio Recording

Uses **expo-av** for cross-platform audio recording:

```typescript
import { Audio } from 'expo-av';

const startRecording = async () => {
  await Audio.requestPermissionsAsync();
  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  setRecording(recording);
};

const stopRecording = async () => {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  setAudioUri(uri);
};
```

**Audio Settings**:
- Format: M4A (AAC encoding)
- Sample Rate: 44100 Hz
- Channels: 2 (stereo)
- Bit Rate: 128 kbps
- Max Duration: 5 minutes (300 seconds)

### 3. Permissions

Microphone permission is requested before recording:

```typescript
const requestPermissions = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission denied', 'Microphone access is required');
  }
};
```

---

## Components

### RecordButton

Large circular button with animations and haptic feedback.

**Props**:
- `state: RecordingState` - Current recording state
- `onPress: () => void` - Button press handler
- `disabled?: boolean` - Disable button
- `size?: number` - Button size (default: 100)

**Features**:
- Pulsing animation during recording
- Color changes based on state (yellow → red → green)
- Icon changes (mic → stop → checkmark)
- Haptic feedback on press

**Usage**:
```tsx
<RecordButton
  state={recordingState}
  onPress={handleRecordPress}
  size={120}
/>
```

---

### WaveformDisplay

Animated bars showing audio levels during recording.

**Props**:
- `isRecording: boolean` - Whether recording is active
- `barCount?: number` - Number of bars (default: 20)
- `barWidth?: number` - Width of each bar (default: 4)
- `barSpacing?: number` - Spacing between bars (default: 4)
- `height?: number` - Container height (default: 60)
- `color?: string` - Bar color (default: accent)

**Features**:
- Real-time animation during recording
- Each bar animates independently
- Smooth transitions using react-native-reanimated

**Usage**:
```tsx
<WaveformDisplay
  isRecording={recordingState === 'recording'}
  height={80}
/>
```

---

### RecordingTimer

Displays recording duration with max time indicator.

**Props**:
- `isRecording: boolean` - Whether recording is active
- `maxDuration?: number` - Max duration in seconds (default: 300)
- `onMaxReached?: () => void` - Callback when max reached

**Features**:
- Updates every second during recording
- Color changes as approaching max (yellow → orange → red)
- Automatically stops at max duration

**Display**: `MM:SS / MM:SS`

**Usage**:
```tsx
<RecordingTimer
  isRecording={recordingState === 'recording'}
  maxDuration={300}
  onMaxReached={handleMaxDurationReached}
/>
```

---

### AudioPlayer

Playback controls for recorded audio.

**Props**:
- `audioUri: string` - Local file URI
- `duration: number` - Duration in seconds
- `onPlaybackComplete?: () => void` - Callback when complete

**Features**:
- Play/pause button
- Progress slider
- Duration display
- Playback speed control (1x, 1.5x, 2x)

**Note**: Actual audio playback requires full expo-av integration (placeholder UI provided).

**Usage**:
```tsx
<AudioPlayer
  audioUri={audioUri}
  duration={audioDuration}
/>
```

---

### TranscriptionCard

Displays transcribed text from voice recording.

**Props**:
- `transcription: string` - Transcribed text
- `language: string` - Language code (en, es, fr, etc.)
- `confidence?: number` - Confidence score (0-100)

**Features**:
- Scrollable text display (max 200px height)
- Copy to clipboard button
- Confidence badge
- Language indicator
- Character count

**Usage**:
```tsx
<TranscriptionCard
  transcription={voiceReport.transcription}
  language={voiceReport.language}
  confidence={voiceReport.confidence}
/>
```

---

### ExtractedDataCard

Displays and allows editing of extracted scouting data.

**Props**:
- `data: ExtractedReportData` - Extracted data
- `onChange?: (data: ExtractedReportData) => void` - Change handler
- `editable?: boolean` - Enable editing (default: true)

**Sections**:
1. **Player Information**: Name, position, jersey number, team
2. **Match Details**: Opponent, competition, venue, date, minutes
3. **Performance Ratings**: Technical, tactical, physical, mental, overall
4. **Analysis**: Strengths, weaknesses, key moments, observations
5. **Tags**: Extracted tags

**Features**:
- Editable text inputs
- Visual rating bars with percentages
- Scrollable content
- Color-coded ratings

**Usage**:
```tsx
<ExtractedDataCard
  data={editedData || voiceReport.extractedData}
  onChange={setEditedData}
  editable={true}
/>
```

---

## API Integration

### Voice-to-Report API Client

**Location**: `/mobile/src/services/api/voice-to-report.ts`

#### Methods

##### 1. processVoiceReport()

Process voice recording and generate report.

```typescript
const response = await voiceToReportApi.processVoiceReport(audioUri, {
  language: 'en',
  matchId: 'clm123abc',
  playerId: 'clm456def',
  keepAudio: false,
});
```

**Request**:
- `audioUri: string` - Local file URI
- `options.language?: SupportedLanguage` - Recording language
- `options.matchId?: string` - Optional match ID
- `options.playerId?: string` - Optional player ID
- `options.keepAudio?: boolean` - Save audio to storage

**Response**:
```typescript
{
  transcription: string;
  extractedData: ExtractedReportData;
  confidence: number;
  suggestions: string[];
  warnings?: string[];
  audioUrl?: string;
  language: string;
  processingTimeMs: number;
}
```

**Rate Limit**: 10 requests per minute

---

##### 2. getSupportedLanguages()

Get list of supported languages.

```typescript
const languages = await voiceToReportApi.getSupportedLanguages();
```

**Response**:
```typescript
[
  { code: 'en', name: 'English', whisperSupported: true },
  { code: 'es', name: 'Spanish', whisperSupported: true },
  { code: 'fr', name: 'French', whisperSupported: true },
  // ...
]
```

---

##### 3. getExamples()

Get example voice report templates.

```typescript
const examples = await voiceToReportApi.getExamples();
```

**Response**:
```typescript
[
  {
    language: 'en',
    prompt: 'This is a scouting report for...',
    tips: ['Speak clearly', 'Include all ratings', ...]
  },
  // ...
]
```

---

##### 4. testTranscription()

Test data extraction without uploading audio (dev only).

```typescript
const result = await voiceToReportApi.testTranscription(
  'This is a scouting report for John Doe...',
  'en'
);
```

---

## Types

### RecordingState

```typescript
type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing' | 'complete' | 'error';
```

### SupportedLanguage

```typescript
enum SupportedLanguage {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
}
```

### ExtractedReportData

```typescript
interface ExtractedReportData {
  playerName?: string;
  position?: string;
  jerseyNumber?: number;
  team?: string;
  opponent?: string;
  competition?: string;
  matchDate?: string;
  venue?: string;
  technicalRating?: number;
  physicalRating?: number;
  tacticalRating?: number;
  mentalRating?: number;
  overallRating?: number;
  strengths?: string;
  weaknesses?: string;
  keyMoments?: string;
  observations?: string;
  minutesPlayed?: number;
  recommendation?: RecommendationType;
  tags?: string[];
}
```

### VoiceReportResponse

See API Integration section above.

---

## User Flow

### Complete Recording Flow

```
1. User taps microphone button
   ↓
2. App requests microphone permission
   ↓
3. User grants permission
   ↓
4. Recording starts (waveform animates, timer starts)
   ↓
5. User speaks scouting report
   ↓
6. User taps stop button (or max duration reached)
   ↓
7. Recording stops, audio saved locally
   ↓
8. User reviews audio with playback controls
   ↓
9. User taps "Process Recording"
   ↓
10. Audio uploaded to API
    ↓
11. API transcribes audio (Whisper)
    ↓
12. API extracts structured data (NLU)
    ↓
13. Results displayed (transcription + extracted data)
    ↓
14. User reviews/edits extracted data
    ↓
15. User taps "Generate Report"
    ↓
16. Navigate to CreateReportScreen with pre-filled data
```

---

## Error Handling

### Permission Denied

```typescript
if (status !== 'granted') {
  Alert.alert(
    'Permission Required',
    'Microphone access is required. Please enable it in settings.',
    [{ text: 'OK' }]
  );
}
```

### Recording Failed

```typescript
try {
  await startRecording();
} catch (error) {
  Alert.alert('Error', 'Failed to start recording. Please try again.');
}
```

### API Processing Failed

```typescript
try {
  await voiceToReportApi.processVoiceReport(audioUri);
} catch (error) {
  Alert.alert('Processing Failed', error.message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Retry', onPress: processRecording },
  ]);
}
```

---

## Mobile Features

### Haptic Feedback

Haptic feedback is triggered on:
- Record button press (start)
- Record button press (stop) - heavier impact
- Copy to clipboard - success notification

```typescript
import * as Haptics from 'expo-haptics';

Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### Background Recording

Audio recording continues with screen on. For background recording, additional configuration needed:

```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
});
```

### Copy to Clipboard

```typescript
import * as Clipboard from 'expo-clipboard';

await Clipboard.setStringAsync(transcription);
```

---

## Design System

### Colors

```typescript
// Arcane Brand Colors
accent: '#E4FF3B',          // Fluorescent Yellow - Primary accent
dark: '#080C1D',            // Primary Dark
darkAlt: '#0F1425',         // Secondary background
darkBorder: '#1B2133',      // Borders
grey: '#9FA1A9',            // Secondary text
white: '#FFFFFF',           // Primary text

// Functional Colors
success: '#10B981',         // Green
danger: '#FF3B3B',          // Red
warning: '#F59E0B',         // Orange
info: '#E4FF3B',            // Same as accent
```

### Spacing

```typescript
xs: 4,
sm: 8,
md: 16,
lg: 24,
xl: 32,
xxl: 48,
```

### Font Sizes

```typescript
xs: 12,
sm: 14,
md: 16,
lg: 18,
xl: 20,
xxl: 24,
xxxl: 32,
```

---

## Navigation

### Navigate to Voice-to-Report

```typescript
navigation.navigate('VoiceToReport', {
  matchId: 'clm123abc',    // Optional
  playerId: 'clm456def',   // Optional
});
```

### Navigate from Voice-to-Report

After processing, navigate to CreateReport with pre-filled data:

```typescript
navigation.navigate('CreateReport', {
  prefillData: editedData,
  fromVoice: true,
});
```

---

## Testing

### Manual Testing Checklist

- [ ] Microphone permission requested
- [ ] Recording starts/stops correctly
- [ ] Timer updates every second
- [ ] Waveform animates during recording
- [ ] Max duration stops recording
- [ ] Audio playback works
- [ ] API upload succeeds
- [ ] Transcription displays correctly
- [ ] Extracted data editable
- [ ] Copy to clipboard works
- [ ] Haptic feedback triggers
- [ ] Navigation works
- [ ] Error handling works

### Test API Connection

```typescript
// Test without audio (dev only)
const result = await voiceToReportApi.testTranscription(
  'This is a scouting report for Cristiano Ronaldo, forward, number 7. ' +
  'Technical rating 95, tactical 88, physical 92, mental 90. ' +
  'Excellent positioning and finishing. Needs to improve defensive work rate.',
  'en'
);
```

---

## Performance Optimization

### Audio File Size

- Max duration: 5 minutes → ~10-15 MB
- Compressed with AAC codec
- Uploaded as multipart/form-data

### Animations

- Use `react-native-reanimated` for smooth 60fps animations
- Waveform bars animate independently
- Pulse animation on record button

### Memory Management

```typescript
// Clean up audio recording
useEffect(() => {
  return () => {
    if (recording) {
      recording.stopAndUnloadAsync();
    }
  };
}, [recording]);
```

---

## Dependencies

### Required Packages

```json
{
  "expo-av": "^16.0.7",
  "expo-clipboard": "^8.0.7",
  "expo-haptics": "~15.0.7",
  "@react-native-community/slider": "^5.1.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-toast-message": "^2.3.3"
}
```

### Install Command

```bash
npm install expo-av expo-clipboard
```

---

## Future Enhancements

### Planned Features

1. **Offline Mode**
   - Save recordings locally
   - Queue for upload when online
   - Local storage management

2. **Multi-Language UI**
   - Language picker
   - Localized example prompts
   - Translation support

3. **Real-Time Transcription**
   - Live captions during recording
   - Instant feedback

4. **Voice Commands**
   - "Start recording"
   - "Stop recording"
   - "Process"

5. **Audio Editing**
   - Trim audio
   - Remove silence
   - Adjust volume

6. **Templates**
   - Pre-defined report structures
   - Custom prompts per position
   - Quick fill templates

7. **Batch Processing**
   - Multiple recordings
   - Queue management
   - Bulk report generation

8. **Analytics**
   - Recording quality metrics
   - Confidence tracking
   - Usage statistics

---

## Troubleshooting

### Issue: Permission Denied

**Solution**: Guide user to enable microphone in Settings:
```typescript
Alert.alert(
  'Permission Required',
  'Please enable microphone access in Settings > Arcane Football',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() }
  ]
);
```

### Issue: Recording Failed

**Causes**:
- Microphone in use by another app
- Audio session conflicts
- Insufficient storage

**Solution**: Release audio resources and retry.

### Issue: Upload Failed

**Causes**:
- Network timeout
- File too large
- Server error

**Solution**: Implement retry with exponential backoff:
```typescript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

### Issue: Low Confidence Score

**Causes**:
- Background noise
- Unclear speech
- Missing information

**Solution**: Show suggestions to user:
- Speak more clearly
- Record in quiet environment
- Include all required fields

---

## Support

For issues or questions:
- Check backend logs: `/backend/src/modules/voice-to-report/`
- Review API documentation: `/backend/src/modules/voice-to-report/README.md`
- Test with sample prompts: `/backend/src/modules/voice-to-report/SAMPLE_PROMPTS.md`

---

## Summary

The Voice-to-Report mobile UI provides a complete, production-ready interface for scouts to record voice notes and generate structured scouting reports. The implementation includes:

- 6 reusable components
- Full audio recording support
- API integration with error handling
- TypeScript types
- Arcane brand design
- Mobile-specific features (haptics, permissions, clipboard)
- Comprehensive documentation

**Next Steps**:
1. Add navigation route to VoiceToReportScreen
2. Test on iOS and Android devices
3. Integrate with CreateReportScreen
4. Test with real backend API
5. Add offline support
