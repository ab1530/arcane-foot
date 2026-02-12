# SmartScout AI Module

## Overview

SmartScout AI is an intelligent report suggestion system that leverages vector embeddings and OpenAI's technology to help scouts complete scouting reports more efficiently and accurately. The system analyzes partial report data and provides intelligent suggestions based on similar historical reports.

## Features

### 1. Vector Embeddings
- Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- Stores embeddings in PostgreSQL for fast similarity searches
- Automatic indexing of approved scouting reports
- Cosine similarity for finding similar reports

### 2. Intelligent Suggestions
- Analyzes partial report data to find similar historical reports
- Provides contextual suggestions for completing report fields
- Relevance boosting based on position (+10%) and league (+5%)
- Returns top 5 most similar reports with confidence scores

### 3. Smart Autocomplete
- Context-aware autocomplete for all report fields
- Supports both structured fields (position, foot) and text fields (strengths, weaknesses)
- Learns from historical approved reports
- Filters by position and context for better relevance

### 4. AI Insights
- Aggregates all reports for a player
- Identifies performance trends (improving/declining)
- Detects scout consensus and disagreements
- Generates development recommendations using GPT-4

### 5. Graceful Fallback
- Operates without OpenAI API key (rule-based matching)
- Automatic retry logic with exponential backoff (3 attempts)
- Comprehensive error handling and logging
- No service disruption when AI is unavailable

## API Endpoints

### POST /smart-scout/suggestions
Get intelligent suggestions for report completion.

**Auth**: JWT + SCOUT role or higher

**Request Body**:
```json
{
  "partialReport": {
    "playerPosition": "Forward",
    "technicalRating": 85,
    "strengths": "Fast and technical",
    "tags": ["fast", "clinical"]
  },
  "context": {
    "playerId": "player-123",
    "matchId": "match-456",
    "position": "Forward",
    "league": "Premier League"
  }
}
```

**Response**:
```json
{
  "similarReports": [
    {
      "reportId": "report-789",
      "similarity": 0.92,
      "player": {
        "id": "player-999",
        "name": "John Doe",
        "position": "Forward"
      },
      "excerpts": {
        "strengths": "Excellent finishing and pace",
        "weaknesses": "Needs to improve heading",
        "summary": "Promising young striker"
      }
    }
  ],
  "suggestions": [
    {
      "field": "strengths",
      "value": "Excellent off-ball movement",
      "confidence": 0.85,
      "source": "similar_reports"
    }
  ],
  "usingAI": true
}
```

### POST /smart-scout/autocomplete
Smart autocomplete for report fields.

**Auth**: JWT + SCOUT role or higher

**Request Body**:
```json
{
  "fieldName": "strengths",
  "partialValue": "Good contro",
  "context": {
    "position": "Midfielder"
  }
}
```

**Response**:
```json
{
  "suggestions": [
    "Good control in tight spaces",
    "Good control and vision",
    "Good control of the midfield"
  ],
  "usingAI": false
}
```

### GET /smart-scout/insights/:playerId
Generate AI insights for a player.

**Auth**: JWT + SCOUT role or higher

**Response**:
```json
{
  "playerId": "player-123",
  "insights": "Player Analysis (5 reports):\n\nPerformance Trends:\n- Technical skills showing consistent improvement (+8 points over 6 months)\n- Physical attributes stable\n\nScout Consensus:\n- All scouts agree on exceptional technical ability\n- Mixed opinions on tactical awareness (60-85 range)\n\nKey Strengths:\n- Outstanding ball control\n- Creative playmaking\n- Vision and passing range\n\nKey Weaknesses:\n- Defensive positioning needs work\n- Consistency in high-pressure games\n\nRecommendations:\n- Focus on tactical training\n- Consider for attacking midfield role\n- Ready for step up to higher level",
  "usingAI": true
}
```

### POST /smart-scout/index/:reportId (Admin Only)
Index a specific report with vector embeddings.

**Auth**: JWT + ADMIN role

**Response**:
```json
{
  "message": "Report indexed successfully",
  "reportId": "report-123"
}
```

### POST /smart-scout/reindex-all (Admin Only)
Reindex all approved reports (heavy operation).

**Auth**: JWT + ADMIN role

**Response**:
```json
{
  "message": "Reindexing completed",
  "indexed": 450,
  "failed": 3,
  "totalProcessed": 453
}
```

## Embedding Strategy

### Text Normalization
Reports are normalized before embedding generation:

```typescript
Position: Forward
Technical: 85/100
Physical: 80/100
Mental: 90/100
Tactical: 75/100
Strengths: Fast and technical, excellent finishing
Weaknesses: Needs work on heading, decision making
Summary: Promising young striker with potential
Tags: fast, clinical, striker
```

