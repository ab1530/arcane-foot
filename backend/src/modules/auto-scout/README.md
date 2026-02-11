# AutoScout - AI-Powered Scouting Report Generation

AutoScout is an automated scouting report generation system that leverages GPT-4 to create comprehensive, professional-quality player assessments based on historical data, match statistics, and performance trends.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Report Templates](#report-templates)
- [Quality Scoring](#quality-scoring)
- [Cost Management](#cost-management)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

AutoScout automates the time-consuming process of writing scouting reports by:
1. Aggregating player statistics from multiple sources
2. Analyzing performance trends and patterns
3. Generating structured, professional reports using GPT-4
4. Calculating quality scores to ensure reliability
5. Providing actionable recommendations

**Key Benefits:**
- Reduces report writing time from hours to seconds
- Maintains consistency across all reports
- Provides data-driven insights
- Allows scouts to focus on high-value analysis tasks

## Features

### Core Functionality

#### 1. Single Report Generation
Generate detailed reports for individual players with customizable parameters:
- Multiple report types (match performance, season overview, transfer target, etc.)
- Custom context and focus areas
- Adjustable AI creativity (temperature)
- Automatic quality scoring

#### 2. Bulk Report Generation
Process multiple players simultaneously:
- Up to 50 players per batch
- Concurrent processing (max 10 at a time)
- Progress tracking
- Aggregate statistics

#### 3. Report Enhancement
Improve existing scouting reports with AI insights:
- Add comparable players
- Generate additional recommendations
- Provide deeper tactical analysis
- Suggest improvements

#### 4. Custom Templates
Create custom report structures for specific needs:
- Define custom sections
- Specify required fields
- Tailor prompts for your use case

#### 5. Analytics Dashboard
Track AutoScout usage and performance:
- Total reports generated
- Average quality scores
- Token consumption and costs
- Template usage statistics

### Advanced Features

- **Caching**: 1-hour cache for identical requests to reduce costs
- **Rate Limiting**: Prevents abuse (10 reports/hour per scout)
- **Fallback System**: Template-based reports if AI fails
- **Quality Assurance**: Multi-dimensional quality scoring
- **Cost Tracking**: Detailed token and cost logging

## Architecture

### Components

```
auto-scout/
├── auto-scout.module.ts          # Module definition
├── auto-scout.service.ts         # Core business logic
├── auto-scout.controller.ts      # API endpoints
├── stats-aggregator.service.ts   # Data aggregation
├── dto/                          # Request/response DTOs
│   ├── generate-report.dto.ts
│   ├── bulk-generate.dto.ts
│   ├── enhance-report.dto.ts
│   └── custom-generate.dto.ts
├── interfaces/                   # TypeScript interfaces
│   └── report.interface.ts
├── templates/                    # Report templates
│   ├── match-performance.template.ts
│   ├── season-overview.template.ts
│   ├── transfer-target.template.ts
│   ├── youth-prospect.template.ts
│   └── quick-scan.template.ts
└── auto-scout.service.spec.ts   # Unit tests
```

### Data Flow

1. **Request** → Controller receives generation request
2. **Validation** → DTOs validate input parameters
3. **Cache Check** → Check if report exists in cache
4. **Data Aggregation** → StatsAggregator fetches player data
5. **AI Generation** → GPT-4 generates report content
6. **Quality Scoring** → Calculate quality metrics
7. **Storage** → Save to database with metadata
8. **Response** → Return generated report with quality score

## API Endpoints

### POST /auto-scout/generate

Generate a single scouting report.

**Request:**
```json
{
  "playerId": "player-uuid",
  "matchId": "match-uuid",  // Optional
  "reportType": "SEASON_OVERVIEW",
  "customContext": "Focus on defensive capabilities",
  "temperature": 0.7,
  "includeComparisons": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playerId": "player-uuid",
    "playerName": "John Doe",
    "position": "Midfielder",
    "summary": "...",
    "technicalSkills": { "rating": 8, "strengths": [...], "weaknesses": [...], "details": "..." },
    "tacticalAwareness": { "rating": 7, "strengths": [...], "weaknesses": [...], "details": "..." },
    "physicalAttributes": { "rating": 8, "strengths": [...], "weaknesses": [...], "details": "..." },
    "mentalAttributes": { "rating": 7, "strengths": [...], "weaknesses": [...], "details": "..." },
    "overallRating": 7.5,
    "potential": "High potential with proper development",
    "recommendations": ["Focus on technical development", "..."],
    "comparablePlayers": ["Player A", "Player B"],
    "qualityScore": {
      "total": 85,
      "breakdown": {
        "dataCompleteness": 22,
        "insightDepth": 21,
        "technicalAccuracy": 24,
        "actionability": 18
      },
      "grade": "A"
    },
    "generatedAt": "2025-11-06T12:00:00Z",
    "model": "gpt-4-turbo-preview"
  },
  "message": "Report generated successfully",
  "costWarning": "AI-generated report. Please review before using officially.",
  "qualityGrade": "A"
}
```

**Rate Limit:** 10 requests per hour per scout

---

### POST /auto-scout/bulk-generate

Generate reports for multiple players at once.

**Request:**
```json
{
  "playerIds": ["player-1", "player-2", "player-3"],
  "matchId": "match-uuid",
  "customContext": "Post-match analysis for championship final"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "reports": [...],
    "errors": [],
    "totalTokens": 12500,
    "totalCost": 0.0875,
    "averageQualityScore": 78.5
  },
  "message": "Generated 3 reports successfully, 0 failed",
  "estimatedCost": "$0.0875"
}
```

**Rate Limit:** 3 requests per hour (Admin/Director only)

---

### POST /auto-scout/enhance/:reportId

Enhance an existing scouting report.

**Request:**
```json
{
  "reportId": "report-uuid",
  "focusAreas": "Add more tactical analysis and comparable players",
  "additionalContext": "Player has recently changed position to attacking midfielder"
}
```

**Rate Limit:** 15 requests per hour

---

### GET /auto-scout/templates

Get available report templates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Match Performance Report",
      "description": "Detailed analysis of player performance in a specific match",
      "sections": [...],
      "promptTemplate": "..."
    },
    ...
  ],
  "count": 5
}
```

---

### POST /auto-scout/custom

Generate report with custom template (Admin/Director only).

**Request:**
```json
{
  "playerId": "player-uuid",
  "template": {
    "name": "Custom Analysis",
    "description": "...",
    "sections": [...],
    "promptTemplate": "..."
  },
  "customPrompt": "Additional instructions"
}
```

**Rate Limit:** 5 requests per hour

---

### GET /auto-scout/preview/:playerId

Generate preview without saving to database.

**Query Params:**
- `matchId` (optional): Match ID for context

**Rate Limit:** 20 requests per hour

---

### GET /auto-scout/analytics

Get usage analytics (Admin/Director only).

**Query Params:**
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 1250,
    "averageQualityScore": 76.8,
    "totalTokensUsed": 4375000,
    "estimatedCost": 306.25,
    "templateUsage": [
      { "template": "Season Overview Report", "count": 500 },
      { "template": "Match Performance Report", "count": 400 },
      ...
    ]
  },
  "period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-11-06T12:00:00Z"
  }
}
```

