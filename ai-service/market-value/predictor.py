import joblib
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from typing import Dict, List, Optional
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketValuePredictor:
    """Predictor for player market value using trained ML model"""

    def __init__(self, model_version: str = "v1"):
        """
        Initialize the predictor

        Args:
            model_version: Version of the model to load
        """
        self.model_version = model_version
        self.model = None
        self.scaler = None
        self.feature_names = []
        self.position_hierarchy = {}
        self.top_leagues = {}
        self.top_nations = set()
        self.metrics = {}

        # Load the model
        self.load_model()

    def load_model(self):
        """Load the trained model and metadata"""
        model_path = f"models/market_value_{self.model_version}.pkl"

        if not os.path.exists(model_path):
            logger.warning(f"Model not found at {model_path}")
            return

        try:
            model_data = joblib.load(model_path)

            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.position_hierarchy = model_data.get('position_hierarchy', {})
            self.top_leagues = model_data.get('top_leagues', {})
            self.top_nations = set(model_data.get('top_nations', []))
            self.metrics = model_data.get('metrics', {})

            logger.info(f"Model {self.model_version} loaded successfully")
            logger.info(f"Model R² score: {self.metrics.get('test', {}).get('r2', 'N/A')}")

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def engineer_features(self, player_data: Dict) -> Dict:
        """
        Engineer features from raw player data

        Args:
            player_data: Dictionary with player attributes

        Returns:
            Dictionary with engineered features
        """
        features = {}

        # Age normalization (peak at 25-28)
        age = player_data.get('age', 25)
        features['age_normalized'] = 1 - abs(age - 26.5) / 20

        # Position encoding
        position = player_data.get('position', 'MID').upper()
        features['position_encoded'] = self.position_hierarchy.get(position, 1)

        # League tier
        league = player_data.get('league', 'Unknown')
        features['league_tier'] = self.top_leagues.get(league, 2)

        # Performance metrics per 90 minutes
        appearances = max(player_data.get('appearances', 1), 1)
        goals = player_data.get('goals', 0)
        assists = player_data.get('assists', 0)

        features['goals_per_90'] = goals / appearances
        features['assists_per_90'] = assists / appearances

        # Rating normalized
        rating = player_data.get('rating', 6.5)
        features['rating_normalized'] = rating / 10

        # Physical score
        height = player_data.get('height', 180)
        weight = player_data.get('weight', 75)
        physical_score = ((height / 190) + (weight / 75)) / 2
        features['physical_score'] = min(physical_score, 1.5)

        # Nationality market factor
        nationality = player_data.get('nationality', 'Unknown')
        features['top_nation'] = 1 if nationality in self.top_nations else 0

        # Contract value multiplier
        contract_years = player_data.get('contract_years_remaining', 2.0)
        features['contract_multiplier'] = max(0.5, min(contract_years, 5.0))

        # Average scout rating
        scout_ratings = player_data.get('scout_ratings', [])
        if scout_ratings and len(scout_ratings) > 0:
            features['avg_scout_rating'] = np.mean(scout_ratings)
        else:
            features['avg_scout_rating'] = rating

        # Experience factor
        features['experience'] = np.log1p(appearances)

        return features

    def calculate_confidence(self, player_data: Dict, prediction: float) -> Dict:
        """
        Calculate confidence score and interval for the prediction

        Args:
            player_data: Original player data
            prediction: Model prediction

        Returns:
            Dictionary with confidence_score, confidence_low, confidence_high
        """
        # Base confidence from model performance
        base_confidence = self.metrics.get('test', {}).get('r2', 0.75)

        # Data completeness factor
        data_fields = [
            'age', 'position', 'league', 'goals', 'assists',
            'appearances', 'rating', 'height', 'weight',
            'nationality', 'contract_years_remaining'
        ]

        completeness = sum(
            1 for field in data_fields if player_data.get(field) is not None
        ) / len(data_fields)

        # Appearances factor (more games = more reliable data)
        appearances = player_data.get('appearances', 0)
        appearances_factor = min(appearances / 30, 1.0)  # Cap at 30 games

        # Scout ratings factor (more ratings = more reliable)
        scout_ratings = player_data.get('scout_ratings', [])
        scout_factor = min(len(scout_ratings) / 5, 1.0) if scout_ratings else 0.5

        # Combined confidence score
        confidence_score = (
            base_confidence * 0.4 +
            completeness * 0.3 +
            appearances_factor * 0.2 +
            scout_factor * 0.1
        )

        # Confidence interval (wider interval = lower confidence)
        mae = self.metrics.get('test', {}).get('mae', 3.0)
        interval_multiplier = 2.0 - confidence_score  # Lower confidence = wider interval

        confidence_low = max(0.1, prediction - mae * interval_multiplier)
        confidence_high = prediction + mae * interval_multiplier

        return {
            'confidence_score': round(confidence_score, 3),
            'confidence_low': round(confidence_low, 2),
            'confidence_high': round(confidence_high, 2)
        }

    def calculate_factor_contributions(self, features: Dict, prediction: float) -> Dict:
        """
        Calculate how much each factor contributes to the valuation

        Args:
            features: Engineered features
            prediction: Model prediction

        Returns:
            Dictionary with factor contributions
        """
        # Get feature importance from model
        if hasattr(self.model, 'feature_importances_'):
            importance = dict(zip(
                self.feature_names,
                self.model.feature_importances_
            ))
        else:
            # Fallback to equal importance
            importance = {name: 1.0 / len(self.feature_names) for name in self.feature_names}

        # Calculate contributions (importance * normalized feature value)
        factors = {}
        total_importance = sum(importance.values())

        for feature_name in self.feature_names:
            feature_value = features.get(feature_name, 0)
            feature_importance = importance.get(feature_name, 0)

            # Normalize contribution
            contribution = (feature_importance / total_importance) * feature_value
            factors[feature_name] = round(contribution * prediction, 2)

        return factors

    def find_comparable_players(
        self,
        features: Dict,
        n_players: int = 5
    ) -> List[Dict]:
        """
        Find similar players based on feature similarity

        Args:
            features: Player features
            n_players: Number of comparable players to return

        Returns:
            List of comparable players
        """
        # This is a simplified version
        # In production, you'd query a database of known players
        # For now, return mock comparable players

        position_map = {v: k for k, v in self.position_hierarchy.items()}
        position = position_map.get(features.get('position_encoded', 1), 'MID')

        # Generate mock comparable players
        comparable = []
        for i in range(min(n_players, 3)):
            comparable.append({
                'name': f'Similar Player {i+1}',
                'age': int(features.get('age_normalized', 0.5) * 20 + 26),
                'position': position,
                'market_value': round(np.random.normal(
                    features.get('rating_normalized', 0.7) * 30,
                    5
                ), 2),
                'similarity_score': round(0.85 - i * 0.1, 2)
            })

        return comparable

    def predict(self, player_data: Dict) -> Dict:
        """
        Predict market value for a player

        Args:
            player_data: Dictionary with player attributes

        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise ValueError("Model not loaded. Please train the model first.")

        # Engineer features
        features = self.engineer_features(player_data)

        # Prepare feature vector
        feature_vector = np.array([
            features[name] for name in self.feature_names
        ]).reshape(1, -1)

        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)

        # Make prediction
        prediction = self.model.predict(feature_vector_scaled)[0]
        prediction = max(0.1, prediction)  # Ensure positive value

        # Calculate confidence
        confidence = self.calculate_confidence(player_data, prediction)

        # Calculate factor contributions
        factor_contributions = self.calculate_factor_contributions(
            features,
            prediction
        )

        # Find comparable players
        comparable_players = self.find_comparable_players(features)

        # Prepare response
        result = {
            'estimated_value': round(prediction, 2),
            'confidence_interval': {
                'low': confidence['confidence_low'],
                'high': confidence['confidence_high']
            },
            'confidence_score': confidence['confidence_score'],
            'factors': factor_contributions,
            'comparable_players': comparable_players,
            'model_version': self.model_version
        }

        return result

    def get_model_info(self) -> Dict:
        """
        Get information about the current model

        Returns:
            Dictionary with model metadata
        """
        if self.model is None:
            return {'error': 'Model not loaded'}

        return {
            'model_version': self.model_version,
            'model_type': type(self.model).__name__,
            'feature_names': self.feature_names,
            'metrics': self.metrics,
            'n_features': len(self.feature_names),
            'position_hierarchy': self.position_hierarchy,
            'top_leagues': self.top_leagues,
            'top_nations': list(self.top_nations)
        }

if __name__ == "__main__":
    # Test the predictor
    predictor = MarketValuePredictor()

    test_player = {
        'age': 23,
        'position': 'FWD',
        'league': 'LaLiga',
        'goals': 15,
        'assists': 8,
        'appearances': 32,
        'rating': 7.8,
        'height': 183,
        'weight': 78,
        'nationality': 'Spain',
        'contract_years_remaining': 2.5,
        'scout_ratings': [7.5, 8.0, 7.8]
    }

    result = predictor.predict(test_player)
    print("\nPrediction Result:")
    print(f"Estimated Value: €{result['estimated_value']}M")
    print(f"Confidence: {result['confidence_score']:.2%}")
    print(f"Range: €{result['confidence_interval']['low']}M - €{result['confidence_interval']['high']}M")
