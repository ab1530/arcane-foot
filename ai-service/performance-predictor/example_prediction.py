"""
Example: How to use the Performance Predictor

This demonstrates a complete prediction workflow.
"""

from predictor import PerformancePredictor, PredictionRequest

def example_prediction():
    """Run an example prediction"""

    print("\n" + "="*70)
    print("PERFORMANCE PREDICTOR - EXAMPLE")
    print("="*70 + "\n")

    # Initialize predictor (loads trained model)
    try:
        predictor = PerformancePredictor()
        print("✅ Model loaded successfully\n")
    except FileNotFoundError:
        print("❌ Model not found. Run model_trainer.py first:")
        print("   python -m performance_predictor.model_trainer\n")
        return

    # Example: Predict Luka Modrić's performance in El Clásico
    print("Example Player: Luka Modrić")
    print("Example Match: Real Madrid vs Barcelona (El Clásico)\n")

    # Prepare prediction request
    request = PredictionRequest(
        player_id="modric-10",

        # Match context
        match_context={
            'venue': 'home',                    # Playing at Santiago Bernabéu
            'importance': 5,                    # El Clásico = maximum importance
            'opponent_strength': 5,             # Barcelona = very strong opponent
            'days_rest': 5,                     # Had 5 days since last match
            'season_progress': 0.65,            # Late in season (65% through)
            'playing_position': 'CM',           # Central midfield
        },

        # Recent form (last 5 matches)
        recent_form=[7.2, 7.5, 7.8, 8.0, 7.9],  # Excellent recent form

        # Season statistics
        season_stats={
            'avg_minutes': 78,                  # Average 78 min per match
            'technical_rating': 8.2,            # Elite technical skills
            'tactical_rating': 8.5,             # Elite tactical awareness
            'physical_rating': 6.8,             # Declining physicality (age 39)
            'mental_rating': 9.0,               # Elite mentality
        },

        # Player attributes
        player_attributes={
            'age': 39,                          # Veteran player
            'height': 172,                      # 172 cm
            'weight': 66,                       # 66 kg
            'market_value': 5000000,            # €5M market value
            'position': 'CM',                   # Central midfielder
        },
    )

    print("Input Data:")
    print(f"  - Recent form: {request.recent_form}")
    print(f"  - Venue: {request.match_context['venue']}")
    print(f"  - Opponent strength: {request.match_context['opponent_strength']}/5")
    print(f"  - Match importance: {request.match_context['importance']}/5")
    print(f"  - Days rest: {request.match_context['days_rest']}")
    print(f"  - Age: {request.player_attributes['age']}")
    print()

    # Make prediction
    print("Running prediction...\n")
    prediction = predictor.predict(request)

    # Display results
    print("="*70)
    print("PREDICTION RESULTS")
    print("="*70)
    print(f"\n🎯 Predicted Rating: {prediction.predicted_rating}/10")
    print(f"   Confidence Interval: [{prediction.confidence_interval[0]:.2f}, {prediction.confidence_interval[1]:.2f}]")
    print(f"   Prediction Confidence: {prediction.confidence*100:.0f}%")

    print("\n📊 Rating Distribution:")
    for rating_range, probability in prediction.rating_distribution.items():
        bar_length = int(probability * 50)
        bar = "█" * bar_length
        print(f"   {rating_range:20s} {bar:50s} {probability*100:5.1f}%")

    print("\n🔍 Key Influencing Factors:")
    for i, factor in enumerate(prediction.key_factors, 1):
        impact_emoji = "📈" if factor['impact'] == 'positive' else "📉" if factor['impact'] == 'negative' else "➡️"
        print(f"   {i}. {impact_emoji} {factor['description']}")
        print(f"      (Importance: {factor['importance']*100:.1f}%, Impact: {factor['impact']})")

    print("\n💡 Recommendations:")
    for i, rec in enumerate(prediction.recommendations, 1):
        print(f"   {i}. {rec}")

    print("\n" + "="*70)
    print("Interpretation:")
    print("="*70)

    if prediction.predicted_rating >= 8.0:
        print("🌟 EXCELLENT performance predicted")
        print("   Player is in great form and conditions favor high performance.")
    elif prediction.predicted_rating >= 7.0:
        print("✅ GOOD performance predicted")
        print("   Player should perform at or above their average level.")
    elif prediction.predicted_rating >= 6.0:
        print("⚠️  AVERAGE performance predicted")
        print("   Player may face challenges but should contribute.")
    else:
        print("❌ BELOW AVERAGE performance predicted")
        print("   Consider tactical adjustments or rotation.")

    print(f"\nConfidence: {prediction.confidence*100:.0f}%")
    if prediction.confidence >= 0.8:
        print("   High data quality - prediction is reliable")
    elif prediction.confidence >= 0.6:
        print("   Moderate data quality - use with caution")
    else:
        print("   Low data quality - prediction may be unreliable")

    print("\n" + "="*70 + "\n")

    return prediction


