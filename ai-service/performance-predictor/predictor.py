"""
Performance Predictor

Uses trained ML model to predict player performance in upcoming matches.
"""

import os
from typing import Dict, List, Tuple, Any
import numpy as np
import pandas as pd
import joblib
from scipy.stats import norm
from datetime import datetime


class PredictionRequest:
    """Data class for prediction request"""

    def __init__(
        self,
        player_id: str,
        match_context: Dict[str, Any],
        recent_form: List[float],
        season_stats: Dict[str, Any],
        player_attributes: Dict[str, Any],
    ):
        self.player_id = player_id
        self.match_context = match_context
        self.recent_form = recent_form
        self.season_stats = season_stats
        self.player_attributes = player_attributes


class PerformancePrediction:
    """Data class for prediction result"""

    def __init__(
        self,
        player_id: str,
        predicted_rating: float,
        confidence_interval: Tuple[float, float],
        confidence: float,
        rating_distribution: Dict[str, float],
        key_factors: List[Dict],
        recommendations: List[str],
    ):
        self.player_id = player_id
        self.predicted_rating = predicted_rating
        self.confidence_interval = confidence_interval
        self.confidence = confidence
        self.rating_distribution = rating_distribution
        self.key_factors = key_factors
        self.recommendations = recommendations

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'playerId': self.player_id,
            'predictedRating': self.predicted_rating,
            'confidenceInterval': self.confidence_interval,
            'confidence': self.confidence,
            'ratingDistribution': self.rating_distribution,
            'keyFactors': self.key_factors,
            'recommendations': self.recommendations,
        }


