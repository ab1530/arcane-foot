# PlayStyle DNA - ML-Based Player Classification System

> **Intelligent player style classification using K-Means clustering and machine learning**

PlayStyle DNA is an advanced ML system that analyzes player statistics from scouting reports to identify 12 distinct play styles, providing data-driven insights for recruitment, training, and team composition.

---

## Table of Contents

1. [Overview](#overview)
2. [Play Style Taxonomy](#play-style-taxonomy)
3. [Architecture](#architecture)
4. [Setup & Installation](#setup--installation)
5. [Training the Model](#training-the-model)
6. [Running the Service](#running-the-service)
7. [API Reference](#api-reference)
8. [Integration Guide](#integration-guide)
9. [Model Quality Metrics](#model-quality-metrics)
10. [Troubleshooting](#troubleshooting)

---

## Overview

PlayStyle DNA uses unsupervised machine learning to classify players into distinct play styles based on their:

- **Technical Skills** (ball control, passing, dribbling)
- **Tactical Awareness** (positioning, game reading)
- **Physical Attributes** (strength, stamina)
- **Mental Attributes** (composure, decision-making)
- **Derived Metrics** (pace, creativity, work rate, vision, aggression)

### Key Features

- **12 Distinct Play Styles** - From "Playmaker" to "Physical Enforcer"
- **Confidence Scoring** - Classification confidence based on cluster proximity
- **DNA Profiles** - 8-dimensional radar chart data for visualization
- **Similar Player Matching** - Find players with comparable styles
- **Personalized Recommendations** - Development suggestions per style
- **Real-World Examples** - Each style includes professional player references
- **Analytics Dashboard** - Style distribution insights across positions

---

## Play Style Taxonomy

### 1. Playmaker
**Description:** Creative midfielders who dictate tempo and create chances

**Key Traits:**
- High Technical Skills (>7.0)
- Exceptional Creativity (>7.0)
- Outstanding Vision (>7.0)

**Real-World Examples:** Kevin De Bruyne, Luka Modrić, Bruno Fernandes

**Ideal Positions:** CAM, CM, AM

---

### 2. Physical Enforcer
**Description:** Dominant physical presence using strength and aggression

**Key Traits:**
- High Physical Attributes (>7.0)
- Strong Aggression (>6.5)
- Exceptional Strength (>6.5)

**Real-World Examples:** Casemiro, Fabinho, N'Golo Kanté

**Ideal Positions:** CDM, CM, CB

---

### 3. Box-to-Box Engine
**Description:** Tireless runner covering entire pitch with tactical awareness

**Key Traits:**
- High Work Rate (>7.0)
- Good Physical Attributes (>6.0)
- Solid Tactical Awareness (>6.0)

**Real-World Examples:** Joshua Kimmich, Leon Goretzka, Arturo Vidal

**Ideal Positions:** CM, CDM, RM

---

### 4. Tactical Anchor
**Description:** Intelligent positioning and game reading, controls tempo

**Key Traits:**
- High Tactical Awareness (>7.0)
- Strong Mental Attributes (>7.0)
- Lower Pace (<6.0) - reads game instead

**Real-World Examples:** Sergio Busquets, Rodri, Jorginho

**Ideal Positions:** CDM, CB, CM

---

### 5. Speed Demon
**Description:** Exceptional pace and acceleration, direct running

**Key Traits:**
- Outstanding Pace (>7.5)
- Explosive acceleration
- Direct running style

**Real-World Examples:** Kylian Mbappé, Adama Traoré, Vinícius Jr

**Ideal Positions:** W, ST, RW, LW

---

### 6. Clinical Finisher
**Description:** Composed striker with technical ability and mental strength

**Key Traits:**
- High Technical Skills (>7.0)
- Strong Mental Attributes (>7.0)
- Forward position

**Real-World Examples:** Harry Kane, Robert Lewandowski, Erling Haaland

**Ideal Positions:** ST, CF, FW

---

### 7. Creative Dribbler
**Description:** Flair player with exceptional dribbling and unpredictability

**Key Traits:**
- Outstanding Technical Skills (>7.5)
- High Creativity (>7.0)
- Lower Aggression (<5.0)

**Real-World Examples:** Neymar, Lionel Messi, Mohamed Salah

**Ideal Positions:** W, CAM, RW, LW

---

### 8. Defensive Wall
**Description:** Rock-solid defender with positioning and physical strength

**Key Traits:**
- High Tactical Awareness (>6.5)
- Strong Physical Attributes (>6.5)
- Defender position

**Real-World Examples:** Virgil van Dijk, Rúben Dias, Antonio Rüdiger

**Ideal Positions:** CB, DF

---

### 9. Deep-Lying Orchestrator
**Description:** Controls tempo from deep with passing range and vision

**Key Traits:**
- Exceptional Vision (>7.0)
- High Tactical Awareness (>6.5)
- Lower Work Rate (<6.0)

**Real-World Examples:** Andrea Pirlo, Thiago Alcântara, Xabi Alonso

**Ideal Positions:** CDM, CM

---

### 10. Pressing Machine
**Description:** Relentless presser with high work rate and aggression

**Key Traits:**
- Outstanding Work Rate (>7.5)
- High Aggression (>6.0)
- Relentless stamina

**Real-World Examples:** Marcelo Brozović, Ilkay Gündogan, Enzo Fernández

**Ideal Positions:** CM, CDM, CAM

---

### 11. Target Man
**Description:** Physical aerial threat with hold-up play ability

**Key Traits:**
- Exceptional Strength (>7.0)
- High Physical Attributes (>7.0)
- Forward position

**Real-World Examples:** Olivier Giroud, Romelu Lukaku, Zlatan Ibrahimović

**Ideal Positions:** ST, CF, FW

---

### 12. Balanced All-Rounder
**Description:** Well-rounded player without dominant characteristics

**Key Traits:**
- No single attribute >7.0
- Consistent across all areas
- Versatile and adaptable

**Real-World Examples:** James Milner, Thomas Müller, Mason Mount

**Ideal Positions:** Any

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Arcane Football Platform                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  NestJS Backend (Port 3000)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PlayStyle DNA Module                         │  │
│  │  - Controller (REST endpoints)                        │  │
│  │  - Service (business logic)                           │  │
│  │  - Integration with scouting reports                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP to Python Service
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            Python FastAPI Service (Port 8002)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py - FastAPI REST API                          │  │
│  │    - /classify      - Classify player                │  │
│  │    - /compare       - Compare players                │  │
│  │    - /similar       - Find similar                   │  │
│  │    - /retrain       - Retrain model                  │  │
│  │    - /analytics     - Distribution stats             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────┴────────────────────────────┐  │
│  │  classifier.py - PlayStyleClassifier                  │  │
│  │    - Load pre-trained models                          │  │
│  │    - Classify individual players                      │  │
│  │    - Calculate confidence scores                      │  │
│  │    - Generate DNA profiles                            │  │
│  │    - Find similar players                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  cluster_trainer.py - PlayStyleClusterer             │  │
│  │    - Fetch training data from DB                      │  │
│  │    - StandardScaler normalization                     │  │
│  │    - PCA dimensionality reduction                     │  │
│  │    - K-Means clustering (n_clusters=12)               │  │
│  │    - Style mapping & analysis                         │  │
│  │    - Save models to disk                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  models/ (Persisted ML Models)                        │  │
│  │    - playstyle_kmeans_v1.pkl                          │  │
│  │    - scaler_v1.pkl                                    │  │
│  │    - pca_v1.pkl                                       │  │
│  │    - style_mapping_v1.pkl                             │  │
│  │    - features_v1.pkl                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Database Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│  - scouting_reports (training data)                          │
│  - player_playstyles (cached classifications)                │
│  - playstyle_definitions (style metadata)                    │
└─────────────────────────────────────────────────────────────┘
```

### Machine Learning Pipeline

```
Training Pipeline (cluster_trainer.py):
──────────────────────────────────────────────────────────────

1. Data Extraction
   └─> Fetch from scouting_reports table
       ├─> AVG(technical_rating)
       ├─> AVG(tactical_rating)
       ├─> AVG(physical_rating)
       ├─> AVG(mental_rating)
       └─> Derive pace, strength, work_rate, creativity from tags

2. Preprocessing
   └─> StandardScaler normalization (mean=0, std=1)

3. Dimensionality Reduction
   └─> PCA (10 features → 6 components)
       └─> Retain ~95% variance

4. Clustering
   └─> K-Means (n_clusters=12)
       ├─> n_init=20 (multiple initializations)
       └─> max_iter=500

5. Style Mapping
   └─> Analyze cluster centroids
       └─> Map to human-readable style names

6. Quality Assessment
   ├─> Silhouette Score (target: >0.5)
   └─> Davies-Bouldin Index (target: <1.0)

7. Model Persistence
   └─> Save to models/ directory


Classification Pipeline (classifier.py):
──────────────────────────────────────────────────────────────

1. Feature Extraction
   └─> Convert player profile to feature vector

2. Normalization
   └─> Apply saved StandardScaler

3. PCA Transform
   └─> Apply saved PCA transformation

4. Cluster Prediction
   └─> K-Means predict (cluster assignment)

5. Confidence Calculation
   └─> Distance to cluster centroid
       └─> confidence = 1 - (distance / max_distance)

6. Secondary Style
   └─> Second closest cluster

7. DNA Profile Generation
   └─> 8-dimensional radar data

8. Recommendations
   └─> Style-specific development advice

9. Similar Players
   └─> Same cluster, sorted by confidence
```

---

## Setup & Installation

### Prerequisites

- Python 3.10+
- PostgreSQL database with scouting reports
- At least 36 players with 2+ scouting reports each

### Installation Steps

```bash
# 1. Navigate to service directory
cd /Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment
cp .env.example .env

# 6. Edit .env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/arcane_football
# SERVICE_PORT=8002
# MODEL_VERSION=v1
```

---

## Training the Model

### Initial Training

Before using the classification service, you must train the clustering model with your scouting data.

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Train the model
python cluster_trainer.py
```

### Training Output

The trainer will display:

```
Starting PlayStyle DNA Training Pipeline
Target clusters: 12

Loaded 87 players with scouting data

PCA explained variance ratio: [0.342, 0.218, 0.156, 0.112, 0.089, 0.054]
Total variance explained: 97.1%

Cluster Quality Metrics:
Silhouette Score: 0.624 (higher is better, >0.5 is good)
Davies-Bouldin Index: 0.847 (lower is better)

======================================================================
CLUSTER ANALYSIS - PLAY STYLE IDENTIFICATION
======================================================================

Cluster 0: Playmaker
  Players: 12
  Positions: {'CM': 7, 'CAM': 4, 'AM': 1}
  Key Characteristics:
    - Technical: 8.2/10
    - Tactical: 7.8/10
    - Physical: 6.4/10
    - Mental: 8.1/10
    - Pace: 6.9/10
    - Creativity: 8.7/10
  Reasoning: High technical ability, creativity, and vision - dictates play

[... continues for all 12 clusters ...]

Models saved to models/
  - playstyle_kmeans_v1.pkl
  - scaler_v1.pkl
  - pca_v1.pkl
  - style_mapping_v1.pkl
  - features_v1.pkl

Training completed successfully!
```

### Quality Thresholds

- **Silhouette Score > 0.5** = Good cluster separation
- **Davies-Bouldin Index < 1.0** = Compact, well-defined clusters

If scores are below thresholds:
- Add more scouting reports
- Ensure diverse player types
- Consider reducing `n_clusters` to 8-10

---

## Running the Service

### Start FastAPI Server

```bash
# Development mode (with auto-reload)
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8002 --workers 4
```

### Health Check

```bash
curl http://localhost:8002/

# Expected response:
{
  "status": "healthy",
  "service": "playstyle-dna",
  "version": "1.0.0",
  "modelVersion": "v1",
  "timestamp": "2025-11-06T20:30:00.000Z"
}
```

### Interactive API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8002/docs
- **ReDoc:** http://localhost:8002/redoc

---

## API Reference

### POST /classify

Classify a single player's play style.

**Request Body:**
```json
{
  "playerId": "player-uuid",
  "position": "CM",
  "technicalSkills": 8.5,
  "tacticalAwareness": 7.5,
  "physicalAttributes": 6.5,
  "mentalAttributes": 8.0,
  "pace": 7.0,
  "strength": 6.0,
  "workRate": 8.5,
  "creativity": 9.0,
  "aggression": 5.5,
  "vision": 8.8
}
```

**Response:**
```json
{
  "playerId": "player-uuid",
  "primaryStyle": "Playmaker",
  "secondaryStyle": "Deep-Lying Orchestrator",
  "styleConfidence": 0.847,
  "cluster": 0,
  "dnaProfile": {
    "Technical": 8.5,
    "Tactical": 7.5,
    "Physical": 6.5,
    "Mental": 8.0,
    "Pace": 7.0,
    "Strength": 6.0,
    "Creativity": 9.0,
    "Work Rate": 8.5
  },
  "styleDescription": "Creative midfielders who dictate tempo and create chances through vision and technical ability",
  "keyCharacteristics": [
    "Technical Excellence",
    "Creative Vision",
    "Passing Range",
    "Game Intelligence"
  ],
  "realWorldExamples": [
    "Kevin De Bruyne",
    "Luka Modrić",
    "Bruno Fernandes",
    "Toni Kroos"
  ],
  "recommendations": [
    "Focus on vision and passing range training",
    "Study top playmakers' positioning and decision-making",
    "Develop set-piece delivery skills"
  ]
}
```

---

### POST /compare

Compare multiple players' play styles.

**Request Body:**
```json
{
  "playerProfiles": [
    {
      "playerId": "player-1",
      "position": "CM",
      "technicalSkills": 8.5,
      ...
    },
    {
      "playerId": "player-2",
      "position": "CDM",
      "technicalSkills": 6.5,
      ...
    }
  ]
}
```

**Response:**
```json
{
  "players": [
    { /* player 1 full classification */ },
    { /* player 2 full classification */ }
  ],
  "commonStyles": ["Tactical Anchor"],
  "uniqueStyles": ["Playmaker", "Physical Enforcer"],
  "recommendations": [
    "Similar play styles detected: Tactical Anchor. Consider diversifying team composition.",
    "No dedicated playmaker. Consider recruiting creative midfielder."
  ]
}
```

---

### GET /similar/{player_id}

Find players with similar play styles.

**Query Parameters:**
- `limit` (optional): Number of similar players (default: 5)

**Response:**
```json
{
  "playerId": "target-player-id",
  "targetStyle": "Playmaker",
  "cluster": 0,
  "similarPlayers": [
    {
      "playerId": "similar-1",
      "playerName": "John Smith",
      "position": "CAM",
      "primaryStyle": "Playmaker",
      "styleConfidence": 0.892,
      "dnaProfile": { ... }
    },
    ...
  ]
}
```

---

### GET /styles

Get all play style definitions.

**Response:**
```json
{
  "styles": [
    "Playmaker",
    "Physical Enforcer",
    ...
  ],
  "styleMapping": {
    "0": "Playmaker",
    "1": "Physical Enforcer",
    ...
  },
  "descriptions": {
    "Playmaker": {
      "description": "Creative midfielders who dictate tempo...",
      "characteristics": ["Technical Excellence", ...],
      "real_world_examples": ["Kevin De Bruyne", ...]
    },
    ...
  }
}
```

---

### GET /analytics/distribution

Get play style distribution analytics.

**Response:**
```json
{
  "totalPlayers": 87,
  "styleDistribution": {
    "Playmaker": 12,
    "Physical Enforcer": 9,
    "Box-to-Box Engine": 14,
    ...
  },
  "stylePercentages": {
    "Playmaker": 13.8,
    "Physical Enforcer": 10.3,
    ...
  },
  "topStyles": [
    {
      "style": "Box-to-Box Engine",
      "count": 14,
      "percentage": 16.1
    },
    ...
  ],
  "byPosition": {
    "CM": {
      "Playmaker": 7,
      "Box-to-Box Engine": 11,
      ...
    },
    ...
  }
}
```

---

### POST /retrain

Retrain clustering model with latest data (background task).

**Request Body:**
```json
{
  "n_clusters": 12,
  "force": true
}
```

**Response:**
```json
{
  "status": "training_started",
  "message": "Model retraining started in background. Check logs for progress.",
  "n_clusters": 12
}
```

---

## Integration Guide

### NestJS Backend Integration

#### 1. HTTP Service Call

```typescript
// playstyle-dna.service.ts
async getPlayerPlayStyle(playerId: string): Promise<PlayStyleDto> {
  // Fetch player data
  const player = await this.prisma.players.findUnique({
    where: { id: playerId },
    include: {
      scouting_reports: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Calculate average ratings
  const avgTechnical = this.calculateAverage(
    player.scouting_reports.map(r => r.technicalRating)
  );
  const avgTactical = this.calculateAverage(
    player.scouting_reports.map(r => r.tacticalRating)
  );
  // ... more calculations

  // Prepare profile
  const profile = {
    playerId: player.id,
    position: player.position,
    technicalSkills: avgTechnical,
    tacticalAwareness: avgTactical,
    physicalAttributes: avgPhysical,
    mentalAttributes: avgMental,
    pace: this.derivePace(player),
    strength: this.deriveStrength(player),
    workRate: this.deriveWorkRate(player),
    creativity: this.deriveCreativity(player),
    aggression: this.deriveAggression(player),
    vision: this.deriveVision(player),
  };

  // Call Python service
  const response = await this.httpService.axiosRef.post(
    'http://localhost:8002/classify',
    profile
  );

  // Cache result in database
  await this.prisma.player_playstyles.upsert({
    where: { playerId },
    create: {
      id: randomUUID(),
      playerId,
      primaryStyle: response.data.primaryStyle,
      secondaryStyle: response.data.secondaryStyle,
      styleConfidence: response.data.styleConfidence,
      cluster: response.data.cluster,
      dnaProfile: response.data.dnaProfile,
      similarPlayerIds: [],
      modelVersion: 'v1',
      lastUpdated: new Date(),
    },
    update: {
      primaryStyle: response.data.primaryStyle,
      secondaryStyle: response.data.secondaryStyle,
      styleConfidence: response.data.styleConfidence,
      cluster: response.data.cluster,
      dnaProfile: response.data.dnaProfile,
      lastUpdated: new Date(),
    },
  });

  return response.data;
}
```

#### 2. Trigger on Report Approval

```typescript
// scouting-reports.service.ts
async approve(reportId: string, reviewerId: string) {
  const approved = await this.prisma.scouting_reports.update({
    where: { id: reportId },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    },
  });

  // Trigger PlayStyle DNA update
  await this.playStyleDnaService.updatePlayerDNA(approved.playerId);

  return approved;
}
```

---

## Model Quality Metrics

### Evaluation Metrics

The system uses two primary metrics to assess cluster quality:

#### 1. Silhouette Score

**Definition:** Measures how similar a player is to their own cluster compared to other clusters.

**Range:** -1 to 1
- **> 0.7:** Excellent clustering
- **0.5 - 0.7:** Good clustering ✅ (Our target)
- **0.25 - 0.5:** Weak clustering
- **< 0.25:** Poor clustering

**Interpretation:**
- High score = Clear separation between styles
- Low score = Overlapping styles, ambiguous classification

#### 2. Davies-Bouldin Index

**Definition:** Ratio of within-cluster scatter to between-cluster separation.

**Range:** 0 to ∞
- **< 1.0:** Excellent clustering ✅ (Our target)
- **1.0 - 2.0:** Acceptable clustering
- **> 2.0:** Poor clustering

**Interpretation:**
- Lower is better
- Measures cluster compactness and separation

### Monitoring Recommendations

1. **Weekly Quality Check:**
   ```bash
   # Retrain and check metrics
   python cluster_trainer.py | grep "Silhouette\|Davies-Bouldin"
   ```

2. **Alert Thresholds:**
   - Silhouette < 0.4 → Warning
   - Silhouette < 0.3 → Critical
   - Davies-Bouldin > 1.5 → Warning
   - Davies-Bouldin > 2.0 → Critical

3. **Quarterly Full Retraining:**
   - Player meta evolves
   - New scouting reports accumulate
   - Style trends shift

---

## Troubleshooting

### Issue: "Insufficient training data"

**Symptom:** Error during training: `ValueError: Insufficient training data. Need at least 36 players, got 15.`

**Solution:**
1. Add more scouting reports to database
2. Ensure reports have status `SUBMITTED`, `APPROVED`, or `REVIEWED`
3. Verify reports include all required ratings:
   - `technical_rating`
   - `tactical_rating`
   - `physical_rating`
   - `mental_rating`

**Minimum Requirements:**
- 36 players with 2+ reports each
- Ideally 50+ players for robust clustering

---

### Issue: Low Silhouette Score (<0.3)

**Symptom:** Training completes but silhouette score is very low.

**Possible Causes:**
- Data not diverse enough (all similar players)
- Too many clusters for available data
- Poor quality scouting reports

**Solutions:**
1. **Reduce cluster count:**
   ```python
   clusterer = PlayStyleClusterer(n_clusters=8)  # Try 8 instead of 12
   ```

2. **Add diverse players:**
   - Include various positions
   - Mix of technical and physical players
   - Different leagues/levels

3. **Review scouting data quality:**
   - Check for rating consistency
   - Validate tag usage
   - Ensure proper rating scales (1-10)

---

### Issue: "Model not found" Error

**Symptom:** Classification fails with `FileNotFoundError: models/playstyle_kmeans_v1.pkl`

**Solution:**
```bash
# Train the model first
python cluster_trainer.py

# Verify models were created
ls -la models/

# Should see:
# playstyle_kmeans_v1.pkl
# scaler_v1.pkl
# pca_v1.pkl
# style_mapping_v1.pkl
# features_v1.pkl
```

---

### Issue: Low Classification Confidence

**Symptom:** Players consistently get confidence < 0.5

**Possible Causes:**
- Player is unique/outlier
- Clusters not well-defined
- Player profile incomplete

**Solutions:**
1. **Accept as Balanced All-Rounder:**
   - Low confidence often indicates versatile player
   - This is a valid classification

2. **Add more similar players:**
   - Expand training data with comparable profiles

3. **Check input data quality:**
   - Ensure all attributes populated
   - Validate rating scales
   - Review derived metrics

---

### Issue: Service Won't Start

**Symptom:** `uvicorn main:app` fails to start

**Common Causes:**

1. **Port already in use:**
   ```bash
   # Check what's using port 8002
   lsof -i :8002

   # Kill the process
   kill -9 <PID>

   # Or use different port
   uvicorn main:app --port 8003
   ```

2. **Missing dependencies:**
   ```bash
   # Reinstall requirements
   pip install -r requirements.txt
   ```

3. **Virtual environment not activated:**
   ```bash
   source venv/bin/activate
   ```

4. **Database connection failure:**
   ```bash
   # Check .env DATABASE_URL
   # Test connection
   psql "${DATABASE_URL}"
   ```

---

## Performance Optimization

### Caching Strategy

1. **Cache classifications in database** (`player_playstyles` table)
2. **Refresh triggers:**
   - New scouting report approved
   - Manual refresh requested
   - Classification older than 30 days

### Response Time Targets

- **Cached lookup:** < 50ms
- **New classification:** < 200ms
- **Batch classification (10 players):** < 1s
- **Model training:** 10-30s (depending on data size)

### Scaling Recommendations

**For > 1000 players:**
- Use Redis for caching
- Implement background job queue (Celery)
- Add load balancer for multiple service instances

**For > 10,000 players:**
- Consider batch processing overnight
- Pre-compute classifications
- Cache results in CDN

---

## Development Tips

### Testing Classification Locally

```python
# test_classification.py
from classifier import get_classifier

# Load classifier
classifier = get_classifier()

# Test profile
test_profile = {
    "playerId": "test-123",
    "position": "CM",
    "technicalSkills": 8.5,
    "tacticalAwareness": 7.5,
    "physicalAttributes": 6.5,
    "mentalAttributes": 8.0,
    "pace": 7.0,
    "strength": 6.0,
    "workRate": 8.5,
    "creativity": 9.0,
    "aggression": 5.5,
    "vision": 8.8,
}

# Classify
result = classifier.classify(test_profile)

print(f"Primary Style: {result['primaryStyle']}")
print(f"Confidence: {result['styleConfidence']}")
print(f"DNA Profile: {result['dnaProfile']}")
```

### Debugging Training Issues

```python
# debug_training.py
from cluster_trainer import PlayStyleClusterer
import os

clusterer = PlayStyleClusterer(n_clusters=12)

# Fetch data
df = clusterer.fetch_training_data(os.getenv('DATABASE_URL'))

print(f"Total players: {len(df)}")
print(f"Columns: {df.columns.tolist()}")
print(f"Missing values:\n{df.isnull().sum()}")
print(f"\nSample data:\n{df.head()}")

# Check feature distributions
print(f"\nFeature statistics:\n{df.describe()}")
```

---

## Roadmap

### Short Term (v1.1)
- [ ] Position-specific clustering (separate models per position)
- [ ] Style evolution tracking (how player style changes over time)
- [ ] Confidence thresholds for manual review flagging

### Medium Term (v1.5)
- [ ] Team style analysis (aggregate team composition insights)
- [ ] Transfer recommendations ("Find me a Playmaker < 5M EUR")
- [ ] Formation suggestions based on player styles

### Long Term (v2.0)
- [ ] Video analysis integration (auto-tag footage by style moments)
- [ ] Real-time match style tracking
- [ ] Opponent style analysis and counter-strategy suggestions

---

## License

Part of the Arcane Football platform. All rights reserved.

---

## Support

For issues or questions:
1. Check logs: `ai-service/playstyle-dna/*.log`
2. Review cluster analysis output
3. Validate input data quality
4. Ensure Python service is running

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0
**Model Version:** v1
