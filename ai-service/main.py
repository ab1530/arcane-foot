import os
import asyncio
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime, timezone
import httpx
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Arkane AI Service",
    version="1.0.0",
    description="Lightweight FastAPI layer powering Arkane summaries, scoring and matchmaking.",
)

# Add rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class SummaryRequest(BaseModel):
    prompt: str = Field(..., description="Raw scouting prompt or notes to summarise.")
    metadata: Dict[str, Any] | None = Field(
        default=None, description="Additional context (player, match, scout…)."
    )


class SummaryResponse(BaseModel):
    summary: str
    confidence: float
    tokens_used: int


class IndexRequest(BaseModel):
    player_id: str
    metrics: Dict[str, float] = Field(
        ..., description="Dict of player metrics (0-100 or raw values)."
    )


class IndexBreakdown(BaseModel):
    name: str
    score: float
    weight: float


class IndexResponse(BaseModel):
    player_id: str
    overall_score: float
    breakdown: List[IndexBreakdown]
    updated_at: str


class Profile(BaseModel):
    id: str
    score: float = Field(..., description="Base score or suitability (0-1).")
    tags: List[str] = Field(default_factory=list)


class MatchmakingRequest(BaseModel):
    players: List[Profile]
    clubs: List[Profile]
    top: int | None = 5


class MatchResult(BaseModel):
    player_id: str
    club_id: str
    score: float


class MatchmakingResponse(BaseModel):
    matches: List[MatchResult]


