# Player Validation Module - Integration Guide

## Step 1: Import Module in App Module

Add the `PlayerValidationModule` to your main application module:

**File**: `/backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PlayerValidationModule } from './modules/player-validation/player-validation.module';

@Module({
  imports: [
    // ... existing modules
    PlayerValidationModule,
  ],
})
export class AppModule {}
```

## Step 2: Verify Dependencies

Make sure these modules are also imported in `app.module.ts`:
- `PrismaModule` - Database access
- `NotificationsModule` - Player notifications

These are already imported by `PlayerValidationModule`, but ensure they're available globally if needed.

## Step 3: Update Swagger Documentation

The module already includes Swagger decorators. When you start your app, the endpoints will automatically appear in the Swagger UI under the "Player Validation" tag.

Access Swagger at: `http://localhost:3000/api`

## Step 4: Test the Endpoints

### Using cURL

#### 1. Get pending players
```bash
curl -X GET "http://localhost:3000/api/admin/players/pending-validation?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Validate a player
```bash
curl -X POST "http://localhost:3000/api/admin/players/PLAYER_ID/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Player credentials verified through club contact"
  }'
```

#### 3. Reject a player
```bash
curl -X POST "http://localhost:3000/api/admin/players/PLAYER_ID/reject" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionReason": "Unable to verify player credentials"
  }'
```

#### 4. Convert to agency
```bash
curl -X POST "http://localhost:3000/api/admin/players/PLAYER_ID/convert-to-agency" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversionNotes": "Player signed with our agency"
  }'
```

#### 5. Get verification stats
```bash
curl -X GET "http://localhost:3000/api/admin/players/verification-stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Bulk import from JSON
```bash
curl -X POST "http://localhost:3000/api/admin/players/bulk-import" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {
        "firstName": "Kylian",
        "lastName": "Mbappé",
        "email": "kylian.mbappe@example.com",
        "position": "Forward",
        "dateOfBirth": "1998-12-20",
        "nationality": "FR",
        "height": 178,
        "weight": 73,
        "preferredFoot": "Right"
      }
    ],
    "autoVerify": false
  }'
```

#### 7. Bulk import from CSV
```bash
curl -X POST "http://localhost:3000/api/admin/players/bulk-import-csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csvContent": "firstName,lastName,email,position,dateOfBirth,nationality\nJohn,Doe,john@example.com,Forward,1998-01-15,US\nJane,Smith,jane@example.com,Midfielder,1999-05-20,GB",
    "autoVerify": false
  }'
```

#### 8. Export to CSV
```bash
curl -X GET "http://localhost:3000/api/admin/players/export-csv?status=VERIFIED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o players-export.csv
```

### Using Postman

1. **Import Collection**: Create a new collection called "Player Validation"

2. **Set Environment Variables**:
   - `base_url`: http://localhost:3000/api
   - `jwt_token`: Your authentication token

3. **Create Requests**:
   - Copy the cURL examples above and import them into Postman
   - Or manually create requests using the endpoints documented in README.md

## Step 5: Frontend Integration

### React/Next.js Example

```typescript
// services/playerValidation.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const playerValidationService = {
  // Get pending players
  async getPendingPlayers(page = 1, limit = 20) {
    const response = await axios.get(
      `${API_BASE}/admin/players/pending-validation`,
      {
        params: { page, limit },
        headers: { Authorization: `Bearer ${getToken()}` }
      }
    );
    return response.data;
  },

  // Validate player
  async validatePlayer(playerId: string, notes?: string) {
    const response = await axios.post(
      `${API_BASE}/admin/players/${playerId}/validate`,
      { notes },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  // Reject player
  async rejectPlayer(playerId: string, rejectionReason: string) {
    const response = await axios.post(
      `${API_BASE}/admin/players/${playerId}/reject`,
      { rejectionReason },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  // Convert to agency
  async convertToAgency(playerId: string, conversionNotes?: string) {
    const response = await axios.post(
      `${API_BASE}/admin/players/${playerId}/convert-to-agency`,
      { conversionNotes },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  // Get stats
  async getStats() {
    const response = await axios.get(
      `${API_BASE}/admin/players/verification-stats`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  // Bulk import
  async bulkImport(players: any[], autoVerify = false) {
    const response = await axios.post(
      `${API_BASE}/admin/players/bulk-import`,
      { players, autoVerify },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    return response.data;
  },

  // Export CSV
  async exportCSV(status?: string) {
    const response = await axios.get(
      `${API_BASE}/admin/players/export-csv`,
      {
        params: { status },
        headers: { Authorization: `Bearer ${getToken()}` },
        responseType: 'blob'
      }
    );
    return response.data;
  }
};

function getToken() {
  // Implement your token retrieval logic
  return localStorage.getItem('jwt_token');
}
```

