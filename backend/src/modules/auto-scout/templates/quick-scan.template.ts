import { ReportTemplate, ReportType } from '../interfaces/report.interface';

export const quickScanTemplate: ReportTemplate = {
  id: 'quick-scan',
  name: 'Quick Scan',
  description: 'Fast overview of key stats and highlights',
  icon: 'flash',
  useCase: 'Quick assessment',
  estimatedCost: '$0.016',
  reportType: ReportType.QUICK_SCAN,
  sections: [
    {
      name: 'Quick Profile',
      fields: ['position', 'age', 'key_stats'],
    },
    {
      name: 'Snapshot Assessment',
      fields: ['strengths', 'weaknesses', 'fit'],
    },
  ],
  promptTemplate: `Provide a quick scan analysis for {player_name} ({position}):

Player Data:
{stats}

Deliver a concise but informative initial assessment covering:

1. **Quick Summary** (2-3 sentences)
   - Player type and style
   - Immediate standout quality
   - Quick verdict (Worth detailed scout / Monitor / Pass)

2. **Technical Skills**
   - Rating (0-10)
   - Top 2 strengths
   - Top 1-2 weaknesses
   - Brief notes (30-40 words)

3. **Tactical Awareness**
   - Rating (0-10)
   - Top 2 strengths
   - Top 1-2 weaknesses
   - Brief notes (30-40 words)

4. **Physical Attributes**
   - Rating (0-10)
   - Top 2 strengths
   - Top 1 weakness
   - Brief notes (20-30 words)

5. **Mental Attributes**
   - Rating (0-10)
   - Top 2 strengths
   - Top 1 area to improve
   - Brief notes (20-30 words)

6. **Overall Rating** (0-10)

7. **Potential Level**
   - One-line description (e.g., "Mid-table starter potential", "Elite prospect")

8. **Quick Recommendations** (2-3 bullet points)
   - Scout further? Yes/No
   - Key areas to investigate if yes
   - Alternative uses if applicable

9. **Similar Players** (2-3 names)

Keep it concise, decisive, and actionable for initial screening purposes.`,
};
