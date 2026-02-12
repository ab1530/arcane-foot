# PlayStyle DNA - ML Player Classification System

## Implementation Complete Summary

### Overview
PlayStyle DNA is an ML-powered player classification system that uses K-Means clustering and PCA to identify 12 distinct play styles based on scouting report data.

---

## 1. PYTHON ML SERVICE (Complete)

### Location: `/Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna/`

### Files Created:

#### A. `requirements.txt`
Dependencies for ML service:
- fastapi, uvicorn (API server)
- scikit-learn (K-Means, PCA)
- pandas, numpy (data processing)
- psycopg2-binary (PostgreSQL)
- joblib (model serialization)

#### B. `cluster_trainer.py` (360 lines)
**K-Means clustering trainer with 12 play styles:**

**Play Style Taxonomy:**
1. **Playmaker** - Technical + Creative + Vision
2. **Physical Enforcer** - Strength + Aggression + Physical
3. **Box-to-Box Engine** - Work Rate + Stamina + Versatility
4. **Tactical Anchor** - Positioning + Awareness + Discipline
5. **Speed Demon** - Pace + Acceleration + Directness
6. **Clinical Finisher** - Composure + Finishing + Positioning
7. **Creative Dribbler** - Dribbling + Flair + Unpredictability
8. **Defensive Wall** - Tackling + Strength + Concentration
9. **Deep-Lying Orchestrator** - Passing Range + Vision + Calmness
10. **Pressing Machine** - Work Rate + Aggression + Stamina
11. **Target Man** - Aerial + Strength + Hold-Up Play
12. **Balanced All-Rounder** - No Dominant Traits

**Features:**
- Fetches player data from scouting_reports table
- Aggregates technical, tactical, physical, mental ratings
- Derives pace, strength, work rate, creativity from tags
- Applies StandardScaler normalization
- PCA dimensionality reduction (10 → 6 components)
- K-Means clustering (n_clusters=12)
- Silhouette score and Davies-Bouldin index for quality
- Intelligent style mapping based on cluster centroids
- Saves models to `models/` directory

**Usage:**
```bash
cd /Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna
python cluster_trainer.py
```

#### C. `classifier.py` (250 lines)
**Real-time player classification service:**

**Features:**
- Loads pre-trained models (KMeans, Scaler, PCA, StyleMapping)
- Classifies individual player profiles
- Calculates confidence scores (distance to centroid)
- Generates DNA profiles for radar charts (8 attributes)
- Identifies secondary styles
- Provides personalized recommendations
- Includes real-world player examples for each style
- Singleton pattern for efficient model loading

**Key Methods:**
- `classify(profile)` - Main classification
- `calculate_dna_profile()` - Radar chart data
- `generate_recommendations()` - Development advice
- `find_similar_players()` - Cluster-based matching

#### D. `main.py` (420 lines)
**FastAPI REST API:**

**Endpoints:**
- `GET /` - Health check
- `POST /classify` - Classify single player
- `POST /classify-batch` - Batch classification
- `POST /compare` - Compare multiple players
- `GET /styles` - Get all style definitions
- `GET /analytics/distribution` - Style analytics
- `POST /retrain` - Retrain model (background task)
- `GET /similar/{player_id}` - Find similar players

**Run Service:**
```bash
cd /Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

---

## 2. DATABASE SCHEMA EXTENSION

### Models to Add to Prisma Schema

Add these models after `prediction_accuracy_log`:

```prisma
// ==========================================
// PLAYSTYLE DNA - ML-BASED PLAYER CLASSIFICATION
// ==========================================

model player_playstyles {
  id               String   @id @default(uuid())
  playerId         String   @unique
  primaryStyle     String
  secondaryStyle   String?
  styleConfidence  Float
  cluster          Int
  dnaProfile       Json     // {Technical: 8.5, Tactical: 7.0, ...}
  similarPlayerIds String[] // Top 5 similar players
  modelVersion     String   @default("v1")
  lastUpdated      DateTime @default(now())
  createdAt        DateTime @default(now())

  players          players  @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId])
  @@index([primaryStyle])
  @@index([cluster])
  @@index([lastUpdated])
  @@map("player_playstyles")
}

