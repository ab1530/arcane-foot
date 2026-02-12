"""
PlayStyle DNA Cluster Trainer
Trains K-Means clustering model to identify player play styles
"""
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score, davies_bouldin_score
import psycopg2
from psycopg2.extras import RealDictCursor
import joblib
import os
from typing import Dict, List, Tuple
from datetime import datetime


class PlayStyleClusterer:
    """
    K-Means clustering for player play style identification

    Uses player statistics from scouting reports to identify
    12 distinct play styles using unsupervised learning
    """

    def __init__(self, n_clusters: int = 12):
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=6)
        self.kmeans = KMeans(
            n_clusters=n_clusters,
            random_state=42,
            n_init=20,
            max_iter=500
        )
        self.feature_cols = [
            'technical_skills',
            'tactical_awareness',
            'physical_attributes',
            'mental_attributes',
            'pace',
            'strength',
            'work_rate',
            'creativity',
            'aggression',
            'vision',
        ]

    def fetch_training_data(self, database_url: str) -> pd.DataFrame:
        """
        Fetch player statistics from database

        Aggregates scouting report data to create player profiles
        """
        conn = psycopg2.connect(database_url)

        query = """
        SELECT
            p.id as player_id,
            p.position,
            AVG(sr.technical_rating) as technical_skills,
            AVG(sr.tactical_rating) as tactical_awareness,
            AVG(sr.physical_rating) as physical_attributes,
            AVG(sr.mental_rating) as mental_attributes,
            AVG(sr.overall_rating) as overall_rating,
            COUNT(sr.id) as num_reports,
            -- Derived metrics from tags and notes
            AVG(CASE
                WHEN 'pace' = ANY(sr.tags) THEN 8.0
                WHEN 'fast' = ANY(sr.tags) THEN 8.0
                ELSE 5.0
            END) as pace,
            AVG(CASE
                WHEN 'strong' = ANY(sr.tags) THEN 8.0
                WHEN 'physical' = ANY(sr.tags) THEN 7.5
                ELSE 5.0
            END) as strength,
            AVG(CASE
                WHEN 'high-work-rate' = ANY(sr.tags) THEN 8.0
                WHEN 'tireless' = ANY(sr.tags) THEN 8.0
                ELSE 5.0
            END) as work_rate,
            AVG(CASE
                WHEN 'creative' = ANY(sr.tags) THEN 8.0
                WHEN 'playmaker' = ANY(sr.tags) THEN 8.5
                ELSE 5.0
            END) as creativity,
            AVG(CASE
                WHEN 'aggressive' = ANY(sr.tags) THEN 7.0
                WHEN 'tough' = ANY(sr.tags) THEN 7.0
                ELSE 5.0
            END) as aggression,
            AVG(CASE
                WHEN 'vision' = ANY(sr.tags) THEN 8.0
                WHEN 'passing' = ANY(sr.tags) THEN 7.5
                ELSE 5.0
            END) as vision
        FROM players p
        INNER JOIN scouting_reports sr ON p.id = sr.player_id
        WHERE sr.status IN ('SUBMITTED', 'APPROVED', 'REVIEWED')
            AND sr.technical_rating IS NOT NULL
            AND sr.tactical_rating IS NOT NULL
            AND sr.physical_rating IS NOT NULL
            AND sr.mental_rating IS NOT NULL
        GROUP BY p.id, p.position
        HAVING COUNT(sr.id) >= 2
        ORDER BY num_reports DESC
        """

        df = pd.read_sql(query, conn)
        conn.close()

        print(f"Loaded {len(df)} players with scouting data")
        return df

    def preprocess_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
        """
        Preprocess data for clustering

        Returns:
            - Preprocessed feature matrix
            - Original dataframe with additional columns
        """
        # Handle missing values
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 5.0  # Default neutral value
            df[col] = df[col].fillna(df[col].mean())

        # Extract feature matrix
        X = df[self.feature_cols].values

        # Normalize features
        X_scaled = self.scaler.fit_transform(X)

        # Apply PCA for dimensionality reduction
        X_pca = self.pca.fit_transform(X_scaled)

        print(f"PCA explained variance ratio: {self.pca.explained_variance_ratio_}")
        print(f"Total variance explained: {sum(self.pca.explained_variance_ratio_):.2%}")

        return X_pca, df

    def train(self, X_pca: np.ndarray, df: pd.DataFrame) -> Dict[int, str]:
        """
        Train K-Means clustering model

        Returns:
            - Mapping of cluster ID to play style name
        """
        # Fit clustering model
        self.kmeans.fit(X_pca)

        # Assign cluster labels
        df['cluster'] = self.kmeans.labels_

        # Calculate cluster quality metrics
        silhouette = silhouette_score(X_pca, self.kmeans.labels_)
        davies_bouldin = davies_bouldin_score(X_pca, self.kmeans.labels_)

        print(f"\nCluster Quality Metrics:")
        print(f"Silhouette Score: {silhouette:.3f} (higher is better, >0.5 is good)")
        print(f"Davies-Bouldin Index: {davies_bouldin:.3f} (lower is better)")

        # Analyze clusters and assign style names
        style_mapping = self.analyze_clusters(df)

        return style_mapping

    def analyze_clusters(self, df: pd.DataFrame) -> Dict[int, str]:
        """
        Analyze each cluster and assign meaningful play style names

        Uses cluster centroids to determine dominant characteristics
        """
        style_mapping = {}

        print(f"\n{'='*70}")
        print("CLUSTER ANALYSIS - PLAY STYLE IDENTIFICATION")
        print(f"{'='*70}\n")

        for cluster_id in range(self.n_clusters):
            cluster_data = df[df['cluster'] == cluster_id]

            if len(cluster_data) == 0:
                style_mapping[cluster_id] = "Unclassified"
                continue

            # Calculate average stats for this cluster
            avg_stats = cluster_data[self.feature_cols].mean()

            # Determine style based on characteristics
            style_name, reasoning = self.determine_style(avg_stats, cluster_data)
            style_mapping[cluster_id] = style_name

            # Print cluster summary
            print(f"Cluster {cluster_id}: {style_name}")
            print(f"  Players: {len(cluster_data)}")
            print(f"  Positions: {cluster_data['position'].value_counts().to_dict()}")
            print(f"  Key Characteristics:")
            print(f"    - Technical: {avg_stats['technical_skills']:.1f}/10")
            print(f"    - Tactical: {avg_stats['tactical_awareness']:.1f}/10")
            print(f"    - Physical: {avg_stats['physical_attributes']:.1f}/10")
            print(f"    - Mental: {avg_stats['mental_attributes']:.1f}/10")
            print(f"    - Pace: {avg_stats['pace']:.1f}/10")
            print(f"    - Creativity: {avg_stats['creativity']:.1f}/10")
            print(f"  Reasoning: {reasoning}")
            print()

        return style_mapping

    def determine_style(self, stats: pd.Series, cluster_data: pd.DataFrame) -> Tuple[str, str]:
        """
        Determine play style based on cluster statistics

        Returns:
            - Style name
            - Reasoning explanation
        """
        # Normalize stats to 0-1 scale for comparison
        technical = stats['technical_skills'] / 10.0
        tactical = stats['tactical_awareness'] / 10.0
        physical = stats['physical_attributes'] / 10.0
        mental = stats['mental_attributes'] / 10.0
        pace = stats['pace'] / 10.0
        strength = stats['strength'] / 10.0
        work_rate = stats['work_rate'] / 10.0
        creativity = stats['creativity'] / 10.0
        aggression = stats['aggression'] / 10.0
        vision = stats['vision'] / 10.0

        # Most common positions in cluster
        positions = cluster_data['position'].mode()
        primary_position = positions[0] if len(positions) > 0 else "Unknown"

        # Style determination logic (hierarchical)

        # 1. Playmaker: High technical + creativity + vision
        if technical > 0.7 and creativity > 0.7 and vision > 0.7:
            return "Playmaker", "High technical ability, creativity, and vision - dictates play"

        # 2. Physical Enforcer: High physical + aggression + strength
        if physical > 0.7 and aggression > 0.65 and strength > 0.65:
            return "Physical Enforcer", "Dominant physical presence with aggression and strength"

        # 3. Box-to-Box Engine: High work rate + physical + tactical
        if work_rate > 0.7 and physical > 0.6 and tactical > 0.6:
            return "Box-to-Box Engine", "Tireless runner covering entire pitch with tactical awareness"

        # 4. Tactical Anchor: High tactical + mental + low pace
        if tactical > 0.7 and mental > 0.7 and pace < 0.6:
            return "Tactical Anchor", "Intelligent positioning and game reading, controlled tempo"

        # 5. Speed Demon: High pace + acceleration
        if pace > 0.75:
            return "Speed Demon", "Exceptional pace and acceleration, direct running"

        # 6. Clinical Finisher: High technical + mental (for forwards)
        if technical > 0.7 and mental > 0.7 and primary_position in ['ST', 'CF', 'FW']:
            return "Clinical Finisher", "Composed and technical finisher with mental strength"

        # 7. Creative Dribbler: High technical + creativity (for attackers)
        if technical > 0.75 and creativity > 0.7 and aggression < 0.5:
            return "Creative Dribbler", "Exceptional dribbling and flair, unpredictable playmaker"

        # 8. Defensive Wall: High tactical + physical + low creativity (defenders)
        if tactical > 0.65 and physical > 0.65 and creativity < 0.55 and primary_position in ['CB', 'DF']:
            return "Defensive Wall", "Solid defender with positioning and physical strength"

        # 9. Deep-Lying Orchestrator: High vision + tactical + low work rate
        if vision > 0.7 and tactical > 0.65 and work_rate < 0.6:
            return "Deep-Lying Orchestrator", "Controls tempo from deep with passing range and vision"

        # 10. Pressing Machine: High work rate + aggression + stamina
        if work_rate > 0.75 and aggression > 0.6:
            return "Pressing Machine", "Relentless pressing with high work rate and aggression"

        # 11. Target Man: High strength + physical (for forwards)
        if strength > 0.7 and physical > 0.7 and primary_position in ['ST', 'CF', 'FW']:
            return "Target Man", "Physical aerial threat with hold-up play ability"

        # 12. Balanced All-Rounder: No dominant trait
        return "Balanced All-Rounder", "Well-rounded player without dominant characteristics"

    def save_models(self, style_mapping: Dict[int, str], output_dir: str = "models"):
        """
        Save trained models and mappings to disk
        """
        os.makedirs(output_dir, exist_ok=True)

        version = os.getenv('MODEL_VERSION', 'v1')

        joblib.dump(self.kmeans, f"{output_dir}/playstyle_kmeans_{version}.pkl")
        joblib.dump(self.scaler, f"{output_dir}/scaler_{version}.pkl")
        joblib.dump(self.pca, f"{output_dir}/pca_{version}.pkl")
        joblib.dump(style_mapping, f"{output_dir}/style_mapping_{version}.pkl")

        # Save feature columns for reference
        joblib.dump(self.feature_cols, f"{output_dir}/features_{version}.pkl")

        print(f"\nModels saved to {output_dir}/")
        print(f"  - playstyle_kmeans_{version}.pkl")
        print(f"  - scaler_{version}.pkl")
        print(f"  - pca_{version}.pkl")
        print(f"  - style_mapping_{version}.pkl")
        print(f"  - features_{version}.pkl")

    def train_pipeline(self, database_url: str, output_dir: str = "models") -> Dict[int, str]:
        """
        Complete training pipeline

        1. Fetch data from database
        2. Preprocess and normalize
        3. Train clustering model
        4. Assign style names
        5. Save models

        Returns:
            - Style mapping dictionary
        """
        print("Starting PlayStyle DNA Training Pipeline")
        print(f"Target clusters: {self.n_clusters}\n")

        # Fetch data
        df = self.fetch_training_data(database_url)

        if len(df) < self.n_clusters * 3:
            raise ValueError(
                f"Insufficient training data. Need at least {self.n_clusters * 3} players, "
                f"got {len(df)}. Please add more scouting reports."
            )

        # Preprocess
        X_pca, df = self.preprocess_data(df)

        # Train
        style_mapping = self.train(X_pca, df)

        # Save
        self.save_models(style_mapping, output_dir)

        print("\nTraining completed successfully!")
        return style_mapping


def main():
    """
    CLI interface for training the clustering model
    """
    from dotenv import load_dotenv
    load_dotenv()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not set in environment")

    # Initialize trainer
    clusterer = PlayStyleClusterer(n_clusters=12)

    # Train and save models
    style_mapping = clusterer.train_pipeline(
        database_url=database_url,
        output_dir="models"
    )

    print("\n" + "="*70)
    print("FINAL STYLE MAPPING")
    print("="*70)
    for cluster_id, style_name in style_mapping.items():
        print(f"  Cluster {cluster_id}: {style_name}")


if __name__ == "__main__":
    main()
