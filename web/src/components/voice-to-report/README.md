# Voice-to-Report UI System

A comprehensive voice recording interface for scouts to create scouting reports 10x faster using voice input, AI transcription, and automatic data extraction.

## 📁 File Structure

```
/src/components/voice-to-report/
├── VoiceRecorder.tsx           # Main modal component
├── WaveformVisualizer.tsx      # Real-time audio waveform
├── RecordingControls.tsx       # Recording control buttons
├── TranscriptionDisplay.tsx    # Transcription viewer/editor
├── ExtractedDataPreview.tsx    # Extracted data display
├── index.ts                    # Exports
└── README.md                   # This file

/src/hooks/
└── useVoiceRecorder.ts         # Voice recording hook

/src/lib/
└── browser-compatibility.ts    # Browser support checker
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { useState } from "react";
import { VoiceRecorder } from "@/components/voice-to-report";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function MyPage() {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const handleComplete = (extractedData: any) => {
    console.log("Extracted data:", extractedData);
    // Use the data to pre-fill your form
  };

  return (
    <>
      <Button onClick={() => setShowVoiceRecorder(true)}>
        <Mic className="w-5 h-5" />
        Voice Report
      </Button>

      {showVoiceRecorder && (
        <VoiceRecorder
          onClose={() => setShowVoiceRecorder(false)}
          onComplete={handleComplete}
          language="en"
        />
      )}
    </>
  );
}
```

### Integration with Form

```tsx
"use client";

import { useState } from "react";
import { VoiceRecorder } from "@/components/voice-to-report";

export default function ScoutingReportForm() {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [formData, setFormData] = useState({
    playerName: "",
    position: "",
    technicalRating: 0,
    physicalRating: 0,
    mentalRating: 0,
    tacticalRating: 0,
    overallRating: 0,
    strengths: "",
    weaknesses: "",
    recommendation: "",
    summary: "",
  });

  const handleVoiceComplete = (extractedData: any) => {
    setFormData({
      ...formData,
      ...extractedData,
    });
    setShowVoiceRecorder(false);
  };

  return (
    <div>
      {/* Voice Button */}
      <button
        onClick={() => setShowVoiceRecorder(true)}
        className="flex items-center gap-2 px-6 py-3 bg-arcane-accent text-arcane-dark rounded-lg hover:glow"
      >
        <Mic className="w-5 h-5" />
        <span>Fill from Voice</span>
      </button>

      {/* Form Fields */}
      <input
        type="text"
        value={formData.playerName}
        onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
        placeholder="Player Name"
      />

      {/* ... other form fields ... */}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onClose={() => setShowVoiceRecorder(false)}
          onComplete={handleVoiceComplete}
          language="en"
        />
      )}
    </div>
  );
}
```

## 🎯 Component API

### VoiceRecorder

Main modal component that handles the entire voice-to-report flow.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onClose` | `() => void` | Yes | - | Called when modal should close |
| `onComplete` | `(data: any) => void` | No | - | Called with extracted data when processing is complete |
| `language` | `string` | No | `"en"` | Initial language for transcription |
| `className` | `string` | No | `""` | Additional CSS classes |

**States:**

- `idle`: Ready to record
- `recording`: Actively recording
- `recorded`: Recording complete, ready to play/process
- `processing`: Uploading and transcribing
- `complete`: Processing complete, showing results

**Example:**

```tsx
<VoiceRecorder
  onClose={() => setShowModal(false)}
  onComplete={(data) => {
    console.log("Player:", data.playerName);
    console.log("Ratings:", data.technicalRating, data.physicalRating);
  }}
  language="en"
/>
```

### WaveformVisualizer

Real-time audio waveform visualization during recording.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isRecording` | `boolean` | Yes | - | Whether recording is active |
| `audioStream` | `MediaStream \| null` | Yes | - | Audio stream from getUserMedia |
| `barCount` | `number` | No | `20` | Number of frequency bars |
| `className` | `string` | No | `""` | Additional CSS classes |

**Features:**
- Real-time audio visualization using Web Audio API
- Animated bars with Framer Motion
- Responsive to audio levels
- Arcane accent color for active bars

**Example:**

```tsx
<WaveformVisualizer
  isRecording={recordingState === "recording"}
  audioStream={audioStream}
  barCount={20}
/>
```

### RecordingControls

