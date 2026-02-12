# Passport Feature Integration Guide

This document provides a comprehensive guide for integrating the Passport feature into the UI layer of the Next.js web application.

## Overview

The Passport feature has been fully implemented with backend integration including:
- Full CRUD operations (Create, Read, Update, Delete)
- Admin verification workflow
- Public QR code viewing (already functional)
- Authentication and authorization
- React Query integration for caching and state management

## Files Created/Modified

### 1. API Client - `/web/src/lib/api-client.ts`
**Status**: Modified

Added 6 new passport methods:
- `createPassport(data)` - Create passport for player
- `getPassportByPlayer(playerId)` - Get passport by player ID (auth required)
- `getPassportByToken(token)` - Get passport by public token (no auth)
- `verifyPassport(playerId, data)` - Verify passport (admin only)
- `deletePassport(playerId)` - Delete passport
- `getPassportQRCode(token)` - Get QR code

### 2. Types - `/web/src/types/passport.ts`
**Status**: Created

TypeScript interfaces defined:
```typescript
// Status enum
type PassportStatus = "PENDING" | "VERIFIED" | "EXPIRED" | "REVOKED"

// Main passport interface
interface Passport {
  id: string;
  playerId: string;
  status: PassportStatus;
  publicToken: string;
  verifiedAt?: string;
  expiresAt?: string;
  passportData: PassportData;
  qrCodeUrl: string;
  createdAt: string;
  updatedAt: string;
}

// DTO interfaces
interface CreatePassportDto
interface VerifyPassportDto
interface PassportResponse
interface PassportListResponse
interface PassportValidationResult
```

### 3. Service - `/web/src/services/passportService.ts`
**Status**: Created

Service methods:
- `createPassport(data)` - Create new passport
- `getPassportByPlayer(playerId)` - Fetch by player ID
- `getPassportByToken(token)` - Fetch by public token
- `getMyPassport(playerId)` - Fetch current user's passport (requires playerId)
- `verifyPassport(playerId, data)` - Verify passport (admin)
- `deletePassport(playerId)` - Delete passport
- `getQRCode(token)` - Get QR code URL
- `generateQRCodeURL(token, baseUrl?)` - Generate QR URL
- `validatePassportData(data)` - Validate before creation
- `isPassportExpired(passport)` - Check expiry
- `isPassportVerified(passport)` - Check verification
- `getPassportStatusInfo(status)` - Get status display info
- `getShareableURL(token, baseUrl?)` - Get shareable URL
- `copyPassportURLToClipboard(token, baseUrl?)` - Copy URL

### 4. Hooks - `/web/src/hooks/usePassport.ts`
**Status**: Created

React Query hooks:
- `useMyPassport(playerId)` - Fetch current user's passport (requires playerId)
- `usePassportByPlayer(playerId)` - Fetch by player ID
- `usePassportByToken(token)` - Fetch by public token (for public view)
- `useCreatePassport()` - Mutation for creating
- `useVerifyPassport()` - Mutation for verification (admin)
- `useDeletePassport()` - Mutation for deletion
- `useGenerateQRCode()` - Generate QR code client-side
- `useDownloadQRCode()` - Download QR code
- `useCopyPassportURL()` - Copy passport URL
- `useCanManagePassport(playerId)` - Check permissions
- `usePassportManagement(playerId)` - Composite hook with all operations
- `usePassportStatus(passport)` - Get status information

## UI Integration Examples

### Example 1: Display Player's Passport in Profile

