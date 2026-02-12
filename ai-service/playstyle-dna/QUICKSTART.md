# PlayStyle DNA - Quick Start Guide

## 60-Second Setup

```bash
# 1. Setup
cd /Users/lakhdari/Desktop/AppFoot/ai-service/playstyle-dna
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env: Add DATABASE_URL

# 3. Train
python cluster_trainer.py

# 4. Run
uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# 5. Test
curl http://localhost:8002/styles | jq
```

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /` | Health check |
| `POST /classify` | Classify player |
| `POST /compare` | Compare players |
| `GET /similar/:id` | Find similar |
| `GET /styles` | All styles |
| `GET /analytics/distribution` | Stats |

## Docs

- **Swagger:** http://localhost:8002/docs
- **Full README:** [README.md](README.md)
- **Implementation:** [../../PLAYSTYLE_DNA_IMPLEMENTATION.md](../../PLAYSTYLE_DNA_IMPLEMENTATION.md)

## 12 Play Styles

1. **Playmaker** - Creative midfielders
2. **Physical Enforcer** - Dominant strength
3. **Box-to-Box Engine** - Tireless runners
4. **Tactical Anchor** - Intelligent positioning
5. **Speed Demon** - Exceptional pace
6. **Clinical Finisher** - Composed strikers
7. **Creative Dribbler** - Flair players
8. **Defensive Wall** - Solid defenders
9. **Deep-Lying Orchestrator** - Deep playmakers
10. **Pressing Machine** - Relentless pressers
11. **Target Man** - Aerial forwards
12. **Balanced All-Rounder** - Versatile

## Example Classification

```bash
curl -X POST http://localhost:8002/classify \
  -H "Content-Type: application/json" \
  -d '{
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
    "vision": 8.8
  }'
```

**Response:**
```json
{
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
  "recommendations": [
    "Focus on vision and passing range training",
    "Study top playmakers' positioning",
    "Develop set-piece delivery skills"
  ]
}
```

## Requirements

- Python 3.10+
- PostgreSQL with scouting reports
- 36+ players with 2+ reports each

## Quality Targets

- Silhouette Score: > 0.5
- Davies-Bouldin: < 1.0
- Avg Confidence: > 0.7

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Insufficient data | Add more scouting reports (36+ players) |
| Model not found | Run `python cluster_trainer.py` |
| Low confidence | Accept as "Balanced All-Rounder" |
| Port in use | Change port or kill process |

## Next Steps

1. ✅ Python service running
2. ⏳ Database migration: `npx prisma migrate dev --name add_playstyle_dna`
3. ⏳ NestJS module implementation
4. ⏳ Frontend integration
5. ⏳ Seed style definitions

## Support

- **Full docs:** [README.md](README.md)
- **Implementation guide:** [../../PLAYSTYLE_DNA_IMPLEMENTATION.md](../../PLAYSTYLE_DNA_IMPLEMENTATION.md)
- **Delivery summary:** [../../PLAYSTYLE_DNA_DELIVERY.md](../../PLAYSTYLE_DNA_DELIVERY.md)
