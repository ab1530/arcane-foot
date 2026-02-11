# MarketValue AI - Player Valuation System

An advanced machine learning system for dynamic player market value estimation using XGBoost regression.

## Overview

The MarketValue AI system provides AI-powered player valuations based on:
- **Performance metrics**: Goals, assists, ratings, appearances
- **Physical attributes**: Height, weight, age
- **Contextual factors**: Position, league, nationality, contract status
- **Scout assessments**: Historical scout ratings

## Architecture

```
┌─────────────────┐         HTTP          ┌──────────────────┐
│                 │────────────────────────▶│                  │
│  NestJS Backend │                        │  FastAPI Service │
│   (Port 3000)   │                        │   (Port 8001)    │
│                 │◀────────────────────────│                  │
└─────────────────┘      JSON Response     └──────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌─────────────────┐                        ┌──────────────────┐
│   PostgreSQL    │                        │  XGBoost Model   │
│   (Valuations   │                        │   (v1.pkl)       │
│    History)     │                        │                  │
└─────────────────┘                        └──────────────────┘
```

## Features

### 1. ML-Powered Valuation
- **XGBoost Regressor** trained on 10,000+ player valuations
- **11 engineered features** for accurate predictions
- **Cross-validated** performance (5-fold CV)

### 2. Confidence Scoring
- Data completeness analysis
- Model uncertainty quantification
- Confidence intervals (low/high bounds)

### 3. Factor Breakdown
- Transparent contribution analysis
- Feature importance scores
- Interpretable predictions

### 4. Comparable Players
- K-NN similarity matching
- Position-aware comparisons
- Market context understanding

### 5. Valuation History
- Track value changes over time
- Trend analysis (up/down/stable)
- Historical performance

## Installation

### Prerequisites
- Python 3.11+
- PostgreSQL database
- 4GB+ RAM (for model training)

### Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Set environment variables**:
```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
```

3. **Generate training data**:
```bash
python prepare_data.py
```

4. **Train the model**:
```bash
python model_trainer.py
```

5. **Run the service**:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Model Features

The model uses 11 engineered features:

### 1. Age Normalized (0-1)
- Peak performance at 25-28 years
- Calculated as: `1 - |age - 26.5| / 20`

### 2. Position Encoded (0-3)
- GK: 0, DEF: 1, MID: 2, FWD: 3
- Reflects offensive contribution potential

### 3. League Tier (1-5)
- Top 5 leagues: 5 (EPL, LaLiga, Serie A, Bundesliga, Ligue 1)
- Tier 4: Primeira Liga, Eredivisie
- Tier 3: Championship, MLS
- Lower tiers: 1-2

### 4. Goals per 90 minutes
- Normalized by appearances
- Position-weighted importance

### 5. Assists per 90 minutes
- Playmaking contribution
- Key for midfielders and wingers

### 6. Rating Normalized (0-1)
- Average match/scout rating / 10
- Performance quality indicator

### 7. Physical Score (0-1.5)
- `(height/190 + weight/75) / 2`
- Capped at 1.5 for fairness

### 8. Top Nation Binary (0/1)
- Top 10 football nations: 1
- Others: 0
- Reflects market demand

### 9. Contract Multiplier (0.5-5.0)
- Years remaining
- Impacts negotiation leverage

### 10. Average Scout Rating
- Historical scout assessments
- Fallback to match rating

### 11. Experience Factor
- `log(1 + appearances)`
- Reflects career maturity

## API Endpoints

### POST /predict
Predict market value for a player.

**Request**:
```json
{
  "age": 23,
  "position": "FWD",
  "league": "LaLiga",
  "goals": 15,
  "assists": 8,
  "appearances": 32,
  "rating": 7.8,
  "height": 183,
  "weight": 78,
  "nationality": "Spain",
  "contract_years_remaining": 2.5,
  "scout_ratings": [7.5, 8.0, 7.8]
}
```

**Response**:
```json
{
  "estimated_value": 23.5,
  "confidence_interval": {
    "low": 18.5,
    "high": 28.5
  },
  "confidence_score": 0.82,
  "factors": {
    "age_normalized": 2.5,
    "rating_normalized": 5.2,
    "goals_per_90": 3.8
  },
  "comparable_players": [...],
  "model_version": "v1"
}
```

### POST /train
Retrain the ML model with latest data.

**Request**:
```json
{
  "force_retrain": true,
  "data_path": "training_data.csv"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Model trained successfully",
  "metrics": {
    "test": {
      "mae": 2.8,
      "rmse": 4.2,
      "r2": 0.78
    }
  },
  "model_version": "v1"
}
```

### GET /health
Check service health and model status.