class PerformancePredictor:
    """Predict player performance using trained ML model"""

    def __init__(self, model_dir: str = None):
        """
        Initialize predictor with trained model

        Args:
            model_dir: Directory containing model artifacts
        """
        if model_dir is None:
            model_dir = os.path.join(os.path.dirname(__file__), 'models')

        model_path = os.path.join(model_dir, 'performance_predictor_v1.pkl')
        scaler_path = os.path.join(model_dir, 'scaler_v1.pkl')
        features_path = os.path.join(model_dir, 'feature_names_v1.pkl')
        importance_path = os.path.join(model_dir, 'feature_importance_v1.pkl')

        # Load model artifacts
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}. Train model first using model_trainer.py"
            )

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.feature_names = joblib.load(features_path)
        self.feature_importance = joblib.load(importance_path)

        print(f"Loaded model from {model_path}")
        print(f"Features: {len(self.feature_names)}")

    def prepare_features(self, request: PredictionRequest) -> np.ndarray:
        """
        Engineer features from prediction request

        Args:
            request: PredictionRequest with player and match data

        Returns:
            Numpy array of features matching training format
        """
        attrs = request.player_attributes
        ctx = request.match_context
        stats = request.season_stats

        # Position encoding
        position_mapping = {
            'GK': 0, 'RB': 1, 'CB': 2, 'LB': 3,
            'CDM': 4, 'CM': 5, 'CAM': 6,
            'RW': 7, 'LW': 8, 'ST': 9
        }

        features = {
            'age': attrs.get('age', 25),
            'height': attrs.get('height', 180),
            'weight': attrs.get('weight', 75),
            'market_value_log': np.log1p(attrs.get('market_value', 0)),
            'position_encoded': position_mapping.get(attrs.get('position', 'CM'), 5),
            'position_match': 1 if ctx.get('playing_position') == attrs.get('position') else 0,
            'form_l5': np.mean(request.recent_form[-5:]) if request.recent_form else 6.5,
            'form_trend': (
                np.mean(request.recent_form[-3:]) - np.mean(request.recent_form[-6:])
                if len(request.recent_form) >= 6 else 0
            ),
            'is_home': 1 if ctx.get('venue') == 'home' else 0,
            'competition_importance': ctx.get('importance', 3),
            'opponent_strength': ctx.get('opponent_strength', 3),
            'days_since_last_match': ctx.get('days_rest', 7),
            'season_progress': ctx.get('season_progress', 0.5),
            'minutes_played': stats.get('avg_minutes', 90),
            'avg_technical': stats.get('technical_rating', 6.5),
            'avg_tactical': stats.get('tactical_rating', 6.5),
            'avg_physical': stats.get('physical_rating', 6.5),
            'avg_mental': stats.get('mental_rating', 6.5),
            'match_goal_diff': 0,  # Unknown for future matches
        }

        # Convert to array in correct order
        feature_array = np.array([features[name] for name in self.feature_names])

        return feature_array.reshape(1, -1)

    def calculate_confidence_interval(
        self, features_scaled: np.ndarray, predicted: float
    ) -> Tuple[float, float]:
        """
        Calculate confidence interval for prediction

        Uses ensemble variance and historical error distribution

        Args:
            features_scaled: Scaled feature array
            predicted: Predicted rating

        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        # Use model's estimators to estimate variance
        predictions = []
        for estimator in self.model.estimators_[:, 0]:
            pred = estimator.predict(features_scaled)[0]
            predictions.append(pred)

        std = np.std(predictions)

        # Apply minimum std based on typical prediction error (±0.8 rating points)
        std = max(std, 0.4)

        # 95% confidence interval (±1.96 standard deviations)
        lower = predicted - 1.96 * std
        upper = predicted + 1.96 * std

        # Clamp to valid rating range (0-10)
        lower = max(0, lower)
        upper = min(10, upper)

        return (lower, upper)

    def calculate_confidence_score(self, request: PredictionRequest) -> float:
        """
        Calculate confidence score based on data quality

        Args:
            request: PredictionRequest

        Returns:
            Confidence score from 0-1
        """
        confidence = 0.5  # Base confidence

        # More recent form data → higher confidence
        if len(request.recent_form) >= 5:
            confidence += 0.2
        elif len(request.recent_form) >= 3:
            confidence += 0.1

        # Complete season stats → higher confidence
        stats = request.season_stats
        if all(key in stats for key in ['technical_rating', 'tactical_rating', 'physical_rating', 'mental_rating']):
            confidence += 0.15

        # Complete player attributes → higher confidence
        attrs = request.player_attributes
        if all(key in attrs for key in ['age', 'height', 'weight', 'market_value']):
            confidence += 0.1

        # Known opponent strength → higher confidence
        if request.match_context.get('opponent_strength'):
            confidence += 0.05

        return min(1.0, confidence)

    def calculate_rating_distribution(
        self, predicted: float, low: float, high: float
    ) -> Dict[str, float]:
        """
        Calculate probability distribution across rating ranges

        Args:
            predicted: Predicted rating
            low: Lower bound of confidence interval
            high: Upper bound of confidence interval

        Returns:
            Dictionary with probabilities for each rating range
        """
        # Assume normal distribution
        std = (high - low) / 4  # Approximate std from CI

        return {
            'poor_0_5': float(norm.cdf(5, predicted, std)),
            'average_5_7': float(norm.cdf(7, predicted, std) - norm.cdf(5, predicted, std)),
            'good_7_8': float(norm.cdf(8, predicted, std) - norm.cdf(7, predicted, std)),
            'excellent_8_plus': float(1 - norm.cdf(8, predicted, std)),
        }

    def identify_key_factors(
        self, features: np.ndarray, predicted_rating: float
    ) -> List[Dict]:
        """
        Identify which factors most influenced prediction

        Args:
            features: Feature array
            predicted_rating: Predicted rating

        Returns:
            List of key factors with impact analysis
        """
        key_factors = []

        # Get top 5 most important features
        top_features = self.feature_importance.nlargest(5, 'importance')

        for idx, row in top_features.iterrows():
            feature_name = row['feature']
            importance = row['importance']

            # Get feature index and value
            try:
                feature_idx = self.feature_names.index(feature_name)
                feature_value = features[0, feature_idx]
            except (ValueError, IndexError):
                continue

            # Estimate impact direction
            impact = self.estimate_feature_impact(
                feature_name, feature_value, importance, predicted_rating
            )

            description = self.get_factor_description(feature_name, feature_value)

            key_factors.append({
                'factor': feature_name,
                'value': float(feature_value),
                'importance': float(importance),
                'impact': impact,
                'description': description,
            })

        return key_factors

    def estimate_feature_impact(
        self, feature_name: str, feature_value: float, importance: float, predicted: float
    ) -> str:
        """Estimate whether feature has positive/negative impact"""

        # Heuristics for common features
        if 'form' in feature_name.lower():
            if feature_value > 7:
                return 'positive'
            elif feature_value < 6:
                return 'negative'
        elif 'age' in feature_name.lower():
            if 22 <= feature_value <= 28:
                return 'positive'
            elif feature_value < 18 or feature_value > 33:
                return 'negative'
        elif 'is_home' in feature_name.lower():
            return 'positive' if feature_value == 1 else 'negative'
        elif 'competition_importance' in feature_name.lower():
            return 'neutral'  # Can go either way
        elif 'opponent_strength' in feature_name.lower():
            return 'negative' if feature_value > 3 else 'positive'

        return 'neutral'

    def get_factor_description(self, feature_name: str, feature_value: float) -> str:
        """Get human-readable description of feature"""

        descriptions = {
            'form_l5': f"Recent form: {feature_value:.1f}/10 (last 5 matches)",
            'form_trend': f"Form trend: {'improving' if feature_value > 0 else 'declining' if feature_value < 0 else 'stable'}",
            'age': f"Player age: {int(feature_value)} years",
            'is_home': f"Playing {'at home' if feature_value == 1 else 'away'}",
            'competition_importance': f"Match importance: {int(feature_value)}/5",
            'opponent_strength': f"Opponent strength: {int(feature_value)}/5",
            'days_since_last_match': f"Rest days: {int(feature_value)}",
            'minutes_played': f"Average minutes: {int(feature_value)}",
            'position_match': f"Playing in {'primary' if feature_value == 1 else 'different'} position",
        }

        return descriptions.get(feature_name, f"{feature_name}: {feature_value:.2f}")

    def generate_recommendations(
        self, predicted_rating: float, key_factors: List[Dict], request: PredictionRequest
    ) -> List[str]:
        """
        Generate actionable recommendations based on prediction

        Args:
            predicted_rating: Predicted performance rating
            key_factors: Key influencing factors
            request: Original prediction request

        Returns:
            List of recommendation strings
        """
        recommendations = []

        # Performance level recommendations
        if predicted_rating < 5.5:
            recommendations.append(
                "⚠️ Low performance predicted. Consider resting player or using as substitute."
            )
        elif predicted_rating < 6.5:
            recommendations.append(
                "Player may underperform. Consider tactical adjustments or limited minutes."
            )
        elif predicted_rating >= 7.5:
            recommendations.append(
                "✅ High performance expected. Consider giving player key role in match."
            )

        # Form-based recommendations
        form = np.mean(request.recent_form[-5:]) if request.recent_form else 6.5
        if form < 6.0:
            recommendations.append(
                "Recent form is poor. Extra rest or training focus may help."
            )
        elif form > 7.5:
            recommendations.append(
                "Player in excellent form. Maintain current preparation routine."
            )

        # Context-specific recommendations
        ctx = request.match_context
        if ctx.get('opponent_strength', 0) >= 4:
            recommendations.append(
                "Facing strong opponent. Ensure defensive support and tactical discipline."
            )

        if ctx.get('days_rest', 7) < 3:
            recommendations.append(
                "Short rest period. Monitor for fatigue and consider rotation."
            )
        elif ctx.get('days_rest', 7) > 10:
            recommendations.append(
                "Extended rest period. Extra warm-up and intensity in training recommended."
            )

        # Position mismatch warning
        if request.match_context.get('playing_position') != request.player_attributes.get('position'):
            recommendations.append(
                "⚠️ Playing out of primary position. Provide extra tactical guidance."
            )

        return recommendations

    def predict(self, request: PredictionRequest) -> PerformancePrediction:
        """
        Predict player performance for upcoming match

        Args:
            request: PredictionRequest with all necessary data

        Returns:
            PerformancePrediction with rating, confidence, and insights
        """
        # Engineer features
        features = self.prepare_features(request)

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Predict
        predicted_rating = float(self.model.predict(features_scaled)[0])

        # Clamp to valid range (0-10)
        predicted_rating = max(0, min(10, predicted_rating))

        # Calculate confidence interval
        confidence_low, confidence_high = self.calculate_confidence_interval(
            features_scaled, predicted_rating
        )

        # Calculate confidence score
        confidence = self.calculate_confidence_score(request)

        # Rating distribution
        rating_distribution = self.calculate_rating_distribution(
            predicted_rating, confidence_low, confidence_high
        )

        # Key factors
        key_factors = self.identify_key_factors(features, predicted_rating)

        # Recommendations
        recommendations = self.generate_recommendations(
            predicted_rating, key_factors, request
        )

        return PerformancePrediction(
            player_id=request.player_id,
            predicted_rating=round(predicted_rating, 2),
            confidence_interval=(round(confidence_low, 2), round(confidence_high, 2)),
            confidence=round(confidence, 2),
            rating_distribution=rating_distribution,
            key_factors=key_factors,
            recommendations=recommendations,
        )


if __name__ == "__main__":
    # Test predictor
    predictor = PerformancePredictor()

    # Example request
    test_request = PredictionRequest(
        player_id="test-player-123",
        match_context={
            'venue': 'home',
            'importance': 4,
            'opponent_strength': 3,
            'days_rest': 4,
            'season_progress': 0.6,
            'playing_position': 'CM',
        },
        recent_form=[6.5, 7.0, 6.8, 7.2, 7.5],
        season_stats={
            'avg_minutes': 85,
            'technical_rating': 7.0,
            'tactical_rating': 6.8,
            'physical_rating': 7.2,
            'mental_rating': 6.9,
        },
        player_attributes={
            'age': 24,
            'height': 178,
            'weight': 72,
            'market_value': 5000000,
            'position': 'CM',
        },
    )

    prediction = predictor.predict(test_request)

    print("\n" + "="*60)
    print("PREDICTION TEST")
    print("="*60)
    print(f"Predicted Rating: {prediction.predicted_rating}/10")
    print(f"Confidence Interval: {prediction.confidence_interval}")
    print(f"Confidence: {prediction.confidence*100:.0f}%")
    print("\nRating Distribution:")
    for range_name, prob in prediction.rating_distribution.items():
        print(f"  {range_name}: {prob*100:.1f}%")
    print("\nKey Factors:")
    for factor in prediction.key_factors:
        print(f"  {factor['factor']}: {factor['description']} ({factor['impact']})")
    print("\nRecommendations:")
    for rec in prediction.recommendations:
        print(f"  • {rec}")
    print("="*60 + "\n")