```tsx
import { usePassportByPlayer, usePassportStatus } from '@/hooks/usePassport';
import { QRCodeSVG } from 'qrcode.react';

function PlayerProfile({ playerId }: { playerId: string }) {
  const { data: passport, isLoading, isError } = usePassportByPlayer(playerId);
  const { statusInfo, isVerified } = usePassportStatus(passport);

  if (isLoading) return <div>Loading passport...</div>;
  if (isError) return <div>No passport found</div>;

  return (
    <div>
      <h2>Player Passport</h2>

      {/* Status Badge */}
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}>
        {statusInfo.label}
      </div>

      {/* QR Code */}
      <QRCodeSVG
        value={`${window.location.origin}/passport/${passport.publicToken}`}
        size={200}
        level="H"
      />

      {/* Player Data */}
      <div>
        <p>{passport.passportData.firstName} {passport.passportData.lastName}</p>
        <p>{passport.passportData.position}</p>
        <p>{passport.passportData.nationality}</p>
      </div>
    </div>
  );
}
```

### Example 2: Create Passport (Admin/Scout)

```tsx
import { useCreatePassport, useCanManagePassport } from '@/hooks/usePassport';

function CreatePassportButton({ playerId }: { playerId: string }) {
  const { mutate: createPassport, isPending } = useCreatePassport();
  const { canCreate } = useCanManagePassport(playerId);

  if (!canCreate) return null;

  const handleCreate = () => {
    createPassport({
      playerId,
      additionalData: {
        notes: 'Auto-generated passport',
      },
    });
  };

  return (
    <button onClick={handleCreate} disabled={isPending}>
      {isPending ? 'Creating...' : 'Create Passport'}
    </button>
  );
}
```

### Example 3: Verify Passport (Admin Only)

```tsx
import { useVerifyPassport, useCanManagePassport } from '@/hooks/usePassport';

function VerifyPassportButton({ playerId }: { playerId: string }) {
  const { mutate: verifyPassport, isPending } = useVerifyPassport();
  const { canVerify } = useCanManagePassport(playerId);

  if (!canVerify) return null;

  const handleVerify = () => {
    verifyPassport({
      playerId,
      data: {
        verified: true,
        adminNotes: 'Verified by admin',
      },
    });
  };

  return (
    <button onClick={handleVerify} disabled={isPending}>
      {isPending ? 'Verifying...' : 'Verify Passport'}
    </button>
  );
}
```

### Example 4: Delete Passport (Admin)

```tsx
import { useDeletePassport, useCanManagePassport } from '@/hooks/usePassport';

function DeletePassportButton({ playerId }: { playerId: string }) {
  const { mutate: deletePassport, isPending } = useDeletePassport();
  const { canDelete } = useCanManagePassport(playerId);

  if (!canDelete) return null;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this passport?')) {
      deletePassport(playerId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Deleting...' : 'Delete Passport'}
    </button>
  );
}
```

### Example 5: Composite Management Hook

```tsx
import { usePassportManagement } from '@/hooks/usePassport';

function PassportManagementPanel({ playerId }: { playerId: string }) {
  const {
    passport,
    isLoading,
    createPassport,
    isCreating,
    verifyPassport,
    isVerifying,
    deletePassport,
    isDeleting,
    canCreate,
    canVerify,
    canDelete,
  } = usePassportManagement(playerId);

  if (isLoading) return <div>Loading...</div>;

  if (!passport && canCreate) {
    return (
      <button onClick={() => createPassport({ playerId })} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create Passport'}
      </button>
    );
  }

  return (
    <div>
      <div>Passport Status: {passport?.status}</div>

      {canVerify && passport?.status === 'PENDING' && (
        <button
          onClick={() => verifyPassport({ verified: true })}
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      )}

      {canDelete && (
        <button onClick={() => deletePassport()} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      )}
    </div>
  );
}
```

## Admin Verification Workflow

### Step 1: Admin Views Pending Passports
```tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function PendingPassportsAdmin() {
  // Note: You may need to create a backend endpoint for listing pending passports
  // For now, admins can verify passports when viewing player profiles

  return (
    <div>
      <h2>Pending Passport Verifications</h2>
      {/* List of pending passports */}
    </div>
  );
}
```

