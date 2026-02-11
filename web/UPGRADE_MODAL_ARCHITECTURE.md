# Upgrade Modal System - Architecture & Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  AI Features  │  │  Subscription  │  │  Upgrade Modal   │  │
│  │  Components   │  │  Guard Hook    │  │  Component       │  │
│  └───────┬───────┘  └────────┬───────┘  └────────▲─────────┘  │
└──────────┼──────────────────┼──────────────────────┼────────────┘
           │                  │                      │
           │ API Call         │ Check Access         │ Show Modal
           ▼                  ▼                      │
┌─────────────────────────────────────────────────────┼────────────┐
│                      Core System                     │            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┴─────────┐ │
│  │ API Client   │  │ API Inter-   │  │ Upgrade Modal         │ │
│  │              │──│  ceptor      │──│  Emitter              │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘ │
└─────────┼──────────────────┼──────────────────────────────────────┘
          │                  │
          │ HTTP Request     │ Detect 403
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   Backend    │  │   Sentry     │  │   Analytics          │ │
│  │   API        │  │   Errors     │  │   Tracking           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Complete Flow Diagram

### Scenario 1: Automatic 403 Error Handling

```
[User] clicks "Generate AI Report"
   ↓
[Component] calls apiClient.generateAutoScoutReport()
   ↓
[API Client] sends POST /api/auto-scout/generate
   ↓
[Backend] checks subscription tier
   ↓
[Backend] returns 403: "Requires GOLD subscription"
   ↓
[API Client] receives 403 response
   ↓
[API Client] calls handleSubscriptionError()
   ↓
[API Interceptor] detects subscription error
   │
   ├─→ [Analytics] track "feature_blocked" event
   ├─→ [Custom Event] emit "arcane:feature-blocked"
   └─→ [Modal Emitter] emit upgrade modal trigger
       ↓
[useSubscriptionGuard] hook receives trigger
   ↓
[State] setShowUpgradeModal(true)
   ↓
[UpgradeModal] component renders
   │
   ├─→ [Analytics] track "upgrade_modal_shown"
   ├─→ [Custom Event] emit "arcane:upgrade-modal-shown"
   └─→ Shows beautiful modal with tier comparison
       ↓
[User] sees modal
   │
   ├─→ [Click "Upgrade"] → navigate to /pricing
   │   ├─→ [Analytics] track "upgrade_modal_cta_clicked"
   │   └─→ [Custom Event] emit "arcane:upgrade-modal-cta-clicked"
   │
   └─→ [Click "Close"] → modal dismissed
       ├─→ [Analytics] track modal dismissed with time shown
       └─→ [Custom Event] emit "arcane:upgrade-modal-dismissed"
```

### Scenario 2: Proactive Access Check

```
[User] clicks button
   ↓
[Component] calls requireAccess('GOLD', 'Feature Name')
   ↓
[useSubscriptionGuard] checks hasMinimumTier('GOLD')
   ↓
[useSubscription] compares current tier vs required tier
   │
   ├─→ [HAS ACCESS] return true → proceed with action
   │
   └─→ [NO ACCESS]
       ↓
       [Analytics] track "feature_blocked"
       ↓
       [Custom Event] emit "arcane:feature-blocked"
       ↓
       [State] setShowUpgradeModal(true)
       ↓
       [UpgradeModal] renders
       ↓
       return false (action blocked)
```

## 📦 Component Responsibilities

### 1. API Client (`api-client.ts`)
**Role**: HTTP communication layer
- Makes API requests
- Handles responses
- Detects 403 errors
- Calls subscription error handler
- Reports to Sentry

**Key Methods**:
```typescript
private async request<T>(endpoint, config)
private getCurrentTier(): string
private handleError(error, endpoint, method, status)
```

### 2. API Interceptor (`api-interceptor.ts`)
**Role**: Error detection and routing
- Intercepts fetch requests
- Detects subscription errors
- Extracts required tier from errors
- Maps endpoints to feature names
- Emits modal triggers