model playstyle_definitions {
  id                  String   @id @default(uuid())
  styleName           String   @unique
  description         String
  characteristics     Json     // ["Technical Excellence", "Vision", ...]
  examplePlayers      String[] // ["Kevin De Bruyne", ...]
  strengthsProfile    Json?    // Typical strengths for this style
  idealPositions      String[] // ["CAM", "CM", ...]
  trainingFocus       String[] // ["Passing Range", "Vision", ...]
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @default(now())

  @@index([styleName])
  @@index([isActive])
  @@map("playstyle_definitions")
}
```

### Update players Model

Add this relation to the `players` model:
```prisma
player_playstyles   player_playstyles?
```

### Migration Command

```bash
cd /Users/lakhdari/Desktop/AppFoot/backend
npx prisma migrate dev --name add_playstyle_dna
npx prisma generate
```

---

## 3. NESTJS INTEGRATION MODULE

### Location: `/Users/lakhdari/Desktop/AppFoot/backend/src/modules/playstyle-dna/`

### Structure:
```
playstyle-dna/
├── playstyle-dna.module.ts
├── playstyle-dna.controller.ts
├── playstyle-dna.service.ts
├── dto/
│   ├── play-style.dto.ts
│   ├── dna-profile.dto.ts
│   ├── compare-styles.dto.ts
│   └── style-analytics.dto.ts
└── __tests__/
    └── playstyle-dna.service.spec.ts
```

### Key Service Methods:

```typescript
// playstyle-dna.service.ts
export class PlayStyleDnaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  // Get or compute player play style
  async getPlayerPlayStyle(playerId: string): Promise<PlayStyleDto>

  // Compare multiple players
  async comparePlayStyles(playerIds: string[]): Promise<CompareStylesDto>

  // Find similar players
  async findSimilarPlayers(playerId: string, limit: number): Promise<PlayerDto[]>

  // Analytics - style distribution
  async getStyleDistribution(filters?: any): Promise<StyleAnalyticsDto>

  // Refresh classification (after new reports)
  async updatePlayerDNA(playerId: string): Promise<PlayStyleDto>

  // Get all style definitions
  async getAllStyles(): Promise<StyleDefinitionDto[]>

  // Search players by style
  async searchByStyle(styleName: string, filters?: any): Promise<PlayerDto[]>
}
```

### Controller Endpoints:

```typescript
// playstyle-dna.controller.ts
@Controller('playstyle-dna')
@ApiTags('PlayStyle DNA')
export class PlayStyleDnaController {
  @Get('player/:playerId')
  @ApiOperation({ summary: 'Get player play style classification' })
  async getPlayerStyle(@Param('playerId') playerId: string)

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple players' play styles' })
  async comparePlayers(@Body() dto: ComparePlayersDto)

  @Get('similar/:playerId')
  @ApiOperation({ summary: 'Find players with similar DNA' })
  async findSimilar(
    @Param('playerId') playerId: string,
    @Query('limit') limit?: number,
  )

  @Get('analytics/distribution')
  @ApiOperation({ summary: 'Get style distribution analytics' })
  async getDistribution(@Query() filters?: any)

  @Post('refresh/:playerId')
  @ApiOperation({ summary: 'Refresh player classification' })
  async refreshClassification(@Param('playerId') playerId: string)

  @Get('styles')
  @ApiOperation({ summary: 'Get all play style definitions' })
  async getAllStyles()

  @Get('search/:styleName')
  @ApiOperation({ summary: 'Search players by style' })
  async searchByStyle(
    @Param('styleName') styleName: string,
    @Query() filters?: any,
  )
}
```

---

## 4. INTEGRATION WITH EXISTING MODULES

### A. Add to app.module.ts

```typescript
import { PlayStyleDnaModule } from './modules/playstyle-dna/playstyle-dna.module';

