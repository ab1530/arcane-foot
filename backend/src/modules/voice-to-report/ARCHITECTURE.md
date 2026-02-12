# Voice-to-Report System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      VOICE-TO-REPORT SYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │    Mobile    │      │     API      │
│   (Web App)  │──────│     App      │──────│   Clients    │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  JWT Auth Guard │
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │   VoiceToReportController   │
              │  POST /process              │
              │  GET /languages             │
              │  GET /examples              │
              │  POST /test-transcription   │
              └──────────────┬──────────────┘
                             │
              ┌──────────────▼──────────────┐
              │   VoiceToReportService      │
              │  • Audio Validation         │
              │  • Transcription            │
              │  • Data Extraction          │
              │  • Validation & Scoring     │
              └──────┬─────────────┬────────┘
                     │             │
         ┌───────────▼───┐   ┌────▼─────────┐
         │  OpenAI API   │   │  Supabase    │
         │  • Whisper    │   │  Storage     │
         │  • GPT-4o     │   │  (Optional)  │
         └───────────────┘   └──────────────┘
```

---

## Component Architecture

### 1. Controller Layer (voice-to-report.controller.ts)

**Responsibilities**:
- HTTP request handling
- File upload processing (multer)
- Authentication validation (JWT)
- Rate limiting enforcement
- Request/response formatting
- Swagger documentation

**Endpoints**:
```typescript
POST   /api/voice-to-report/process           // Main processing endpoint
GET    /api/voice-to-report/languages         // Language info
GET    /api/voice-to-report/examples          // Example templates
POST   /api/voice-to-report/test-transcription // Development testing
```

**Security Features**:
- JWT Bearer token required
- File type validation (audio only)
- File size validation (25MB max)
- Rate limiting (10/min processing, 5/min testing)

---

### 2. Service Layer (voice-to-report.service.ts)

**Core Responsibilities**:
- Business logic orchestration
- Audio transcription
- Data extraction
- Validation & enrichment
- Confidence calculation
- File management

**Key Methods**:

```typescript
// Main processing pipeline
async processVoiceReport(
  audioFile: Express.Multer.File,
  userId: string,
  dto: ProcessVoiceReportDto
): Promise<VoiceReportResponseDto>

// Transcription
private async transcribeAudio(
  audioFile: Express.Multer.File,
  language: string
): Promise<string>

private async transcribeWithWhisper(
  audioFile: Express.Multer.File,
  language: string
): Promise<string>

// Data extraction
private async extractReportData(
  transcription: string,
  language: string
): Promise<ExtractedReportData>

private async extractWithAI(
  transcription: string,
  language: string
): Promise<ExtractedReportData>

private extractWithRules(
  transcription: string
): ExtractedReportData

// Validation & enrichment
private async validateData(
  data: ExtractedReportData,
  matchId?: string,
  playerId?: string
): Promise<{ data: ExtractedReportData; warnings: string[] }>

// Scoring & suggestions
private calculateConfidence(
  data: ExtractedReportData,
  transcription: string
): number

private generateSuggestions(
  data: ExtractedReportData,
  warnings: string[]
): string[]

// File management
private async saveAudioTemporarily(
  file: Express.Multer.File
): Promise<string>

private async saveAudioPermanently(
  file: Express.Multer.File,
  userId: string
): Promise<string>