---

### GET /auto-scout/cost-estimate

Get cost estimate for report generation.

**Query Params:**
- `reportType` (optional): Type of report

**Response:**
```json
{
  "success": true,
  "data": {
    "reportType": "SEASON_OVERVIEW (default)",
    "estimatedTokens": 3500,
    "estimatedCost": "$0.0280",
    "note": "This is an estimate. Actual cost may vary based on complexity."
  }
}
```

## Report Templates

### 1. Match Performance Report
**Use Case:** Analyze player performance in a specific match

**Sections:**
- Match overview and context
- Key contributions (goals, assists, chances)
- Technical execution assessment
- Defensive work evaluation
- Physical performance metrics
- Decision-making analysis

**Typical Tokens:** ~3000
**Estimated Cost:** $0.024

---

### 2. Season Overview Report
**Use Case:** Comprehensive analysis of player's season

**Sections:**
- Season statistics and achievements
- Performance trends over time
- Technical development analysis
- Tactical evolution assessment
- Physical condition tracking
- Character and mentality evaluation
- Potential assessment
- Strategic recommendations

**Typical Tokens:** ~3500
**Estimated Cost:** $0.028

---

### 3. Transfer Target Report
**Use Case:** Evaluation for potential transfer/signing

**Sections:**
- Player profile and career summary
- Performance analysis (current level)
- Team fit assessment
- Investment analysis (value for money)
- Risk assessment (injuries, adaptation)
- Contract recommendations
- Comparable players
- Value assessment

