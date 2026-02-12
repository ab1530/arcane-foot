import { ReportTemplate, ReportType } from '../interfaces/report.interface';

export const matchPerformanceTemplate: ReportTemplate = {
  id: 'match-performance',
  name: 'Match Performance',
  description: 'Detailed analysis of player performance in a specific match',
  icon: 'football',
  useCase: 'Post-match analysis',
  estimatedCost: '$0.024',
  reportType: ReportType.MATCH_PERFORMANCE,
  sections: [
    {
      name: 'Match Overview',
      fields: ['match_date', 'opponent', 'result', 'minutes_played', 'position_played'],
    },
    {
      name: 'Key Contributions',
      fields: ['goals', 'assists', 'key_passes', 'shots', 'chances_created'],
    },
    {
      name: 'Technical Execution',
      fields: ['passing_accuracy', 'dribbles_completed', 'first_touch', 'ball_control'],
    },
    {
      name: 'Defensive Work',
      fields: ['tackles', 'interceptions', 'clearances', 'duels_won'],
    },
    {
      name: 'Physical Performance',
      fields: ['distance_covered', 'sprints', 'intensity', 'stamina'],
    },
    {
      name: 'Decision Making',
      fields: ['positioning', 'timing', 'risk_taking', 'game_reading'],
    },
  ],
  promptTemplate: `Analyze the following match performance for {player_name} ({position}):

Player Statistics:
{stats}

Provide a comprehensive match performance analysis covering:

1. **Match Performance Summary** (2-3 sentences)
   - Overall impact on the game
   - Key moments and contributions
   - Performance relative to expectations

2. **Technical Skills Analysis**
   - Rate technical execution (0-10)
   - List 2-3 specific technical strengths demonstrated
   - List 1-2 technical weaknesses or areas for improvement
   - Detailed analysis of technical performance (50-75 words)

3. **Tactical Awareness Analysis**
   - Rate tactical discipline and awareness (0-10)
   - List 2-3 tactical strengths (positioning, decision-making)
   - List 1-2 tactical weaknesses
   - Detailed analysis of tactical performance (50-75 words)

4. **Physical Attributes Analysis**
   - Rate physical performance (0-10)
   - List 2-3 physical strengths (pace, stamina, strength)
   - List 1-2 physical limitations observed
   - Detailed analysis (40-60 words)

5. **Mental Attributes Analysis**
   - Rate mental performance (0-10)
   - List 2-3 mental strengths (composure, concentration, work rate)
   - List 1-2 mental areas for improvement
   - Detailed analysis (40-60 words)

6. **Overall Match Rating** (0-10 scale)
   - Provide justified overall rating
   - Explain rating context

7. **Key Recommendations** (2-4 specific points)
   - Immediate focus areas for training
   - Tactical adjustments for next match
   - Development priorities

8. **Comparable Performance**
   - List 2-3 players with similar style/performance level

Focus on specific, observable actions and statistics. Be professional and balanced.`,
};
