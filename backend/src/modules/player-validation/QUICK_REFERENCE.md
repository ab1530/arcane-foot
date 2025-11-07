# Player Validation Module - Quick Reference

## Module Structure
```
player-validation/
├── dto/
│   ├── validate-player.dto.ts
│   └── bulk-import.dto.ts
├── player-validation.controller.ts
├── player-validation.service.ts
├── bulk-import.service.ts
└── player-validation.module.ts
```

## Quick Start

### 1. Import Module
```typescript
// app.module.ts
import { PlayerValidationModule } from './modules/player-validation/player-validation.module';

@Module({
  imports: [PlayerValidationModule],
})
```

### 2. Test Endpoint (Swagger)
```
http://localhost:3000/api
→ Find "Player Validation" tag
```

## Common Operations

### Get Pending Players
```bash
GET /admin/players/pending-validation?page=1&limit=20
Auth: ADMIN | SCOUT | SUPER_ADMIN
```

### Validate Player
```bash
POST /admin/players/:id/validate
Body: { "notes": "Verified through club" }
Auth: ADMIN | SCOUT | SUPER_ADMIN
```

### Reject Player
```bash
POST /admin/players/:id/reject
Body: { "rejectionReason": "Invalid credentials" }
Auth: ADMIN | SCOUT | SUPER_ADMIN
```

### Convert to Agency
```bash
POST /admin/players/:id/convert-to-agency
Body: { "conversionNotes": "Signed with agency" }
Auth: ADMIN | SUPER_ADMIN
Requires: Player must be VERIFIED
```

### Get Statistics
```bash
GET /admin/players/verification-stats
Auth: ADMIN | SCOUT | SUPER_ADMIN
```

### Bulk Import (CSV)
```bash
POST /admin/players/bulk-import-csv
Body: {
  "csvContent": "firstName,lastName,email,...",
  "autoVerify": false
}
Auth: ADMIN | SUPER_ADMIN
```

### Export CSV
```bash
GET /admin/players/export-csv?status=VERIFIED
Auth: ADMIN | SUPER_ADMIN
Response: CSV file download
```

## CSV Format

### Required Columns
```csv
firstName,lastName,email,position,dateOfBirth,nationality
John,Doe,john@example.com,Forward,1998-01-15,US
```

### Optional Columns
```csv
phone,height,weight,preferredFoot,clubName
+33612345678,178,73,Right,Paris FC
```

## Verification Statuses
- `PENDING` - Awaiting validation
- `VERIFIED` - Approved by admin/scout
- `REJECTED` - Rejected with reason
- `SUSPICIOUS` - Flagged for review

## Player Types
- `PUBLIC` - Self-registered player
- `AGENCY` - Agency-managed player (premium)

## Permissions Matrix

| Action | ADMIN | SCOUT | SUPER_ADMIN |
|--------|-------|-------|-------------|
| View pending | ✅ | ✅ | ✅ |
| Validate | ✅ | ✅ | ✅ |
| Reject | ✅ | ✅ | ✅ |
| Mark suspicious | ✅ | ✅ | ✅ |
| Convert to agency | ✅ | ❌ | ✅ |
| Bulk import | ✅ | ❌ | ✅ |
| Export CSV | ✅ | ❌ | ✅ |

## Frontend Integration

### Service Example
```typescript
async validatePlayer(playerId: string, notes?: string) {
  const response = await axios.post(
    `/admin/players/${playerId}/validate`,
    { notes },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}
```

### React Hook Example
```typescript
const { data, error } = useSWR(
  '/admin/players/pending-validation',
  fetcher
);
```

## Notifications Sent

| Action | Notification |
|--------|--------------|
| Validated | "Profile Verified - Congratulations!" |
| Rejected | "Profile Review" + rejection reason |
| Converted | "Profile Upgraded to Agency Player" |

## Audit Log Actions
- `PLAYER_VALIDATED`
- `PLAYER_REJECTED`
- `PLAYER_MARKED_SUSPICIOUS`
- `PLAYER_CONVERTED_TO_AGENCY`
- `PLAYER_BULK_IMPORTED`

## Common Errors

### 404 Not Found
```json
{ "message": "Player with ID xxx not found" }
```
→ Check player ID is correct

### 400 Bad Request
```json
{ "message": "Only PUBLIC players can be validated" }
```
→ Player is already AGENCY type

### 400 Bad Request
```json
{ "message": "Player must be verified before converting" }
```
→ Validate player first, then convert

### 403 Forbidden
```json
{ "message": "Forbidden resource" }
```
→ Check user has correct role

## Testing Checklist

- [ ] Get pending players
- [ ] Validate a player
- [ ] Reject a player
- [ ] Mark as suspicious
- [ ] Convert to agency
- [ ] Get verification stats
- [ ] View validation history
- [ ] Bulk import JSON
- [ ] Bulk import CSV
- [ ] Export CSV
- [ ] Check notifications sent

## Useful Queries

### Get all pending PUBLIC players
```typescript
const pending = await prisma.player.findMany({
  where: {
    playerType: 'PUBLIC',
    verificationStatus: 'PENDING'
  }
});
```

### Get validation history
```typescript
const history = await prisma.auditLog.findMany({
  where: {
    entityType: 'Player',
    entityId: playerId,
    action: { in: ['PLAYER_VALIDATED', 'PLAYER_REJECTED'] }
  }
});
```

## Environment Variables
None required - uses existing:
- `DATABASE_URL` (Prisma)
- Firebase config (Notifications)

## Swagger Tags
- Tag: "Player Validation"
- All endpoints documented
- Try it out in UI: `http://localhost:3000/api`

## Support

- 📖 Full docs: `README.md`
- 🚀 Integration: `INTEGRATION_GUIDE.md`
- 📊 Summary: `PLAYER_VALIDATION_MODULE_SUMMARY.md`

---

**Version**: 1.0.0
**Last Updated**: November 4, 2024