**Typical Tokens:** ~4000
**Estimated Cost:** $0.032

---

### 4. Youth Prospect Report
**Use Case:** Evaluation of young players and development path

**Sections:**
- Prospect profile and development stage
- Technical foundation assessment
- Development potential analysis
- Personality and character evaluation
- Physical development tracking
- Development plan recommendations
- Risk factors identification
- 3-year projection

**Typical Tokens:** ~3200
**Estimated Cost:** $0.026

---

### 5. Quick Scan Report
**Use Case:** Rapid initial screening of players

**Sections:**
- Quick summary and verdict
- Brief category assessments
- Key strengths/weaknesses
- Quick recommendations
- Similar players

**Typical Tokens:** ~2000
**Estimated Cost:** $0.016

## Quality Scoring

AutoScout uses a multi-dimensional quality scoring system to ensure report reliability:

### Scoring Components (25 points each)

#### 1. Data Completeness (0-25 points)
Measures the richness of underlying data:
- Basic player info presence (5 pts)
- Career statistics availability (5 pts)
- Recent match data (10 pts)
- Rating history (5 pts)

#### 2. Insight Depth (0-25 points)
Measures the quality of analysis:
- Summary quality (5 pts)
- Detailed category analysis (15 pts)
- Recommendations provided (5 pts)

#### 3. Technical Accuracy (0-25 points)
Measures consistency and realism:
- Rating range validity (10 pts)
- Category/overall alignment (5 pts)
- Statistical consistency (10 pts)

#### 4. Actionability (0-25 points)
Measures practical usefulness:
- Recommendations present (10 pts)
- Comparable players listed (5 pts)
- Potential assessment (5 pts)
- Specific weaknesses identified (5 pts)

### Quality Grades

| Score | Grade | Interpretation |
|-------|-------|----------------|
| 90-100 | S | Exceptional quality - highly reliable |
| 80-89 | A | Excellent quality - fully actionable |
| 70-79 | B | Good quality - generally reliable |
| 60-69 | C | Acceptable quality - review recommended |
| 0-59 | D | Limited quality - manual review required |

### Grade Distribution (Typical)

- **S Grade (90+):** 5-10% of reports
- **A Grade (80-89):** 30-40% of reports
- **B Grade (70-79):** 40-50% of reports
- **C Grade (60-69):** 10-15% of reports
- **D Grade (<60):** <5% of reports

## Cost Management

### Pricing (GPT-4 Turbo)

- **Input tokens:** $0.01 per 1K tokens
- **Output tokens:** $0.03 per 1K tokens

### Typical Costs Per Report

| Report Type | Avg Tokens | Avg Cost |
|-------------|-----------|----------|
| Quick Scan | 2,000 | $0.016 |
| Match Performance | 3,000 | $0.024 |
| Youth Prospect | 3,200 | $0.026 |
| Season Overview | 3,500 | $0.028 |
| Transfer Target | 4,000 | $0.032 |

### Cost Optimization Strategies

#### 1. Caching
- 1-hour cache for identical requests
- Can reduce costs by 30-50% in practice
- Automatic cache invalidation

#### 2. Rate Limiting
- Prevents runaway costs from abuse
- 10 reports/hour per scout = max $3.50/day per scout
- Bulk operations limited to 3/hour

#### 3. Template Selection
- Use Quick Scan for initial screening
- Reserve detailed reports for serious targets
- ~$0.016 vs ~$0.032 per report

#### 4. Batch Processing
- Bulk generation more efficient
- Shared context reduces token usage
- ~5-10% savings on large batches

### Monthly Cost Estimates

**Small Team (5 scouts):**
- 50 reports/day (10 per scout)
- ~$40/day = ~$1,200/month

