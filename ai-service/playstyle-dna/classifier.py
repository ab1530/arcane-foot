"""
PlayStyle DNA Classifier
Classifies individual players into play style categories
"""
import joblib
import numpy as np
from typing import Dict, List, Optional
import os


class PlayStyleClassifier:
    """
    Classifies players based on their statistics using pre-trained K-Means model
    """

    def __init__(self, model_dir: str = "models", version: str = "v1"):
        """
        Initialize classifier with pre-trained models
        """
        self.model_dir = model_dir
        self.version = version

        # Load models
        self.kmeans = joblib.load(f"{model_dir}/playstyle_kmeans_{version}.pkl")
        self.scaler = joblib.load(f"{model_dir}/scaler_{version}.pkl")
        self.pca = joblib.load(f"{model_dir}/pca_{version}.pkl")
        self.style_mapping = joblib.load(f"{model_dir}/style_mapping_{version}.pkl")
        self.feature_cols = joblib.load(f"{model_dir}/features_{version}.pkl")

        # Style descriptions
        self.style_descriptions = {
            "Playmaker": {
                "description": "Creative midfielders who dictate tempo and create chances through vision and technical ability",
                "characteristics": ["Technical Excellence", "Creative Vision", "Passing Range", "Game Intelligence"],
                "real_world_examples": ["Kevin De Bruyne", "Luka Modrić", "Bruno Fernandes", "Toni Kroos"],
            },
            "Physical Enforcer": {
                "description": "Dominant physical presence who uses strength and aggression to control their area",
                "characteristics": ["Physical Dominance", "Aggression", "Aerial Ability", "Tackling Strength"],
                "real_world_examples": ["Casemiro", "Fabinho", "N'Golo Kanté", "Declan Rice"],
            },
            "Box-to-Box Engine": {
                "description": "Tireless runners who cover the entire pitch with stamina and versatility",
                "characteristics": ["High Work Rate", "Stamina", "Versatility", "Tactical Awareness"],
                "real_world_examples": ["Joshua Kimmich", "Leon Goretzka", "Kevin De Bruyne", "Arturo Vidal"],
            },
            "Tactical Anchor": {
                "description": "Intelligent players who control tempo through positioning and game reading",
                "characteristics": ["Tactical Intelligence", "Positioning", "Composure", "Passing Accuracy"],
                "real_world_examples": ["Sergio Busquets", "Rodri", "Jorginho", "Pierre-Emile Højbjerg"],
            },
            "Speed Demon": {
                "description": "Explosive athletes with exceptional pace and acceleration for direct running",
                "characteristics": ["Exceptional Pace", "Acceleration", "Direct Running", "Counter-Attack Threat"],
                "real_world_examples": ["Kylian Mbappé", "Adama Traoré", "Alphonso Davies", "Vinícius Jr"],
            },
            "Clinical Finisher": {
                "description": "Composed strikers with technical ability and mental strength to finish chances",
                "characteristics": ["Composure", "Finishing", "Positioning", "Mental Strength"],
                "real_world_examples": ["Harry Kane", "Robert Lewandowski", "Erling Haaland", "Karim Benzema"],
            },
            "Creative Dribbler": {
                "description": "Flair players with exceptional dribbling and unpredictable playmaking ability",
                "characteristics": ["Dribbling", "Flair", "Unpredictability", "One-on-One Ability"],
                "real_world_examples": ["Neymar", "Lionel Messi", "Jadon Sancho", "Mohamed Salah"],
            },
            "Defensive Wall": {
                "description": "Rock-solid defenders with positioning and physical strength to prevent goals",
                "characteristics": ["Defensive Positioning", "Tackling", "Concentration", "Physical Strength"],
                "real_world_examples": ["Virgil van Dijk", "Rúben Dias", "Antonio Rüdiger", "William Saliba"],
            },
            "Deep-Lying Orchestrator": {
                "description": "Deep playmakers who control tempo from deep positions with passing range",
                "characteristics": ["Passing Range", "Vision", "Calmness", "Tempo Control"],
                "real_world_examples": ["Andrea Pirlo", "Xabi Alonso", "Thiago Alcântara", "Manuel Locatelli"],
            },
            "Pressing Machine": {
                "description": "Relentless pressers with high work rate and aggression to win the ball",
                "characteristics": ["Work Rate", "Aggression", "Stamina", "Ball Winning"],
                "real_world_examples": ["Marcelo Brozović", "Ilkay Gündogan", "Aurélien Tchouaméni", "Enzo Fernández"],
            },
            "Target Man": {
                "description": "Physical aerial threats with hold-up play ability for strikers",
                "characteristics": ["Aerial Ability", "Strength", "Hold-Up Play", "Physical Presence"],
                "real_world_examples": ["Olivier Giroud", "Diego Costa", "Romelu Lukaku", "Zlatan Ibrahimović"],
            },
            "Balanced All-Rounder": {
                "description": "Well-rounded players without dominant characteristics but competent in all areas",
                "characteristics": ["Versatility", "Consistency", "Team Player", "Adaptability"],
                "real_world_examples": ["James Milner", "Thomas Müller", "Sergi Roberto", "Mason Mount"],
            },
        }

    def extract_features(self, profile: Dict) -> np.ndarray:
        """
        Extract feature vector from player profile
        """
        features = []
        for col in self.feature_cols:
            # Map camelCase to snake_case
            camel_to_snake = {
                'technicalSkills': 'technical_skills',
                'tacticalAwareness': 'tactical_awareness',
                'physicalAttributes': 'physical_attributes',
                'mentalAttributes': 'mental_attributes',
                'pace': 'pace',
                'strength': 'strength',
                'workRate': 'work_rate',
                'creativity': 'creativity',
                'aggression': 'aggression',
                'vision': 'vision',
            }

            # Try both naming conventions
            value = profile.get(col)
            if value is None:
                # Try camelCase version
                for camel, snake in camel_to_snake.items():
                    if snake == col:
                        value = profile.get(camel)
                        break

            # Default to 5.0 if missing
            if value is None:
                value = 5.0

            features.append(float(value))

        return np.array(features)

    def classify(self, profile: Dict) -> Dict:
        """
        Classify a player's play style

        Args:
            profile: Dictionary with player statistics

        Returns:
            Classification result with style, confidence, and recommendations
        """
        # Extract features
        features = self.extract_features(profile)

        # Normalize
        features_scaled = self.scaler.transform([features])

        # PCA
        features_pca = self.pca.transform(features_scaled)

        # Predict cluster
        cluster = self.kmeans.predict(features_pca)[0]

        # Get style
        primary_style = self.style_mapping[cluster]

        # Calculate confidence (inverse of distance to cluster centroid)
        distances = self.kmeans.transform(features_pca)[0]
        distance_to_cluster = distances[cluster]
        max_distance = np.max(distances)

        # Confidence: closer to centroid = higher confidence
        # Normalize to 0-1 range, with exponential scaling for better distribution
        confidence = max(0, 1 - (distance_to_cluster / (max_distance + 0.1)))
        confidence = min(1.0, confidence ** 0.5)  # Square root for better scaling

        # Get secondary style (second closest cluster)
        sorted_distances = np.argsort(distances)
        secondary_cluster = sorted_distances[1] if len(sorted_distances) > 1 else None
        secondary_style = self.style_mapping[secondary_cluster] if secondary_cluster is not None else None

        # Calculate DNA profile (radar chart data)
        dna_profile = self.calculate_dna_profile(features)

        # Generate recommendations
        recommendations = self.generate_recommendations(primary_style, dna_profile, features)

        # Get style info
        style_info = self.style_descriptions.get(primary_style, {})

        return {
            "playerId": profile.get("playerId"),
            "primaryStyle": primary_style,
            "secondaryStyle": secondary_style,
            "styleConfidence": round(confidence, 3),
            "cluster": int(cluster),
            "dnaProfile": dna_profile,
            "styleDescription": style_info.get("description", ""),
            "keyCharacteristics": style_info.get("characteristics", []),
            "realWorldExamples": style_info.get("real_world_examples", []),
            "recommendations": recommendations,
        }

    def calculate_dna_profile(self, features: np.ndarray) -> Dict[str, float]:
        """
        Generate radar chart data from features

        Returns normalized (0-10) scores for visualization
        """
        feature_mapping = {
            "Technical": features[0],
            "Tactical": features[1],
            "Physical": features[2],
            "Mental": features[3],
            "Pace": features[4],
            "Strength": features[5],
            "Work Rate": features[6],
            "Creativity": features[7],
        }

        # Round to 1 decimal place
        return {k: round(v, 1) for k, v in feature_mapping.items()}

    def generate_recommendations(
        self, style: str, dna_profile: Dict[str, float], features: np.ndarray
    ) -> List[str]:
        """
        Generate personalized development recommendations based on play style
        """
        recommendations = []

        # Style-specific recommendations
        style_recommendations = {
            "Playmaker": [
                "Focus on vision and passing range training",
                "Study top playmakers' positioning and decision-making",
                "Develop set-piece delivery skills",
            ],
            "Physical Enforcer": [
                "Maintain strength and conditioning program",
                "Work on tactical discipline to avoid unnecessary fouls",
                "Develop ball-winning techniques and timing",
            ],
            "Box-to-Box Engine": [
                "Build exceptional cardiovascular endurance",
                "Practice transitional play from defense to attack",
                "Develop versatility across multiple positions",
            ],
            "Tactical Anchor": [
                "Study game footage to improve reading of play",
                "Work on distribution and tempo control",
                "Develop communication and organization skills",
            ],
            "Speed Demon": [
                "Maximize explosive power and acceleration",
                "Improve decision-making at high speed",
                "Work on finishing after fast runs",
            ],
            "Clinical Finisher": [
                "Practice finishing under pressure",
                "Study movement patterns of elite strikers",
                "Develop composure in one-on-one situations",
            ],
            "Creative Dribbler": [
                "Enhance close control and dribbling variety",
                "Work on decision-making when to dribble vs pass",
                "Develop end product (assists and goals)",
            ],
            "Defensive Wall": [
                "Master defensive positioning and angles",
                "Build leadership and communication skills",
                "Study opponent striker movements",
            ],
            "Deep-Lying Orchestrator": [
                "Expand passing range and accuracy",
                "Improve spatial awareness under pressure",
                "Develop defensive contribution",
            ],
            "Pressing Machine": [
                "Perfect pressing triggers and intensity",
                "Build stamina for sustained high intensity",
                "Improve tactical coordination with teammates",
            ],
            "Target Man": [
                "Develop hold-up play and shielding",
                "Improve aerial dominance and timing",
                "Work on linking play with midfielders",
            ],
            "Balanced All-Rounder": [
                "Identify and develop a signature strength",
                "Focus on consistency across all attributes",
                "Increase tactical versatility",
            ],
        }

        recommendations.extend(style_recommendations.get(style, []))

        # Add attribute-specific recommendations based on weakest areas
        if dna_profile["Technical"] < 6.0:
            recommendations.append("Improve technical skills through dedicated ball work")

        if dna_profile["Pace"] < 6.0:
            recommendations.append("Focus on speed and acceleration training")

        if dna_profile["Physical"] < 6.0:
            recommendations.append("Increase strength and conditioning work")

        return recommendations[:5]  # Return top 5 recommendations

    def find_similar_players(
        self,
        player_id: str,
        cluster: int,
        all_players: List[Dict],
        limit: int = 5
    ) -> List[Dict]:
        """
        Find similar players based on cluster membership and feature similarity

        Args:
            player_id: ID of the target player
            cluster: Cluster assignment
            all_players: List of all player profiles with classifications
            limit: Number of similar players to return

        Returns:
            List of similar player profiles
        """
        # Filter players in same cluster
        cluster_players = [
            p for p in all_players
            if p.get("cluster") == cluster and p.get("playerId") != player_id
        ]

        # Sort by confidence (higher confidence = more typical of cluster)
        cluster_players.sort(key=lambda x: x.get("styleConfidence", 0), reverse=True)

        return cluster_players[:limit]

    def get_all_styles(self) -> Dict:
        """
        Get information about all play styles
        """
        return {
            "styles": list(self.style_descriptions.keys()),
            "styleMapping": self.style_mapping,
            "descriptions": self.style_descriptions,
        }


# Singleton instance
_classifier_instance: Optional[PlayStyleClassifier] = None


def get_classifier(model_dir: str = "models", version: str = "v1") -> PlayStyleClassifier:
    """
    Get or create singleton classifier instance
    """
    global _classifier_instance

    if _classifier_instance is None:
        _classifier_instance = PlayStyleClassifier(model_dir=model_dir, version=version)

    return _classifier_instance