private async cleanupAudioFile(
  filepath: string
): Promise<void>
```

---

## Data Flow

### Processing Pipeline

```
┌────────────────┐
│ Audio Upload   │  Scout records voice report
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Validation     │  • Check file format
│                │  • Check file size (<25MB)
│                │  • Verify MIME type
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Temp Storage   │  Save to /tmp/{timestamp}-{name}
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Transcription  │  OpenAI Whisper API
│                │  • Convert audio → text
│                │  • Language detection/specification
│                │  • 2-5 seconds processing
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ AI Extraction  │  GPT-4o-mini
│                │  • Parse transcription
│                │  • Extract structured data
│                │  • ~1 second processing
│                │  [Fallback: Rule-based]
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Validation     │  • Check field completeness
│                │  • Validate rating ranges
│                │  • Normalize data types
│                │  • Generate warnings
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Enrichment     │  • Calculate missing overall rating
│                │  • Add provided matchId/playerId
│                │  • Normalize recommendation enum
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Confidence     │  Calculate score (0-100)
│ Scoring        │  Based on data completeness
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Suggestions    │  Generate improvement tips
│ Generation     │  Based on missing/incomplete data
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Permanent      │  [Optional] Save to Supabase
│ Storage        │  If keepAudio=true
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Cleanup        │  Delete temporary file
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Response       │  Return JSON with:
│                │  • transcription
│                │  • extractedData
│                │  • confidence
│                │  • suggestions
│                │  • warnings
└────────────────┘
```

---

## AI Extraction Architecture

### Primary Method: GPT-4o-mini

```
┌─────────────────────────────────────────────┐
│          TRANSCRIPTION TEXT                  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  STRUCTURED PROMPT ENGINEERING               │
│  • System: "Football scouting assistant"    │
│  • Context: Language, expected fields       │
│  • Format: JSON object structure            │
│  • Rules: Rating conversion, normalization  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  OPENAI GPT-4o-mini API                     │
│  • Model: gpt-4o-mini                       │
│  • Temperature: 0.3 (consistent)            │
│  • Response Format: json_object             │
│  • Cost: ~$0.0001 per report                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  JSON PARSING & VALIDATION                   │
│  • Parse response                            │
│  • Validate field types                      │
│  • Normalize data (ratings, enums)          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  EXTRACTED REPORT DATA                       │
└─────────────────────────────────────────────┘
```

### Fallback Method: Rule-Based

```
┌─────────────────────────────────────────────┐
│          TRANSCRIPTION TEXT                  │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌─────────────┐       ┌─────────────┐
│  Pattern    │       │  Keyword    │
│  Matching   │       │  Extraction │
│  (Regex)    │       │  (Dict)     │
└──────┬──────┘       └──────┬──────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
       ┌────────────────────┐
       │  Data Normalization │
       │  • Type conversion  │
       │  • Range validation │
       │  • Enum mapping     │
       └────────┬───────────┘
                │
                ▼
       ┌────────────────────┐
       │  EXTRACTED DATA     │
       └────────────────────┘
```

---

## Confidence Scoring Algorithm

```typescript
function calculateConfidence(data: ExtractedReportData, transcription: string): number {
  let score = 0;
  const maxScore = 100;

  // Component 1: Player Identification (20 points)
  if (data.playerName) {
    score += 20;
  } else if (data.playerId) {
    score += 15;
  }

  // Component 2: Match Context (15 points)
  if (data.team) score += 5;
  if (data.opponent) score += 5;
  if (data.matchDate) score += 5;

  // Component 3: Performance Ratings (30 points)
  const ratings = ['technicalRating', 'physicalRating', 'tacticalRating', 'mentalRating'];
  const ratingCount = ratings.filter(r => data[r] != null).length;
  score += (ratingCount / ratings.length) * 30;

  // Component 4: Observations (20 points)
  if (data.strengths) score += 7;
  if (data.weaknesses) score += 7;
  if (data.keyMoments || data.observations) score += 6;

  // Component 5: Recommendation (15 points)
  if (data.recommendation) score += 15;

  // Adjustment: Transcription Quality
  const wordCount = transcription.split(/\s+/).length;
  if (wordCount < 50) score *= 0.8;      // Too short: -20%
  else if (wordCount > 200) score *= 1.1; // Detailed: +10%

  return Math.min(maxScore, Math.round(score));
}
```

**Score Interpretation**:
- **90-100**: Excellent (complete data, ready to submit)
- **75-89**: Good (minor gaps, review recommended)
- **50-74**: Fair (significant missing data, edits needed)
- **0-49**: Poor (incomplete, re-record or manual entry)

---

## File Management Strategy

### Temporary Storage

```
┌──────────────────────────────────────────┐
│  UPLOAD                                   │
│  Audio file arrives via multipart/form   │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  SAVE TO /tmp                             │
│  Filename: {timestamp}-{originalname}    │
│  Purpose: Whisper API processing         │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  PROCESS                                  │
│  Pass file path to Whisper API          │
│  Read as stream                          │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  CLEANUP (Finally Block)                 │
│  Delete file even if errors occur       │
│  Non-blocking, logged if fails          │
└──────────────────────────────────────────┘
```

### Permanent Storage (Optional)

```
┌──────────────────────────────────────────┐
│  CHECK keepAudio FLAG                     │
│  User option: save for future reference  │
└─────────────────┬────────────────────────┘
                  │ (if true)
                  ▼
