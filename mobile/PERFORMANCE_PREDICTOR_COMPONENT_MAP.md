# Performance Predictor - Component Map

## Visual Hierarchy

```
PerformancePredictorScreen (Main Container)
│
├── Header
│   ├── Title: "Performance Predictor"
│   └── Subtitle: "AI-powered player performance forecasting"
│
├── Tab Navigation
│   ├── [Single] Tab
│   ├── [Team Lineup] Tab
│   └── [Accuracy] Tab
│
└── Tab Content
    │
    ├─── SinglePredictionTab
    │    │
    │    ├── Player Picker Button
    │    ├── Match Picker Button
    │    ├── Predict Button
    │    │
    │    └── (After Prediction)
    │        ├── PredictionCard
    │        │   ├── Player Avatar
    │        │   ├── Rating (48-56px)
    │        │   ├── Rating Label Badge
    │        │   ├── Confidence Interval Display
    │        │   └── Confidence Bar
    │        │
    │        ├── ConfidenceInterval
    │        │   ├── Scale (0-10)
    │        │   ├── Interval Range Bar
    │        │   ├── Predicted Marker
    │        │   └── Value Labels
    │        │
    │        ├── RatingDistribution
    │        │   ├── Donut Chart
    │        │   ├── Center Label
    │        │   └── Legend
    │        │
    │        ├── Key Factors Section
    │        │   └── KeyFactorItem[] (expandable)
    │        │       ├── Rank Badge
    │        │       ├── Factor Name
    │        │       ├── Impact Indicator (↑↓→)
    │        │       ├── Importance Bar
    │        │       └── Description (expandable)
    │        │
    │        └── Recommendations Section
    │            └── RecommendationCard[]
    │                ├── Icon (warning/info/success)
    │                └── Text
    │
    ├─── TeamLineupTab
    │    │
    │    ├── Match Picker Button
    │    ├── Predict Team Button
    │    │
    │    └── (After Prediction)
    │        ├── Team Summary Card
    │        │   ├── Expected Team Rating
    │        │   └── Player Count
    │        │
    │        ├── FormationView
    │        │   ├── Football Pitch
    │        │   ├── Field Markings
    │        │   └── Player Circles[]
    │        │       ├── Rating Display
    │        │       ├── Player Name
    │        │       └── Position Badge
    │        │
    │        ├── Sort Options
    │        │   ├── [Rating] Button
    │        │   └── [Position] Button
    │        │
    │        ├── Player List
    │        │   └── PlayerItem[]
    │        │       ├── Player Info
    │        │       ├── Position
    │        │       └── Rating
    │        │
    │        └── Player Detail Modal
    │            └── PredictionCard (full details)
    │
    └─── AccuracyTab
         │
         ├── Performance Grade Card
         │   ├── Grade (A+ to F)
         │   └── Subtitle
         │
         ├── Metrics Grid
         │   ├── Row 1
         │   │   ├── AccuracyMetricCard (MAE)
         │   │   └── AccuracyMetricCard (RMSE)
         │   └── Row 2
         │       ├── AccuracyMetricCard (Within CI)
         │       └── AccuracyMetricCard (Total Predictions)
         │
         ├── Trend Chart Section
         │   ├── Chart Title
         │   └── LineChart (Monthly MAE)
         │
         ├── Model Metadata Section
         │   ├── Model Version
         │   ├── Date Range
         │   └── R² Score
         │
         └── Performance Insights Section
             ├── Insight Card (Model Accuracy)
             ├── Insight Card (Confidence Reliability)
             └── Insight Card (Data Coverage)
```

## Component Dependencies

```
Components Used by Screens:

SinglePredictionTab uses:
  - PredictionCard
  - ConfidenceInterval
  - RatingDistribution
  - KeyFactorItem
  - RecommendationCard

TeamLineupTab uses:
  - FormationView
  - PredictionCard (in modal)

AccuracyTab uses:
  - AccuracyMetricCard
  - LineChart (from react-native-chart-kit)
```

## Component Props Quick Reference

### PredictionCard
```typescript
{
  prediction: {
    rating: number;          // 0-10
    interval: [number, number]; // [low, high]
    confidence: number;      // 0-1
  };
  player: {
    name: string;
    position: string;
    photo?: string;
  };
}
```

### RatingDistribution
```typescript
{
  distribution: {
    poor_0_5: number;        // probability 0-1
    average_5_7: number;
    good_7_8: number;
    excellent_8_plus: number;
  };
}
```

### KeyFactorItem
```typescript
{
  factor: {
    factor: string;          // e.g., "form_l5"
    value: number;           // e.g., 7.2
    importance: number;      // 0-1
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  };
  rank: number;              // 1-5
}
```

### RecommendationCard
```typescript
{
  recommendation: string;
  index: number;
}
```

### ConfidenceInterval
```typescript
{
  interval: [number, number]; // [low, high]
  predictedValue: number;     // 0-10
}
```

### FormationView
```typescript
{
  predictions: TeamPrediction[];
  onPlayerPress?: (prediction: TeamPrediction) => void;
}

TeamPrediction = PerformancePrediction & {
  playerName?: string;
  playerPosition?: string;
  playerPhoto?: string;
}
```

### AccuracyMetricCard
```typescript
{
  label: string;
  value: number | string;
  subtitle?: string;
  icon: string;              // Ionicons name
  color?: string;            // hex color
}
```

## Data Flow

```
User Action → API Call → State Update → Component Render

Example: Single Prediction Flow
1. User selects player + match
2. User taps "Predict Performance"
3. API: performancePredictorApi.predict(playerId, matchId)
4. Response: PerformancePrediction object
5. State: setPrediction(response)
6. Render: All components receive prediction data
7. Display: Charts, cards, lists populate with data
```

