# Performance Predictor - Quick Start Guide

## What is it?
AI-powered player performance prediction system that forecasts match ratings with confidence intervals and actionable insights.

## How to Use

### 1. Single Player Prediction

**Step 1**: Open Performance Predictor screen
```typescript
navigation.navigate('PerformancePredictor')
```

**Step 2**: Select a player
- Tap "Choose a player..." button
- Pick from player list

**Step 3**: Select a match
- Tap "Choose a match..." button
- Pick upcoming match

**Step 4**: Predict
- Tap "Predict Performance" button
- Wait for AI analysis (1-2 seconds)

**Step 5**: Review Results
- **Rating**: Large color-coded number (0-10)
- **Confidence**: How certain the AI is
- **Distribution**: Probability chart
- **Factors**: Top 5 performance drivers
- **Recommendations**: Actionable advice

### 2. Team Lineup Prediction

**Step 1**: Navigate to "Team Lineup" tab

**Step 2**: Select match
- Choose upcoming match

**Step 3**: Predict Team
- Tap "Predict Team Performance"
- See all players predicted

**Step 4**: Explore
- View formation visualization
- Tap players for details
- Sort by rating or position
- See expected team rating

### 3. Model Accuracy

**Step 1**: Navigate to "Accuracy" tab

**Step 2**: Review Metrics
- Performance grade (A+ to F)
- Mean error (MAE)
- Confidence accuracy
- Total predictions

**Step 3**: Analyze Trends
- Monthly accuracy chart
- Model improvement over time

## Color Coding

| Rating | Color | Label |
|--------|-------|-------|
| 8.0+ | Green (#10B981) | Excellent |
| 7.0-8.0 | Blue (#3B82F6) | Good |
| 5.0-7.0 | Yellow (#EAB308) | Average |
| 0-5.0 | Red (#EF4444) | Poor |

## Understanding Results

### Predicted Rating
The AI's best estimate of player's match rating (0-10 scale).

### Confidence Interval
Range where actual rating will likely fall (95% confidence).
Example: 6.5 - 8.1 means rating will be between 6.5 and 8.1.

### Confidence Score
How certain the AI is (0-100%).
- 90%+: Very High
- 75-90%: High
- 60-75%: Medium
- 40-60%: Low

### Key Factors
Top 5 things affecting this prediction:
- ↑ Green: Positive impact
- ↓ Red: Negative impact
- → Gray: Neutral impact

### Recommendations
AI-generated advice based on prediction:
- Warning (red): Caution or risk
- Info (blue): General insight
- Success (green): Opportunity

## Tips

1. **Higher confidence = more reliable**: Look for 75%+ confidence
2. **Check factors**: Understand WHY the prediction is what it is
3. **Compare intervals**: Narrow interval = more certain prediction
4. **Use team view**: See how entire lineup is expected to perform
5. **Track accuracy**: Monitor model performance over time

## Common Scenarios

### High Rating, High Confidence
**Example**: 8.2 rating, 85% confidence
**Meaning**: Player very likely to have excellent performance
**Action**: Consider key role in match

### High Rating, Low Confidence
**Example**: 8.0 rating, 45% confidence
**Meaning**: Could be great, but uncertain
**Action**: Monitor closely, have backup plan

### Low Rating, High Confidence
**Example**: 5.5 rating, 80% confidence
**Meaning**: Player likely to underperform
**Action**: Consider substitution or different tactics

### Wide Interval
**Example**: [4.5 - 8.5]
**Meaning**: High uncertainty, many outcomes possible
**Action**: Treat prediction with caution

## Integration Points

### From Player Profile
```typescript
navigation.navigate('PerformancePredictor', {
  playerId: player.id,
  tab: 'single'
})
```

### From Match Detail
```typescript
navigation.navigate('PerformancePredictor', {
  matchId: match.id,
  tab: 'team'
})
```

### From AI Hub
```typescript
navigation.navigate('PerformancePredictor')
```

## API Endpoints

```typescript
// Single prediction
POST /performance-predictor/predict/:playerId/:matchId

// Team prediction
POST /performance-predictor/batch-predict/:matchId

// Accuracy metrics
GET /performance-predictor/accuracy

// Feature importance
GET /performance-predictor/feature-importance
```

## Troubleshooting

### "Prediction Failed"
- Check internet connection
- Verify ML service is running
- Try again in a moment

### "Missing Selection"
- Ensure both player and match are selected
- Check that match is upcoming (not past)

### Empty Accuracy Tab
- No predictions made yet
- Model needs time to collect data
- Check back after some predictions

### Chart Not Displaying
- Ensure react-native-chart-kit installed
- Check react-native-svg dependency
- Reload app

## Performance

- Prediction API call: ~1-2 seconds
- Chart rendering: ~200-500ms
- Smooth 60fps scrolling
- Offline caching (future)

## Permissions Required

- None (uses existing auth token)

## Data Privacy

- Predictions stored server-side
- No personal data exposed
- Compliant with data policies

## Future Features

- Share predictions as images
- Save predictions offline
- Compare player predictions
- Historical prediction accuracy per player
- Export to PDF
- Push notifications for predictions
- Live match prediction updates

## Support

For issues or questions:
1. Check this guide
2. Review error messages
3. Contact development team
4. Check API status