**Medium Team (20 scouts):**
- 200 reports/day (10 per scout)
- ~$160/day = ~$4,800/month

**Large Organization (50 scouts):**
- 500 reports/day (10 per scout)
- ~$400/day = ~$12,000/month

### Cost Monitoring

Track costs using the analytics endpoint:
```
GET /auto-scout/analytics?startDate=2025-11-01&endDate=2025-11-06
```

## Best Practices

### For Scouts

#### 1. Choose the Right Template
- **Quick Scan:** First look at unknown players
- **Match Performance:** Immediate post-match analysis
- **Season Overview:** Quarterly or end-of-season reviews
- **Transfer Target:** Serious acquisition candidates
- **Youth Prospect:** Academy players and young talents

#### 2. Provide Context
Always include `customContext` for better results:
```json
{
  "playerId": "player-123",
  "reportType": "TRANSFER_TARGET",
  "customContext": "We need a left-footed central midfielder who can play as a 6 or 8. Must be comfortable pressing high. Budget: €15-20M"
}
```

#### 3. Review AI Output
- **All AI reports should be reviewed by a human**
- Check the quality score (aim for B+ or higher)
- Verify statistical claims against source data
- Add your own observations and insights

#### 4. Edit and Personalize
- Use AI report as a starting point
- Add specific observations not in the data
- Include subjective assessments (personality, attitude)
- Reference specific match moments

#### 5. Track Quality Over Time
- Monitor your quality score trends
- Reports with C or D grades need more review
- Provide feedback if AI analysis is incorrect

### For Administrators

#### 1. Monitor Usage
- Check analytics dashboard weekly
- Watch for unusual spikes in usage
- Identify scouts generating low-quality reports

#### 2. Set Budget Alerts
- Calculate expected monthly costs
- Set up alerts at 75% and 90% of budget
- Review high-usage scouts

#### 3. Template Optimization
- Track which templates are most used
- Consider creating custom templates for common use cases
- Adjust prompts based on feedback

#### 4. Quality Standards
- Set minimum quality thresholds (e.g., B grade required)
- Review D-grade reports for patterns
- Provide training on effective use

### Prompt Engineering Tips

When creating custom templates or adding context:

#### 1. Be Specific
❌ "Analyze the player"
✅ "Analyze this player's ability to play as a false 9 in a high-pressing system"

#### 2. Provide Examples
❌ "List strengths"
✅ "List 3-5 specific technical strengths, e.g., 'First touch allows quick direction changes', 'Passing accuracy over 85%'"

#### 3. Set Constraints
❌ "Write a summary"
✅ "Write a 2-3 sentence summary focusing on their primary position and standout quality"

#### 4. Define Success
❌ "Give a rating"
✅ "Rate on a 0-10 scale where 7-10 is elite professional level, 5-7 is solid professional, and <5 needs development"

## Examples

### Example 1: Generate Season Overview

```typescript
// Using the API
const response = await fetch('/auto-scout/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    playerId: 'player-123',
    reportType: 'SEASON_OVERVIEW',
    temperature: 0.7,
    includeComparisons: true
  })
});

const result = await response.json();
console.log(`Quality Grade: ${result.data.qualityScore.grade}`);
console.log(`Overall Rating: ${result.data.overallRating}/10`);
```

### Example 2: Bulk Match Reports

```typescript
// Generate reports for all players in a match
const response = await fetch('/auto-scout/bulk-generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    playerIds: ['player-1', 'player-2', 'player-3', ...],
    matchId: 'match-456',
    customContext: 'Focus on pressing intensity and defensive work rate'
  })
});

const result = await response.json();
console.log(`Generated ${result.data.successful}/${result.data.total} reports`);
console.log(`Total cost: $${result.data.totalCost.toFixed(4)}`);
```

### Example 3: Transfer Target with Context

```typescript
const response = await fetch('/auto-scout/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    playerId: 'player-789',
    reportType: 'TRANSFER_TARGET',
    customContext: `
      Context for evaluation:
      - Position needed: Central Defensive Midfielder
      - Must be: Left-footed, strong in duels, excellent passer
      - Playing style: High press, possession-based
      - Budget: €10-15M
      - Age range: 22-26
      - Contract: Looking for 4-year deal
      - Competition: 2 other clubs interested
    `
  })
});
```

