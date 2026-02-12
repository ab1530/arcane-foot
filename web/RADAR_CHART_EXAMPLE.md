# PlayStyle DNA Radar Chart Example

## Visual Representation

```
                    Technical (9.2)
                         /|\
                        / | \
                       /  |  \
         Work Rate    /   |   \    Tactical
           (7.5)     /    |    \    (8.8)
                    /     |     \
                   /      |      \
                  /       |       \
                 /        |        \
      Creativity *───────(•)───────* Physical
        (9.5)             |           (6.5)
                 \        |        /
                  \       |       /
                   \      |      /
                    \     |     /
                     \    |    /
         Strength     \   |   /     Mental
           (6.0)       \  |  /       (8.9)
                        \ | /
                         \|/
                      Pace (7.0)

        Player: Kevin De Bruyne
        Style: Playmaker
        Color: Purple (#A855F7)
```

## Chart Configuration

### Data Structure
```typescript
{
  labels: [
    'Technical',    // Top
    'Tactical',     // Top Right
    'Physical',     // Right
    'Mental',       // Bottom Right
    'Pace',         // Bottom
    'Strength',     // Bottom Left
    'Creativity',   // Left
    'Work Rate'     // Top Left
  ],
  datasets: [{
    label: 'Kevin De Bruyne',
    data: [9.2, 8.8, 6.5, 8.9, 7.0, 6.0, 9.5, 7.5],
    backgroundColor: 'rgba(168, 85, 247, 0.2)',  // Purple with 20% opacity
    borderColor: '#A855F7',                       // Purple
    borderWidth: 2,
    pointBackgroundColor: '#A855F7',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#A855F7',
    pointRadius: 4,
    pointHoverRadius: 6,
  }]
}
```

### Chart Options
```typescript
{
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      min: 0,
      max: 10,
      ticks: {
        stepSize: 2,                    // 0, 2, 4, 6, 8, 10
        color: '#9FA1A9',               // Arcane grey
        backdropColor: 'transparent',
        font: { size: 11 }
      },
      grid: {
        color: 'rgba(228, 255, 59, 0.1)',  // Arcane accent with transparency
        lineWidth: 1
      },
      pointLabels: {
        color: '#E5E7EB',               // Light grey
        font: { size: 13, weight: 500 },
        padding: 8
      },
      angleLines: {
        color: 'rgba(228, 255, 59, 0.15)',
        lineWidth: 1
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#E5E7EB',
        font: { size: 12, weight: 500 },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      backgroundColor: '#0F1425',
      titleColor: '#E4FF3B',
      bodyColor: '#E5E7EB',
      borderColor: '#1B2133',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.r.toFixed(1);
          return `${label}: ${value}/10`;
        }
      }
    }
  },
  animation: {
    duration: 2000,
    easing: 'easeInOutQuart'
  }
}
```

## Comparison Mode Example

```
                    Technical
                         /|\
                        / | \
                       /  |  \
         Work Rate    /   | * \    Tactical
                    */    |  •*\
                   / *    |  • *\
                  /   *   | •   *\
                 /     *  |•     *\
      Creativity *───────(•)───────* Physical
                 \     *• |  *   */
                  \   *  •|   * /
                   \ *   •|    */
                    */  • | * /
                     \ •  |* /
         Strength     \• |*/     Mental
                       \•|/
                        \|/
                         *
                        Pace

        Legend:
        • Player 1 (Purple) - Playmaker
        * Player 2 (Orange) - Speed Demon
```

### Multi-Player Data
```typescript
{
  labels: ['Technical', 'Tactical', 'Physical', 'Mental', 'Pace', 'Strength', 'Creativity', 'Work Rate'],
  datasets: [
    {
      label: 'Kevin De Bruyne',
      data: [9.2, 8.8, 6.5, 8.9, 7.0, 6.0, 9.5, 7.5],
      backgroundColor: 'rgba(168, 85, 247, 0.2)',
      borderColor: '#A855F7'
    },
    {
      label: 'Kylian Mbappé',
      data: [7.5, 6.5, 8.0, 7.0, 9.8, 6.5, 8.0, 8.5],
      backgroundColor: 'rgba(247, 115, 22, 0.2)',
      borderColor: '#F97316'
    }
  ]
}
```

## Style-Specific Examples

### Playmaker (Purple)
```
Strong in: Technical (9.2), Creativity (9.5), Tactical (8.8), Mental (8.9)
Moderate in: Work Rate (7.5), Pace (7.0)
Weak in: Physical (6.5), Strength (6.0)
Shape: Top-heavy octagon
```

