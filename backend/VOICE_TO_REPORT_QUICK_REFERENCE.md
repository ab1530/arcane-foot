# Voice-to-Report Quick Reference

## Quick Start

### 1. Configure Environment
```bash
# Add to .env
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
MAX_AUDIO_SIZE_MB=25
```

### 2. Test the System
```bash
# Run test script (no audio files needed)
npx ts-node src/scripts/test-voice-to-report.ts
```

### 3. Upload Audio via API
```bash
curl -X POST http://localhost:3000/api/voice-to-report/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@sample-report.mp3" \
  -F "language=en"
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| POST | `/api/voice-to-report/process` | Upload & process audio | 10/min |
| GET | `/api/voice-to-report/languages` | Get supported languages | None |
| GET | `/api/voice-to-report/examples` | Get example templates | None |
| POST | `/api/voice-to-report/test-transcription` | Test extraction (dev) | 5/min |

---

## Voice Report Template

```
"This is a scouting report for [PLAYER NAME], [POSITION], number [NUMBER],
playing for [TEAM] against [OPPONENT] in [COMPETITION] on [DATE].

Technical rating: [1-10] out of 10.
Physical rating: [1-10] out of 10.
Tactical rating: [1-10] out of 10.
Mental rating: [1-10] out of 10.

Strengths: [DESCRIBE STRENGTHS]

Weaknesses: [DESCRIBE WEAKNESSES]

Key moments: [DESCRIBE KEY MOMENTS]

Recommendation: [BUY_NOW/MONITOR/FOLLOW_UP/NOT_INTERESTED]"
```

---

## Supported Languages

| Code | Language | Whisper Support |
|------|----------|-----------------|
| `en` | English | ✅ Auto-detect |
| `es` | Spanish | ✅ Explicit |
| `fr` | French | ✅ Explicit |
| `de` | German | ✅ Explicit |
| `it` | Italian | ✅ Explicit |
| `pt` | Portuguese | ✅ Explicit |

---

## Response Structure

```typescript
{
  transcription: string;              // Full text transcription
  extractedData: {
    playerName: string;                // "John Doe"
    position: string;                  // "Defender"
    jerseyNumber: number;              // 5
    team: string;                      // "Real Madrid"
    opponent: string;                  // "Barcelona"
    technicalRating: number;           // 80 (0-100 scale)
    physicalRating: number;            // 90
    tacticalRating: number;            // 70
    mentalRating: number;              // 80
    overallRating: number;             // 80
    strengths: string;                 // "Excellent positioning..."
    weaknesses: string;                // "Can be slow to turn..."
    keyMoments: string;                // "Crucial block in 67th..."
    recommendation: string;            // "BUY_NOW"
    tags: string[];                    // ["defender", "strong"]
  };
  confidence: number;                  // 92 (0-100)
  suggestions: string[];               // Improvement tips
  warnings: string[];                  // Missing data warnings
  language: string;                    // "en"
  processingTimeMs: number;            // 2500
  audioUrl?: string;                   // Optional permanent URL
}
```

---

## Confidence Score Guide

| Score | Interpretation | Action |
|-------|----------------|--------|
| 90-100 | Excellent - Complete data | ✅ Ready to submit |
| 75-89 | Good - Minor gaps | ⚠️ Review & fill gaps |
| 50-74 | Fair - Missing key info | ⚠️ Significant edits needed |
| 0-49 | Poor - Incomplete | ❌ Re-record or manual entry |

---

## File Formats Supported

- ✅ MP3 (audio/mpeg)
- ✅ WAV (audio/wav)
- ✅ M4A (audio/mp4)
- ✅ WebM (audio/webm)
- ✅ OGG (audio/ogg)

**Max size**: 25MB per file

---

## Error Codes

| Code | Reason | Solution |
|------|--------|----------|
| 400 | Invalid file/format | Check file type & size |
| 401 | Unauthorized | Provide valid JWT token |
| 413 | File too large | Reduce file size (<25MB) |
| 429 | Rate limit | Wait 1 minute |
| 500 | Processing error | Check OPENAI_API_KEY |

---

## Testing Commands

### Test Text Extraction
```bash
curl -X POST http://localhost:3000/api/voice-to-report/test-transcription \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Report for John Doe, technical rating 8",
    "language": "en"
  }'