### Similarity Calculation
Cosine similarity between vectors:
```
similarity = dot(a, b) / (norm(a) * norm(b))
```

### Relevance Boosting
- Same position: +10% similarity boost
- Same league/competition: +5% similarity boost
- Results sorted by boosted similarity

## Configuration

### Environment Variables

```bash
# Required for AI features
OPENAI_API_KEY=sk-...

# Optional - already configured in .env
DATABASE_URL=postgresql://...
```

### Without OpenAI API Key
The module works without OpenAI:
- Uses rule-based similarity (position, league, tags)
- Autocomplete from database values only
- Basic statistical insights (averages, trends)
- Logs warning on startup

## Performance Considerations

### Indexing
- Only approved reports are indexed
- Embeddings are cached (not regenerated)
- Batch indexing available for initial setup
- Average: ~200ms per report (OpenAI API call)

### Similarity Search
- In-memory cosine similarity calculation
- Fast for < 10,000 reports (~50ms)
- For larger datasets, consider:
  - Pinecone (vector database)
  - pgvector (PostgreSQL extension)
  - Weaviate (open-source vector DB)

### Rate Limiting
Consider adding rate limiting for:
- `/suggestions` endpoint (computation heavy)
- `/insights` endpoint (GPT-4 calls)
- `/reindex-all` endpoint (very heavy)

## Database Schema

```prisma
model report_embeddings {
  id               String           @id
  reportId         String           @unique
  embedding        Float[]          // 1536 dimensions
  model            String           @default("text-embedding-3-small")
  createdAt        DateTime         @default(now())
  scouting_reports scouting_reports @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@map("report_embeddings")
}
```

## Error Handling

### OpenAI API Failures
- Automatic retry with exponential backoff (3 attempts)
- Falls back to rule-based matching
- Logs errors for monitoring
- Service remains available

### Invalid Input
- Validates field names for autocomplete
- Checks report existence before indexing
- Returns 404 if player has no reports
- Validates embedding dimensions

## Testing

```bash
# Run unit tests
npm test smart-scout.service.spec.ts

# Run with coverage
npm run test:cov
```

### Test Coverage
- ✅ Embedding generation (with/without API)
- ✅ Cosine similarity calculation
- ✅ Report indexing
- ✅ Suggestions generation
- ✅ Autocomplete (structured + text fields)
- ✅ Insights generation (AI + fallback)
- ✅ Error handling

## Future Improvements

### Vector Database Integration
For production scale (>10K reports):

```typescript
// Example: Pinecone integration
import { PineconeClient } from '@pinecone-database/pinecone';

async findSimilarReports(embedding: number[]) {
  const results = await this.pinecone.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });
  return results.matches;
}
```

### Semantic Search
- Search reports by natural language queries
- "Find strikers good at headers"
- "Show me creative midfielders"

### Multilingual Support
- Embed reports in multiple languages
- Language detection
- Cross-language similarity

### Real-time Suggestions
- WebSocket integration
- Live suggestions as scout types
- Collaborative report editing

### Advanced Analytics
- Scout accuracy tracking
- Prediction vs. actual performance
- Report quality scoring

## Usage Example

```typescript
// In your frontend or service
const response = await fetch('/smart-scout/suggestions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    partialReport: {
      playerPosition: 'Midfielder',
      technicalRating: 85,
      strengths: 'Good passing',
    },
    context: {
      position: 'Midfielder',
      league: 'La Liga',
    },
  }),
});

const { similarReports, suggestions, usingAI } = await response.json();

// Display suggestions to scout
suggestions.forEach(suggestion => {
  console.log(`${suggestion.field}: ${suggestion.value} (${suggestion.confidence})`);
});
```

## Monitoring

### Logs
```
[SmartScoutService] OpenAI client initialized successfully
[SmartScoutService] Generating embedding (attempt 1/3)
[SmartScoutService] Embedding generated successfully
[SmartScoutService] Report report-123 indexed successfully
```

### Metrics to Track
- Average embedding generation time
- Suggestion accuracy (user acceptance rate)
- API failure rate
- Cache hit rate
- Number of indexed reports

## Security

### Authentication
- All endpoints require JWT authentication
- Role-based access control (SCOUT+)
- Admin endpoints restricted to ADMIN/SUPER_ADMIN

### Data Privacy
- Embeddings stored securely in database
- No PII sent to OpenAI
- Reports sanitized before embedding
- Cascade deletion with report removal

## Support

For issues or questions:
1. Check logs for error messages
2. Verify OpenAI API key is set
3. Ensure database schema is migrated
4. Test with fallback mode (no API key)

## License

Part of Arcane Football Platform - Internal Use Only
