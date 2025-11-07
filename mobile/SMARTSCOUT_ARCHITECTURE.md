# SmartScout AI - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                               │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    Navigation Layer                     │   │
│  │                                                         │   │
│  │  MainApp → AI Screen → SmartScout Screen               │   │
│  │                              │                          │   │
│  │                              ├─ Suggestions Tab         │   │
│  │                              ├─ Autocomplete Tab        │   │
│  │                              └─ Insights Tab            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Component Layer                       │   │
│  │                                                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ RatingSlider │  │SimilarReport │  │ Autocomplete│  │   │
│  │  │              │  │    Card      │  │  Suggestion │  │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────┐                                      │   │
│  │  │ InsightCard  │                                      │   │
│  │  │              │                                      │   │
│  │  └──────────────┘                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    Services Layer                       │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │         smartScoutApi (API Client)               │  │   │
│  │  │                                                  │  │   │
│  │  │  • getSuggestions(partialReport)                │  │   │
│  │  │  • autocomplete(request)                        │  │   │
│  │  │  • getInsights(playerId)                        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                     Types Layer                         │   │
│  │                                                         │   │
│  │  • PartialReport                                       │   │
│  │  • SimilarReport                                       │   │
│  │  • AutocompleteRequest/Response                       │   │
│  │  • PlayerInsights                                     │   │
│  │  • FieldName                                          │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ Bearer Token Auth
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              SmartScout Controller                      │   │
│  │                                                         │   │
│  │  POST   /smart-scout/suggestions                       │   │
│  │  POST   /smart-scout/autocomplete                      │   │
│  │  GET    /smart-scout/insights/:playerId                │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              SmartScout Service                         │   │
│  │                                                         │   │
│  │  • findSimilarReports()                                │   │
│  │  • autocompleteField()                                 │   │
│  │  • generatePlayerInsights()                            │   │
│  │  • calculateSimilarity()                               │   │
│  │  • analyzePlayerTrends()                               │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Database (Prisma)                     │   │
│  │                                                         │   │
│  │  • ScoutingReports                                     │   │
│  │  • Players                                             │   │
│  │  • Users                                               │   │
│  │  • Matches                                             │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                 OpenAI Integration                      │   │
│  │                                                         │   │
│  │  • GPT-4 for insights generation                       │   │
│  │  • GPT-3.5 for autocomplete                            │   │
│  │  • Embeddings for similarity                           │   │
│  │  • Fallback to rule-based                              │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Suggestions Tab

```
User Interaction
     │
     ├─ Select Position: "CB"
     ├─ Adjust Technical Rating: 75
     ├─ Adjust Tactical Rating: 80
     ├─ Adjust Physical Rating: 85
     └─ Adjust Mental Rating: 70
     │
     ▼
Tap "Find Similar Reports"
     │
     ▼
┌──────────────────────────┐
│   smartScoutApi          │
│   .getSuggestions()      │
└──────────────────────────┘
     │
     ▼ POST /smart-scout/suggestions
     │ Body: { partialReport: {...} }
     │
┌──────────────────────────┐
│  Backend API             │
│  SmartScoutService       │
│  .findSimilarReports()   │
└──────────────────────────┘
     │
     ├─ Query Database for CB reports
     ├─ Calculate similarity scores
     ├─ Rank by similarity (0-1)
     └─ Return top matches
     │
     ▼
Response: {
  similarReports: [
    { reportId, similarity: 0.92, player: {...}, excerpts: {...} },
    { reportId, similarity: 0.85, player: {...}, excerpts: {...} },
    ...
  ],
  usingAI: true
}
     │
     ▼
┌──────────────────────────┐
│  Mobile App              │
│  Display Results         │
│  • Sort by similarity    │
│  • Show circular badge   │
│  • Render cards          │
└──────────────────────────┘
     │
     ▼
User sees similar reports
```

---

## Data Flow: Autocomplete Tab

```
User Interaction
     │
     ├─ Select Field: "strengths"
     ├─ Set Context Position: "ST"
     └─ Type: "Good ball con"
     │
     ▼
500ms Debounce Timer
     │
     ▼
┌──────────────────────────┐
│   smartScoutApi          │
│   .autocomplete()        │
└──────────────────────────┘
     │
     ▼ POST /smart-scout/autocomplete
     │ Body: {
     │   fieldName: "strengths",
     │   partialValue: "Good ball con",
     │   context: { position: "ST" }
     │ }
     │
┌──────────────────────────┐
│  Backend API             │
│  SmartScoutService       │
│  .autocompleteField()    │
└──────────────────────────┘
     │
     ├─ Try OpenAI completion
     │  └─ If available: GPT-3.5 suggestions
     │  └─ If not: Fallback to rules
     ├─ Analyze similar reports
     ├─ Extract common phrases
     └─ Return top 5 suggestions
     │
     ▼
Response: {
  suggestions: [
    "Good ball control and dribbling",
    "Good ball control in tight areas",
    "Good ball control under pressure",
    ...
  ],
  usingAI: true
}
     │
     ▼
┌──────────────────────────┐
│  Mobile App              │
│  Display Suggestions     │
│  • Show AI badge         │
│  • Show confidence       │
│  • Tap to insert         │
└──────────────────────────┘
     │
     ▼
User taps suggestion → Text inserted
```

