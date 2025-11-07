# Marketplace Integration - Code Snippets

## Key Code Examples

### 1. API Client Methods

#### Search Scout Listings
```typescript
// Search with filters
const result = await apiClient.searchScoutListings({
  leagues: ['LaLiga', 'Ligue 1'],
  positions: ['CB', 'CDM'],
  minRating: 4.0,
  verifiedOnly: true,
  page: 1,
  limit: 10
});

// Result: { data: ScoutListing[], pagination: Pagination }
```

#### Get Scout Listing
```typescript
const scout = await apiClient.getScoutListing('cm2vvnfoo0000kftwgnk7cfvk');
// Result: ScoutListing
```

#### Get Reviews
```typescript
const reviewsData = await apiClient.getListingReviews('cm2vvnfoo0000kftwgnk7cfvk');
// Result: { reviews: Review[], stats: ReviewStats }
```

#### Favorite Management
```typescript
// Check if favorited
const status = await apiClient.checkFavorite(scoutId);
// Result: { isFavorite: boolean, favoriteId?: string }

// Add to favorites
const favorite = await apiClient.addFavorite(scoutId, 'Great scout!', ['expert']);
// Result: Favorite object

// Remove from favorites
await apiClient.removeFavorite(favoriteId);

// Get all favorites
const favorites = await apiClient.getFavorites();
// Result: Favorite[]
```

### 2. Component Usage

#### ScoutStats Component
```typescript
import { ScoutStats } from '@/components/marketplace/scout/ScoutStats';

<ScoutStats
  avgRating={4.8}
  totalReviews={15}
  completionRate={95}
  className="mb-8"
/>
```

#### ScoutExpertiseBadge Component
```typescript
import { ScoutExpertiseBadge } from '@/components/marketplace/scout/ScoutExpertiseBadge';

// League badge (blue)
<ScoutExpertiseBadge
  label="LaLiga"
  icon="🏆"
  variant="league"
/>

// Position badge (green)
<ScoutExpertiseBadge
  label="CB"
  icon="⚽"
  variant="position"
/>

// Age group badge (purple)
<ScoutExpertiseBadge
  label="U21"
  icon="👥"
  variant="age"
/>
```

#### RatingDistribution Component
```typescript
import { RatingDistribution } from '@/components/marketplace/scout/RatingDistribution';

<RatingDistribution
  distribution={{
    "5": 10,
    "4": 3,
    "3": 2,
    "2": 0,
    "1": 0
  }}
  totalReviews={15}
/>
```

#### ReviewCard Component
```typescript
import { ReviewCard } from '@/components/marketplace/reviews/ReviewCard';

<ReviewCard
  review={{
    id: '1',
    rating: 5,
    comment: 'Excellent scout!',
    tags: ['Professional', 'Reliable'],
    reviewedAt: new Date('2024-10-20'),
    isVerified: true,
    clubs: {
      id: 'club1',
      name: 'Real Madrid CF',
      logo: '/logos/real-madrid.png'
    }
  }}
/>
```

#### ReviewList Component
```typescript
import { ReviewList } from '@/components/marketplace/reviews/ReviewList';

<ReviewList
  reviews={reviewsArray}
  itemsPerPage={5}
/>
```

### 3. Page Navigation

#### Link to Scout Profile
```typescript
import Link from 'next/link';

<Link href={`/marketplace/scouts/${scout.id}`}>
  View Profile
</Link>
```

#### Programmatic Navigation
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to scout profile
router.push(`/marketplace/scouts/${scoutId}`);

// Go back
router.back();
```

### 4. Type Definitions

#### ScoutListing Type
```typescript
import { ScoutListing } from '@/types/marketplace';