### React Component Example

```typescript
// components/PlayerValidationDashboard.tsx
import React, { useEffect, useState } from 'react';
import { playerValidationService } from '../services/playerValidation';

export function PlayerValidationDashboard() {
  const [pendingPlayers, setPendingPlayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [playersData, statsData] = await Promise.all([
        playerValidationService.getPendingPlayers(),
        playerValidationService.getStats()
      ]);
      setPendingPlayers(playersData.data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(playerId: string) {
    try {
      await playerValidationService.validatePlayer(playerId, 'Approved by admin');
      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error validating player:', error);
    }
  }

  async function handleReject(playerId: string) {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await playerValidationService.rejectPlayer(playerId, reason);
      await loadData();
    } catch (error) {
      console.error('Error rejecting player:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Player Validation Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="stats">
          <div>Total: {stats.totalPublicPlayers}</div>
          <div>Pending: {stats.statusBreakdown.pending}</div>
          <div>Verified: {stats.statusBreakdown.verified}</div>
          <div>Rejected: {stats.statusBreakdown.rejected}</div>
        </div>
      )}

      {/* Pending Players List */}
      <div className="players-list">
        {pendingPlayers.map(player => (
          <div key={player.id} className="player-card">
            <h3>{player.user.firstName} {player.user.lastName}</h3>
            <p>Email: {player.user.email}</p>
            <p>Position: {player.position}</p>
            <p>Nationality: {player.nationality}</p>

            <button onClick={() => handleValidate(player.id)}>
              Validate
            </button>
            <button onClick={() => handleReject(player.id)}>
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 6: Database Seeding (Optional)

Add sample pending players for testing:

```typescript
// prisma/seed.ts
import { PrismaClient, PlayerType, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPendingPlayers() {
  // Create public users and pending players
  const publicPlayers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.public@example.com',
      position: 'Forward',
      nationality: 'US',
      dateOfBirth: new Date('1998-01-15'),
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.public@example.com',
      position: 'Midfielder',
      nationality: 'GB',
      dateOfBirth: new Date('1999-05-20'),
    },
  ];

  for (const playerData of publicPlayers) {
    const user = await prisma.user.create({
      data: {
        email: playerData.email,
        firstName: playerData.firstName,
        lastName: playerData.lastName,
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'PUBLIC',
        emailVerified: true,
      },
    });

    await prisma.player.create({
      data: {
        userId: user.id,
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        position: playerData.position,
        nationality: playerData.nationality,
        dateOfBirth: playerData.dateOfBirth,
        isPublic: true,
      },
    });
  }

  console.log('Seeded pending players');
}

seedPendingPlayers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Step 7: Environment Variables

No additional environment variables are required. The module uses existing configuration from:
- `DATABASE_URL` - Prisma database connection
- Firebase config (for notifications)

## Troubleshooting

### Issue: "Module not found"
**Solution**: Ensure `PlayerValidationModule` is imported in `app.module.ts`

### Issue: "Forbidden" errors
**Solution**: Check that your JWT token is valid and the user has appropriate role (SUPER_ADMIN, ADMIN, or SCOUT)

### Issue: Notifications not sending
**Solution**: Verify `NotificationsModule` and `FirebaseService` are properly configured

### Issue: Bulk import fails
**Solution**:
- Check CSV format matches required columns
- Ensure no duplicate emails
- Verify all required fields are present

## Next Steps

1. Import the module in your app
2. Test endpoints using Swagger UI
3. Integrate with your frontend
4. Set up proper authentication/authorization
5. Configure notification templates
6. Add monitoring and logging

## Support

For issues or questions:
- Check the main README.md
- Review error messages in logs
- Contact the development team

---

**Happy Coding!** 🚀
