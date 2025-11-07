# Player Validation Module

## Overview

The Player Validation module provides a comprehensive crowd-sourcing system for managing PUBLIC player registrations on the Arcane Football platform. It allows admins and scouts to validate, reject, or upgrade public player profiles to agency-managed players.

## Features

- **Player Validation**: Verify PUBLIC player profiles submitted through self-registration
- **Player Rejection**: Reject invalid profiles with detailed reasons
- **Suspicious Profile Flagging**: Mark potentially fraudulent profiles for review
- **Agency Conversion**: Convert verified PUBLIC players to AGENCY type (premium upgrade)
- **Bulk Import**: Import multiple players via JSON or CSV
- **CSV Export**: Export player data for external processing
- **Audit Logging**: Track all validation actions with detailed history
- **Notifications**: Automatic notifications to players when their status changes
- **Statistics Dashboard**: Real-time validation metrics and analytics

## Directory Structure

```
player-validation/
├── dto/
│   ├── validate-player.dto.ts    # DTOs for validation operations
│   └── bulk-import.dto.ts        # DTOs for bulk import
├── player-validation.controller.ts  # API endpoints
├── player-validation.service.ts     # Business logic
├── bulk-import.service.ts           # CSV/bulk import logic
├── player-validation.module.ts      # Module configuration
└── README.md                        # This file
```

## API Endpoints

### 1. Get Pending Players
```
GET /admin/players/pending-validation?page=1&limit=20
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Retrieves PUBLIC players with PENDING verification status.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "player_id",
      "userId": "user_id",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "position": "Forward",
      "verificationStatus": "PENDING",
      "createdAt": "2024-11-04T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 2. Get Players by Status
```
GET /admin/players/by-status/:status?page=1&limit=20
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Retrieves players filtered by verification status.

**Path Parameters**:
- `status`: PENDING | VERIFIED | REJECTED | SUSPICIOUS

### 3. Validate Player
```
POST /admin/players/:id/validate
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Marks a PUBLIC player profile as VERIFIED.

**Request Body**:
```json
{
  "notes": "Player credentials verified through club contact"
}
```

**Response**:
```json
{
  "id": "player_id",
  "verificationStatus": "VERIFIED",
  "verifiedAt": "2024-11-04T10:00:00Z",
  "verifiedById": "admin_user_id"
}
```

### 4. Reject Player
```
POST /admin/players/:id/reject
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Marks a PUBLIC player profile as REJECTED with a reason.

**Request Body**:
```json
{
  "rejectionReason": "Unable to verify player credentials. Club contact did not confirm player association."
}
```

### 5. Mark as Suspicious
```
POST /admin/players/:id/mark-suspicious
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Flags a player profile as potentially fraudulent.

**Request Body**:
```json
{
  "reason": "Duplicate profile detected with different email"
}
```

### 6. Convert to Agency
```
POST /admin/players/:id/convert-to-agency
```
**Authorization**: SUPER_ADMIN, ADMIN

Converts a verified PUBLIC player to AGENCY type.

**Request Body**:
```json
{
  "conversionNotes": "Player signed with our agency. Contract details stored separately."
}
```

**Requirements**:
- Player must be PUBLIC type
- Player must be VERIFIED

### 7. Verification Statistics
```
GET /admin/players/verification-stats
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Retrieves dashboard statistics about player verification.

**Response**:
```json
{
  "totalPublicPlayers": 150,
  "statusBreakdown": {
    "pending": 45,
    "verified": 80,
    "rejected": 20,
    "suspicious": 5
  },
  "percentages": {
    "pending": 30,
    "verified": 53.33,
    "rejected": 13.33,
    "suspicious": 3.33
  },
  "recentActivity": {
    "validationsLast30Days": 15,
    "rejectionsLast30Days": 5
  }
}
```

### 8. Validation History
```
GET /admin/players/:id/validation-history
```
**Authorization**: SUPER_ADMIN, ADMIN, SCOUT

Retrieves the full validation history for a player.

**Response**:
```json
{
  "player": {
    "id": "player_id",
    "playerType": "PUBLIC",
    "verificationStatus": "VERIFIED",
    "verifiedAt": "2024-11-04T10:00:00Z"
  },
  "history": [
    {
      "action": "PLAYER_VALIDATED",
      "userId": "admin_id",
      "createdAt": "2024-11-04T10:00:00Z",
      "changes": {
        "previousStatus": "PENDING",
        "newStatus": "VERIFIED"
      }
    }
  ]
}
```

### 9. Bulk Import (JSON)
```
POST /admin/players/bulk-import
```
**Authorization**: SUPER_ADMIN, ADMIN

Import multiple players at once from JSON data.

**Request Body**:
```json
{
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
      "preferredFoot": "Right",
      "clubName": "Paris Saint-Germain"
    }
  ],
  "autoVerify": false
}
```

**Response**:
```json
{
  "success": true,
  "imported": 45,
  "failed": 5,
  "errors": [
    {
      "row": 3,
      "field": "email",
      "message": "Email already exists"
    }
  ],
  "players": [...]
}
```

### 10. Bulk Import (CSV)
```
POST /admin/players/bulk-import-csv
```
**Authorization**: SUPER_ADMIN, ADMIN

