import { ReportTemplate, ReportType } from '../interfaces/report.interface';

export const youthProspectTemplate: ReportTemplate = {
  name: 'Youth Prospect Report',
  description: 'Detailed analysis of young player potential and development path',
  sections: [
    {
      name: 'Prospect Profile',
      fields: ['age', 'youth_level', 'development_stage', 'physical_maturity'],
    },
    {
      name: 'Technical Foundation',
      fields: ['technical_basics', 'learning_speed', 'coachability', 'touch_quality'],
    },
    {
      name: 'Development Potential',
      fields: ['ceiling_projection', 'growth_areas', 'timeline', 'risk_factors'],
    },
    {
      name: 'Personality & Character',
      fields: ['attitude', 'work_ethic', 'coachability', 'mental_strength'],
    },
    {
      name: 'Development Plan',
      fields: ['training_priorities', 'pathway', 'loan_needs', 'timeline'],
    },
  ],
  promptTemplate: `Provide a comprehensive youth prospect analysis for {player_name} ({position}):

Prospect Data:
{stats}

Deliver a detailed youth prospect evaluation covering:

1. **Prospect Summary** (3-4 sentences)
   - Current development stage
   - Standout qualities
   - Primary development needs
   - Overall prospect rating (Elite/High/Medium/Low potential)

2. **Technical Skills Assessment**
   - Rate current technical level (0-10)
   - Rate technical potential ceiling (0-10)
   - List 3-5 technical strengths for age
   - List 3-4 technical areas to develop
   - Detailed analysis (75-100 words)
   - Technical learning curve assessment

3. **Tactical Understanding Assessment**
   - Rate current tactical awareness (0-10)
   - Rate tactical potential ceiling (0-10)
   - List 3-4 tactical strengths for age
   - List 3-4 tactical development needs
   - Detailed analysis (75-100 words)
   - Game intelligence evaluation

4. **Physical Development**
   - Rate current physical level (0-10)
   - Rate physical potential ceiling (0-10)
   - List 3-4 physical strengths
   - List 2-3 physical areas to develop
   - Detailed analysis (60-80 words)
   - Physical maturity stage
   - Growth expectations

5. **Mental & Character Assessment**
   - Rate current mental strength (0-10)
   - Rate mental potential ceiling (0-10)
   - List 4-5 positive character traits
   - List 2-3 mental areas for growth
   - Detailed analysis (75-100 words)
   - Work ethic evaluation
   - Coachability assessment
   - Pressure handling
   - Leadership potential

6. **Current Ability Rating** (0-10)
   - Rating relative to age group
   - Rating relative to senior level

7. **Potential Ceiling Assessment**
   - Realistic best-case scenario: e.g., "Elite player", "Solid professional", "Squad player"
   - Likely outcome: e.g., "First-team regular", "Rotation player", "Lower league"
   - Confidence in projection (High/Medium/Low)
   - Age when likely to reach potential
   - Factors that could accelerate/limit development

8. **Development Recommendations** (6-8 specific points)
   - Immediate training priorities (technical)
   - Tactical development focus
   - Physical development program
   - Mental development needs
   - Playing time recommendations
   - Loan vs. stay decision
   - Position development path
   - Mentorship recommendations

9. **Risk Factors & Concerns**
   - Injury susceptibility (if any)
   - Physical development uncertainties
   - Mental/character red flags (if any)
   - Competition for pathway
   - Environmental factors
   - Risk level (Low/Medium/High)

10. **Comparable Player Trajectories** (4-6 examples)
    - Similar prospects who succeeded
    - Similar prospects who didn't fulfill potential
    - Players with similar profile at same age
    - Realistic role models

11. **Investment Recommendation**
    - Academy retention priority (Must Keep/High/Medium/Low)
    - Contract recommendation
    - Development budget justification
    - Timeline to first team (if applicable)
    - Expected career path
    - Resale value potential

12. **3-Year Development Projection**
    - Year 1 expectations
    - Year 2 expectations
    - Year 3 expectations
    - Key milestones to track

Focus on realistic potential assessment, concrete development pathways, and age-appropriate expectations.`,
};