```

### Get Examples
```bash
curl http://localhost:3000/api/voice-to-report/examples \
  -H "Authorization: Bearer TOKEN"
```

### Get Languages
```bash
curl http://localhost:3000/api/voice-to-report/languages \
  -H "Authorization: Bearer TOKEN"
```

---

## Frontend Integration

### JavaScript/TypeScript
```typescript
// Upload audio file
const formData = new FormData();
formData.append('audio', audioBlob, 'report.webm');
formData.append('language', 'en');

const response = await fetch('/api/voice-to-report/process', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const result = await response.json();

// Auto-fill form
form.setValue('playerName', result.extractedData.playerName);
form.setValue('technicalRating', result.extractedData.technicalRating);
// ... etc
```

### React Native / Mobile
```typescript
import DocumentPicker from 'react-native-document-picker';

// Pick audio file
const file = await DocumentPicker.pick({
  type: [DocumentPicker.types.audio],
});

// Upload
const formData = new FormData();
formData.append('audio', {
  uri: file.uri,
  type: file.type,
  name: file.name,
});
```

---

## Recording Tips

1. ✅ **Speak clearly** - Enunciate each word
2. ✅ **Use structure** - Follow the template
3. ✅ **Include numbers** - Ratings, jersey numbers, minutes
4. ✅ **Be specific** - Names, dates, venues
5. ✅ **Stay consistent** - One language throughout
6. ✅ **Quiet environment** - Minimize background noise
7. ✅ **Good microphone** - Better quality = better transcription

---

## Files & Locations

### Module Files
```
/Users/lakhdari/Desktop/AppFoot/backend/src/modules/voice-to-report/
├── voice-to-report.service.ts       (677 lines)
├── voice-to-report.controller.ts    (238 lines)
├── voice-to-report.module.ts        (25 lines)
├── dto/
│   ├── process-voice-report.dto.ts  (46 lines)
│   └── voice-report-response.dto.ts (119 lines)
├── README.md                        (Full documentation)
└── SAMPLE_PROMPTS.md                (Example prompts)
```

### Test Script
```
/Users/lakhdari/Desktop/AppFoot/backend/src/scripts/
└── test-voice-to-report.ts          (218 lines)
```

### Documentation
```
/Users/lakhdari/Desktop/AppFoot/backend/
├── VOICE_TO_REPORT_SUMMARY.md       (Complete implementation summary)
└── VOICE_TO_REPORT_QUICK_REFERENCE.md (This file)
```

---

## Troubleshooting

### "Transcription not available"
→ Set `OPENAI_API_KEY` in `.env`

### Low confidence scores
→ Follow template, include all key information

### File upload fails
→ Check format (mp3, wav, etc.) and size (<25MB)

### Rate limit errors
→ Wait 60 seconds between requests

### Missing fields
→ Check `warnings` and `suggestions` in response

---

## Next Steps

1. ✅ Configure `OPENAI_API_KEY` in production
2. ✅ Test with actual audio files
3. ✅ Integrate with frontend voice recording
4. ✅ Add to mobile app
5. ✅ Train scouts on voice report templates
6. ✅ Monitor usage and confidence scores
7. ✅ Collect feedback for improvements

---

## Resources

- **Full Docs**: `src/modules/voice-to-report/README.md`
- **Sample Prompts**: `src/modules/voice-to-report/SAMPLE_PROMPTS.md`
- **Test Script**: `src/scripts/test-voice-to-report.ts`
- **API Docs**: `http://localhost:3000/api/docs` (Swagger UI)
- **Summary**: `VOICE_TO_REPORT_SUMMARY.md`

---

## Support

Questions? Check:
1. README.md for detailed documentation
2. SAMPLE_PROMPTS.md for examples
3. Run test script for validation
4. Check server logs for errors
5. Swagger UI for interactive API testing

---

**Status**: ✅ Production-Ready
**Version**: 1.0.0
**Last Updated**: 2025-11-06