### Step 2: Admin Verifies or Rejects
```tsx
import { useVerifyPassport } from '@/hooks/usePassport';

function PassportVerificationActions({ playerId }: { playerId: string }) {
  const { mutate: verifyPassport, isPending } = useVerifyPassport();

  const handleApprove = () => {
    verifyPassport({
      playerId,
      data: {
        verified: true,
        adminNotes: 'Identity and data verified',
      },
    });
  };

  const handleReject = () => {
    verifyPassport({
      playerId,
      data: {
        verified: false,
        adminNotes: 'Invalid or incomplete data',
      },
    });
  };

  return (
    <div>
      <button onClick={handleApprove} disabled={isPending}>
        Approve
      </button>
      <button onClick={handleReject} disabled={isPending}>
        Reject
      </button>
    </div>
  );
}
```

### Step 3: Passport Status Updates
After verification:
- Status changes to "VERIFIED" if approved
- Status changes to "REVOKED" if rejected
- `verifiedAt` timestamp is set
- All queries are invalidated and refetched automatically

## Permission System

The `useCanManagePassport` hook checks user permissions:

```typescript
const {
  canManage,   // Can do any action (admin or owner)
  canVerify,   // Can verify (admin only)
  canDelete,   // Can delete (admin only)
  canCreate,   // Can create (admin, scout, or agent)
  isAdmin,     // Is user an admin
  isOwner,     // Is user the passport owner
} = useCanManagePassport(playerId);
```

**Role Requirements**:
- **Create**: ADMIN, SCOUT, AGENT roles
- **View by Player ID**: Any authenticated user
- **View by Token**: Public (no auth)
- **Verify**: ADMIN, SUPER_ADMIN only
- **Delete**: ADMIN, SUPER_ADMIN only

## QR Code Implementation

The existing public passport page (`/web/src/app/passport/[token]/page.tsx`) already implements QR code display using `qrcode.react`:

```tsx
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG
  value={`${window.location.origin}/passport/${passport.publicToken}`}
  size={180}
  level="H"
  fgColor="#080C1D"
  bgColor="#FFFFFF"
  includeMargin
/>
```

Use the same pattern in other components that need to display QR codes.

## Error Handling

All hooks use toast notifications (via `sonner`) for user feedback:

```typescript
// Success
toast.success('Passport created successfully');

// Error
toast.error('Failed to create passport');
```

Errors are also available in the hook return values:
```typescript
const { data, isError, error } = usePassportByPlayer(playerId);

if (isError) {
  console.error(error.message);
}
```

## Caching Strategy

React Query is configured with the following cache settings:

- **My Passport**: 5-minute stale time
- **Passport by Player**: 5-minute stale time
- **Passport by Token**: 10-minute stale time (longer for public view)

Cache invalidation happens automatically after mutations:
- Create → Invalidates all passport queries
- Verify → Invalidates all passport queries
- Delete → Invalidates all passport queries

## Best Practices

1. **Always check permissions** before rendering management UI
2. **Use loading states** to prevent multiple submissions
3. **Show clear status indicators** (verified, pending, expired, revoked)
4. **Handle errors gracefully** with user-friendly messages
5. **Cache invalidation** is automatic, don't manually refetch
6. **Use the composite hook** (`usePassportManagement`) for complex UIs

## Testing Recommendations

1. Test passport creation with different roles
2. Test admin verification workflow
3. Test public QR code viewing (already working)
4. Test permission checks for different user roles
5. Test error handling for network failures
6. Test caching behavior with React Query DevTools

## Next Steps for UI Implementation

1. **Player Profile Page**: Add passport display section
2. **Admin Dashboard**: Create pending passports list
3. **Player List**: Add passport status badges
4. **Create Passport Modal**: Add form for passport creation
5. **Verification Panel**: Add admin verification interface
6. **Settings Page**: Add passport management for users

## Support

For questions or issues:
1. Check TypeScript types in `/web/src/types/passport.ts`
2. Review service methods in `/web/src/services/passportService.ts`
3. Check hook documentation in `/web/src/hooks/usePassport.ts`
4. Reference existing passport page at `/web/src/app/passport/[token]/page.tsx`
