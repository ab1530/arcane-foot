# Passport Feature Integration Guide

## Overview
Complete CRUD implementation for the Passport feature in the React Native/Expo mobile application.

## Files Created

### 1. Type Definitions
**File**: `/mobile/src/types/passport.ts`

Defines all TypeScript interfaces for the Passport feature:
- `Passport` - Main passport interface
- `PassportVerificationStatus` - Enum for verification states (PENDING, VERIFIED, REJECTED)
- `CreatePassportDto` - DTO for creating passports
- `VerifyPassportDto` - DTO for admin verification
- `PassportResponse` - API response structure
- `PublicPassportData` - Public passport view data (for QR codes)
- `PassportValidation` - Validation result structure
- `PassportShareOptions` - Share configuration
- `PassportStatistics` - Admin statistics

### 2. API Service Layer
**File**: `/mobile/src/services/api.ts` (updated)

Added 6 new passport endpoints:
- `getPassportByToken(token)` - Get public passport by token (existing, for QR viewing)
- `createPassport(passportData)` - Create new passport
- `getPassportByPlayer(playerId)` - Get passport by player ID
- `getMyPassport()` - Get current user's passport
- `verifyPassport(playerId, verificationData)` - Verify passport (ADMIN only)
- `deletePassport(playerId)` - Delete passport

### 3. Passport Service
**File**: `/mobile/src/services/passportService.ts`

Service layer with business logic and utilities:
- **Caching**: AsyncStorage-based caching with 5-minute expiry
- **Validation**: Pre-creation validation of passport data
- **Helpers**:
  - `generatePublicUrl(token)` - Generate shareable URL
  - `generateQRCodeValue(token)` - Generate QR code value
  - `getVerificationStatusInfo(status)` - Get display info for status
  - `canVerifyPassport(userRole)` - Check admin permissions
  - `validatePassportData(dto)` - Validate passport data
  - `formatPassportForQR(passport)` - Format for QR display
  - `clearAllCache()` - Clear all cached passports

### 4. React Hooks
**File**: `/mobile/src/hooks/usePassport.ts`

Custom React hooks for passport operations:

#### `useMyPassport()`
Fetch and manage current user's passport with caching.
```typescript
const { passport, loading, error, refreshing, refresh } = useMyPassport();
```

#### `usePassportByPlayer(playerId)`
Fetch passport for a specific player.
```typescript
const { passport, loading, error, refresh } = usePassportByPlayer('player-id');
```

#### `usePublicPassport(token)`
Fetch public passport data via QR token.
```typescript
const { passport, loading, error, refresh } = usePublicPassport('token');
```

#### `useCreatePassport()`
Create a new passport with validation.
```typescript
const { createPassport, loading, error, success, reset } = useCreatePassport();
await createPassport({ playerId: 'player-id' });
```

#### `useVerifyPassport()`
Verify/reject a passport (Admin only).
```typescript
const { verifyPassport, loading, error, success, reset } = useVerifyPassport();
await verifyPassport('player-id', {
  verified: true,
  verificationStatus: PassportVerificationStatus.VERIFIED,
  adminNotes: 'Verified by admin'
});
```

#### `useDeletePassport()`
Delete a passport.
```typescript
const { deletePassport, loading, error, success, reset } = useDeletePassport();
await deletePassport('player-id');
```

#### `usePassportOperations(playerId)`
Combined hook with optimistic updates for all operations.
```typescript
const {
  passport,
  loading,
  error,
  refresh,
  createPassport,
  verifyPassport,
  deletePassport
} = usePassportOperations('player-id');
```

#### `usePassportHelpers()`
Utility functions for passport operations.
```typescript
const {
  generatePublicUrl,
  generateQRCodeValue,
  getVerificationStatusInfo,
  canVerifyPassport,
  validatePassportData
} = usePassportHelpers();
```

## Backend Endpoints Integrated

All 6 passport endpoints from the backend are now integrated:

1. **POST /passport** - Create passport (requires auth, roles: ADMIN, AGENT, SCOUT)
2. **GET /passport/player/:playerId** - Get passport by player ID (requires auth)
3. **GET /passport/token/:token** - Get public passport by token (public)
4. **GET /passport/me** - Get my passport (requires auth) ⚠️ **NOTE**: Not documented in BACKEND_API_ENDPOINTS.json but implemented
5. **PUT /passport/player/:playerId/verify** - Verify passport (ADMIN, SUPER_ADMIN only)
6. **DELETE /passport/player/:playerId** - Delete passport (ADMIN, SUPER_ADMIN only)

## QR Code Library

The QR code library `react-native-qrcode-svg` is already installed in the project (confirmed in package.json). The existing PassportScreen.tsx already uses it for QR code display.

## Integration with UI Screens

### Existing Screens
The following screens already exist and may need updates:

1. **PassportScreen.tsx** (`/mobile/src/screens/passport/PassportScreen.tsx`)
   - Currently displays user's passport with QR code
   - **Integration**: Use `useMyPassport()` hook instead of auth context
   - Add create button if passport doesn't exist
   - Add error handling

2. **PlayerPassport.tsx** (`/mobile/src/screens/players/PlayerPassport.tsx`)
   - Currently shows player passport view
   - **Integration**: Use `usePassportByPlayer(playerId)` hook
   - Add public QR scanning feature with `usePublicPassport(token)`