---

## Data Flow: Insights Tab

```
User Interaction
     │
     └─ Select Player: "John Doe (ST)"
     │
     ▼
Tap "Generate AI Insights"
     │
     ▼
┌──────────────────────────┐
│   smartScoutApi          │
│   .getInsights()         │
└──────────────────────────┘
     │
     ▼ GET /smart-scout/insights/player123
     │
┌──────────────────────────┐
│  Backend API             │
│  SmartScoutService       │
│  .generatePlayerInsights()│
└──────────────────────────┘
     │
     ├─ Query all reports for player
     ├─ Calculate average ratings
     ├─ Analyze trends over time
     ├─ Calculate scout consensus
     ├─ Generate AI summary (GPT-4)
     └─ Return comprehensive insights
     │
     ▼
Response: {
  playerId: "player123",
  playerName: "John Doe",
  summary: "Talented striker...",
  trends: {
    improving: ["Finishing", "Positioning"],
    declining: ["Work rate"],
    stable: ["Passing", "Dribbling"]
  },
  consensus: {
    agreementPercentage: 87,
    totalReports: 12
  },
  avgRatings: {
    technical: 82,
    tactical: 65,
    physical: 71,
    mental: 78
  }
}
     │
     ▼
┌──────────────────────────┐
│  Mobile App              │
│  Display Insights        │
│  • Show AI summary       │
│  • Render trends         │
│  • Show consensus        │
│  • Display ratings       │
└──────────────────────────┘
     │
     ▼
User views comprehensive analysis
```

---

## Component Hierarchy

```
SmartScoutScreen
  ├─ Header
  │   ├─ Back Button
  │   ├─ Title + AI Badge
  │   └─ Placeholder
  │
  ├─ Tab Bar
  │   ├─ Tab: Suggestions
  │   ├─ Tab: Autocomplete
  │   └─ Tab: Insights
  │
  └─ Tab Content
       │
       ├─ SuggestionsTab
       │   ├─ GlassCard (Form)
       │   │   ├─ Picker (Position)
       │   │   ├─ RatingSlider (Technical)
       │   │   ├─ RatingSlider (Tactical)
       │   │   ├─ RatingSlider (Physical)
       │   │   ├─ RatingSlider (Mental)
       │   │   └─ Button (Find Similar)
       │   │
       │   └─ Results Section
       │       ├─ SimilarReportCard
       │       ├─ SimilarReportCard
       │       └─ SimilarReportCard
       │
       ├─ AutocompleteTab
       │   ├─ GlassCard (Field Selector)
       │   │   └─ Picker
       │   │
       │   ├─ GlassCard (Context)
       │   │   ├─ Picker (Position)
       │   │   └─ TextInput (League)
       │   │
       │   ├─ GlassCard (Text Input)
       │   │   └─ TextInput (multiline)
       │   │
       │   └─ Suggestions List
       │       ├─ AutocompleteSuggestion
       │       ├─ AutocompleteSuggestion
       │       └─ AutocompleteSuggestion
       │
       └─ InsightsTab
           ├─ GlassCard (Player Selector)
           │   ├─ Picker
           │   └─ Button (Generate)
           │
           ├─ Share Button
           │
           └─ InsightCard
               ├─ Header (Player Name)
               ├─ AI Summary Section
               ├─ Trends Section
               │   ├─ Improving
               │   ├─ Declining
               │   └─ Stable
               ├─ Consensus Section
               └─ Ratings Chart
```

---

## State Management

```
SuggestionsTab State:
  ├─ partialReport: PartialReport
  ├─ similarReports: SimilarReport[]
  ├─ isLoading: boolean
  └─ hasSearched: boolean

AutocompleteTab State:
  ├─ selectedField: FieldName
  ├─ inputText: string
  ├─ context: { position, league }
  ├─ suggestions: string[]
  ├─ isAI: boolean
  ├─ isLoading: boolean
  └─ debounceTimer: NodeJS.Timeout

InsightsTab State:
  ├─ players: Player[]
  ├─ selectedPlayerId: string
  ├─ insights: PlayerInsights | null
  ├─ isLoadingPlayers: boolean
  ├─ isLoadingInsights: boolean
  └─ isRefreshing: boolean

SmartScoutScreen State:
  └─ activeTab: TabName
```

---

## API Request/Response Examples

### 1. Suggestions

**Request**:
```json
POST /smart-scout/suggestions
{
  "partialReport": {
    "playerPosition": "CB",
    "technicalRating": 75,
    "tacticalRating": 80,
    "physicalRating": 85,
    "mentalRating": 70
  }
}
```

