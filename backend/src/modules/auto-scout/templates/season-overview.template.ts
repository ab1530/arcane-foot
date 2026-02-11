import { ReportTemplate, ReportType } from '../interfaces/report.interface';

export const seasonOverviewTemplate: ReportTemplate = {
  id: 'season-overview',
  name: 'Season Overview',
  description: 'Comprehensive season performance and development tracking',
  icon: 'barChart',
  useCase: 'End of season review',
  estimatedCost: '$0.028',
  reportType: ReportType.SEASON_OVERVIEW,
  sections: [
    {
      name: 'Season Statistics',
      fields: ['matches_played', 'goals', 'assists', 'avg_rating', 'consistency'],
    },
    {
      name: 'Performance Trends',
      fields: ['form_curve', 'improvement_areas', 'declining_areas', 'peak_performances'],
    },
    {
      name: 'Technical Development',
      fields: ['skill_progression', 'weaknesses_addressed', 'new_capabilities'],
    },
    {
      name: 'Tactical Evolution',
      fields: ['role_adaptation', 'positional_flexibility', 'tactical_maturity'],
    },
    {
      name: 'Physical Condition',
      fields: ['fitness_levels', 'injury_resilience', 'stamina_trends'],
    },
  ],
  promptTemplate: `Provide a comprehensive season overview analysis for {player_name} ({position}):

Player Season Data:
{stats}

Deliver a thorough season review covering:

1. **Season Summary** (3-4 sentences)
   - Overall season performance
   - Major achievements and highlights
   - Key challenges faced
   - Season grade (A+, A, B+, B, C+, C, D)

2. **Technical Skills Assessment**
   - Rate overall technical ability (0-10)
   - List 3-4 technical strengths demonstrated consistently
   - List 2-3 technical areas needing improvement
   - Detailed technical analysis (75-100 words)
   - Note any technical development/regression

3. **Tactical Awareness Assessment**
   - Rate tactical understanding (0-10)
   - List 3-4 tactical strengths
   - List 2-3 tactical development needs
   - Detailed tactical analysis (75-100 words)
   - Evolution of tactical role during season

4. **Physical Attributes Assessment**
   - Rate physical capabilities (0-10)
   - List 3-4 physical strengths
   - List 1-2 physical limitations
   - Detailed physical analysis (60-80 words)
   - Fitness and injury record impact

5. **Mental Attributes Assessment**
   - Rate mental strength (0-10)
   - List 3-4 mental strengths (consistency, leadership, resilience)
   - List 2-3 mental areas for growth
   - Detailed mental analysis (60-80 words)
   - Character and mentality evaluation

6. **Overall Season Rating** (0-10 scale)
   - Justified overall rating
   - Comparison to pre-season expectations

7. **Performance Trends**
   - Identify if player is improving, declining, or consistent
   - Explain trend reasoning

8. **Player Potential Assessment**
   - Current level description
   - Realistic potential ceiling
   - Timeline for reaching potential
   - Key factors affecting development

9. **Strategic Recommendations** (4-6 points)
   - Off-season training focus
   - Next season objectives
   - Tactical role recommendations
   - Contract/transfer considerations (if relevant)

10. **Comparable Players** (3-5 players)
    - Players with similar profile
    - Players at similar career stage
    - Players with similar playing style

Be data-driven, balanced, and forward-looking in your analysis.`,
};