async def call_openai(prompt: str, max_retries: int = 3) -> SummaryResponse | None:
    """
    Call OpenAI API with retry logic and exponential backoff.

    Args:
        prompt: The prompt to send to OpenAI
        max_retries: Maximum number of retry attempts (default: 3)

    Returns:
        SummaryResponse if successful, None otherwise
    """
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "input": prompt,
        "max_output_tokens": 200,
    }

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post("https://api.openai.com/v1/responses", headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                text = data.get("output", [{}])[0].get("content", [{}])[0].get("text")
                if not text:
                    return None
                return SummaryResponse(
                    summary=text.strip(),
                    confidence=0.9,
                    tokens_used=data.get("usage", {}).get("total_tokens", 0)
                )
        except (httpx.HTTPStatusError, httpx.RequestError, httpx.TimeoutException) as e:
            # Calculate exponential backoff: 1s, 2s, 4s
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"OpenAI API error (attempt {attempt + 1}/{max_retries}): {type(e).__name__}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                print(f"OpenAI API failed after {max_retries} attempts: {type(e).__name__}")
                return None
        except Exception as e:
            print(f"Unexpected error calling OpenAI: {type(e).__name__}: {str(e)}")
            return None

    return None


@app.post("/summary", response_model=SummaryResponse)
@limiter.limit("10/minute")  # Rate limit: 10 requests per minute per IP
async def generate_summary(request: Request, payload: SummaryRequest):
    """
    Generate AI summary from prompt with rate limiting (10/min per IP).

    Args:
        payload: SummaryRequest containing the prompt

    Returns:
        SummaryResponse with summary, confidence, and token usage

    Raises:
        HTTPException: 400 if prompt is empty, 429 if rate limit exceeded
    """
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    ai_summary = await call_openai(payload.prompt)
    if ai_summary:
        return ai_summary

    # Fallback: simple text summarization
    sentences = [s.strip() for s in payload.prompt.split(".") if s.strip()]
    summary = " ".join(sentences[:2]) if len(sentences) > 1 else payload.prompt.strip()
    summary = summary[:500]

    confidence = min(0.95, 0.5 + (len(summary.split()) / 200))
    tokens_used = max(12, len(payload.prompt.split()))

    return SummaryResponse(summary=summary, confidence=round(confidence, 2), tokens_used=tokens_used)


@app.post("/index", response_model=IndexResponse)
@limiter.limit("30/minute")  # Rate limit: 30 requests per minute per IP (higher for scoring)
async def generate_index(request: Request, payload: IndexRequest):
    """
    Generate ArkaneIndex score from player metrics with rate limiting (30/min per IP).

    Args:
        payload: IndexRequest containing player_id and metrics

    Returns:
        IndexResponse with overall_score, breakdown, and timestamp

    Raises:
        HTTPException: 400 if metrics missing, 429 if rate limit exceeded
    """
    if not payload.metrics:
        raise HTTPException(status_code=400, detail="Metrics required")

    weights = {
        "technical": 0.25,
        "physical": 0.2,
        "mental": 0.2,
        "tactical": 0.2,
        "form": 0.1,
        "potential": 0.05,
    }

    breakdown: List[IndexBreakdown] = []
    weighted_sum = 0.0
    total_weight = 0.0

    for key, weight in weights.items():
        value = float(payload.metrics.get(key, 60))
        capped = max(0.0, min(100.0, value))
        breakdown.append(IndexBreakdown(name=key.capitalize(), score=round(capped, 2), weight=weight))
        weighted_sum += capped * weight
        total_weight += weight

    if total_weight == 0:
        overall = 0.0
    else:
        overall = weighted_sum / total_weight

    overall_score = round(overall, 2)

    return IndexResponse(
        player_id=payload.player_id,
        overall_score=overall_score,
        breakdown=breakdown,
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/matchmaking", response_model=MatchmakingResponse)
@limiter.limit("20/minute")  # Rate limit: 20 requests per minute per IP
async def matchmaking(request: Request, payload: MatchmakingRequest):
    """
    Calculate player-club matchmaking scores with rate limiting (20/min per IP).

    Args:
        payload: MatchmakingRequest with players, clubs, and top_n

    Returns:
        MatchmakingResponse with top matches sorted by score

    Raises:
        HTTPException: 400 if players/clubs missing, 429 if rate limit exceeded
    """
    if not payload.players or not payload.clubs:
        raise HTTPException(status_code=400, detail="Players and clubs must be provided")

    matches: List[MatchResult] = []

    for player in payload.players:
        for club in payload.clubs:
            tag_overlap = len(set(player.tags) & set(club.tags))
            base_score = (player.score + club.score) / 2
            score = base_score * (1 + 0.05 * tag_overlap)
            score = min(1.0, max(0.0, score))
            matches.append(MatchResult(player_id=player.id, club_id=club.id, score=round(score, 3)))

    matches.sort(key=lambda m: m.score, reverse=True)
    top_n = payload.top or 5

    return MatchmakingResponse(matches=matches[:top_n])


# ==========================================
# PERFORMANCE PREDICTOR ENDPOINTS
# ==========================================

class PerformancePredictionRequest(BaseModel):
    playerId: str
    matchContext: Dict[str, Any] = Field(..., description="Match context: venue, importance, opponent_strength, etc.")
    recentForm: List[float] = Field(default_factory=list, description="Last 5-10 match ratings")
    seasonStats: Dict[str, Any] = Field(default_factory=dict, description="Season statistics")
    playerAttributes: Dict[str, Any] = Field(..., description="Player attributes: age, height, position, etc.")


class KeyFactor(BaseModel):
    factor: str
    value: float
    importance: float
    impact: str
    description: str


class PerformancePredictionResponse(BaseModel):
    playerId: str
    predictedRating: float
    confidenceInterval: List[float]  # [low, high]
    confidence: float
    ratingDistribution: Dict[str, float]
    keyFactors: List[KeyFactor]
    recommendations: List[str]


class BatchPredictionRequest(BaseModel):
    predictions: List[PerformancePredictionRequest]


class BatchPredictionResponse(BaseModel):
    predictions: List[PerformancePredictionResponse]


class TrainingResult(BaseModel):
    success: bool
    message: str
    metrics: Dict[str, Any] | None = None


class FeatureImportanceResponse(BaseModel):
    features: List[Dict[str, Any]]
    modelVersion: str


# Lazy-load predictor
_predictor = None


def get_predictor():
    """Get or create predictor instance"""
    global _predictor
    if _predictor is None:
        try:
            from performance_predictor.predictor import PerformancePredictor
            _predictor = PerformancePredictor()
            print("✅ Performance predictor loaded successfully")
        except FileNotFoundError as e:
            print(f"⚠️ Model not found: {e}")
            print("Run 'python -m performance_predictor.model_trainer' to train model first")
            raise HTTPException(
                status_code=503,
                detail="Model not trained yet. Please train model first."
            )
        except Exception as e:
            print(f"❌ Error loading predictor: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load predictor: {str(e)}")
    return _predictor


@app.post("/performance/predict", response_model=PerformancePredictionResponse)
@limiter.limit("30/minute")
async def predict_performance(request: Request, payload: PerformancePredictionRequest):
    """
    Predict player performance for upcoming match using ML model.

    Args:
        payload: Player and match context data

    Returns:
        Prediction with rating, confidence interval, and recommendations

    Raises:
        HTTPException: 503 if model not trained, 500 on prediction error
    """
    try:
        predictor = get_predictor()

        # Import request class
        from performance_predictor.predictor import PredictionRequest

        # Convert API request to predictor request
        pred_request = PredictionRequest(
            player_id=payload.playerId,
            match_context=payload.matchContext,
            recent_form=payload.recentForm,
            season_stats=payload.seasonStats,
            player_attributes=payload.playerAttributes,
        )

        # Make prediction
        prediction = predictor.predict(pred_request)

        # Convert to API response
        return PerformancePredictionResponse(
            playerId=prediction.player_id,
            predictedRating=prediction.predicted_rating,
            confidenceInterval=list(prediction.confidence_interval),
            confidence=prediction.confidence,
            ratingDistribution=prediction.rating_distribution,
            keyFactors=[
                KeyFactor(
                    factor=f['factor'],
                    value=f['value'],
                    importance=f['importance'],
                    impact=f['impact'],
                    description=f['description']
                )
                for f in prediction.key_factors
            ],
            recommendations=prediction.recommendations,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/performance/batch-predict", response_model=BatchPredictionResponse)
@limiter.limit("10/minute")
async def batch_predict_performance(request: Request, payload: BatchPredictionRequest):
    """
    Predict performance for multiple players in batch.

    Args:
        payload: List of prediction requests

    Returns:
        List of predictions

    Raises:
        HTTPException: 503 if model not trained, 500 on error
    """
    try:
        predictor = get_predictor()

        from performance_predictor.predictor import PredictionRequest

        predictions = []

        for req in payload.predictions:
            pred_request = PredictionRequest(
                player_id=req.playerId,
                match_context=req.matchContext,
                recent_form=req.recentForm,
                season_stats=req.seasonStats,
                player_attributes=req.playerAttributes,
            )

            prediction = predictor.predict(pred_request)

            predictions.append(PerformancePredictionResponse(
                playerId=prediction.player_id,
                predictedRating=prediction.predicted_rating,
                confidenceInterval=list(prediction.confidence_interval),
                confidence=prediction.confidence,
                ratingDistribution=prediction.rating_distribution,
                keyFactors=[
                    KeyFactor(
                        factor=f['factor'],
                        value=f['value'],
                        importance=f['importance'],
                        impact=f['impact'],
                        description=f['description']
                    )
                    for f in prediction.key_factors
                ],
                recommendations=prediction.recommendations,
            ))

        return BatchPredictionResponse(predictions=predictions)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.post("/performance/train", response_model=TrainingResult)
async def train_model(request: Request):
    """
    Retrain performance prediction model with latest data.

    Returns:
        Training results with metrics

    Raises:
        HTTPException: 500 on training error
    """
    try:
        from performance_predictor.model_trainer import PerformanceModelTrainer

        trainer = PerformanceModelTrainer()
        results = trainer.train()

        # Reload predictor with new model
        global _predictor
        _predictor = None  # Force reload on next request

        return TrainingResult(
            success=True,
            message="Model trained successfully",
            metrics=results
        )

    except Exception as e:
        print(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.get("/performance/feature-importance", response_model=FeatureImportanceResponse)
@limiter.limit("60/minute")
async def get_feature_importance(request: Request):
    """
    Get feature importance from trained model.

    Returns:
        List of features with importance scores

    Raises:
        HTTPException: 503 if model not trained
    """
    try:
        predictor = get_predictor()

        features = predictor.feature_importance.to_dict('records')

        return FeatureImportanceResponse(
            features=features,
            modelVersion="v1"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting feature importance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "arkane-ai"}
