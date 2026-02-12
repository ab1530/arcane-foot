# Passport Feature - Quick Reference Card

## Quick Start

### 1. Display a Passport
```tsx
import { usePassportByPlayer } from '@/hooks/usePassport';

function PlayerPassport({ playerId }) {
  const { data: passport, isLoading } = usePassportByPlayer(playerId);

  if (isLoading) return <div>Loading...</div>;
  if (!passport) return <div>No passport found</div>;

  return (
    <div>
      <h2>{passport.passportData.firstName} {passport.passportData.lastName}</h2>
      <p>Status: {passport.status}</p>
    </div>
  );
}
```

### 2. Create a Passport
```tsx
import { useCreatePassport } from '@/hooks/usePassport';

function CreatePassportButton({ playerId }) {
  const { mutate: createPassport, isPending } = useCreatePassport();

  return (
    <button
      onClick={() => createPassport({ playerId })}
      disabled={isPending}
    >
      {isPending ? 'Creating...' : 'Create Passport'}
    </button>
  );
}
```

### 3. Verify a Passport (Admin Only)
```tsx
import { useVerifyPassport } from '@/hooks/usePassport';

function VerifyButton({ playerId }) {
  const { mutate: verify, isPending } = useVerifyPassport();

  return (
    <button
      onClick={() => verify({
        playerId,
        data: { verified: true, adminNotes: 'Approved' }
      })}
      disabled={isPending}
    >
      Verify Passport
    </button>
  );
}
```

### 4. Display QR Code
```tsx
import { QRCodeSVG } from 'qrcode.react';

function PassportQRCode({ token }) {
  return (
    <QRCodeSVG
      value={`${window.location.origin}/passport/${token}`}
      size={200}
      level="H"
    />
  );
}
```

## Hooks Reference

### Queries (GET)

| Hook | Purpose | Auth Required | Returns |
|------|---------|---------------|---------|
| `useMyPassport(playerId)` | Get my passport | Yes | `Passport` |
| `usePassportByPlayer(playerId)` | Get by player ID | Yes | `Passport` |
| `usePassportByToken(token)` | Get by public token | No | `Passport` |

### Mutations (POST/PUT/DELETE)

| Hook | Purpose | Auth Required | Roles |
|------|---------|---------------|-------|
| `useCreatePassport()` | Create new | Yes | ADMIN, SCOUT, AGENT |
| `useVerifyPassport()` | Verify/reject | Yes | ADMIN only |
| `useDeletePassport()` | Delete | Yes | ADMIN only |

### Utilities

| Hook | Purpose | Returns |
|------|---------|---------|
| `useCanManagePassport(playerId)` | Check permissions | `{ canCreate, canVerify, canDelete }` |
| `usePassportStatus(passport)` | Get status info | `{ statusInfo, isVerified, isPending }` |
| `usePassportManagement(playerId)` | All-in-one hook | Combined operations |

## Permission Checks

```tsx
import { useCanManagePassport } from '@/hooks/usePassport';

function PassportActions({ playerId }) {
  const { canCreate, canVerify, canDelete } = useCanManagePassport(playerId);

  return (
    <div>
      {canCreate && <CreateButton />}
      {canVerify && <VerifyButton />}
      {canDelete && <DeleteButton />}
    </div>
  );
}
```

## Status Display

```tsx
import { usePassportStatus } from '@/hooks/usePassport';

function PassportStatusBadge({ passport }) {
  const { statusInfo, isVerified } = usePassportStatus(passport);

  return (
    <span className={`${statusInfo.bgColor} ${statusInfo.color}`}>
      {statusInfo.label}
      {isVerified && ' ✓'}
    </span>
  );
}
```

## Composite Hook (Recommended)

```tsx
import { usePassportManagement } from '@/hooks/usePassport';

function PassportPanel({ playerId }) {
  const {
    passport,
    isLoading,
    createPassport,
    verifyPassport,
    deletePassport,
    canCreate,
    canVerify,
    canDelete,
  } = usePassportManagement(playerId);

  if (isLoading) return <div>Loading...</div>;

  if (!passport && canCreate) {
    return <button onClick={() => createPassport({ playerId })}>Create</button>;
  }

  return (
    <div>
      <PassportDisplay passport={passport} />
      {canVerify && <button onClick={() => verifyPassport({ verified: true })}>Verify</button>}
      {canDelete && <button onClick={() => deletePassport()}>Delete</button>}
    </div>
  );
}
```

## Error Handling

```tsx
function PassportWithError({ playerId }) {
  const { data, isError, error } = usePassportByPlayer(playerId);

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return <PassportDisplay passport={data} />;
}
```

## Loading States

```tsx
function PassportWithLoading({ playerId }) {
  const { data, isLoading, isFetching } = usePassportByPlayer(playerId);

  return (
    <div>
      {isLoading && <Spinner />}
      {isFetching && <div>Refreshing...</div>}
      {data && <PassportDisplay passport={data} />}
    </div>
  );
}
```

## Backend Endpoints

| Method | Endpoint | Purpose | Auth | Roles |
|--------|----------|---------|------|-------|
| POST | `/api/passport` | Create | Yes | ADMIN, SCOUT, AGENT |
| GET | `/api/passport/player/:playerId` | Get by player | Yes | Any |
| GET | `/api/passport/token/:token` | Public view | No | None |
| GET | `/api/passport/qr/:token` | Get QR | No | None |
| PUT | `/api/passport/player/:playerId/verify` | Verify | Yes | ADMIN only |
| DELETE | `/api/passport/player/:playerId` | Delete | Yes | ADMIN only |

## TypeScript Types

```typescript
import type {
  Passport,
  PassportStatus,
  CreatePassportDto,
  VerifyPassportDto
} from '@/types/passport';
```

## Cache Configuration

- My Passport: 5 min stale time
- By Player: 5 min stale time
- By Token: 10 min stale time (public)
- Auto-invalidation after mutations

## Common Patterns

### Check if passport exists
```tsx
const { data: passport } = usePassportByPlayer(playerId);
const hasPassport = !!passport;
```

### Get passport URL
```tsx
import { passportService } from '@/services/passportService';
const url = passportService.getShareableURL(token);
```

### Copy URL to clipboard
```tsx
import { useCopyPassportURL } from '@/hooks/usePassport';
const { mutate: copyURL } = useCopyPassportURL();
copyURL({ token });
```

## Files to Reference

1. **Types**: `/web/src/types/passport.ts`
2. **Service**: `/web/src/services/passportService.ts`
3. **Hooks**: `/web/src/hooks/usePassport.ts`
4. **Full Guide**: `/web/PASSPORT_INTEGRATION.md`
5. **Summary**: `/web/PASSPORT_IMPLEMENTATION_SUMMARY.md`

## Need Help?

1. Check TypeScript types in `/web/src/types/passport.ts`
2. Review service methods in `/web/src/services/passportService.ts`
3. Check hook examples in `/web/src/hooks/usePassport.ts`
4. See full integration guide in `/web/PASSPORT_INTEGRATION.md`
5. Reference existing implementation at `/web/src/app/passport/[token]/page.tsx`