### Example 4: Custom Template

```typescript
const customTemplate = {
  name: "Pre-Match Scouting Brief",
  description: "Quick brief for upcoming opponent analysis",
  sections: [
    { name: "Key Threats", fields: ["attacking_patterns", "set_pieces"] },
    { name: "Weaknesses", fields: ["defensive_vulnerabilities", "fitness"] },
    { name: "Game Plan", fields: ["how_to_defend", "how_to_attack"] }
  ],
  promptTemplate: `
    Analyze {player_name} ({position}) for pre-match preparation:

    Stats: {stats}

    Provide:
    1. Top 3 threats this player poses
    2. Top 2 weaknesses to exploit
    3. Specific game plan recommendations
  `
};

const response = await fetch('/auto-scout/custom', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    playerId: 'player-999',
    template: customTemplate,
    customPrompt: 'Match is in 3 days, focus on immediate actionable insights'
  })
});
```

## Environment Variables

Add to your `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
AUTOSCOUT_CACHE_TTL=3600        # Cache duration in seconds
AUTOSCOUT_MAX_BATCH_SIZE=50     # Max players in bulk operation
AUTOSCOUT_RATE_LIMIT=10         # Reports per hour per scout
```

## Troubleshooting

### Common Issues

#### 1. "Player not found" error
**Cause:** Invalid player ID or player has no data
**Solution:** Verify player exists and has basic info in database

#### 2. Low quality scores consistently
**Cause:** Insufficient data or vague prompts
**Solution:**
- Ensure players have recent match data
- Add more specific custom context
- Check that scouting reports exist for the player

#### 3. Rate limit exceeded
**Cause:** Too many requests in short time
**Solution:**
- Wait for rate limit window to reset (1 hour)
- Use bulk generation instead of individual requests
- Contact admin to increase your limit

#### 4. High costs
**Cause:** Inefficient usage patterns
**Solution:**
- Use caching effectively (same requests reuse cache)
- Start with Quick Scan before detailed reports
- Batch similar requests together

#### 5. Generic/unhelpful reports
**Cause:** Lack of context or data
**Solution:**
- Always provide custom context
- Ensure player has sufficient match history
- Use appropriate template for use case
- Add specific focus areas

## Database Schema

The `auto_generated_reports` table stores all generated reports:

```prisma
model auto_generated_reports {
  id                String   @id
  playerId          String
  matchId           String?
  scoutId           String?

  reportData        Json     // Full generated report
  qualityScore      Float
  qualityBreakdown  Json

  template          String
  model             String   @default("gpt-4-turbo-preview")
  tokensUsed        Int
  generationTime    Int      // milliseconds

  wasManuallyEdited Boolean  @default(false)
  savedAsReport     Boolean  @default(false)
  savedReportId     String?

  createdAt         DateTime @default(now())

  players           players  @relation(...)
  matches           matches? @relation(...)
  users             users?   @relation(...)
}
```

## Future Enhancements

Planned features for future versions:

1. **Video Analysis Integration**
   - Generate reports with video timestamp references
   - Link specific observations to video clips

2. **Multi-Language Support**
   - Generate reports in different languages
   - Maintain quality across languages

3. **Historical Comparison**
   - Compare current report to previous reports
   - Track player development over time

4. **Custom Metrics**
   - Define organization-specific metrics
   - Custom quality scoring criteria

5. **Report Templates Library**
   - Community-shared templates
   - Industry-standard templates

6. **AI Model Selection**
   - Choose between different AI models
   - Balance cost vs quality

7. **Batch Export**
   - Export multiple reports to PDF
   - Custom formatting options

8. **Integration with Other Modules**
   - Auto-generate reports from SmartScout matches
   - Link with Performance Predictor insights

## Support

For issues, questions, or feature requests:
- Check this documentation first
- Review the troubleshooting section
- Contact your system administrator
- Refer to the main Arcane Football documentation

## Version History

**v1.0.0** (2025-11-06)
- Initial release
- 5 report templates
- Quality scoring system
- Cost tracking
- Caching and rate limiting