**Key Functions**:
```typescript
isSubscriptionError(error, endpoint): SubscriptionError
handleSubscriptionError(error, endpoint, currentTier): boolean
initializeApiInterceptor()
```

**Key Classes**:
```typescript
class UpgradeModalEmitter {
  subscribe(callback)
  emit(trigger)
}
```

### 3. useSubscriptionGuard Hook (`useSubscriptionGuard.ts`)
**Role**: React integration layer
- Provides subscription check functions
- Manages modal state
- Listens to emitter events
- Tracks analytics

**API**:
```typescript
{
  checkAccess: (tier: SubscriptionTier) => boolean
  requireAccess: (tier: SubscriptionTier, feature?: string) => boolean
  showUpgradeModal: boolean
  blockedFeature: string
  requiredTier: PremiumTier
  closeModal: () => void
}
```

### 4. UpgradeModal Component (`UpgradeModal.tsx`)
**Role**: User interface
- Beautiful modal design
- Tier comparison tables
- Benefits showcase
- CTA buttons
- Analytics tracking

**Props**:
```typescript
{
  isOpen: boolean
  onClose: () => void
  blockedFeature: string
  requiredTier: 'GOLD' | 'PRO' | 'ENTERPRISE'
}
```

### 5. Error Handler (`error-handler.ts`)
**Role**: Global error management
- Categorizes errors
- Handles subscription vs generic errors
- Sentry integration
- User-friendly messages

**API**:
```typescript
ErrorHandler.handle(error, options)
ErrorHandler.handleApiError(error, endpoint, method)
ErrorHandler.handleComponentError(error, errorInfo)
```

## 🔌 Integration Points

### Provider Integration
```tsx
// app/layout.tsx → ClientProviders → UpgradeModalProvider
<AuthProvider>
  <UpgradeModalProvider>
    {children}
  </UpgradeModalProvider>
</AuthProvider>
```

### Component Integration
```tsx
// Any component
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

function MyComponent() {
  const { requireAccess } = useSubscriptionGuard();

  const handleAction = () => {
    if (!requireAccess('GOLD', 'Feature Name')) return;
    // Proceed
  };
}
```

### API Integration
```tsx
// API calls are automatically protected
try {
  await apiClient.generateAutoScoutReport({ ... });
} catch (error) {
  // 403 subscription errors handled automatically
}
```

## 📊 Data Flow

### Subscription Data
```
localStorage (arcane_user)
  → AuthContext
    → useSubscription hook
      → hasMinimumTier(tier)
        → checkAccess(tier)
          → UI rendering decisions
```

### Error Data
```
Backend 403 Response
  → API Client
    → handleSubscriptionError()
      → isSubscriptionError()
        → UpgradeModalEmitter
          → useSubscriptionGuard
            → UpgradeModal
```

### Analytics Data
```
User Action
  → Custom Event (arcane:*)
    → Analytics Service
      → Sentry Breadcrumb
        → Console (dev)
          → External Analytics (GA, Mixpanel, etc.)
```

## 🎯 State Management

### Global State
- `UpgradeModalProvider` → Modal visibility
- `AuthProvider` → User subscription data
- `localStorage` → Persisted subscription info

### Local State
- `useSubscriptionGuard` → Modal trigger data
- `UpgradeModal` → Modal open/close state
- Components → Access check results

## 🔐 Security Model

```
┌─────────────────────────────────────────┐
│         Client-Side (UX Only)           │
│  • checkAccess() → UI decisions         │
│  • Disable buttons                      │
│  • Show locks                           │
│  • Display warnings                     │
└────────────────┬────────────────────────┘
                 │
                 │ API Request
                 ▼
┌─────────────────────────────────────────┐
│      Server-Side (Source of Truth)      │
│  • Validate JWT token                   │
│  • Check subscription in database       │
│  • Return 403 if insufficient           │
│  • NEVER trust client tier claims       │
└─────────────────────────────────────────┘
```