## State Management

```
SinglePredictionTab State:
  - selectedPlayer: Player | null
  - selectedMatch: Match | null
  - prediction: PerformancePrediction | null
  - loading: boolean

TeamLineupTab State:
  - selectedMatch: Match | null
  - predictions: TeamPrediction[]
  - loading: boolean
  - sortBy: 'rating' | 'position'
  - selectedPlayer: TeamPrediction | null

AccuracyTab State:
  - metrics: AccuracyMetrics[]
  - loading: boolean

PerformancePredictorScreen State:
  - activeTab: 'single' | 'team' | 'accuracy'
```

## Color Coding Guide

```
Rating Colors (used in all components):
  getRatingColor(8.5)  → #10B981 (Green)  "Excellent"
  getRatingColor(7.5)  → #3B82F6 (Blue)   "Good"
  getRatingColor(6.0)  → #EAB308 (Yellow) "Average"
  getRatingColor(4.0)  → #EF4444 (Red)    "Poor"

Impact Colors (used in KeyFactorItem):
  'positive'  → #10B981 (Green)
  'negative'  → #EF4444 (Red)
  'neutral'   → #6B7280 (Gray)

Confidence Colors (used in PredictionCard):
  confidence >= 0.75 → #10B981 (Green)
  confidence >= 0.50 → #3B82F6 (Blue)
  confidence >= 0.30 → #EAB308 (Yellow)
  confidence < 0.30  → #EF4444 (Red)

Accuracy Grade Colors (used in AccuracyTab):
  MAE <= 0.75 → #10B981 (Green)
  MAE <= 1.00 → #3B82F6 (Blue)
  MAE <= 1.25 → #EAB308 (Yellow)
  MAE <= 1.50 → #F59E0B (Orange)
  MAE > 1.50  → #EF4444 (Red)
```

## Icon Usage

```
Ionicons used in components:

SinglePredictionTab:
  - "person" (player picker)
  - "football" (match picker)
  - "analytics" (predict button)
  - "analytics-outline" (empty state)

TeamLineupTab:
  - "football" (match picker)
  - "people" (predict button)
  - "people-outline" (empty state)
  - "close" (modal close)

KeyFactorItem:
  - "chevron-up" / "chevron-down" (expand/collapse)

RecommendationCard:
  - "alert-circle" (warning)
  - "trending-up" (positive)
  - "information" (info)

AccuracyMetricCard:
  - "analytics" (MAE)
  - "stats-chart" (RMSE)
  - "checkmark-circle" (Within CI)
  - "layers" (Total predictions)
```

## Responsive Sizing

```
Dimensions:
  - Screen Width: Dimensions.get('window').width
  - Chart Width: screenWidth - 32 (16px margin each side)
  - Pitch Width: screenWidth - 32
  - Pitch Height: pitchWidth * 1.5 (3:2 aspect ratio)

Font Sizes:
  - Screen Title: 28px
  - Section Title: 16-20px
  - Large Rating: 48-56px
  - Body Text: 14-15px
  - Caption: 11-12px

Touch Targets:
  - Minimum: 44x44px (accessibility)
  - Button Height: 48px
  - Player Circle: 50x50px

Spacing:
  - Card Margin: 16px horizontal, 12px vertical
  - Card Padding: 16-20px
  - Item Gap: 8-12px
  - Bottom Spacer: 40px
```

## Animation Opportunities (Future)

```
Potential Animations:

1. Rating Count-Up
   Component: PredictionCard
   Animation: 0 → predictedRating over 2 seconds
   Library: React Native Animated API

2. Confidence Fill
   Component: PredictionCard, ConfidenceInterval
   Animation: Width: 0% → confidence% over 1 second
   Library: react-native-reanimated

3. Chart Drawing
   Component: RatingDistribution, LineChart
   Animation: Built-in with react-native-chart-kit
   Trigger: On mount

4. Factor Bars Slide-In
   Component: KeyFactorItem
   Animation: translateX(-100) → 0 with stagger
   Delay: 100ms per item

5. Shimmer Loading
   Component: All cards
   Animation: Shimmer effect while loading
   Library: react-native-shimmer

6. Modal Slide
   Component: TeamLineupTab modal
   Animation: slideInUp / slideOutDown
   Library: Built-in Modal animations
```

## Accessibility (Future Enhancement)

```
Accessibility Labels:

PredictionCard:
  accessibilityLabel={`Player ${player.name}, predicted rating ${rating}, ${label} performance`}

KeyFactorItem:
  accessibilityLabel={`Factor ${rank}: ${factorName}, ${impact} impact, ${importance}% importance`}

AccuracyMetricCard:
  accessibilityLabel={`${label}: ${value}${subtitle ? ', ' + subtitle : ''}`}

FormationView Player:
  accessibilityLabel={`${playerName}, ${position}, predicted rating ${rating}`}
```

## Testing Selectors

```
Test IDs for automated testing:

Screens:
  - testID="performance-predictor-screen"
  - testID="single-prediction-tab"
  - testID="team-lineup-tab"
  - testID="accuracy-tab"

Buttons:
  - testID="player-picker-button"
  - testID="match-picker-button"
  - testID="predict-button"
  - testID="predict-team-button"

Components:
  - testID={`prediction-card-${playerId}`}
  - testID={`factor-item-${rank}`}
  - testID={`recommendation-card-${index}`}
  - testID={`accuracy-metric-${label}`}

Lists:
  - testID="factors-list"
  - testID="recommendations-list"
  - testID="team-players-list"
```

---

**Component Map Complete** ✅

Use this map for:
- Understanding component relationships
- Planning new features
- Debugging layout issues
- Writing tests
- Onboarding new developers
