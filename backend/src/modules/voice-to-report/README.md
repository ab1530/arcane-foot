# Voice-to-Report System

A powerful feature that allows scouts to create detailed scouting reports using voice recording. The system transcribes audio using OpenAI Whisper and extracts structured data using AI-powered NLU.

## Features

- **Audio Transcription**: Uses OpenAI Whisper API for accurate speech-to-text
- **Multilingual Support**: Supports English, Spanish, French, German, Italian, and Portuguese
- **AI-Powered Extraction**: Automatically extracts structured scouting report data
- **Smart Validation**: Validates and enriches extracted data with confidence scores
- **File Management**: Temporary processing with optional permanent storage
- **Rate Limited**: Prevents abuse with 10 requests per minute limit

## API Endpoints

### 1. Process Voice Report

**Endpoint**: `POST /api/voice-to-report/process`

**Description**: Upload an audio file and get back transcription + extracted scouting report data

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `audio` (file, required): Audio file (mp3, wav, webm, m4a, ogg) - max 25MB
  - `language` (string, optional): Language code (en, es, fr, de, it, pt) - default: en
  - `matchId` (string, optional): Match ID for context
  - `playerId` (string, optional): Player ID for context
  - `keepAudio` (boolean, optional): Save audio permanently - default: false

**Response** (200):
```json
{
  "transcription": "This is a scouting report for...",
  "extractedData": {
    "playerName": "John Doe",
    "position": "Defender",
    "jerseyNumber": 5,
    "team": "Real Madrid",
    "opponent": "Barcelona",
    "competition": "La Liga",
    "matchDate": "2024-02-15",
    "venue": "Santiago Bernabéu",
    "technicalRating": 80,
    "physicalRating": 90,
    "tacticalRating": 70,
    "mentalRating": 80,
    "overallRating": 80,
    "strengths": "Excellent positioning, strong in the air",
    "weaknesses": "Can be slow to turn",
    "keyMoments": "Crucial block in 67th minute",
    "observations": "Top-quality defender",
    "minutesPlayed": 90,
    "recommendation": "SIGN",
    "tags": ["defender", "strong", "tactical"]
  },
  "confidence": 92,
  "suggestions": [],
  "warnings": [],
  "language": "en",
  "processingTimeMs": 2500,
  "audioUrl": "https://storage.example.com/audio/report-123.mp3"
}
```

**Error Responses**:
- 400: Invalid audio file or format
- 413: File too large
- 429: Rate limit exceeded
- 500: Processing error

### 2. Get Supported Languages

**Endpoint**: `GET /api/voice-to-report/languages`

**Response**:
```json
[
  {
    "code": "en",
    "name": "English",
    "whisperSupported": true
  },
  {
    "code": "es",
    "name": "Spanish",
    "whisperSupported": true
  }
]
```

### 3. Get Example Templates

**Endpoint**: `GET /api/voice-to-report/examples`

**Response**:
```json
[
  {
    "language": "en",
    "prompt": "This is a scouting report for John Doe...",
    "tips": [
      "Start with player name and position",
      "Include match context",
      "Give ratings on a scale of 1-10"
    ]
  }
]
```

### 4. Test Text Extraction (Development)

**Endpoint**: `POST /api/voice-to-report/test-transcription`

**Description**: Test NLU extraction without uploading audio

**Request**:
```json
{
  "text": "This is a scouting report for...",
  "language": "en"
}
```

## Usage Examples

### Using cURL

```bash
# Process voice report
curl -X POST http://localhost:3000/api/voice-to-report/process \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@sample-report.mp3" \
  -F "language=en" \
  -F "keepAudio=false"

# Get supported languages
curl http://localhost:3000/api/voice-to-report/languages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get examples
curl http://localhost:3000/api/voice-to-report/examples \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test extraction
curl -X POST http://localhost:3000/api/voice-to-report/test-transcription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Report for John Doe, striker, rating 8 out of 10", "language": "en"}'
```

### Using JavaScript/TypeScript

```typescript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('language', 'en');
formData.append('keepAudio', 'false');

const response = await fetch('http://localhost:3000/api/voice-to-report/process', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Transcription:', result.transcription);
console.log('Extracted Data:', result.extractedData);
console.log('Confidence:', result.confidence);
```

## Voice Report Template

For best results, structure your voice report like this:

### English Template

```
"This is a scouting report for [PLAYER NAME], [POSITION], number [NUMBER],
playing for [TEAM] against [OPPONENT] in [COMPETITION] at [VENUE] on [DATE].

Technical rating: [1-10] out of 10.
Physical rating: [1-10] out of 10.
Tactical rating: [1-10] out of 10.
Mental rating: [1-10] out of 10.
Overall rating: [1-10] out of 10.

Strengths: [LIST STRENGTHS]

Weaknesses: [LIST WEAKNESSES]

Key moments: [DESCRIBE KEY MOMENTS]

Overall impression: [YOUR ASSESSMENT]

Played [MINUTES] minutes.

Recommendation: [Sign/Monitor/Pass]"
```

### Spanish Template