**Important**: Client-side checks are for UX only. Backend always validates.

## 📈 Analytics Pipeline

```
User Interaction
   ↓
Custom DOM Event (arcane:*)
   ↓
Event Listener
   ↓
Analytics Service
   │
   ├─→ Sentry Breadcrumb
   ├─→ Console Log (dev)
   └─→ External Analytics
       │
       ├─→ Google Analytics
       ├─→ Mixpanel
       ├─→ Amplitude
       └─→ Custom DB
```

### Tracked Events
1. **feature_blocked** - When user hits paywall
2. **upgrade_modal_shown** - Modal appears
3. **upgrade_modal_dismissed** - User closes modal
4. **upgrade_modal_cta_clicked** - User clicks upgrade

## 🎨 UI Component Tree

```
UpgradeModalProvider
  └─→ UpgradeModal (Headless UI Dialog)
      ├─→ Backdrop (blur overlay)
      ├─→ Dialog Panel (glassmorphism)
      │   ├─→ Close Button
      │   ├─→ Header
      │   │   ├─→ Lock Icon
      │   │   ├─→ Title
      │   │   └─→ Description
      │   ├─→ Tier Comparison Grid
      │   │   ├─→ Current Tier Card
      │   │   │   ├─→ Icon
      │   │   │   ├─→ Price
      │   │   │   └─→ Features List
      │   │   └─→ Required Tier Card (highlighted)
      │   │       ├─→ Recommended Badge
      │   │       ├─→ Icon
      │   │       ├─→ Price
      │   │       ├─→ Features List
      │   │       └─→ Upgrade Button
      │   ├─→ Benefits Section
      │   │   ├─→ Benefit 1 (Unlimited AI)
      │   │   ├─→ Benefit 2 (Priority Access)
      │   │   └─→ Benefit 3 (Progression)
      │   ├─→ CTA Buttons
      │   │   ├─→ Primary: Upgrade to GOLD
      │   │   └─→ Secondary: View All Plans
      │   └─→ Trust Signals
      │       └─→ Security, Cancellation, etc.
      └─→ Framer Motion Animations
```

## 🚀 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Modal only renders when needed
2. **Event Emitter**: Efficient pub/sub pattern
3. **localStorage Cache**: Reduces API calls for subscription data
4. **Error Deduplication**: Prevents multiple modals for same error
5. **Analytics Batching**: Debounce rapid events

### Bundle Size
- API Interceptor: ~10KB
- UpgradeModal: ~15KB (with Headless UI)
- Hook: ~5KB
- Total: ~30KB gzipped

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test subscription checks
expect(meetsMinimumTier('GOLD', 'FREE')).toBe(true);
expect(meetsMinimumTier('FREE', 'GOLD')).toBe(false);

// Test error detection
expect(isSubscriptionError({ status: 403, message: 'requires GOLD' }))
  .toEqual({ isSubscriptionError: true, requiredTier: 'GOLD' });
```

### Integration Tests
```typescript
// Test modal trigger on 403
await apiClient.generateReport();
expect(modal).toBeVisible();

// Test access check
const { requireAccess } = renderHook(() => useSubscriptionGuard());
expect(requireAccess('GOLD')).toBe(false);
expect(modal).toBeVisible();
```

### E2E Tests
```typescript
// Full user flow
test('free user sees upgrade modal on premium feature', async () => {
  await loginAsFreeUser();
  await clickGenerateReport();
  await expectModalVisible();
  await clickUpgradeButton();
  await expectPricingPage();
});
```

## 🔄 Future Enhancements

1. **Smart Timing**: Show modal after user demonstrates intent
2. **Exit Intent**: Trigger on leaving page after block
3. **Personalization**: Different messaging based on user behavior
4. **A/B Testing**: Test different modal designs
5. **Trial Offers**: "Try 7 days free" for first-time blocks
6. **Feature Bundling**: "Unlock 5 AI features with GOLD"

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Status**: Production Ready