┌──────────────────────────────────────────┐
│  UPLOAD TO SUPABASE                       │
│  Bucket: voice-reports                   │
│  Path: {userId}/{timestamp}-{name}       │
│  Access: Public URL                      │
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│  RETURN URL IN RESPONSE                   │
│  audioUrl: "https://storage.../..."     │
└──────────────────────────────────────────┘
```

**Use Cases for Permanent Storage**:
- Quality assurance / review
- Dispute resolution
- Training data collection
- Compliance / audit trail
- Future re-processing

---

## Integration Points

### 1. ScoutingReportsModule

**Current**: VoiceToReportModule imports ScoutingReportsModule
**Potential**: Direct report creation after voice processing

```typescript
// Future enhancement
const voiceResult = await voiceToReportService.processVoiceReport(...);

// Auto-create draft report
const report = await scoutingReportsService.create({
  ...voiceResult.extractedData,
  status: 'DRAFT',
  scoutId: userId,
  notes: `Auto-generated from voice recording\nConfidence: ${voiceResult.confidence}%`,
});
```

### 2. SupabaseModule

**Current**: Used for permanent audio storage
**Integration**: Upload audio files to Supabase Storage

```typescript
const audioUrl = await supabaseService.uploadFile(
  audioFile.buffer,
  `${userId}/${timestamp}-${audioFile.originalname}`,
  'voice-reports'
);
```

### 3. PrismaModule

**Current**: Available for database operations
**Future**: Store voice report metadata

```typescript
// Potential schema addition
model VoiceReport {
  id              String   @id @default(cuid())
  userId          String
  audioUrl        String?
  transcription   String
  extractedData   Json
  confidence      Int
  processingTimeMs Int
  language        String
  createdAt       DateTime @default(now())

  user            User     @relation(...)
  scoutingReport  ScoutingReport?
}
```

---

## Security Architecture

### Authentication Flow

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ Authorization: Bearer {JWT}
       ▼
┌──────────────┐
│ JwtAuthGuard │  • Validate token
│              │  • Extract userId
│              │  • Attach to request
└──────┬───────┘
       │ req.user.userId
       ▼
┌──────────────┐
│ Controller   │  • Access userId
│              │  • Pass to service
└──────────────┘
```

### Input Validation

```
┌──────────────────────────────────────┐
│  FILE UPLOAD                          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  MULTER FILTER                        │
│  • Check MIME type (audio/*)         │
│  • Reject non-audio files            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  SIZE VALIDATION                      │
│  • Max: 25MB (configurable)          │
│  • Reject if exceeded                │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  FORMAT VALIDATION                    │
│  • Supported: mp3, wav, m4a, webm   │
│  • Check MIME type list              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  SANITIZATION                         │
│  • Clean filename                    │
│  • Remove path traversal chars      │
└──────────────────────────────────────┘
```

### Rate Limiting

```
┌──────────────────────────────────────┐
│  @Throttle Decorator                 │
│  • Per-user limits                   │
│  • Sliding window                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PROCESS ENDPOINT                     │
│  • Limit: 10 requests/minute         │
│  • Reason: Expensive OpenAI calls    │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  TEST ENDPOINT                        │
│  • Limit: 5 requests/minute          │
│  • Reason: Development protection    │
└──────────────────────────────────────┘
```

---

## Error Handling

### Error Flow