Import multiple players from CSV file content.

**Request Body**:
```json
{
  "csvContent": "firstName,lastName,email,position,dateOfBirth,nationality\nJohn,Doe,john@example.com,Forward,1998-01-15,US",
  "autoVerify": false
}
```

**CSV Format**:
Required columns:
- firstName
- lastName
- email
- position
- dateOfBirth (YYYY-MM-DD)
- nationality (ISO 3166-1 alpha-2)

Optional columns:
- phone
- height
- weight
- preferredFoot
- clubName

### 11. Export CSV
```
GET /admin/players/export-csv?status=VERIFIED
```
**Authorization**: SUPER_ADMIN, ADMIN

Export PUBLIC players to CSV format.

**Query Parameters**:
- `status` (optional): Filter by verification status

**Response**: CSV file download

## Database Schema

The module uses the following Prisma models:

### Player Model Fields
```prisma
model Player {
  // Type
  playerType      PlayerType    @default(PUBLIC)  // AGENCY | PUBLIC

  // Verification (for PUBLIC players)
  verificationStatus  VerificationStatus @default(PENDING)  // PENDING | VERIFIED | REJECTED | SUSPICIOUS
  verifiedAt          DateTime?
  verifiedById        String?           // ID of admin/scout who verified
  conversionNotes     String?           // Notes during PUBLIC → AGENCY conversion
  rejectionReason     String?           // Rejection reason
}
```

### Audit Log
All validation actions are logged in the `AuditLog` table:
- PLAYER_VALIDATED
- PLAYER_REJECTED
- PLAYER_MARKED_SUSPICIOUS
- PLAYER_CONVERTED_TO_AGENCY
- PLAYER_BULK_IMPORTED

## Permissions

| Endpoint | SUPER_ADMIN | ADMIN | SCOUT |
|----------|-------------|-------|-------|
| Get pending players | ✅ | ✅ | ✅ |
| Get by status | ✅ | ✅ | ✅ |
| Validate player | ✅ | ✅ | ✅ |
| Reject player | ✅ | ✅ | ✅ |
| Mark suspicious | ✅ | ✅ | ✅ |
| Convert to agency | ✅ | ✅ | ❌ |
| Verification stats | ✅ | ✅ | ✅ |
| Validation history | ✅ | ✅ | ✅ |
| Bulk import | ✅ | ✅ | ❌ |
| Export CSV | ✅ | ✅ | ❌ |

## Notifications

The module automatically sends notifications to players when:
- Profile is VERIFIED: "Profile Verified - Congratulations!"
- Profile is REJECTED: Includes rejection reason
- Converted to AGENCY: "Profile Upgraded" notification

## Error Handling

The module includes comprehensive error handling:

- **NotFoundException**: Player not found
- **BadRequestException**:
  - Player already verified
  - Not a PUBLIC player
  - Player not verified (for conversion)
  - Invalid CSV format
  - Validation errors

All errors include descriptive messages for debugging.

## Usage Examples

### Validate a player
```typescript
// In your service/controller
await playerValidationService.validatePlayer(
  'player_id',
  'admin_user_id',
  { notes: 'Credentials verified' }
);
```

### Bulk import from CSV
```typescript
const csvContent = `firstName,lastName,email,position,dateOfBirth,nationality
John,Doe,john@example.com,Forward,1998-01-15,US
Jane,Smith,jane@example.com,Midfielder,1999-05-20,GB`;

const result = await bulkImportService.importPlayers(
  { players: bulkImportService.parseCsvFile(csvContent), autoVerify: false },
  'admin_user_id'
);
```

## Integration

To use this module in your application:

1. Import the module in `app.module.ts`:
```typescript
import { PlayerValidationModule } from './modules/player-validation/player-validation.module';

@Module({
  imports: [
    // ... other modules
    PlayerValidationModule,
  ],
})
export class AppModule {}
```

2. The module will be available at `/admin/players/*` endpoints

## Testing

Example test scenarios:
- Validate a pending player
- Reject a player with invalid credentials
- Convert verified player to agency
- Bulk import with validation errors
- Export filtered players to CSV

## Dependencies

- `@nestjs/common`
- `@nestjs/swagger`
- `@prisma/client`
- `bcryptjs` (for password hashing in bulk import)
- `class-validator`
- `class-transformer`

## Best Practices

1. **Always validate before converting**: Players must be VERIFIED before converting to AGENCY
2. **Provide clear rejection reasons**: Help players understand why their profile was rejected
3. **Use audit logs**: Track all validation actions for compliance
4. **Monitor suspicious profiles**: Regular review prevents fraudulent accounts
5. **Bulk import validation**: Always validate CSV data before importing
6. **Notifications**: Ensure players are informed of status changes

## Future Enhancements

Potential improvements:
- Email verification before validation
- Document upload for proof of identity
- Multi-step verification workflow
- Automated fraud detection using AI
- Integration with external player databases
- Batch validation operations
- Advanced filtering and search

## Support

For issues or questions, please contact the development team or create an issue in the project repository.

---

**Version**: 1.0.0
**Last Updated**: November 4, 2024
**Author**: Arcane Platform Team
