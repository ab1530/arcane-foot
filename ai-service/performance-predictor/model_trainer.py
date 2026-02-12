"""
Performance Predictor Model Trainer

Trains a Gradient Boosting model to predict player match performance
based on historical scouting reports and match data.
"""

import os
from typing import Tuple, Dict, List, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import psycopg2
from datetime import datetime


class PerformanceModelTrainer:
    """Train ML model to predict player performance ratings"""

    def __init__(self, db_url: str = None):
        """
        Initialize trainer with database connection

        Args:
            db_url: PostgreSQL connection string (defaults to DATABASE_URL env var)
        """
        self.db_url = db_url or os.getenv("DATABASE_URL")
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            min_samples_split=20,
            min_samples_leaf=10,
            subsample=0.8,
            random_state=42,
            verbose=1,
        )
        self.scaler = StandardScaler()
        self.feature_names = []

    def get_db_connection(self):
        """Create database connection"""
        return psycopg2.connect(self.db_url)

    def fetch_training_data(self) -> pd.DataFrame:
        """
        Fetch historical match performances from database

        Returns:
            DataFrame with all training features and target
        """
        query = """
        SELECT
            sr.id as report_id,
            sr."overallRating" as overall_rating,
            sr."technicalRating" as technical_rating,
            sr."tacticalRating" as tactical_rating,
            sr."physicalRating" as physical_rating,
            sr."mentalRating" as mental_rating,
            sr."playerMinutesPlayed" as minutes_played,
            sr."playerPosition" as match_position,
            p.position as primary_position,
            p.height,
            p.weight,
            EXTRACT(YEAR FROM AGE(m."scheduledAt", p."dateOfBirth")) as age,
            p.nationality,
            p."marketValue" as market_value,
            m.id as match_id,
            m."homeClubId" as home_club_id,
            m."awayClubId" as away_club_id,
            m."homeScore" as home_score,
            m."awayScore" as away_score,
            m.season,
            m."scheduledAt" as match_date,
            p."clubId" as player_club_id,
            comp.name as competition,
            comp.level as competition_level
        FROM scouting_reports sr
        JOIN players p ON sr."playerId" = p.id
        JOIN matches m ON sr."matchId" = m.id
        LEFT JOIN competitions comp ON m."competitionId" = comp.id
        WHERE sr."overallRating" IS NOT NULL
            AND sr.status IN ('SUBMITTED', 'REVIEWED', 'APPROVED')
            AND m.status = 'COMPLETED'
        ORDER BY m."scheduledAt" DESC
        """

        conn = self.get_db_connection()
        df = pd.read_sql(query, conn)
        conn.close()

        print(f"Fetched {len(df)} scouting reports for training")
        return df

    def engineer_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Create predictive features from raw data

        Args:
            df: Raw data from database

        Returns:
            Tuple of (features DataFrame, target Series)
        """
        features = pd.DataFrame()

        # Player attributes
        features['age'] = df['age'].fillna(25)
        features['height'] = df['height'].fillna(df['height'].median())
        features['weight'] = df['weight'].fillna(df['weight'].median())
        features['market_value_log'] = np.log1p(df['market_value'].fillna(0))

        # Position encoding
        position_mapping = {
            'GK': 0, 'RB': 1, 'CB': 2, 'LB': 3,
            'CDM': 4, 'CM': 5, 'CAM': 6,
            'RW': 7, 'LW': 8, 'ST': 9
        }
        features['position_encoded'] = df['primary_position'].map(position_mapping).fillna(5)

        # Position consistency (playing in primary position)
        features['position_match'] = (
            df['primary_position'] == df['match_position']
        ).astype(int)

        # Recent form (last 5 matches average)
        df_sorted = df.sort_values(['match_date'])
        features['form_l5'] = df_sorted.groupby('report_id')['overall_rating'].transform(
            lambda x: x.rolling(5, min_periods=1).mean().shift(1)
        ).fillna(df['overall_rating'].mean())

        # Form trend (improving/declining)
        features['form_trend'] = df_sorted.groupby('report_id')['overall_rating'].transform(
            lambda x: x.rolling(3, min_periods=1).mean().shift(1) -
                     x.rolling(6, min_periods=3).mean().shift(1)
        ).fillna(0)

        # Match context
        features['is_home'] = (df['player_club_id'] == df['home_club_id']).astype(int)

        # Competition importance
        comp_importance = {
            'UEFA Champions League': 5,
            'UEFA Europa League': 4,
            'Primera División': 4,
            'Premier League': 4,
            'Serie A': 4,
            'Bundesliga': 4,
            'Ligue 1': 4,
            'FA Cup': 3,
            'Copa del Rey': 3,
        }
        features['competition_importance'] = df['competition'].map(comp_importance).fillna(2)

        # Opponent strength (based on goal difference in match)
        features['opponent_strength'] = df.apply(
            lambda row: abs(row['home_score'] - row['away_score'])
            if pd.notna(row['home_score']) else 1,
            axis=1
        )

        # Rest days (calculate from match_date)
        df_sorted['days_since_last_match'] = df_sorted.groupby('report_id')['match_date'].diff().dt.days
        features['days_since_last_match'] = df_sorted['days_since_last_match'].fillna(7).clip(0, 30)

        # Season progress (early season vs late season fatigue)
        features['season_progress'] = pd.to_datetime(df['match_date']).dt.dayofyear / 365

        # Minutes played (indicator of fitness/trust)
        features['minutes_played'] = df['minutes_played'].fillna(90).clip(0, 120)

        # Average ratings (if available from previous reports)
        features['avg_technical'] = df['technical_rating'].fillna(df['technical_rating'].mean())
        features['avg_tactical'] = df['tactical_rating'].fillna(df['tactical_rating'].mean())
        features['avg_physical'] = df['physical_rating'].fillna(df['physical_rating'].mean())
        features['avg_mental'] = df['mental_rating'].fillna(df['mental_rating'].mean())

        # Match result (retroactive - helps model learn impact)
        features['match_goal_diff'] = df.apply(
            lambda row: (row['home_score'] - row['away_score'])
            if row['is_home'] == 1
            else (row['away_score'] - row['home_score'])
            if pd.notna(row['home_score']) else 0,
            axis=1
        )

        # Target variable
        target = df['overall_rating']

        # Store feature names for later use
        self.feature_names = features.columns.tolist()

        return features, target

    def train(self) -> Dict[str, Any]:
        """
        Train the performance prediction model

        Returns:
            Dictionary with training metrics and results
        """
        print("Fetching training data from database...")
        df = self.fetch_training_data()

        if len(df) < 50:
            raise ValueError(f"Insufficient training data: {len(df)} samples (need at least 50)")

        print("Engineering features...")
        X, y = self.engineer_features(df)

        print(f"Training data shape: {X.shape}")
        print(f"Features: {self.feature_names}")

        # Split data (80/20)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=True
        )

        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")

        # Scale features
        print("Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        print("Training Gradient Boosting model...")
        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        print("Evaluating model...")
        train_pred = self.model.predict(X_train_scaled)
        test_pred = self.model.predict(X_test_scaled)

        train_r2 = r2_score(y_train, train_pred)
        test_r2 = r2_score(y_test, test_pred)
        train_mae = mean_absolute_error(y_train, train_pred)
        test_mae = mean_absolute_error(y_test, test_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))

        # Cross-validation
        print("Running cross-validation...")
        cv_scores = cross_val_score(
            self.model, X_train_scaled, y_train,
            cv=5, scoring='r2', n_jobs=-1
        )

        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)

        # Calculate within-CI accuracy (predictions within ±1 rating point)
        within_ci = np.sum(np.abs(test_pred - y_test) <= 1.0) / len(y_test)

        # Save model artifacts
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)

        model_path = os.path.join(model_dir, 'performance_predictor_v1.pkl')
        scaler_path = os.path.join(model_dir, 'scaler_v1.pkl')
        features_path = os.path.join(model_dir, 'feature_names_v1.pkl')
        importance_path = os.path.join(model_dir, 'feature_importance_v1.pkl')

        print(f"Saving model to {model_path}")
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.feature_names, features_path)
        joblib.dump(feature_importance, importance_path)

        results = {
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'cv_mean_r2': float(cv_scores.mean()),
            'cv_std_r2': float(cv_scores.std()),
            'within_ci_accuracy': float(within_ci),
            'n_train_samples': len(X_train),
            'n_test_samples': len(X_test),
            'feature_importance': feature_importance.to_dict('records'),
            'model_version': 'v1',
            'trained_at': datetime.now().isoformat(),
        }

        print("\n" + "="*60)
        print("TRAINING COMPLETE")
        print("="*60)
        print(f"Train R²: {train_r2:.4f}")
        print(f"Test R²: {test_r2:.4f}")
        print(f"Test MAE: {test_mae:.4f} rating points")
        print(f"Test RMSE: {test_rmse:.4f}")
        print(f"CV R² (mean ± std): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        print(f"Within ±1 rating: {within_ci*100:.1f}%")
        print("\nTop 5 Important Features:")
        for idx, row in feature_importance.head(5).iterrows():
            print(f"  {row['feature']}: {row['importance']:.4f}")
        print("="*60 + "\n")

        return results


if __name__ == "__main__":
    # Run training
    trainer = PerformanceModelTrainer()
    results = trainer.train()

    # Print results
    import json
    print(json.dumps(results, indent=2))