**Response**:
```json
{
  "similarReports": [
    {
      "reportId": "rpt_123",
      "similarity": 0.92,
      "player": {
        "id": "ply_456",
        "name": "John Doe",
        "position": "CB"
      },
      "excerpts": {
        "strengths": "Strong in the air, good positioning",
        "weaknesses": "Needs to improve distribution"
      },
      "scoutName": "Mike Smith",
      "matchDate": "2024-11-01T10:00:00Z"
    }
  ],
  "suggestions": [],
  "usingAI": true
}
```

### 2. Autocomplete

**Request**:
```json
POST /smart-scout/autocomplete
{
  "fieldName": "strengths",
  "partialValue": "Good ball con",
  "context": {
    "position": "ST"
  }
}
```

**Response**:
```json
{
  "suggestions": [
    "Good ball control and dribbling",
    "Good ball control in tight areas",
    "Good ball control under pressure"
  ],
  "usingAI": true
}
```

### 3. Insights

**Request**:
```
GET /smart-scout/insights/player123
```

**Response**:
```json
{
  "playerId": "player123",
  "playerName": "John Doe",
  "summary": "Talented striker with excellent positioning and finishing. Shows consistency in front of goal and has improved his work rate significantly over the season.",
  "trends": {
    "improving": ["Finishing", "Positioning", "Work rate"],
    "declining": ["Defensive contribution"],
    "stable": ["Passing", "Dribbling", "Speed"]
  },
  "consensus": {
    "agreementPercentage": 87,
    "totalReports": 12
  },
  "avgRatings": {
    "technical": 82,
    "tactical": 65,
    "physical": 71,
    "mental": 78
  }
}
```

---

## File Structure Tree

```
mobile/
└─ src/
   ├─ types/
   │  └─ smart-scout.ts              (Interfaces, types, constants)
   │
   ├─ services/
   │  └─ api/
   │     └─ smart-scout.ts           (API client methods)
   │
   ├─ components/
   │  └─ smart-scout/
   │     ├─ RatingSlider.tsx         (Slider 0-100 with haptics)
   │     ├─ SimilarReportCard.tsx    (Report card with similarity)
   │     ├─ AutocompleteSuggestion.tsx (Suggestion row)
   │     ├─ InsightCard.tsx          (Comprehensive insights)
   │     └─ index.ts                 (Barrel export)
   │
   ├─ screens/
   │  └─ ai/
   │     ├─ SmartScoutScreen.tsx     (Main screen with tabs)
   │     └─ smart-scout/
   │        ├─ SuggestionsTab.tsx    (Find similar reports)
   │        ├─ AutocompleteTab.tsx   (Smart autocomplete)
   │        ├─ InsightsTab.tsx       (Player analysis)
   │        └─ index.ts              (Barrel export)
   │
   └─ navigation/
      └─ AppNavigator.tsx            (Route registration)
```

---

## Technology Stack

### Frontend (Mobile)
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State**: React Hooks (useState, useEffect, useCallback)
- **API Client**: Axios
- **UI Components**: Custom + GlassCard
- **Feedback**: Expo Haptics
- **Sharing**: React Native Share
- **Notifications**: React Native Toast Message
- **Slider**: @react-native-community/slider
- **Picker**: @react-native-picker/picker

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **AI**: OpenAI (GPT-4, GPT-3.5, Embeddings)
- **Auth**: JWT Bearer Tokens
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

---

## Security

### Authentication
- Bearer token in Authorization header
- Token stored in AsyncStorage
- Token included in all API requests
- 401 handling with auto-logout

### Data Privacy
- Player data protected by auth
- Reports visible only to authorized scouts
- Insights based on accessible reports only

### API Security
- Rate limiting on backend
- Input validation with DTOs
- SQL injection prevention (Prisma)
- XSS protection

---

## Performance Considerations

### Mobile
- **Debouncing**: 500ms on autocomplete prevents API spam
- **Lazy Loading**: Components render on tab switch
- **Optimized Lists**: Consider FlatList for large datasets
- **Memoization**: React.memo for expensive components
- **Image Optimization**: If player avatars added

### Backend
- **Caching**: Consider Redis for frequent insights
- **Database Indexing**: On playerId, position, ratings
- **OpenAI Rate Limits**: Fallback to rule-based
- **Batch Processing**: For multiple similar reports

---

## Error Scenarios

| Scenario | Mobile Behavior | Backend Response |
|----------|----------------|------------------|
| Network Offline | Toast: "No connection" | N/A |
| API 404 | Toast: "Not found" | 404 + error message |
| API 500 | Toast: "Server error" | 500 + error message |
| OpenAI Down | Shows "usingAI: false" | Returns rule-based results |
| No Reports | Empty state | 200 + empty array |
| Invalid Token | Logout + redirect | 401 + "Unauthorized" |

---

This architecture ensures scalability, maintainability, and a great user experience!