```
"Informe de scouting para [NOMBRE JUGADOR], [POSICIÓN], número [NÚMERO],
jugando para [EQUIPO] contra [RIVAL] en [COMPETICIÓN].

Valoración técnica: [1-10] sobre 10.
Valoración física: [1-10] sobre 10.
Valoración táctica: [1-10] sobre 10.
Valoración mental: [1-10] sobre 10.

Fortalezas: [LISTA FORTALEZAS]

Debilidades: [LISTA DEBILIDADES]

Momentos clave: [DESCRIBIR MOMENTOS]

Jugó [MINUTOS] minutos.

Recomendación: [Fichar/Seguir/Pasar]"
```

## Tips for Better Voice Reports

1. **Clear Speech**: Speak clearly and at a moderate pace
2. **Structure**: Follow the template structure for best extraction
3. **Details**: Include specific examples and observations
4. **Ratings**: Use 1-10 or 0-100 scale consistently
5. **Context**: Always mention player name, position, and match details
6. **Recommendation**: End with a clear recommendation (Sign/Monitor/Pass)
7. **Language**: Stick to one language throughout the report
8. **Audio Quality**: Use a good microphone in a quiet environment

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# OpenAI Whisper (required for transcription)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Voice-to-Report Configuration
MAX_AUDIO_SIZE_MB=25
VOICE_REPORT_LANGUAGES=en,es,fr,de,it,pt
AUDIO_STORAGE_BUCKET=voice-reports
```

### Supported Audio Formats

- MP3 (audio/mpeg)
- WAV (audio/wav)
- M4A (audio/mp4)
- WebM (audio/webm)
- OGG (audio/ogg)

### File Size Limits

- Maximum: 25MB per file
- Configurable via `MAX_AUDIO_SIZE_MB` environment variable

### Rate Limits

- Voice processing: 10 requests per minute per user
- Test extraction: 5 requests per minute per user
- Configurable via `@Throttle` decorator

## Testing

### Run Test Script

```bash
# Test text extraction (no audio files needed)
npx ts-node src/scripts/test-voice-to-report.ts
```

### Manual Testing

1. **Get Examples**:
   ```bash
   curl http://localhost:3000/api/voice-to-report/examples \
     -H "Authorization: Bearer TOKEN"
   ```

2. **Test Text Extraction**:
   ```bash
   curl -X POST http://localhost:3000/api/voice-to-report/test-transcription \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"text": "Report for John Doe, technical rating 8"}'
   ```

3. **Process Audio**:
   - Record a voice report using your phone or computer
   - Export as MP3 or WAV
   - Upload using the `/process` endpoint

## Architecture

### Service Layer

**VoiceToReportService** handles:
- Audio file validation
- Whisper API transcription
- AI-powered data extraction
- Rule-based fallback extraction
- Data validation and enrichment
- Confidence scoring
- Suggestion generation
- Audio storage management

### Extraction Methods

1. **AI-Powered** (Primary):
   - Uses OpenAI GPT (gpt-4o-mini)
   - Structured JSON output
   - Context-aware extraction
   - Multilingual support

2. **Rule-Based** (Fallback):
   - Regex pattern matching
   - Keyword extraction
   - Basic NLU
   - Works without OpenAI API key

### Data Flow

```
Audio File Upload
    ↓
Validation (format, size)
    ↓
Temporary Storage (/tmp)
    ↓
Whisper Transcription
    ↓
AI/Rule-based Extraction
    ↓
Data Validation
    ↓
Confidence Calculation
    ↓
Suggestion Generation
    ↓
Response + Cleanup
```

## Integration with Scouting Reports

The extracted data can be used in three ways:

1. **Auto-fill Form**: Send data to frontend to populate scouting report form
2. **Direct Create**: Create draft report immediately using ScoutingReportsService
3. **Save for Review**: Store as draft for scout to review/edit before submission

Example integration:

```typescript
// In your frontend or service
const voiceResult = await voiceToReportService.processVoiceReport(...);

// Option 1: Auto-fill form
populateForm(voiceResult.extractedData);

// Option 2: Create draft report
const report = await scoutingReportsService.create({
  ...voiceResult.extractedData,
  status: 'DRAFT',
  scoutId: userId,
});
```

## Troubleshooting

### "Server-side transcription not available"
- Ensure `OPENAI_API_KEY` is set in `.env`
- Verify the API key starts with `sk-`
- Check OpenAI API quota/billing

### Low Confidence Scores
- Use the provided templates
- Speak clearly and include all key information
- Use structured language (e.g., "technical rating: 8")
- Avoid ambiguous terms

### Missing Extracted Fields
- Check the `warnings` and `suggestions` in the response
- Ensure you're following the voice report template
- Test with the example prompts first

### Rate Limit Errors
- Wait 1 minute between requests
- Use the test endpoint for development
- Contact admin to increase limits if needed

## Future Enhancements

- [ ] Real-time streaming transcription
- [ ] Speaker diarization (multiple scouts)
- [ ] Emotion/sentiment analysis
- [ ] Video analysis integration
- [ ] Offline transcription support
- [ ] Custom vocabulary/terminology
- [ ] Voice authentication
- [ ] Automatic report finalization

## Support

For issues or questions:
1. Check the API documentation in Swagger UI: `/api/docs`
2. Review the test script examples
3. Check server logs for detailed error messages
4. Consult the troubleshooting section above

## License

Internal use only - Arcane Football