Control buttons for recording flow.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `recordingState` | `RecordingState` | Yes | Current recording state |
| `isPlaying` | `boolean` | Yes | Whether audio is playing |
| `onStartRecording` | `() => void` | Yes | Start recording handler |
| `onStopRecording` | `() => void` | Yes | Stop recording handler |
| `onPlayRecording` | `() => void` | Yes | Play recording handler |
| `onPauseRecording` | `() => void` | Yes | Pause playback handler |
| `onReRecord` | `() => void` | Yes | Re-record handler |
| `onProcess` | `() => void` | Yes | Process recording handler |
| `disabled` | `boolean` | No | Disable all buttons |

**Example:**

```tsx
<RecordingControls
  recordingState={recordingState}
  isPlaying={isPlaying}
  onStartRecording={startRecording}
  onStopRecording={stopRecording}
  onPlayRecording={playRecording}
  onPauseRecording={pauseRecording}
  onReRecord={resetRecording}
  onProcess={processRecording}
/>
```

### TranscriptionDisplay

Display and edit transcription with confidence indicator.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `transcription` | `string` | Yes | Transcribed text |
| `confidence` | `number` | Yes | Confidence score (0-1) |
| `onEdit` | `(text: string) => void` | No | Edit handler |
| `className` | `string` | No | Additional CSS classes |

**Features:**
- Confidence indicator (High/Medium/Low)
- Copy to clipboard
- Inline editing
- Syntax highlighting for extracted entities

**Example:**

```tsx
<TranscriptionDisplay
  transcription="Scouting report for John Doe..."
  confidence={0.95}
  onEdit={(text) => setTranscription(text)}
/>
```

### ExtractedDataPreview

Preview and edit extracted data before applying to form.

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `extractedData` | `any` | Yes | Extracted data object |
| `onApplyToForm` | `() => void` | Yes | Apply handler |
| `onEdit` | `(key: string, value: any) => void` | No | Edit field handler |
| `className` | `string` | No | Additional CSS classes |

**Features:**
- Field-by-field confidence indicators
- Inline editing for each field
- Missing fields warning
- One-click apply to form

**Example:**

```tsx
<ExtractedDataPreview
  extractedData={extractedData}
  onApplyToForm={() => applyToForm(extractedData)}
  onEdit={(key, value) => updateField(key, value)}
/>
```

## 🪝 Hooks

### useVoiceRecorder

Custom hook for voice recording functionality.

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `recordingState` | `RecordingState` | Current state |
| `audioStream` | `MediaStream \| null` | Audio stream |
| `mediaRecorder` | `MediaRecorder \| null` | Media recorder instance |
| `audioBlob` | `Blob \| null` | Recorded audio blob |
| `audioUrl` | `string \| null` | Audio object URL |
| `recordingTime` | `number` | Recording duration (seconds) |
| `error` | `string \| null` | Error message |
| `isPlaying` | `boolean` | Playback state |
| `startRecording` | `() => Promise<void>` | Start recording |
| `stopRecording` | `() => void` | Stop recording |
| `playRecording` | `() => void` | Play audio |
| `pauseRecording` | `() => void` | Pause audio |
| `resetRecording` | `() => void` | Reset state |
| `setRecordingState` | `(state) => void` | Set state |
| `setError` | `(error) => void` | Set error |

**Example:**

```tsx
const {
  recordingState,
  audioStream,
  audioBlob,
  recordingTime,
  error,
  startRecording,
  stopRecording,
  resetRecording,
} = useVoiceRecorder(180); // 180 seconds max
```

## 🛠️ Utilities

### Browser Compatibility

```tsx
import {
  checkBrowserSupport,
  getRecommendedBrowser,
  isSecureContext,
  formatRecordingTime,
  formatFileSize,
  getMicrophonePermissionMessage,
} from "@/lib/browser-compatibility";

// Check browser support
const support = checkBrowserSupport();
if (!support.supported) {
  alert(support.message);
}

// Format time
const formatted = formatRecordingTime(125); // "02:05"

// Format file size
const size = formatFileSize(1024 * 1024); // "1 MB"

// Get permission error message
const message = getMicrophonePermissionMessage(error);
```

## 🎨 Design System

The Voice-to-Report UI follows the Arcane design system:

**Colors:**
- Background: `arcane-dark` (#080C1D)
- Cards: `arcane-darkCard` (#0F1425)
- Borders: `arcane-darkBorder` (#1B2133)
- Accent: `arcane-accent` (#E4FF3B)
- Text: `white` (#FFFFFF)
- Secondary: `arcane-grey` (#9FA1A9)

**Typography:**
- Font: Inter (system default)
- Headings: Bold, uppercase with letter-spacing
- Body: Regular weight

**Animations:**
- Framer Motion for smooth transitions
- Pulse effect for recording indicator
- Smooth waveform animations

## 🔧 API Integration

The voice-to-report system requires a backend endpoint:

**POST `/api/voice-to-report/process`**

Request:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `audio`: Audio file (Blob)
  - `language`: Language code (string)

Response:
```json
{
  "transcription": "Full transcription text...",
  "extractedData": {
    "playerName": "John Doe",
    "position": "Striker",
    "technicalRating": 8,
    "physicalRating": 9,
    "mentalRating": 7,
    "tacticalRating": 8,
    "overallRating": 8,
    "strengths": "Excellent positioning...",
    "weaknesses": "Needs to improve passing...",
    "recommendation": "SIGN",
    "summary": "Outstanding striker..."
  },
  "confidence": 0.95,
  "suggestions": ["Consider mentioning match date", "Add opponent name"]
}
```

## 🌐 Browser Support

| Browser | Recording | Waveform | Notes |
|---------|-----------|----------|-------|
| Chrome 60+ | ✅ | ✅ | Full support |
| Firefox 55+ | ✅ | ✅ | Full support |
| Edge 79+ | ✅ | ✅ | Full support |
| Safari 14+ | ✅ | ✅ | Full support |
| Opera 47+ | ✅ | ✅ | Full support |

**Requirements:**
- HTTPS (or localhost for development)
- Microphone permission
- MediaRecorder API support
- Web Audio API support

## 🔒 Privacy & Security

- Audio is only processed when user clicks "Process"
- No automatic uploads
- User can delete recording at any time
- Clear visual indicators when microphone is active
- Recordings stored temporarily (cleaned on page leave)
- HTTPS required for production

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Stop recording |
| `Escape` | Close modal |

## 📱 Mobile Support

The Voice-to-Report UI is fully responsive and works on mobile devices:

- Touch-friendly buttons (min 44px tap target)
- Responsive layout
- Mobile-optimized modals
- Works with device microphones

## 🧪 Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceRecorder } from "@/components/voice-to-report";

test("shows recording button in idle state", () => {
  render(<VoiceRecorder onClose={() => {}} />);
  expect(screen.getByText(/start recording/i)).toBeInTheDocument();
});

test("calls onComplete with extracted data", async () => {
  const onComplete = jest.fn();
  render(<VoiceRecorder onClose={() => {}} onComplete={onComplete} />);

  // Simulate recording and processing
  // ...

  expect(onComplete).toHaveBeenCalledWith(
    expect.objectContaining({
      playerName: expect.any(String),
      technicalRating: expect.any(Number),
    })
  );
});
```

### E2E Tests

```tsx
import { test, expect } from "@playwright/test";

test("complete voice recording flow", async ({ page }) => {
  await page.goto("/reports/voice");

  // Click voice button
  await page.click("text=Start Voice Recording");

  // Wait for recorder modal
  await expect(page.locator("text=Voice to Report")).toBeVisible();

  // Start recording (requires mock microphone)
  await page.click("text=Start Recording");

  // Wait a bit
  await page.waitForTimeout(2000);

  // Stop recording
  await page.click("text=Stop Recording");

  // Process
  await page.click("text=Process Recording");

  // Wait for results
  await expect(page.locator("text=Processing Complete")).toBeVisible();
});
```

## 🐛 Troubleshooting

### Microphone not working
- Check browser permissions
- Ensure HTTPS (not HTTP)
- Try different browser
- Check if another app is using microphone

### Poor transcription quality
- Speak clearly and slowly
- Reduce background noise
- Use a better microphone
- Check language setting

### Processing fails
- Check network connection
- Verify backend is running
- Check audio file size limit
- Review API logs

## 🚀 Performance

- Audio processing is done server-side
- Waveform uses requestAnimationFrame for smooth 60fps
- Optimized re-renders with React.memo
- Lazy loading of audio processing
- Cleanup on unmount to prevent memory leaks

## 📝 TODO / Future Enhancements

- [ ] Voice commands (pause/resume)
- [ ] Auto language detection
- [ ] Background noise reduction
- [ ] Multiple recording takes
- [ ] Pre-defined templates
- [ ] Offline support
- [ ] Export audio file
- [ ] Team sharing

## 📄 License

Part of the Arcane Football App ecosystem.

---

**Built with:**
- React 19
- TypeScript
- Framer Motion
- Tailwind CSS
- Web Audio API
- MediaRecorder API