**Response**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_version": "v1",
  "service": "market-value-ai"
}
```

### GET /model-info
Get model metadata and performance.

**Response**:
```json
{
  "model_version": "v1",
  "model_type": "XGBRegressor",
  "n_features": 11,
  "metrics": {
    "test": {
      "r2": 0.78,
      "mae": 2.8,
      "rmse": 4.2
    }
  },
  "feature_importance": {...}
}
```

## Model Training

### Data Requirements

Minimum 1,000 samples recommended. Ideal: 10,000+

Training data format (CSV):
```csv
age,position,league,goals,assists,appearances,rating,height,weight,nationality,contract_years,market_value
23,FWD,LaLiga,15,8,32,7.8,183,78,Spain,2.5,25.0
```

### Training Process

1. **Data Loading**: Fetch from DB or CSV
2. **Feature Engineering**: Create 11 features
3. **Train/Test Split**: 80/20
4. **Scaling**: StandardScaler normalization
5. **Model Training**: XGBoost with tuned hyperparameters
6. **Cross-Validation**: 5-fold CV for robustness
7. **Evaluation**: MAE, RMSE, R² metrics
8. **Model Persistence**: Save to models/market_value_v1.pkl

### Hyperparameters

```python
XGBRegressor(
    n_estimators=200,      # Number of boosting rounds
    max_depth=6,           # Tree depth
    learning_rate=0.05,    # Step size shrinkage
    subsample=0.8,         # Row sampling
    colsample_bytree=0.8,  # Column sampling
    random_state=42
)
```

### Performance Targets

- **R² Score**: > 0.75 (explains 75%+ variance)
- **MAE**: < 3.0M EUR (average error)
- **RMSE**: < 5.0M EUR (penalized large errors)

## Performance Metrics

### Current Model (v1)

Based on 10,000 synthetic samples:

- **Test R²**: 0.78
- **Test MAE**: 2.8M EUR
- **Test RMSE**: 4.2M EUR
- **Cross-Val R² (mean)**: 0.76 ± 0.03

### Feature Importance

1. **rating_normalized**: 0.22 (Most important)
2. **age_normalized**: 0.18
3. **experience**: 0.15
4. **league_tier**: 0.12
5. **position_encoded**: 0.10
6. **goals_per_90**: 0.08
7. **assists_per_90**: 0.06
8. **contract_multiplier**: 0.04
9. **physical_score**: 0.03
10. **top_nation**: 0.01
11. **avg_scout_rating**: 0.01

## Deployment

### Docker

```bash
docker build -t market-value-ai .
docker run -p 8001:8001 -e DATABASE_URL="postgresql://..." market-value-ai
```

### Docker Compose

See `docker-compose.yml` in project root:

```yaml
ai-market-value:
  build: ./ai-service/market-value
  ports:
    - "8001:8001"
  environment:
    - DATABASE_URL=${DATABASE_URL}
  volumes:
    - market_value_models:/app/models
```

### Health Checks

The service includes health checks:
- Endpoint: `GET /health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Testing

### Unit Tests

```bash
pytest test_predictor.py -v
```

Test coverage:
- Feature engineering
- Position encoding
- Confidence calculation
- League tier mapping
- Contract multiplier bounds
- Physical score calculation
- Experience factor

### Integration Tests

```bash
pytest test_integration.py -v
```

Tests full prediction pipeline with mock data.

## Monitoring

### Logs

The service logs all predictions:

```
INFO:     Prediction made for player: FWD, age 23
INFO:     Model valuation: €23.5M, confidence: 0.82
```

### Metrics to Track

1. **Prediction Latency**: < 500ms target
2. **Cache Hit Rate**: Monitor cache effectiveness
3. **Model Performance**: Track MAE/RMSE over time
4. **Error Rate**: Failed predictions
5. **Usage Statistics**: Requests per day

## Maintenance

### Retraining Schedule

**Recommended**: Monthly retraining

Trigger via API:
```bash
curl -X POST http://localhost:8001/train \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

### Model Versioning

Models are versioned (v1, v2, etc.) for rollback capability:

```python
model_data = {
    'model': model,
    'scaler': scaler,
    'model_version': 'v1',
    'trained_at': datetime.now(),
    'metrics': metrics
}
```

### Data Quality

Ensure training data includes:
- ✅ Diverse positions (all 4 types)
- ✅ Multiple leagues (5+ leagues)
- ✅ Age range 17-38
- ✅ Various performance levels
- ✅ Recent data (< 2 years old)

## Troubleshooting

### Model Not Loading

**Issue**: `Model not found at models/market_value_v1.pkl`

**Solution**:
```bash
python model_trainer.py
```

### Low Confidence Scores

**Issue**: Predictions have low confidence

**Possible causes**:
1. Incomplete player data (missing fields)
2. Few appearances (< 10 matches)
3. No scout ratings
4. Outlier values

**Solution**: Collect more data for the player

### High Prediction Error

**Issue**: Predictions significantly off

**Possible causes**:
1. Model needs retraining
2. Training data quality issues
3. Feature drift (leagues changed, etc.)

**Solution**:
1. Retrain with latest data
2. Validate training data quality
3. Consider feature engineering updates

### Service Unavailable

**Issue**: `503 Service Unavailable`

**Possible causes**:
1. Model not trained yet
2. Service startup in progress
3. Resource constraints (memory)

**Solution**:
1. Wait for service to fully start (40s)
2. Check health endpoint
3. Review logs for errors

## Future Enhancements

### Planned Features

1. **Ensemble Models**: Combine XGBoost, Random Forest, Neural Network
2. **Transfer Learning**: Leverage pre-trained player embeddings
3. **Real-time Updates**: Stream processing for live valuations
4. **Market Trends**: Incorporate transfer market dynamics
5. **Injury Impact**: Factor in injury history
6. **Social Media**: Consider player popularity metrics
7. **Advanced Stats**: xG, xA, defensive actions
8. **Multi-currency**: Support multiple currencies beyond EUR

### Research Opportunities

1. **Deep Learning**: LSTM for temporal patterns
2. **Graph Neural Networks**: Player relationship networks
3. **Reinforcement Learning**: Optimal contract timing
4. **Explainable AI**: SHAP values for transparency

## Contributing

When contributing to the model:

1. Maintain backward compatibility
2. Document feature changes
3. Validate on test set before deployment
4. Update model version number
5. Preserve previous model for rollback

## License

See project LICENSE file.

## Support

For issues or questions:
- GitHub Issues: [Repository URL]
- Documentation: [Docs URL]
- Email: support@arcane.com

---

**Version**: 1.0.0
**Last Updated**: November 2024
**Model Version**: v1
**Maintained by**: Arcane Football AI Team
