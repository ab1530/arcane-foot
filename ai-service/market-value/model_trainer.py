import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib
import logging
import os
from typing import Dict, Optional
import psycopg2
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelTrainer:
    """Trainer for the market value prediction model"""

    def __init__(self, data_path: Optional[str] = None):
        """
        Initialize the model trainer

        Args:
            data_path: Path to training data CSV (optional)
        """
        self.data_path = data_path or "training_data.csv"
        self.model = None
        self.scaler = StandardScaler()
        self.position_encoder = LabelEncoder()
        self.league_encoder = LabelEncoder()
        self.nationality_encoder = LabelEncoder()
        self.feature_names = []
        self.model_version = "v1"

        # Position hierarchy for encoding
        self.position_hierarchy = {
            'GK': 0,
            'DEF': 1,
            'MID': 2,
            'FWD': 3
        }

        # Top 5 leagues for tier encoding
        self.top_leagues = {
            'Premier League': 5,
            'LaLiga': 5,
            'Serie A': 5,
            'Bundesliga': 5,
            'Ligue 1': 5,
            'Primeira Liga': 4,
            'Eredivisie': 4,
            'Championship': 3,
            'MLS': 3
        }

        # Top football nations (market factor)
        self.top_nations = {
            'Brazil', 'France', 'Spain', 'Germany', 'England',
            'Argentina', 'Portugal', 'Italy', 'Netherlands', 'Belgium'
        }

    def fetch_data_from_db(self) -> pd.DataFrame:
        """
        Fetch training data from PostgreSQL database

        Returns:
            DataFrame with player data for training
        """
        try:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL not set")

            conn = psycopg2.connect(database_url)

            query = """
            SELECT
                p.id,
                EXTRACT(YEAR FROM AGE(p."dateOfBirth")) as age,
                p.position,
                p.height,
                p.weight,
                p.nationality,
                p."currentClubId",
                COUNT(DISTINCT mp.id) as appearances,
                SUM(CASE WHEN mp.goals IS NOT NULL THEN mp.goals ELSE 0 END) as goals,
                SUM(CASE WHEN mp.assists IS NOT NULL THEN mp.assists ELSE 0 END) as assists,
                AVG(CASE WHEN mp.rating IS NOT NULL THEN mp.rating ELSE 0 END) as avg_rating,
                AVG(CASE WHEN sr.rating IS NOT NULL THEN sr.rating ELSE 0 END) as avg_scout_rating
            FROM players p
            LEFT JOIN match_participations mp ON mp."playerId" = p.id
            LEFT JOIN scouting_reports sr ON sr."playerId" = p.id
            WHERE p."dateOfBirth" IS NOT NULL
            GROUP BY p.id
            HAVING COUNT(DISTINCT mp.id) > 5
            """

            df = pd.read_sql_query(query, conn)
            conn.close()

            logger.info(f"Fetched {len(df)} player records from database")
            return df

        except Exception as e:
            logger.warning(f"Could not fetch data from database: {str(e)}")
            return None

    def load_data(self) -> pd.DataFrame:
        """
        Load training data from CSV or database

        Returns:
            DataFrame with training data
        """
        # Try to load from CSV first
        if os.path.exists(self.data_path):
            logger.info(f"Loading training data from {self.data_path}")
            df = pd.read_csv(self.data_path)
            return df

        # Try to fetch from database
        df = self.fetch_data_from_db()
        if df is not None and len(df) > 0:
            return df

        # If no data available, raise error
        raise FileNotFoundError(
            f"Training data not found at {self.data_path} and could not fetch from database"
        )

    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for the model

        Args:
            df: Raw data DataFrame

        Returns:
            DataFrame with engineered features
        """
        df = df.copy()

        # Age normalization (peak at 25-28)
        df['age_normalized'] = 1 - abs(df['age'] - 26.5) / 20

        # Position encoding
        df['position_encoded'] = df['position'].map(self.position_hierarchy)
        df['position_encoded'].fillna(1, inplace=True)

        # League tier
        df['league_tier'] = df['league'].map(self.top_leagues)
        df['league_tier'].fillna(2, inplace=True)

        # Performance metrics per 90 minutes (assuming 90 min per appearance)
        df['goals_per_90'] = df['goals'] / df['appearances'].clip(lower=1)
        df['assists_per_90'] = df['assists'] / df['appearances'].clip(lower=1)

        # Physical score
        df['height'] = df['height'].fillna(df['height'].mean())
        df['weight'] = df['weight'].fillna(df['weight'].mean())
        df['physical_score'] = ((df['height'] / 190) + (df['weight'] / 75)) / 2
        df['physical_score'] = df['physical_score'].clip(upper=1.5)

        # Nationality market factor
        df['top_nation'] = df['nationality'].apply(
            lambda x: 1 if x in self.top_nations else 0
        )

        # Contract value multiplier
        if 'contract_years_remaining' in df.columns:
            df['contract_multiplier'] = df['contract_years_remaining'].fillna(2)
            df['contract_multiplier'] = df['contract_multiplier'].clip(lower=0.5, upper=5)
        else:
            df['contract_multiplier'] = 2.0

        # Scout rating (if available)
        if 'scout_ratings' in df.columns:
            df['avg_scout_rating'] = df['scout_ratings'].apply(
                lambda x: np.mean(x) if isinstance(x, list) and len(x) > 0 else df['rating'].mean()
            )
        elif 'avg_scout_rating' not in df.columns:
            df['avg_scout_rating'] = df['rating']

        # Rating normalized
        df['rating_normalized'] = df['rating'] / 10

        # Experience factor (appearances)
        df['experience'] = np.log1p(df['appearances'])

        # Fill NaN values
        df.fillna(0, inplace=True)

        return df

    def prepare_features(self, df: pd.DataFrame) -> tuple:
        """
        Prepare feature matrix and target vector

        Args:
            df: DataFrame with engineered features

        Returns:
            Tuple of (X, y) where X is feature matrix and y is target
        """
        self.feature_names = [
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

        X = df[self.feature_names].values
        y = df['market_value'].values

        return X, y

    def train(self) -> Dict:
        """
        Train the market value prediction model

        Returns:
            Dictionary with training metrics
        """
        logger.info("Starting model training...")

        # Load and prepare data
        df = self.load_data()
        df = self.engineer_features(df)

        # Prepare features
        X, y = self.prepare_features(df)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train XGBoost model
        logger.info("Training XGBoost model...")
        self.model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_scaled, y_train)

        # Make predictions
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)

        # Calculate metrics
        metrics = {
            'train': {
                'mae': float(mean_absolute_error(y_train, y_pred_train)),
                'rmse': float(np.sqrt(mean_squared_error(y_train, y_pred_train))),
                'r2': float(r2_score(y_train, y_pred_train))
            },
            'test': {
                'mae': float(mean_absolute_error(y_test, y_pred_test)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred_test))),
                'r2': float(r2_score(y_test, y_pred_test))
            }
        }

        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X_train_scaled, y_train,
            cv=5, scoring='r2'
        )
        metrics['cross_val_r2'] = float(cv_scores.mean())
        metrics['cross_val_r2_std'] = float(cv_scores.std())

        # Feature importance
        feature_importance = dict(zip(
            self.feature_names,
            self.model.feature_importances_.tolist()
        ))
        metrics['feature_importance'] = feature_importance

        # Log metrics
        logger.info(f"Training R²: {metrics['train']['r2']:.4f}")
        logger.info(f"Test R²: {metrics['test']['r2']:.4f}")
        logger.info(f"Test MAE: {metrics['test']['mae']:.2f}M EUR")
        logger.info(f"Test RMSE: {metrics['test']['rmse']:.2f}M EUR")

        # Save model
        self.save_model(metrics)

        return metrics

    def save_model(self, metrics: Dict):
        """
        Save the trained model and metadata

        Args:
            metrics: Training metrics
        """
        os.makedirs("models", exist_ok=True)

        # Save model
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'model_version': self.model_version,
            'metrics': metrics,
            'trained_at': datetime.now().isoformat(),
            'position_hierarchy': self.position_hierarchy,
            'top_leagues': self.top_leagues,
            'top_nations': self.top_nations
        }

        joblib.dump(model_data, f"models/market_value_{self.model_version}.pkl")
        logger.info(f"Model saved to models/market_value_{self.model_version}.pkl")

        # Save performance report
        with open(f"models/performance_report_{self.model_version}.txt", 'w') as f:
            f.write("MARKET VALUE MODEL PERFORMANCE REPORT\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Model Version: {self.model_version}\n")
            f.write(f"Trained At: {datetime.now().isoformat()}\n\n")

            f.write("TEST SET METRICS:\n")
            f.write(f"  R² Score: {metrics['test']['r2']:.4f}\n")
            f.write(f"  MAE: {metrics['test']['mae']:.2f}M EUR\n")
            f.write(f"  RMSE: {metrics['test']['rmse']:.2f}M EUR\n\n")

            f.write("CROSS-VALIDATION:\n")
            f.write(f"  Mean R²: {metrics['cross_val_r2']:.4f}\n")
            f.write(f"  Std R²: {metrics['cross_val_r2_std']:.4f}\n\n")

            f.write("FEATURE IMPORTANCE:\n")
            for feature, importance in sorted(
                metrics['feature_importance'].items(),
                key=lambda x: x[1],
                reverse=True
            ):
                f.write(f"  {feature}: {importance:.4f}\n")

        logger.info(f"Performance report saved")

if __name__ == "__main__":
    trainer = ModelTrainer()
    metrics = trainer.train()
    print("\nTraining completed successfully!")
    print(f"Test R²: {metrics['test']['r2']:.4f}")
    print(f"Test MAE: {metrics['test']['mae']:.2f}M EUR")
