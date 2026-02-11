"""
Script to prepare training data for the market value prediction model.
This script generates mock training data based on realistic player valuations.

In production, you would:
1. Integrate with Transfermarkt API or similar services
2. Use historical transfer data
3. Fetch real player statistics from your database
"""

import pandas as pd
import numpy as np
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrainingDataGenerator:
    """Generate realistic training data for player market values"""

    def __init__(self, n_samples: int = 10000):
        """
        Initialize the data generator

        Args:
            n_samples: Number of training samples to generate
        """
        self.n_samples = n_samples

        # Position distribution
        self.positions = ['GK', 'DEF', 'MID', 'FWD']
        self.position_weights = [0.10, 0.30, 0.35, 0.25]

        # Leagues
        self.leagues = {
            'Premier League': 5,
            'LaLiga': 5,
            'Serie A': 5,
            'Bundesliga': 5,
            'Ligue 1': 5,
            'Primeira Liga': 4,
            'Eredivisie': 4,
            'Championship': 3,
            'MLS': 3,
            'Liga MX': 2,
            'Saudi Pro League': 2,
            'Other': 1
        }

        # Top football nations
        self.top_nations = [
            'Brazil', 'France', 'Spain', 'Germany', 'England',
            'Argentina', 'Portugal', 'Italy', 'Netherlands', 'Belgium',
            'Croatia', 'Uruguay', 'Colombia', 'Mexico', 'USA',
            'Poland', 'Denmark', 'Austria', 'Serbia', 'Switzerland'
        ]

        # Other nations
        self.other_nations = [
            'Japan', 'South Korea', 'Nigeria', 'Ghana', 'Senegal',
            'Morocco', 'Egypt', 'Algeria', 'Ivory Coast', 'Cameroon',
            'Turkey', 'Greece', 'Norway', 'Sweden', 'Czech Republic'
        ]

    def generate_player(self) -> Dict:
        """Generate a single player's data"""

        # Position
        position = np.random.choice(self.positions, p=self.position_weights)

        # Age (normal distribution around 25)
        age = int(np.clip(np.random.normal(25, 4), 17, 38))

        # League
        league = np.random.choice(list(self.leagues.keys()))
        league_tier = self.leagues[league]

        # Nationality
        if np.random.random() < 0.6:
            nationality = np.random.choice(self.top_nations)
        else:
            nationality = np.random.choice(self.other_nations)

        # Appearances (younger players have fewer appearances)
        age_factor = (age - 17) / 21  # Normalized age factor
        appearances = int(np.random.gamma(3, 10) * age_factor) + 1
        appearances = min(appearances, 400)

        # Physical attributes
        if position == 'GK':
            height = np.random.normal(188, 5)
            weight = np.random.normal(82, 6)
        elif position == 'DEF':
            height = np.random.normal(183, 5)
            weight = np.random.normal(78, 6)
        elif position == 'MID':
            height = np.random.normal(178, 5)
            weight = np.random.normal(73, 5)
        else:  # FWD
            height = np.random.normal(180, 6)
            weight = np.random.normal(75, 6)

        height = np.clip(height, 165, 205)
        weight = np.clip(weight, 60, 95)

        # Performance metrics based on position and quality
        quality_factor = np.random.beta(2, 5)  # Most players are average

        # Rating (6.0 - 8.5, with most around 6.5-7.0)
        rating = 6.0 + quality_factor * 2.5

        # Goals and assists (position dependent)
        if position == 'GK':
            goals = 0
            assists = 0
        elif position == 'DEF':
            goals = int(np.random.poisson(0.05 * appearances * quality_factor))
            assists = int(np.random.poisson(0.08 * appearances * quality_factor))
        elif position == 'MID':
            goals = int(np.random.poisson(0.12 * appearances * quality_factor))
            assists = int(np.random.poisson(0.15 * appearances * quality_factor))
        else:  # FWD
            goals = int(np.random.poisson(0.25 * appearances * quality_factor))
            assists = int(np.random.poisson(0.10 * appearances * quality_factor))

        # Contract years remaining
        contract_years = np.random.uniform(0.5, 5.0)

        # Calculate market value based on multiple factors
        base_value = self._calculate_market_value(
            age=age,
            position=position,
            league_tier=league_tier,
            quality_factor=quality_factor,
            appearances=appearances,
            goals=goals,
            assists=assists,
            rating=rating,
            nationality=nationality,
            contract_years=contract_years
        )

        return {
            'age': age,
            'position': position,
            'league': league,
            'goals': goals,
            'assists': assists,
            'appearances': appearances,
            'rating': round(rating, 2),
            'height': round(height, 1),
            'weight': round(weight, 1),
            'nationality': nationality,
            'contract_years_remaining': round(contract_years, 1),
            'market_value': round(base_value, 2)
        }

    def _calculate_market_value(
        self,
        age: int,
        position: str,
        league_tier: int,
        quality_factor: float,
        appearances: int,
        goals: int,
        assists: int,
        rating: float,
        nationality: str,
        contract_years: float
    ) -> float:
        """Calculate realistic market value based on player attributes"""

        # Base value from quality
        base = 1.0 + quality_factor * 50

        # Age factor (peak at 25-28)
        age_multiplier = 1.0 - abs(age - 26.5) / 20
        age_multiplier = max(0.3, age_multiplier)

        # League factor
        league_multiplier = league_tier / 5.0

        # Position factor (forwards typically more expensive)
        position_multipliers = {
            'GK': 0.7,
            'DEF': 0.8,
            'MID': 1.0,
            'FWD': 1.2
        }
        position_multiplier = position_multipliers[position]

        # Performance factor (goals/assists per game)
        if appearances > 0:
            performance = (goals + assists) / appearances
        else:
            performance = 0
        performance_multiplier = 1.0 + performance * 10

        # Rating factor
        rating_multiplier = rating / 7.0

        # Nationality factor
        nationality_multiplier = 1.2 if nationality in self.top_nations else 1.0

        # Contract factor
        contract_multiplier = min(contract_years / 3.0, 1.5)

        # Experience factor
        experience_multiplier = 1.0 + np.log1p(appearances) / 10

        # Calculate final value
        market_value = (
            base *
            age_multiplier *
            league_multiplier *
            position_multiplier *
            performance_multiplier *
            rating_multiplier *
            nationality_multiplier *
            contract_multiplier *
            experience_multiplier
        )

        # Add some random variation (±20%)
        market_value *= np.random.uniform(0.8, 1.2)

        # Ensure minimum and maximum values
        market_value = max(0.1, min(market_value, 200.0))

        return market_value

    def generate_dataset(self) -> pd.DataFrame:
        """Generate the complete training dataset"""

        logger.info(f"Generating {self.n_samples} training samples...")

        players = []
        for i in range(self.n_samples):
            if (i + 1) % 1000 == 0:
                logger.info(f"Generated {i + 1}/{self.n_samples} samples")

            player = self.generate_player()
            players.append(player)

        df = pd.DataFrame(players)

        logger.info(f"Dataset generated successfully!")
        logger.info(f"Shape: {df.shape}")
        logger.info(f"Market value range: €{df['market_value'].min():.2f}M - €{df['market_value'].max():.2f}M")
        logger.info(f"Market value mean: €{df['market_value'].mean():.2f}M")
        logger.info(f"Market value median: €{df['market_value'].median():.2f}M")

        return df

    def save_dataset(self, df: pd.DataFrame, filepath: str = "training_data.csv"):
        """Save the dataset to CSV"""

        df.to_csv(filepath, index=False)
        logger.info(f"Dataset saved to {filepath}")

        # Save summary statistics
        with open("training_data_summary.txt", 'w') as f:
            f.write("TRAINING DATA SUMMARY\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Total samples: {len(df)}\n")
            f.write(f"Generated at: {datetime.now().isoformat()}\n\n")

            f.write("MARKET VALUE STATISTICS:\n")
            f.write(f"  Min: €{df['market_value'].min():.2f}M\n")
            f.write(f"  Max: €{df['market_value'].max():.2f}M\n")
            f.write(f"  Mean: €{df['market_value'].mean():.2f}M\n")
            f.write(f"  Median: €{df['market_value'].median():.2f}M\n")
            f.write(f"  Std: €{df['market_value'].std():.2f}M\n\n")

            f.write("POSITION DISTRIBUTION:\n")
            for pos, count in df['position'].value_counts().items():
                f.write(f"  {pos}: {count} ({count/len(df)*100:.1f}%)\n")

            f.write("\nLEAGUE DISTRIBUTION:\n")
            for league, count in df['league'].value_counts().head(10).items():
                f.write(f"  {league}: {count} ({count/len(df)*100:.1f}%)\n")

            f.write("\nAGE DISTRIBUTION:\n")
            f.write(f"  Min: {df['age'].min()}\n")
            f.write(f"  Max: {df['age'].max()}\n")
            f.write(f"  Mean: {df['age'].mean():.1f}\n")

        logger.info("Summary statistics saved to training_data_summary.txt")

def main():
    """Main function to generate training data"""

    # Generate dataset
    generator = TrainingDataGenerator(n_samples=10000)
    df = generator.generate_dataset()

    # Display sample
    print("\nSample of generated data:")
    print(df.head(10))

    # Display statistics
    print("\nDataset Statistics:")
    print(df.describe())

    # Save dataset
    generator.save_dataset(df)

    print("\nTraining data generation completed successfully!")
    print("You can now train the model using: python model_trainer.py")

if __name__ == "__main__":
    main()