### Speed Demon (Orange)
```
Strong in: Pace (9.8), Work Rate (8.5), Physical (8.0), Creativity (8.0)
Moderate in: Technical (7.5), Mental (7.0), Strength (6.5)
Weak in: Tactical (6.5)
Shape: Bottom-heavy octagon
```

### Physical Enforcer (Red)
```
Strong in: Strength (9.8), Physical (9.5), Mental (8.0), Work Rate (8.5)
Moderate in: Pace (7.5), Tactical (7.0)
Weak in: Technical (6.0), Creativity (5.5)
Shape: Right-heavy octagon
```

### Clinical Finisher (Green)
```
Strong in: Mental (9.0), Technical (8.5)
Moderate in: Tactical (8.0), Pace (7.5), Strength (7.5), Physical (7.0), Work Rate (7.0)
Weak in: Creativity (7.0)
Shape: Balanced octagon
```

## Arcane Theme Colors

All radar charts use the Arcane color scheme:

- **Background Fill**: Player's style color at 20% opacity
- **Border**: Player's style color at 100%
- **Grid Lines**: Arcane accent (#E4FF3B) at 10% opacity
- **Angle Lines**: Arcane accent at 15% opacity
- **Labels**: Light grey (#E5E7EB)
- **Ticks**: Arcane grey (#9FA1A9)
- **Points**: Style color with white border
- **Point Hover**: White with style color border

## Animation Sequence

1. **Initial Load** (0ms)
   - Chart container appears
   - Grid fades in

2. **Grid Lines** (200ms)
   - Radial lines draw outward
   - Angle lines rotate into place

3. **Data Points** (400ms-2000ms)
   - Points animate from center (0) to value
   - Path draws connecting points
   - Fill area expands
   - Smooth easeInOutQuart easing

4. **Legend** (2000ms)
   - Fades in at top
   - Player name and style color

## Responsive Behavior

### Desktop (>1024px)
- Chart height: 320px (h-80)
- Full labels visible
- Point radius: 4px
- Font size: 13px

### Tablet (768px-1024px)
- Chart height: 280px
- Labels may wrap
- Point radius: 3px
- Font size: 12px

### Mobile (<768px)
- Chart height: 240px
- Compact labels
- Point radius: 3px
- Font size: 11px

## Accessibility

- **Screen Readers**: Dataset label announced
- **Keyboard**: Tab to focus, arrow keys to navigate points
- **High Contrast**: Increased border width
- **Color Blind**: Patterns on fill areas
- **Touch**: Larger touch targets (16px min)

## Performance

- **First Paint**: <100ms
- **Animation Duration**: 2000ms
- **Re-render**: <16ms (60fps)
- **Memory**: ~2MB per chart
- **Canvas Size**: 640x640px

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Example Code

```tsx
import { DNARadarChart } from '@/components/playstyle-dna/DNARadarChart';

function PlayerProfile({ player }) {
  return (
    <div className="p-6">
      <h2>{player.name}</h2>

      <div className="h-80">
        <DNARadarChart
          dnaProfile={{
            Technical: 9.2,
            Tactical: 8.8,
            Physical: 6.5,
            Mental: 8.9,
            Pace: 7.0,
            Strength: 6.0,
            Creativity: 9.5,
            'Work Rate': 7.5
          }}
          playerName="Kevin De Bruyne"
          color="#A855F7"
        />
      </div>

      <p className="mt-4 text-sm text-arcane-grey">
        This radar chart visualizes {player.name}'s playing style
        across 8 key dimensions, ranging from 0 (weakest) to 10 (strongest).
      </p>
    </div>
  );
}
```

## Interactive Features

- **Hover**: Shows exact values in tooltip
- **Click**: Highlights specific dimension
- **Legend Click**: Toggle dataset visibility (comparison mode)
- **Touch**: Tap to show value, double-tap to zoom

## Chart.js Integration

```typescript
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);
```

## Tooltip Example

```
┌─────────────────────────┐
│ Kevin De Bruyne         │
│                         │
│ Technical: 9.2/10       │
└─────────────────────────┘
```

Styling:
- Background: #0F1425 (Arcane dark card)
- Title: #E4FF3B (Arcane accent)
- Body: #E5E7EB (Light grey)
- Border: #1B2133 (Arcane dark border)
- Padding: 12px
- Border Radius: 8px

---

**Note**: All measurements are in the 0-10 scale. The radar chart provides an intuitive visual representation of a player's strengths and weaknesses across all 8 dimensions of the PlayStyle DNA system.
