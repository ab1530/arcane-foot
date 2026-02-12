"""
PlayStyle DNA FastAPI Service
REST API for player play style classification and analysis
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

from classifier import get_classifier, PlayStyleClassifier
from cluster_trainer import PlayStyleClusterer


# Pydantic models
class PlayerProfile(BaseModel):
    """Player profile for classification"""
    playerId: str
    position: str
    technicalSkills: float = Field(ge=0, le=10, description="Technical rating 0-10")
    tacticalAwareness: float = Field(ge=0, le=10, description="Tactical rating 0-10")
    physicalAttributes: float = Field(ge=0, le=10, description="Physical rating 0-10")
    mentalAttributes: float = Field(ge=0, le=10, description="Mental rating 0-10")
    pace: Optional[float] = Field(default=5.0, ge=0, le=10, description="Pace rating 0-10")
    strength: Optional[float] = Field(default=5.0, ge=0, le=10, description="Strength rating 0-10")
    workRate: Optional[float] = Field(default=5.0, ge=0, le=10, description="Work rate 0-10")
    creativity: Optional[float] = Field(default=5.0, ge=0, le=10, description="Creativity 0-10")
    aggression: Optional[float] = Field(default=5.0, ge=0, le=10, description="Aggression 0-10")
    vision: Optional[float] = Field(default=5.0, ge=0, le=10, description="Vision 0-10")


class PlayStyleResponse(BaseModel):
    """Play style classification response"""
    playerId: str
    primaryStyle: str
    secondaryStyle: Optional[str]
    styleConfidence: float
    cluster: int
    dnaProfile: Dict[str, float]
    styleDescription: str
    keyCharacteristics: List[str]
    realWorldExamples: List[str]
    recommendations: List[str]


class ComparePlayersRequest(BaseModel):
    """Request to compare multiple players"""
    playerProfiles: List[PlayerProfile]


class ComparePlayersResponse(BaseModel):
    """Comparison of multiple players"""
    players: List[PlayStyleResponse]
    commonStyles: List[str]
    uniqueStyles: List[str]
    recommendations: List[str]


class RetrainRequest(BaseModel):
    """Request to retrain clustering model"""
    n_clusters: Optional[int] = Field(default=12, ge=8, le=20)
    force: Optional[bool] = Field(default=False)


class StyleDistributionResponse(BaseModel):
    """Style distribution analytics"""
    totalPlayers: int
    styleDistribution: Dict[str, int]
    stylePercentages: Dict[str, float]
    topStyles: List[Dict[str, any]]
    byPosition: Dict[str, Dict[str, int]]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    modelVersion: str
    timestamp: str


# Initialize FastAPI app
app = FastAPI(
    title="PlayStyle DNA Service",
    description="ML-powered player play style classification and analysis",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global classifier instance
classifier: Optional[PlayStyleClassifier] = None


@app.on_event("startup")
async def startup_event():
    """Initialize classifier on startup"""
    global classifier
    try:
        model_version = os.getenv('MODEL_VERSION', 'v1')
        classifier = get_classifier(model_dir="models", version=model_version)
        print(f"PlayStyle DNA Service started successfully (model version: {model_version})")
    except Exception as e:
        print(f"Warning: Could not load classifier: {e}")
        print("Run training first: python cluster_trainer.py")


@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if classifier else "not_ready",
        service="playstyle-dna",
        version="1.0.0",
        modelVersion=os.getenv('MODEL_VERSION', 'v1'),
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/classify", response_model=PlayStyleResponse)
async def classify_player(profile: PlayerProfile):
    """
    Classify a player's play style

    Analyzes player statistics and returns:
    - Primary and secondary play styles
    - Confidence score
    - DNA profile for radar visualization
    - Personalized recommendations
    """
    if not classifier:
        raise HTTPException(
            status_code=503,
            detail="Classifier not initialized. Please train the model first."
        )

    try:
        # Convert to dict for classifier
        profile_dict = profile.dict()

        # Classify
        result = classifier.classify(profile_dict)

        return PlayStyleResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")


@app.post("/classify-batch", response_model=List[PlayStyleResponse])
async def classify_players_batch(profiles: List[PlayerProfile]):
    """
    Classify multiple players in batch

    More efficient than individual calls for multiple players
    """
    if not classifier:
        raise HTTPException(
            status_code=503,
            detail="Classifier not initialized. Please train the model first."
        )

    try:
        results = []
        for profile in profiles:
            profile_dict = profile.dict()
            result = classifier.classify(profile_dict)
            results.append(PlayStyleResponse(**result))

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch classification failed: {str(e)}")


@app.post("/compare", response_model=ComparePlayersResponse)
async def compare_players(request: ComparePlayersRequest):
    """
    Compare multiple players' play styles

    Returns analysis of similarities, differences, and team composition insights
    """
    if not classifier:
        raise HTTPException(
            status_code=503,
            detail="Classifier not initialized. Please train the model first."
        )

    try:
        # Classify all players
        players = []
        styles = set()

        for profile in request.playerProfiles:
            profile_dict = profile.dict()
            result = classifier.classify(profile_dict)
            players.append(PlayStyleResponse(**result))
            styles.add(result['primaryStyle'])

        # Analyze commonalities
        primary_styles = [p.primaryStyle for p in players]
        common_styles = [s for s in set(primary_styles) if primary_styles.count(s) > 1]
        unique_styles = [s for s in set(primary_styles) if primary_styles.count(s) == 1]

        # Generate comparison recommendations
        recommendations = []

        if len(common_styles) > 0:
            recommendations.append(
                f"Similar play styles detected: {', '.join(common_styles)}. "
                "Consider diversifying team composition."
            )

        if "Playmaker" not in primary_styles:
            recommendations.append("No dedicated playmaker. Consider recruiting creative midfielder.")

        if "Defensive Wall" not in primary_styles and "Tactical Anchor" not in primary_styles:
            recommendations.append("Defensive cover may be weak. Consider defensive-minded player.")

        # Check for balance
        attacking_styles = ["Clinical Finisher", "Creative Dribbler", "Speed Demon", "Target Man"]
        attacking_count = sum(1 for s in primary_styles if s in attacking_styles)

        if attacking_count == 0:
            recommendations.append("Lack of attacking threat. Consider recruiting forwards.")
        elif attacking_count > len(players) * 0.6:
            recommendations.append("Heavy attacking focus. Ensure defensive balance.")

        return ComparePlayersResponse(
            players=players,
            commonStyles=common_styles,
            uniqueStyles=unique_styles,
            recommendations=recommendations,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@app.get("/styles", response_model=Dict)
async def get_all_styles():
    """
    Get all available play styles with descriptions

    Returns complete taxonomy of play styles with:
    - Style names
    - Detailed descriptions
    - Key characteristics
    - Real-world player examples
    """
    if not classifier:
        raise HTTPException(
            status_code=503,
            detail="Classifier not initialized. Please train the model first."
        )

    try:
        return classifier.get_all_styles()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch styles: {str(e)}")


@app.get("/analytics/distribution", response_model=StyleDistributionResponse)
async def get_style_distribution():
    """
    Get play style distribution analytics across all classified players

    Returns:
    - Total player count
    - Distribution by style
    - Distribution by position
    - Top styles
    """
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get style distribution
        cursor.execute("""
            SELECT
                primary_style,
                COUNT(*) as count
            FROM player_playstyles
            GROUP BY primary_style
            ORDER BY count DESC
        """)
        style_counts = cursor.fetchall()

        total_players = sum(row['count'] for row in style_counts)

        style_distribution = {row['primary_style']: row['count'] for row in style_counts}
        style_percentages = {
            style: round((count / total_players) * 100, 1)
            for style, count in style_distribution.items()
        }

        top_styles = [
            {"style": row['primary_style'], "count": row['count'], "percentage": style_percentages[row['primary_style']]}
            for row in style_counts[:5]
        ]

        # Get distribution by position
        cursor.execute("""
            SELECT
                p.position,
                pp.primary_style,
                COUNT(*) as count
            FROM player_playstyles pp
            JOIN players p ON pp.player_id = p.id
            GROUP BY p.position, pp.primary_style
            ORDER BY p.position, count DESC
        """)
        position_styles = cursor.fetchall()

        by_position = {}
        for row in position_styles:
            pos = row['position']
            style = row['primary_style']
            count = row['count']

            if pos not in by_position:
                by_position[pos] = {}
            by_position[pos][style] = count

        conn.close()

        return StyleDistributionResponse(
            totalPlayers=total_players,
            styleDistribution=style_distribution,
            stylePercentages=style_percentages,
            topStyles=top_styles,
            byPosition=by_position,
        )

    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/retrain")
async def retrain_model(request: RetrainRequest, background_tasks: BackgroundTasks):
    """
    Retrain clustering model with latest data

    WARNING: This is a long-running operation. Consider running in background.

    Parameters:
    - n_clusters: Number of play style clusters (8-20, default 12)
    - force: Force retraining even if recent model exists
    """
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        # Run training in background
        def train_task():
            try:
                clusterer = PlayStyleClusterer(n_clusters=request.n_clusters)
                style_mapping = clusterer.train_pipeline(
                    database_url=database_url,
                    output_dir="models"
                )

                # Reload classifier with new model
                global classifier
                model_version = os.getenv('MODEL_VERSION', 'v1')
                classifier = get_classifier(model_dir="models", version=model_version)

                print(f"Retraining completed. New style mapping: {style_mapping}")

            except Exception as e:
                print(f"Retraining failed: {str(e)}")

        background_tasks.add_task(train_task)

        return {
            "status": "training_started",
            "message": "Model retraining started in background. Check logs for progress.",
            "n_clusters": request.n_clusters,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start retraining: {str(e)}")


@app.get("/similar/{player_id}")
async def find_similar_players(player_id: str, limit: int = 5):
    """
    Find players with similar play styles

    Args:
        player_id: Target player ID
        limit: Number of similar players to return (default 5)

    Returns:
        List of similar players with their play styles
    """
    if not classifier:
        raise HTTPException(
            status_code=503,
            detail="Classifier not initialized."
        )

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get target player's cluster
        cursor.execute("""
            SELECT cluster, primary_style
            FROM player_playstyles
            WHERE player_id = %s
        """, (player_id,))

        target = cursor.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="Player not found")

        # Find similar players in same cluster
        cursor.execute("""
            SELECT
                pp.player_id,
                pp.primary_style,
                pp.secondary_style,
                pp.style_confidence,
                pp.dna_profile,
                u.first_name || ' ' || u.last_name as player_name,
                p.position
            FROM player_playstyles pp
            JOIN players p ON pp.player_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE pp.cluster = %s
                AND pp.player_id != %s
            ORDER BY pp.style_confidence DESC
            LIMIT %s
        """, (target['cluster'], player_id, limit))

        similar_players = cursor.fetchall()
        conn.close()

        return {
            "playerId": player_id,
            "targetStyle": target['primary_style'],
            "cluster": target['cluster'],
            "similarPlayers": [dict(row) for row in similar_players],
        }

    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv('SERVICE_PORT', 8002))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