const scout: ScoutListing = {
  id: 'cm2vvnfoo0000kftwgnk7cfvk',
  userId: 'user123',
  headline: 'LaLiga & Ligue 1 Specialist',
  bio: 'Experienced football scout...',
  expertise: {
    leagues: ['LaLiga', 'Ligue 1'],
    positions: ['CB', 'LB', 'RB'],
    ageGroups: ['U17', 'U19', 'U21', 'Senior']
  },
  languages: ['French', 'Spanish', 'English'],
  availability: {
    countries: ['France', 'Spain', 'Portugal'],
    travelRadius: 500
  },
  hourlyRate: 125,
  matchRate: 800,
  reportRate: 350,
  currency: '€',
  status: 'ACTIVE',
  isVerified: true,
  stats: {
    avgRating: 5.0,
    totalReviews: 1,
    completionRate: 100,
    totalAssignments: 5
  },
  users: {
    id: 'user123',
    firstName: 'Jean',
    lastName: 'Dupont',
    avatar: '/avatars/jean.jpg',
    email: 'scout1@arcane.com'
  }
};
```

#### Review Type
```typescript
import { Review } from '@/types/marketplace';

const review: Review = {
  id: 'review1',
  rating: 5,
  comment: 'Exceptional scout with great eye for talent',
  tags: ['Professional', 'Reliable', 'Expert'],
  reviewedAt: new Date('2024-10-20'),
  isVerified: true,
  clubs: {
    id: 'club1',
    name: 'Real Madrid CF',
    logo: '/logos/real-madrid.png'
  }
};
```

### 5. Authentication Check

#### Check User Type
```typescript
import { useAuth } from '@/contexts/auth-context';

const { user, isAuthenticated } = useAuth();

// Check if club user
const isClub = user?.accountType === 'club';

// Conditional rendering
{isClub && (
  <Button onClick={handleFavorite}>
    Add to Favorites
  </Button>
)}
```

### 6. State Management

#### Page State Example
```typescript
const [scout, setScout] = useState<ScoutListing | null>(null);
const [reviews, setReviews] = useState<Review[]>([]);
const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
const [loading, setLoading] = useState(true);
const [isFavorite, setIsFavorite] = useState(false);
const [favoriteId, setFavoriteId] = useState<string | undefined>();
const [error, setError] = useState<string | null>(null);
```

#### Fetch Data on Mount
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch scout
      const scoutData = await apiClient.getScoutListing(scoutId);
      setScout(scoutData);

      // Fetch reviews
      const reviewsData = await apiClient.getListingReviews(scoutId);
      setReviews(reviewsData.reviews);
      setReviewStats(reviewsData.stats);

      // Check favorite status
      if (user?.accountType === 'club') {
        const status = await apiClient.checkFavorite(scoutId);
        setIsFavorite(status.isFavorite);
        setFavoriteId(status.favoriteId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [scoutId, user]);
```

#### Favorite Toggle Handler
```typescript
const handleFavoriteToggle = async () => {
  if (!user || user.accountType !== 'club') {
    alert('Only clubs can favorite scouts');
    return;
  }

  try {
    setFavoriteLoading(true);

    if (isFavorite && favoriteId) {
      // Remove favorite
      await apiClient.removeFavorite(favoriteId);
      setIsFavorite(false);
      setFavoriteId(undefined);
    } else {
      // Add favorite
      const result = await apiClient.addFavorite(scoutId);
      setIsFavorite(true);
      setFavoriteId(result.id);
    }
  } catch (err) {
    alert(err.message || 'Failed to update favorite');
  } finally {
    setFavoriteLoading(false);
  }
};
```

### 7. Utility Functions

#### Get Language Flag
```typescript
const getLanguageFlag = (language: string) => {
  const flags: Record<string, string> = {
    english: '🇬🇧',
    french: '🇫🇷',
    spanish: '🇪🇸',
    german: '🇩🇪',
    italian: '🇮🇹',
    portuguese: '🇵🇹',
  };
  return flags[language.toLowerCase()] || '🌐';
};
```

#### Get Country Flag
```typescript
const getCountryFlag = (country: string) => {
  const flags: Record<string, string> = {
    france: '🇫🇷',
    spain: '🇪🇸',
    portugal: '🇵🇹',
    england: '🇬🇧',
    germany: '🇩🇪',
    italy: '🇮🇹',
  };
  return flags[country.toLowerCase()] || '🌍';
};
```

