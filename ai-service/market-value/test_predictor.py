"""
Unit tests for the MarketValue predictor
"""

import pytest
import numpy as np
from predictor import MarketValuePredictor

class TestMarketValuePredictor:
    """Test suite for MarketValuePredictor"""

    @pytest.fixture
    def sample_player_data(self):
        """Sample player data for testing"""
        return {
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

    def test_feature_engineering(self, sample_player_data):
        """Test feature engineering produces correct features"""
        predictor = MarketValuePredictor()
        features = predictor.engineer_features(sample_player_data)

        # Check all required features exist
        required_features = [
            'age_normalized',
            'position_encoded',
            'league_tier',
            'goals_per_90',
            'assists_per_90',
            'rating_normalized',
            'physical_score',
            'top_nation',
            'contract_multiplier',
            'avg_scout_rating',
            'experience'
        ]

        for feature in required_features:
            assert feature in features, f"Missing feature: {feature}"

        # Check value ranges
        assert 0 <= features['age_normalized'] <= 1, "Age normalization out of range"
        assert 0 <= features['rating_normalized'] <= 1, "Rating normalization out of range"
        assert features['top_nation'] in [0, 1], "Top nation must be binary"
        assert features['league_tier'] >= 1, "League tier must be positive"
        assert features['position_encoded'] >= 0, "Position encoding must be non-negative"

    def test_position_encoding(self):
        """Test position encoding is consistent"""
        predictor = MarketValuePredictor()

        positions = ['GK', 'DEF', 'MID', 'FWD']
        encodings = []

        for pos in positions:
            features = predictor.engineer_features({
                'age': 25,
                'position': pos,
                'league': 'Premier League',
                'goals': 0,
                'assists': 0,
                'appearances': 20,
                'rating': 7.0,
                'height': 180,
                'weight': 75,
                'nationality': 'England',
                'contract_years_remaining': 2.0,
            })
            encodings.append(features['position_encoded'])

        # All positions should have different encodings
        assert len(set(encodings)) == len(positions), "Position encodings should be unique"

    def test_confidence_calculation(self, sample_player_data):
        """Test confidence calculation"""
        predictor = MarketValuePredictor()
        confidence = predictor.calculate_confidence(sample_player_data, 25.0)

        # Check confidence components exist
        assert 'confidence_score' in confidence
        assert 'confidence_low' in confidence
        assert 'confidence_high' in confidence

        # Check value ranges
        assert 0 <= confidence['confidence_score'] <= 1, "Confidence score out of range"
        assert confidence['confidence_low'] < confidence['confidence_high'], \
            "Low bound must be less than high bound"
        assert confidence['confidence_low'] > 0, "Low bound must be positive"

    def test_confidence_increases_with_data(self):
        """Test that more data increases confidence"""
        predictor = MarketValuePredictor()

        # Player with minimal data
        minimal_data = {
            'age': 25,
            'position': 'MID',
            'league': 'Unknown',
            'goals': 0,
            'assists': 0,
            'appearances': 5,
            'rating': 6.5,
            'height': None,
            'weight': None,
            'nationality': 'Unknown',
            'contract_years_remaining': None,
        }

        # Player with complete data
        complete_data = {
            'age': 25,
            'position': 'MID',
            'league': 'Premier League',
            'goals': 10,
            'assists': 8,
            'appearances': 30,
            'rating': 7.8,
            'height': 180,
            'weight': 75,
            'nationality': 'England',
            'contract_years_remaining': 3.0,
            'scout_ratings': [7.5, 8.0, 7.8, 7.9, 7.6]
        }

        conf_minimal = predictor.calculate_confidence(minimal_data, 10.0)
        conf_complete = predictor.calculate_confidence(complete_data, 25.0)

        assert conf_complete['confidence_score'] > conf_minimal['confidence_score'], \
            "Complete data should have higher confidence"

    def test_league_tier_mapping(self):
        """Test league tier is correctly assigned"""
        predictor = MarketValuePredictor()

        top_leagues = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1']
        for league in top_leagues:
            features = predictor.engineer_features({
                'age': 25,
                'position': 'MID',
                'league': league,
                'goals': 0,
                'assists': 0,
                'appearances': 20,
                'rating': 7.0,
                'height': 180,
                'weight': 75,
                'nationality': 'England',
                'contract_years_remaining': 2.0,
            })
            assert features['league_tier'] == 5, f"{league} should be tier 5"

    def test_contract_multiplier_bounds(self):
        """Test contract multiplier is properly bounded"""
        predictor = MarketValuePredictor()

        # Very short contract
        features_short = predictor.engineer_features({
            'age': 25,
            'position': 'MID',
            'league': 'Premier League',
            'goals': 0,
            'assists': 0,
            'appearances': 20,
            'rating': 7.0,
            'height': 180,
            'weight': 75,
            'nationality': 'England',
            'contract_years_remaining': 0.1,
        })

        # Very long contract
        features_long = predictor.engineer_features({
            'age': 25,
            'position': 'MID',
            'league': 'Premier League',
            'goals': 0,
            'assists': 0,
            'appearances': 20,
            'rating': 7.0,
            'height': 180,
            'weight': 75,
            'nationality': 'England',
            'contract_years_remaining': 10.0,
        })

        # Check bounds
        assert features_short['contract_multiplier'] >= 0.5, "Minimum contract multiplier is 0.5"
        assert features_long['contract_multiplier'] <= 5.0, "Maximum contract multiplier is 5.0"

    def test_physical_score_calculation(self, sample_player_data):
        """Test physical score is calculated correctly"""
        predictor = MarketValuePredictor()
        features = predictor.engineer_features(sample_player_data)

        # Physical score should be around 1.0 for average players
        assert 0.5 <= features['physical_score'] <= 1.5, \
            "Physical score should be in reasonable range"

    def test_experience_factor(self):
        """Test experience factor increases with appearances"""
        predictor = MarketValuePredictor()

        features_rookie = predictor.engineer_features({
            'age': 20,
            'position': 'MID',
            'league': 'Premier League',
            'goals': 0,
            'assists': 0,
            'appearances': 5,
            'rating': 6.5,
            'height': 180,
            'weight': 75,
            'nationality': 'England',
            'contract_years_remaining': 4.0,
        })

        features_veteran = predictor.engineer_features({
            'age': 28,
            'position': 'MID',
            'league': 'Premier League',
            'goals': 50,
            'assists': 30,
            'appearances': 300,
            'rating': 7.8,
            'height': 180,
            'weight': 75,
            'nationality': 'England',
            'contract_years_remaining': 2.0,
        })

        assert features_veteran['experience'] > features_rookie['experience'], \
            "Veteran should have higher experience factor"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