```typescript
try {
  // Validate file
  validateAudioFile(file);

  // Save temporarily
  const tempPath = await saveAudioTemporarily(file);

  try {
    // Transcribe
    const transcription = await transcribeWithWhisper(tempPath, language);

    // Extract
    const extractedData = await extractReportData(transcription, language);

    // Return response
    return { transcription, extractedData, ... };

  } finally {
    // Always cleanup
    await cleanupAudioFile(tempPath);
  }

} catch (error) {
  logger.error(`Processing failed: ${error.message}`);

  if (error.message.includes('Whisper')) {
    throw new InternalServerErrorException('Transcription failed');
  }

  if (error.message.includes('file size')) {
    throw new BadRequestException('File too large');
  }

  throw new InternalServerErrorException('Processing failed');
}
```

---

## Performance Considerations

### Processing Time Breakdown

```
┌──────────────────────────────────────┐
│  File Upload                          │  ~100-500ms
└──────┬───────────────────────────────┘  (network dependent)
       │
       ▼
┌──────────────────────────────────────┐
│  Validation                           │  <10ms
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Whisper Transcription                │  2-5 seconds
└──────┬───────────────────────────────┘  (audio length dependent)
       │
       ▼
┌──────────────────────────────────────┐
│  GPT Extraction                       │  ~1 second
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Validation & Scoring                 │  <50ms
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  TOTAL                                │  ~3-7 seconds
└──────────────────────────────────────┘
```

### Optimization Strategies

1. **Parallel Processing**: Whisper and GPT could potentially run in parallel (future)
2. **Caching**: Language info and examples could be cached
3. **Streaming**: Future support for streaming transcription
4. **Batch Processing**: Process multiple reports in parallel
5. **Edge Computing**: Deploy Whisper closer to users

---

## Monitoring & Observability

### Metrics to Track

```
┌─────────────────────────────────────┐
│  PERFORMANCE METRICS                 │
│  • Processing time (ms)              │
│  • Whisper API latency              │
│  • GPT API latency                  │
│  • File upload time                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  QUALITY METRICS                     │
│  • Average confidence score         │
│  • Confidence distribution          │
│  • Field extraction success rate    │
│  • User correction frequency        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  USAGE METRICS                       │
│  • Reports per day/week/month       │
│  • Language distribution            │
│  • Average audio length             │
│  • Rate limit hits                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ERROR METRICS                       │
│  • Whisper API errors               │
│  • GPT API errors                   │
│  • Validation failures              │
│  • Upload failures                  │
└─────────────────────────────────────┘
```

### Logging Strategy

```typescript
// Structured logging with context
logger.log({
  event: 'voice_report_processed',
  userId: userId,
  language: language,
  confidence: confidence,
  processingTimeMs: processingTimeMs,
  audioSizeMB: fileSizeMB,
  fieldsExtracted: Object.keys(extractedData).length,
  warnings: warnings.length,
  timestamp: new Date().toISOString(),
});
```

---

## Scalability Considerations

### Current Architecture
- **Single-server processing**
- **Synchronous API calls**
- **In-memory processing**

### Scaling Strategies

1. **Horizontal Scaling**
   - Deploy multiple instances
   - Load balancer distribution
   - Stateless service design

2. **Async Processing**
   - Queue-based architecture
   - Background workers
   - Webhook notifications

3. **Caching Layer**
   - Cache transcriptions (deduplication)
   - Cache AI extractions
   - Redis for rate limiting

4. **CDN for Audio**
   - Edge storage for audio files
   - Faster uploads/downloads
   - Reduced server load

---

## Technology Stack

```
┌─────────────────────────────────────────────┐
│  BACKEND FRAMEWORK                           │
│  • NestJS (Node.js)                         │
│  • TypeScript                               │
│  • Express                                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  AI/ML SERVICES                              │
│  • OpenAI Whisper (transcription)           │
│  • OpenAI GPT-4o-mini (extraction)          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  STORAGE                                     │
│  • Supabase Storage (audio files)           │
│  • PostgreSQL (Prisma ORM)                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  FILE HANDLING                               │
│  • Multer (uploads)                         │
│  • fs/promises (file system)                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  SECURITY                                    │
│  • JWT (authentication)                     │
│  • Throttler (rate limiting)                │
│  • Class-validator (validation)             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  DOCUMENTATION                               │
│  • Swagger/OpenAPI                          │
│  • ApiProperty decorators                   │
└─────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2025-11-06
**Status**: Production-Ready
