import { ReportTemplate, ReportType } from '../interfaces/report.interface';

export const transferTargetTemplate: ReportTemplate = {
  name: 'Transfer Target Report',
  description: 'Detailed analysis for potential transfer/signing decision',
  sections: [
    {
      name: 'Player Profile',
      fields: ['age', 'nationality', 'current_club', 'contract_status', 'market_value'],
    },
    {
      name: 'Performance Analysis',
      fields: ['career_stats', 'recent_form', 'consistency', 'peak_level'],
    },
    {
      name: 'Team Fit Assessment',
      fields: ['tactical_fit', 'squad_role', 'immediate_impact', 'adaptation_risk'],
    },
    {
      name: 'Investment Analysis',
      fields: ['value_for_money', 'resale_potential', 'wage_demands', 'roi_projection'],
    },
    {
      name: 'Risk Assessment',
      fields: ['injury_history', 'adaptation_challenges', 'competition', 'red_flags'],
    },
  ],
  promptTemplate: `Provide a comprehensive transfer target analysis for {player_name} ({position}):

Player Data:
{stats}

Deliver a detailed transfer evaluation covering:

1. **Executive Summary** (3-4 sentences)
   - Overall transfer recommendation (Strong Yes / Yes / Maybe / No / Strong No)
   - Key selling points
   - Primary concerns
   - Expected impact timeline

2. **Technical Skills Evaluation**
   - Rate technical ability (0-10)
   - List 3-5 technical strengths
   - List 2-3 technical limitations
   - Detailed analysis (75-100 words)
   - Technical fit with club's playing style

3. **Tactical Fit Analysis**
   - Rate tactical suitability (0-10)
   - List 3-5 tactical strengths
   - List 2-3 tactical concerns
   - Detailed analysis (75-100 words)
   - Specific role recommendations
   - Formation compatibility

4. **Physical Profile**
   - Rate physical attributes (0-10)
   - List 3-4 physical strengths
   - List 1-2 physical concerns
   - Detailed analysis (60-80 words)
   - League adaptation considerations

5. **Mental Attributes & Character**
   - Rate mentality (0-10)
   - List 3-4 mental strengths
   - List 1-2 character concerns
   - Detailed analysis (60-80 words)
   - Leadership potential
   - Dressing room impact

6. **Overall Player Rating** (0-10)
   - Current ability level
   - Rating in context of league/competition

7. **Potential Assessment**
   - Current level: e.g., "Top-tier starter", "Solid rotation", "Backup quality"
   - Growth potential: e.g., "Elite potential", "Moderate growth expected", "Peak/declining"
   - Age curve considerations
   - 3-year projection

8. **Transfer Recommendations** (5-7 specific points)
   - Signing recommendation with confidence level (%)
   - Ideal squad role (starter, rotation, depth)
   - Immediate vs. long-term impact
   - Contract length recommendation
   - Wage bracket recommendation
   - Key negotiation points
   - Pre-signing medical/fitness checks needed

9. **Risk Assessment**
   - Injury history concerns (if any)
   - Adaptation risk level (Low/Medium/High)
   - Age-related considerations
   - Competition for place
   - Other red flags or concerns

10. **Comparable Players** (4-6 players)
    - Similar profile players in same league
    - Alternative targets
    - Players who made similar moves successfully/unsuccessfully

11. **Value Assessment**
    - Fair market value estimate
    - Value for money assessment
    - Resale value potential (3-5 years)
    - Return on investment projection

Focus on club-specific fit, realistic assessment, and decision-making support.`,
};