### New Screens to Create (Optional)

1. **PassportCreateScreen** - Form to create a new passport
2. **PassportVerificationScreen** - Admin screen to verify/reject passports
3. **PassportQRScanScreen** - Scan QR codes to view public passports
4. **PassportManagementScreen** - Admin dashboard for passport management

## Example Usage

### Create Passport
```typescript
import { useCreatePassport } from '@/hooks/usePassport';
import { PassportVerificationStatus } from '@/types/passport';

function CreatePassportScreen() {
  const { createPassport, loading, error, success } = useCreatePassport();

  const handleCreate = async () => {
    const result = await createPassport({
      playerId: 'player-id',
      additionalData: {
        notes: 'Initial passport creation'
      }
    });

    if (result) {
      console.log('Passport created:', result.passport.id);
    }
  };

  return (
    // UI implementation
  );
}
```

### Display My Passport
```typescript
import { useMyPassport } from '@/hooks/usePassport';
import QRCode from 'react-native-qrcode-svg';

function MyPassportScreen() {
  const { passport, loading, error, refresh } = useMyPassport();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} />;
  if (!passport) return <CreatePassportPrompt />;

  return (
    <View>
      <Text>Passport ID: {passport.id}</Text>
      <QRCode value={passport.token} size={200} />
      <Button title="Refresh" onPress={refresh} />
    </View>
  );
}
```

### Admin Verification
```typescript
import { useVerifyPassport } from '@/hooks/usePassport';
import { PassportVerificationStatus } from '@/types/passport';

function VerifyPassportButton({ playerId }) {
  const { verifyPassport, loading } = useVerifyPassport();

  const handleVerify = async () => {
    await verifyPassport(playerId, {
      verified: true,
      verificationStatus: PassportVerificationStatus.VERIFIED,
      adminNotes: 'Documents verified successfully'
    });
  };

  return (
    <Button
      title="Verify Passport"
      onPress={handleVerify}
      disabled={loading}
    />
  );
}
```

### View Public Passport (QR Scan)
```typescript
import { usePublicPassport } from '@/hooks/usePassport';

function PublicPassportView({ token }) {
  const { passport, loading, error } = usePublicPassport(token);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error} />;
  if (!passport) return <NotFoundView />;

  return (
    <View>
      <Text>{passport.player.name}</Text>
      <Text>{passport.player.position}</Text>
      <Badge verified={passport.verified} />
    </View>
  );
}
```

## Admin Verification Workflow

1. **Permission Check**: Use `passportService.canVerifyPassport(userRole)` to check if user is ADMIN or SUPER_ADMIN
2. **Fetch Pending Passports**: Filter passports by `verificationStatus === 'PENDING'`
3. **Review Passport**: Display passport details and player information
4. **Verify/Reject**:
   - Call `verifyPassport(playerId, { verified: true, verificationStatus: 'VERIFIED' })`
   - OR `verifyPassport(playerId, { verified: false, verificationStatus: 'REJECTED', adminNotes: 'reason' })`
5. **Update UI**: Use optimistic updates via `usePassportOperations()` hook

## Caching Strategy

- **Cache Duration**: 5 minutes
- **Cache Keys**:
  - `passport_my` - Current user's passport
  - `passport_player_{playerId}` - Specific player's passport
  - `passport_public_{token}` - Public passport by token
- **Cache Invalidation**: Automatic on create, update, verify, delete operations
- **Manual Clear**: `passportService.clearAllCache()`

## Error Handling

All hooks return error states:
```typescript
const { error } = useMyPassport();

if (error) {
  // Display error message
  // error contains user-friendly message from backend
}
```

## Authentication

All authenticated endpoints automatically include the Bearer token from AsyncStorage via the API client's request interceptor. No additional auth handling needed in the passport services.

## TypeScript Support

All functions and hooks are fully typed. Import types from `@/types/passport`:
```typescript
import {
  Passport,
  PassportVerificationStatus,
  CreatePassportDto,
  VerifyPassportDto,
  PassportResponse,
  PublicPassportData
} from '@/types/passport';
```

## Testing Checklist

- [ ] Create passport successfully
- [ ] Fetch my passport with caching
- [ ] Fetch passport by player ID
- [ ] Fetch public passport by token (QR scan)
- [ ] Verify passport as admin
- [ ] Reject passport as admin
- [ ] Delete passport
- [ ] Cache expiry works correctly
- [ ] Optimistic updates work in usePassportOperations
- [ ] Error states are displayed correctly
- [ ] Permission checks work for admin operations
- [ ] QR code generation and display works
- [ ] Offline cache works without network

## Notes

- The existing public passport viewing functionality (GET /passport/token/:token) is preserved
- QR code library (react-native-qrcode-svg) is already installed
- All operations follow the existing codebase patterns (hooks, services, API structure)
- Admin verification requires ADMIN or SUPER_ADMIN role (checked by backend)
- Caching improves performance and reduces API calls
- Optimistic updates provide instant UI feedback

## Next Steps for UI Implementation

1. Update PassportScreen.tsx to use `useMyPassport()` hook
2. Add create passport flow if user doesn't have one
3. Implement admin verification screen
4. Add QR code scanner for public passport viewing
5. Add passport management dashboard for admins
6. Implement share functionality (PDF, image export)
7. Add passport statistics view for admins
