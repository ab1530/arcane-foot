from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging
import os

# Import our modules
from predictor import MarketValuePredictor
from model_trainer import ModelTrainer

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MarketValue AI Service",
    description="Machine Learning service for dynamic player valuation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = None

class PlayerFeatures(BaseModel):
    age: int = Field(..., ge=16, le=45, description="Player age in years")
    position: str = Field(..., description="Player position (GK, DEF, MID, FWD)")
    league: str = Field(..., description="League name")
    goals: Optional[int] = Field(0, ge=0, description="Total goals scored")
    assists: Optional[int] = Field(0, ge=0, description="Total assists")
    appearances: int = Field(..., ge=0, description="Total appearances")
    rating: float = Field(..., ge=0, le=10, description="Average rating")
    height: Optional[float] = Field(None, ge=150, le=220, description="Height in cm")
    weight: Optional[float] = Field(None, ge=50, le=120, description="Weight in kg")
    nationality: str = Field(..., description="Player nationality")
    contract_years_remaining: Optional[float] = Field(None, ge=0, description="Contract years left")
    scout_ratings: Optional[List[float]] = Field(None, description="Scout ratings history")

    class Config:
        json_schema_extra = {
            "example": {
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
        }

class ValuationResponse(BaseModel):
    estimated_value: float = Field(..., description="Estimated market value in millions EUR")
    confidence_interval: Dict[str, float] = Field(..., description="Low and high confidence bounds")
    confidence_score: float = Field(..., description="Confidence score 0-1")
    factors: Dict[str, float] = Field(..., description="Contributing factors breakdown")
    comparable_players: List[Dict] = Field(..., description="Similar players for comparison")
    model_version: str = Field(..., description="Model version used")

class TrainingResponse(BaseModel):
    status: str
    message: str
    metrics: Optional[Dict] = None
    model_version: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Initialize predictor on startup"""
    global predictor
    try:
        predictor = MarketValuePredictor()
        logger.info("MarketValue predictor initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize predictor: {str(e)}")
        # predictor will remain None, endpoints will handle this

@app.post("/predict", response_model=ValuationResponse)
async def predict_value(features: PlayerFeatures):
    """
    Predict market value for a player based on their features

    Returns:
        ValuationResponse with estimated value, confidence, and breakdown
    """
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Prediction service not available. Model may not be trained yet."
        )

    try:
        # Convert features to dict
        feature_dict = features.model_dump()

        # Get prediction
        result = predictor.predict(feature_dict)

        logger.info(f"Prediction made for player: {features.position}, age {features.age}")

        return ValuationResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/train", response_model=TrainingResponse)
async def train_model(
    force_retrain: bool = False,
    data_path: Optional[str] = None
):
    """
    Train or retrain the market value prediction model

    Args:
        force_retrain: Force retraining even if model exists
        data_path: Optional path to training data CSV

    Returns:
        TrainingResponse with status and metrics
    """
    try:
        trainer = ModelTrainer(data_path=data_path)

        # Check if model already exists
        if not force_retrain and os.path.exists("models/market_value_v1.pkl"):
            return TrainingResponse(
                status="skipped",
                message="Model already exists. Use force_retrain=true to retrain."
            )

        # Train the model
        logger.info("Starting model training...")
        metrics = trainer.train()

        # Reload predictor with new model
        global predictor
        predictor = MarketValuePredictor()

        logger.info("Model trained successfully")

        return TrainingResponse(
            status="success",
            message="Model trained successfully",
            metrics=metrics,
            model_version="v1"
        )

    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/health")
async def health():
    """
    Health check endpoint

    Returns service status and model availability
    """
    model_available = predictor is not None and predictor.model is not None

    return {
        "status": "healthy",
        "model_loaded": model_available,
        "model_version": predictor.model_version if model_available else None,
        "service": "market-value-ai"
    }

@app.get("/model-info")
async def model_info():
    """
    Get information about the current model

    Returns model metadata, feature importance, and performance metrics
    """
    if predictor is None or predictor.model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded"
        )

    try:
        info = predictor.get_model_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "MarketValue AI",
        "version": "1.0.0",
        "endpoints": {
            "/predict": "POST - Predict player market value",
            "/train": "POST - Train/retrain the model",
            "/health": "GET - Health check",
            "/model-info": "GET - Model information",
            "/docs": "GET - API documentation"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