@Module({
  imports: [
    // ... existing modules
    PlayStyleDnaModule,
  ],
})
export class AppModule {}
```

### B. Scouting Reports Integration

After report approval, trigger classification update:

```typescript
// scouting-reports.service.ts
async submit(id: string) {
  const submitted = await this.prisma.scouting_reports.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });

  // Trigger PlayStyle DNA update
  if (submitted.status === 'APPROVED') {
    await this.playStyleDnaService.updatePlayerDNA(submitted.playerId);
  }

  return submitted;
}
```

---

## 5. SEED DATA

### Add to seed.ts:

```typescript
// Play Style Definitions
const playStyleDefinitions = [
  {
    id: randomUUID(),
    styleName: 'Playmaker',
    description: 'Creative midfielders who dictate tempo and create chances through vision and technical ability',
    characteristics: ['Technical Excellence', 'Creative Vision', 'Passing Range', 'Game Intelligence'],
    examplePlayers: ['Kevin De Bruyne', 'Luka Modrić', 'Bruno Fernandes', 'Toni Kroos'],
    idealPositions: ['CAM', 'CM', 'AM'],
    trainingFocus: ['Vision training', 'Passing accuracy', 'Set-piece delivery', 'Decision making under pressure'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: randomUUID(),
    styleName: 'Physical Enforcer',
    description: 'Dominant physical presence who uses strength and aggression to control their area',
    characteristics: ['Physical Dominance', 'Aggression', 'Aerial Ability', 'Tackling Strength'],
    examplePlayers: ['Casemiro', 'Fabinho', 'N\'Golo Kanté', 'Declan Rice'],
    idealPositions: ['CDM', 'CM', 'CB'],
    trainingFocus: ['Strength conditioning', 'Tactical discipline', 'Aerial duels', 'Ball-winning techniques'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... (continue for all 12 styles)
];

await prisma.playstyle_definitions.createMany({
  data: playStyleDefinitions,
  skipDuplicates: true,
});
```

---

## 6. FRONTEND INTEGRATION HELPERS

### Location: `/Users/lakhdari/Desktop/AppFoot/web/src/lib/playstyle-dna.ts`

```typescript
// Style color mapping for UI
export const getStyleColor = (style: string): string => {
  const colors: Record<string, string> = {
    'Playmaker': '#E4FF3B', // Arcane Yellow
    'Physical Enforcer': '#FF6B6B',
    'Box-to-Box Engine': '#4ECDC4',
    'Tactical Anchor': '#95E1D3',
    'Speed Demon': '#FF8C42',
    'Clinical Finisher': '#00A8E8',
    'Creative Dribbler': '#B721FF',
    'Defensive Wall': '#0A2463',
    'Deep-Lying Orchestrator': '#FFD662',
    'Pressing Machine': '#F72585',
    'Target Man': '#9D4EDD',
    'Balanced All-Rounder': '#A8DADC',
  };
  return colors[style] || '#FFFFFF';
};

// Radar chart configuration
export const generateRadarChartData = (dnaProfile: Record<string, number>) => {
  return {
    labels: [
      'Technical',
      'Tactical',
      'Physical',
      'Mental',
      'Pace',
      'Strength',
      'Creativity',
      'Work Rate',
    ],
    datasets: [
      {
        label: 'Player DNA',
        data: Object.values(dnaProfile),
        backgroundColor: 'rgba(228, 255, 59, 0.2)',
        borderColor: '#E4FF3B',
        borderWidth: 2,
        pointBackgroundColor: '#E4FF3B',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#E4FF3B',
      },
    ],
  };
};

// API client methods
export const playStyleDnaApi = {
  async getPlayerStyle(playerId: string) {
    const response = await fetch(`/api/playstyle-dna/player/${playerId}`);
    return response.json();
  },

  async comparePlayers(playerIds: string[]) {
    const response = await fetch('/api/playstyle-dna/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerIds }),
    });
    return response.json();
  },

  async findSimilar(playerId: string, limit = 5) {
    const response = await fetch(`/api/playstyle-dna/similar/${playerId}?limit=${limit}`);
    return response.json();
  },

  async getStyleDistribution() {
    const response = await fetch('/api/playstyle-dna/analytics/distribution');
    return response.json();
  },
};
```

---

## 7. TESTING STRATEGY

### A. Python Service Tests

```bash
# Test cluster quality
python -c "
from cluster_trainer import PlayStyleClusterer
import os

clusterer = PlayStyleClusterer(n_clusters=12)
style_mapping = clusterer.train_pipeline(os.getenv('DATABASE_URL'))

print('Silhouette Score (target: >0.5):', clusterer.silhouette)
print('Davies-Bouldin Index (target: <1.0):', clusterer.davies_bouldin)
"
```

### B. NestJS Service Tests

```typescript
// playstyle-dna.service.spec.ts
describe('PlayStyleDnaService', () => {
  it('should classify player correctly', async () => {
    const style = await service.getPlayerPlayStyle('player-id');
    expect(style.primaryStyle).toBeDefined();
    expect(style.styleConfidence).toBeGreaterThan(0);
  });

  it('should find similar players', async () => {
    const similar = await service.findSimilarPlayers('player-id', 5);
    expect(similar).toHaveLength(5);
  });

  it('should compare multiple players', async () => {
    const comparison = await service.comparePlayStyles(['id1', 'id2', 'id3']);
    expect(comparison.players).toHaveLength(3);
    expect(comparison.recommendations).toBeDefined();
  });
});
```

### C. Integration Tests

```bash
# Start Python service
cd ai-service/playstyle-dna
uvicorn main:app --port 8002 &

# Test endpoint
curl http://localhost:8002/classify -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test-id",
    "position": "CM",
    "technicalSkills": 8.5,
    "tacticalAwareness": 7.5,
    "physicalAttributes": 6.5,
    "mentalAttributes": 8.0,
    "pace": 7.0,
    "strength": 6.0,
    "workRate": 8.5,
    "creativity": 9.0
  }'
```

---

## 8. DEPLOYMENT

### Docker Configuration

Create `/Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

### Docker Compose Addition

Add to `docker-compose.yml`:

```yaml
services:
  playstyle-dna:
    build:
      context: ./ai-service/playstyle-dna
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - MODEL_VERSION=v1
    depends_on:
      - db
    volumes:
      - ./ai-service/playstyle-dna/models:/app/models
```

---

## 9. OPERATIONAL WORKFLOWS

### A. Initial Setup

```bash
# 1. Install Python dependencies
cd ai-service/playstyle-dna
pip install -r requirements.txt

# 2. Train initial model (requires data in database)
python cluster_trainer.py

# 3. Start service
uvicorn main:app --host 0.0.0.0 --port 8002

# 4. Run database migration
cd ../../backend
npx prisma migrate dev --name add_playstyle_dna
npx prisma generate

# 5. Seed style definitions
npm run seed
```

### B. Quarterly Model Retraining

```bash
# Every 3 months or when player meta changes
curl -X POST http://localhost:8002/retrain \
  -H "Content-Type: application/json" \
  -d '{"n_clusters": 12, "force": true}'
```

### C. Player DNA Update Triggers

- After new scouting report approved
- Player position change
- Manual refresh requested
- Quarterly batch update

---

## 10. PERFORMANCE METRICS

### Target Metrics:

- **Cluster Quality**
  - Silhouette Score: > 0.5 (Good separation)
  - Davies-Bouldin Index: < 1.0 (Compact clusters)

- **Classification Performance**
  - Avg Confidence: > 0.7
  - Response Time: < 200ms (cached)
  - Cold Start: < 1s (model loading)

- **Similar Players Accuracy**
  - Manual validation: > 70% agreement
  - User feedback score: > 4.0/5.0

---

## 11. MONITORING & ANALYTICS

### Dashboard Metrics:

1. **Style Distribution Over Time**
   - Track emergence of new playing styles
   - Position-specific trends

2. **Model Drift Detection**
   - Compare current vs. historical distributions
   - Alert if significant shift (> 20%)

3. **Usage Analytics**
   - Most queried styles
   - Popular comparisons
   - Search patterns

---

## 12. FUTURE ENHANCEMENTS

### Phase 2 Features:

1. **Team Style Analysis**
   - Aggregate team play style
   - Formation recommendations
   - Style compatibility matrix

2. **Transfer Market Integration**
   - "Find me a Playmaker under 5M"
   - Style-based player suggestions

3. **Development Tracking**
   - Style evolution over time
   - Progress indicators
   - Personalized training plans

4. **Video Analysis Integration**
   - Auto-tag match footage by style moments
   - Highlight reels by characteristic

---

## QUICK START GUIDE

```bash
# 1. Setup Python Service
cd /Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Train Model (ensure database has scouting reports)
python cluster_trainer.py

# 3. Start FastAPI Service
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# 4. In another terminal - Setup NestJS
cd /Users/lakhdari/Desktop/AppFoot/backend

# 5. Run migration
npx prisma migrate dev --name add_playstyle_dna
npx prisma generate

# 6. Create NestJS module (implement files from section 3)

# 7. Test classification
curl http://localhost:8002/styles | jq
curl http://localhost:3000/api/playstyle-dna/styles
```

---

## IMPLEMENTATION STATUS

### Completed:
- ✅ Python ML service (`cluster_trainer.py`, `classifier.py`, `main.py`)
- ✅ FastAPI endpoints (classify, compare, analytics, retrain)
- ✅ 12 play style taxonomy with descriptions
- ✅ Real-world player examples
- ✅ DNA profile generation (radar charts)
- ✅ Personalized recommendations
- ✅ Similarity matching
- ✅ Model quality metrics (silhouette, davies-bouldin)

### Pending:
- ⏳ Database migration (add `player_playstyles`, `playstyle_definitions`)
- ⏳ NestJS integration module
- ⏳ DTOs and controllers
- ⏳ Seed data for style definitions
- ⏳ Frontend helpers (radar charts, color mapping)
- ⏳ Integration tests
- ⏳ Documentation README

### Next Steps:
1. Run database migration
2. Implement NestJS module
3. Seed style definitions
4. Train initial model with real data
5. Test end-to-end flow
6. Deploy to staging
7. Gather user feedback

---

## DOCUMENTATION

Complete API documentation available at:
- Python Service: `http://localhost:8002/docs` (FastAPI auto-docs)
- NestJS API: `http://localhost:3000/api/docs` (Swagger)

---

## SUPPORT & TROUBLESHOOTING

### Common Issues:

**1. "Insufficient training data"**
- Ensure at least 36 players have 2+ scouting reports
- Add more scouting reports to database

**2. "Low silhouette score (<0.3)"**
- Data may not cluster well yet
- Try reducing n_clusters to 8-10
- Add more diverse scouting reports

**3. "Model not found"**
- Run `python cluster_trainer.py` first
- Check `models/` directory exists

**4. "Classification confidence low"**
- Player profile may be unique/outlier
- Add more similar players to training set
- Accept as "Balanced All-Rounder"

---

## CONTACT

For questions or issues with PlayStyle DNA:
- Check logs: `ai-service/playstyle-dna/*.log`
- Review cluster analysis output
- Validate input data quality
- Ensure Python service is running

**End of Implementation Guide**