#### Render Stars
```typescript
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={cn(
          "text-xl",
          i <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"
        )}
      >
        ★
      </span>
    );
  }
  return stars;
};
```

#### Get Relative Time
```typescript
const getRelativeTime = (date: Date) => {
  try {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return 'Recently';
  }
};
```

### 8. Error Handling

#### Loading State
```typescript
if (loading) {
  return (
    <div className="min-h-screen bg-arcane-dark py-12">
      <div className="container mx-auto px-4">
        <div className="text-center text-white text-xl">
          Loading scout profile...
        </div>
      </div>
    </div>
  );
}
```

#### Error State
```typescript
if (error || !scout) {
  return (
    <div className="min-h-screen bg-arcane-dark py-12">
      <div className="container mx-auto px-4">
        <GlassCard variant="bordered" className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">
            Scout Not Found
          </h2>
          <p className="text-arcane-grey mb-6">
            {error || 'This scout profile could not be found'}
          </p>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
```

### 9. Tailwind CSS Classes

#### Common Patterns
```css
/* Glass Card */
.glass-card {
  @apply bg-[rgba(15,20,37,0.6)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-lg;
}

/* Accent Button */
.btn-accent {
  @apply bg-arcane-accent text-arcane-dark hover:bg-arcane-accentHover hover:shadow-[0_0_20px_rgba(228,255,59,0.3)];
}

/* Badge */
.badge {
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105;
}

/* Rating Stars */
.star-filled {
  @apply text-yellow-400;
}

.star-empty {
  @apply text-gray-600;
}
```

### 10. Testing Examples

#### Component Test (Jest + React Testing Library)
```typescript
import { render, screen } from '@testing-library/react';
import { ScoutStats } from './ScoutStats';

describe('ScoutStats', () => {
  it('renders stats correctly', () => {
    render(
      <ScoutStats
        avgRating={4.5}
        totalReviews={10}
        completionRate={95}
      />
    );

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('shows no ratings message when no rating', () => {
    render(
      <ScoutStats
        totalReviews={0}
        completionRate={100}
      />
    );

    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
  });
});
```

#### API Test
```typescript
import { apiClient } from '@/lib/api-client';

describe('Marketplace API', () => {
  it('fetches scout listing', async () => {
    const scout = await apiClient.getScoutListing('test-id');

    expect(scout).toHaveProperty('id');
    expect(scout).toHaveProperty('users');
    expect(scout).toHaveProperty('expertise');
  });

  it('adds to favorites', async () => {
    const result = await apiClient.addFavorite('scout-id', 'Great!');

    expect(result).toHaveProperty('id');
    expect(result.scoutListingId).toBe('scout-id');
  });
});
```

### 11. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 12. Import Statements

```typescript
// Page imports
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Marketplace components
import {
  ScoutStats,
  ScoutExpertiseBadge,
  RatingDistribution,
  ReviewCard,
  ReviewList,
} from '@/components/marketplace';

// Types
import type {
  ScoutListing,
  Review,
  ReviewStats,
} from '@/types/marketplace';
```

## Quick Reference

### Route
```
/marketplace/scouts/[id]
```

### API Endpoints
```
GET  /api/marketplace/listings/:id
GET  /api/marketplace/reviews/listing/:id
POST /api/marketplace/favorites
DELETE /api/marketplace/favorites/:id
GET  /api/marketplace/favorites/check/:scoutListingId
```

### Key Components
```
- ScoutStats
- ScoutExpertiseBadge
- RatingDistribution
- ReviewCard
- ReviewList
```

### Main Colors
```
Accent:     #E4FF3B
Dark:       #0F1425
Grey:       #9CA3AF
Success:    #10B981
```

### Key Hooks
```
- useParams() - Get route params
- useRouter() - Navigation
- useAuth() - User authentication
- useState() - Component state
- useEffect() - Side effects
```

This reference provides quick access to common patterns and code snippets used throughout the marketplace integration.