def batch_prediction_example():
    """Example: Predict entire squad"""

    print("\n" + "="*70)
    print("BATCH PREDICTION EXAMPLE - STARTING LINEUP")
    print("="*70 + "\n")

    # Simulate predicting entire starting 11
    players = [
        ("Courtois", "GK", [7.0, 7.2, 7.1, 7.3, 7.2]),
        ("Carvajal", "RB", [7.1, 7.3, 7.2, 7.4, 7.3]),
        ("Militão", "CB", [7.2, 7.4, 7.3, 7.5, 7.4]),
        ("Rüdiger", "CB", [7.3, 7.5, 7.4, 7.6, 7.5]),
        ("Mendy", "LB", [7.0, 7.2, 7.1, 7.3, 7.2]),
        ("Modrić", "CM", [7.2, 7.5, 7.8, 8.0, 7.9]),
        ("Camavinga", "CM", [7.4, 7.6, 7.5, 7.7, 7.6]),
        ("Bellingham", "CAM", [8.0, 8.2, 8.1, 8.3, 8.2]),
        ("Rodrygo", "RW", [7.3, 7.5, 7.4, 7.6, 7.5]),
        ("Vinícius Jr.", "LW", [8.1, 8.3, 8.2, 8.4, 8.3]),
        ("Benzema", "ST", [7.8, 8.0, 7.9, 8.1, 8.0]),
    ]

    print("Predicting performance for 4-3-3 formation:\n")

    total_predicted = 0
    predictions_list = []

    for name, position, recent_form in players:
        # Simplified prediction (in reality, would call full predictor)
        avg_form = sum(recent_form) / len(recent_form)
        # Simulate prediction (actual would use full model)
        predicted = avg_form + 0.1  # Slight boost for home advantage
        total_predicted += predicted
        predictions_list.append((name, position, predicted))

        print(f"  {position:4s} {name:20s} Recent: {avg_form:.1f} → Predicted: {predicted:.1f}")

    team_avg = total_predicted / len(players)

    print(f"\n🎯 Expected Team Performance: {team_avg:.2f}/10")

    if team_avg >= 7.5:
        print("   ✅ Strong performance expected from the team")
    elif team_avg >= 7.0:
        print("   ⚠️  Decent performance expected, but room for improvement")
    else:
        print("   ❌ Below-par performance expected - tactical adjustments needed")

    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    # Run single prediction example
    example_prediction()

    # Run batch prediction example
    batch_prediction_example()

    print("\n" + "="*70)
    print("To integrate with API:")
    print("="*70)
    print("""
# Start AI service
uvicorn main:app --reload --port 8000

# Call from NestJS
POST http://localhost:8000/performance/predict
{
  "playerId": "modric-10",
  "matchContext": {...},
  "recentForm": [7.2, 7.5, 7.8, 8.0, 7.9],
  "seasonStats": {...},
  "playerAttributes": {...}
}
""")
    print("="*70 + "\n")
