# ARCANE FOOTBALL - RBAC & PERMISSIONS AUDIT REPORT

**Date**: 2025-11-07
**Author**: Claude AI Analysis
**Version**: 1.0

---

## EXECUTIVE SUMMARY

This comprehensive audit analyzes the Role-Based Access Control (RBAC) system in ARCANE Football, examining user roles, subscription tiers, API endpoint protection, and permission enforcement across 29+ feature modules.

### Key Findings:
- **8 User Roles** defined in the system with varying permissions
- **5 Subscription Tiers** (FREE, BASIC, GOLD, PRO, ENTERPRISE)
- **CRITICAL ISSUE**: Subscription tier enforcement is almost completely absent
- **WARNING**: Many endpoints lack proper role-based protection
- **POSITIVE**: Core authentication infrastructure is solid
- **CONCERN**: Inconsistent permission patterns across modules

---

## 1. USER ROLES ANALYSIS

### 1.1 Role Definitions (from Prisma Schema)

```prisma
enum UserRole {
  SUPER_ADMIN     // System administrator with full access
  ADMIN           // Administrator with broad permissions
  AGENT           // Player agent/representative
  SCOUT           // Scout user (core persona)
  ANALYST         // Performance analyst
  PLAYER          // Player user
  CLUB_CONTACT    // Club representative
  PUBLIC          // Free/public user (default)
}
```

### 1.2 Role Hierarchy & Permissions

| Role | Level | Primary Use Case | Access Level |
|------|-------|------------------|--------------|
| SUPER_ADMIN | 1 | System administration, data sync, critical operations | Full system access |
| ADMIN | 2 | Platform management, validation, bulk operations | High-level administrative |
| AGENT | 3 | Player representation, negotiations | Agency-specific features |
| SCOUT | 4 | Scouting reports, player analysis | Core scouting features |
| ANALYST | 5 | Performance analysis, statistics | Analysis tools |
| CLUB_CONTACT | 6 | Club management, player recruitment | Club-specific features |
| PLAYER | 7 | Personal profile, camps registration | Player-specific features |
| PUBLIC | 8 | Limited read-only access | Minimal access |

### 1.3 Role Usage Analysis

**Roles actively used in guards:**
- `SUPER_ADMIN` - 11 occurrences (admin panels, data sync, player validation)
- `ADMIN` - 25 occurrences (most admin features)
- `SCOUT` - 21 occurrences (scouting reports, AI features)
- `ANALYST` - 4 occurrences (SmartScout AI)
- `AGENT` - 2 occurrences (SmartScout insights)
- `CLUB_CONTACT` - 2 occurrences (SmartScout insights, marketplace)
- `DIRECTOR` - 3 occurrences (AutoScout - **NOT IN SCHEMA - BUG**)

**Roles NOT used in any guards:**
- `PLAYER` - No explicit role guards found
- `PUBLIC` - No explicit role guards found

**ISSUE**: The role `DIRECTOR` is used in AutoScout controller but doesn't exist in the UserRole enum. This is a **critical bug**.

---

## 2. SUBSCRIPTION TIERS ANALYSIS

### 2.1 Tier Definitions

```typescript
enum SubscriptionTier {
  FREE        // €0/month - Limited access
  BASIC       // €19.99/month - Independent scouts
  GOLD        // €49.99/month - Professional scouts (POPULAR)
  PRO         // €149/month - Agencies and clubs
  ENTERPRISE  // €999+/month - Custom pricing
}
```

### 2.2 Tier Hierarchy (from SubscriptionsService)

```typescript
const tierHierarchy = {
  FREE: 0,
  BASIC: 1,
  GOLD: 2,
  PRO: 3,
  ENTERPRISE: 4,
};
```

**Validation Logic**: User's tier level must be >= required minimum tier level.

### 2.3 Tier Feature Matrix

| Feature Category | FREE | BASIC | GOLD | PRO | ENTERPRISE |
|-----------------|------|-------|------|-----|------------|
| **Player Search** | 10/day | Unlimited | Unlimited | Unlimited | Unlimited |
| **Scouting Reports** | Read-only | 10/month | Unlimited | Unlimited | Unlimited |
| **Kanban Boards** | None | 1 board | Unlimited | Unlimited | Unlimited |
| **AI Features (ArkaneGPT)** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **ArkaneIndex Score** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **AI Matchmaking** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Video Analysis** | ❌ | ❌ | Basic | Advanced | Advanced |
| **Auto-Scout AI** | ❌ | ❌ | Limited | ✅ | ✅ |
| **Smart Scout AI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Performance Predictor** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Market Value AI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Team Collaboration** | None | None | 3 members | Unlimited | Unlimited |
| **API Access** | ❌ | ❌ | 10k calls/mo | 100k calls/mo | Unlimited |
| **Support** | Community | Email (48h) | Priority (24h) | Priority (4h) | 24/7 SLA |
| **Priority Camp Access** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ❌ | +€500/mo | ✅ |
| **SSO/SAML** | ❌ | ❌ | ❌ | ❌ | ✅ |

### 2.4 Tier Pricing (Updated Nov 2025)

| Tier | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| FREE | €0 | €0 | - |
| BASIC | €19.99 | €199.99 | 17% |
| GOLD | €49.99 | €499.99 | 17% |
| PRO | €149 | €1,488 | 17% |
| ENTERPRISE | €999+ | €9,999+ | Custom |

**Notes:**
- Prices increased by +150% in November 2025
- Still 10x cheaper than competitors (Wyscout: €3K-20K/year)
- GOLD tier is marked as "most popular"

---

## 3. GUARDS & DECORATORS ANALYSIS

### 3.1 Available Guards

| Guard | Purpose | Implementation Quality |
|-------|---------|----------------------|
| **JwtAuthGuard** | JWT token validation | ✅ Solid - Standard Passport implementation |
| **RolesGuard** | Role-based access control | ✅ Good - Uses Reflector for metadata |
| **SubscriptionTierGuard** | Tier-based access control | ✅ Good implementation - **BUT UNUSED** |
| **OptionalJwtAuthGuard** | Optional authentication | ✅ Good - Allows unauthenticated access |
| **OwnershipGuard** | Resource ownership validation | ⚠️ Partial - Only supports user/player/club |
| **AuthThrottlerGuard** | Rate limiting for auth | ✅ Good - Prevents brute force |
| **AiThrottlerGuard** | Rate limiting for AI | ✅ Good - Prevents excessive API costs |

### 3.2 Available Decorators

| Decorator | Purpose | Usage Count |
|-----------|---------|-------------|
| **@Roles(...roles)** | Specify required roles | 32 usages across 4 controllers |
| **@MinTier(tier)** | Specify minimum subscription tier | **0 usages - COMPLETELY UNUSED** |
| **@CheckOwnership(param, type)** | Validate resource ownership | **0 usages - COMPLETELY UNUSED** |

### 3.3 Guard Usage Patterns

**Controllers using JwtAuthGuard only (no role restrictions):**
- Auth Controller - ✅ Correct (auth endpoints are role-agnostic)
- Players Controller - ⚠️ Should restrict create/update/delete
- Clubs Controller - ⚠️ Should restrict create/update/delete
- Scouting Reports Controller - ✅ Appropriate (scouts only)
- Payments Controller - ✅ Appropriate (user-specific)
- Subscriptions Controller - ✅ Appropriate (user-specific)
- Marketplace Controller - ⚠️ Needs role separation (scouts vs clubs)
- AI Controller - ⚠️ High-cost endpoints need tier restrictions
- Gamification Controller - ✅ Appropriate (user-specific)
- Camps Controller - ⚠️ Should restrict admin operations
- Coaching Controller - ✅ Appropriate
- Matches Controller - ⚠️ Should restrict create/update/delete
- Events Controller - ⚠️ Should restrict create/update/delete
- Kanban Controller - ⚠️ Should restrict based on subscription tier
- Performance Predictor Controller - ⚠️ GOLD+ feature with no tier guard

**Controllers using RolesGuard properly:**
- Player Validation Controller - ✅ SUPER_ADMIN, ADMIN, SCOUT only
- AutoScout Controller - ⚠️ Uses non-existent "DIRECTOR" role
- SmartScout Controller - ✅ SCOUT, ANALYST, ADMIN roles
- Data Sync Controller - ✅ SUPER_ADMIN, ADMIN only

---

## 4. API ENDPOINTS RBAC MATRIX

### 4.1 Authentication Endpoints (No restrictions needed)

| Endpoint | Method | Auth Required | Roles | Tier | Status |
|----------|--------|---------------|-------|------|--------|
| `/auth/signup` | POST | ❌ | - | - | ✅ Correct |
| `/auth/login` | POST | ❌ | - | - | ✅ Correct |
| `/auth/refresh` | POST | ❌ | - | - | ✅ Correct |
| `/auth/logout` | POST | ✅ | - | - | ✅ Correct |
| `/auth/me` | GET | ✅ | - | - | ✅ Correct |

### 4.2 Players Management

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/players` | GET | ❌ | - | - | ✅ Public read | ✅ OK |
| `/players/:id` | GET | ❌ | - | - | ✅ Public read | ✅ OK |
| `/players` | POST | ✅ | - | - | ⚠️ Any auth user | Should be AGENT/CLUB_CONTACT |
| `/players/:id` | PUT | ✅ | - | - | ⚠️ Any auth user | Should check ownership |
| `/players/:id` | DELETE | ✅ | - | - | ⚠️ Any auth user | Should be ADMIN or owner |
| `/players/:id/stats` | GET | ❌ | - | - | ✅ Public read | ✅ OK |
| `/players/:id/reports` | GET | ❌ | - | - | ⚠️ Public read | Should be SCOUT+ or BASIC+ |

### 4.3 Scouting Reports

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/scouting-reports` | POST | ✅ | - | - | ⚠️ Any auth user | SCOUT role + BASIC+ tier |
| `/scouting-reports` | GET | ✅ | - | - | ⚠️ Any auth user | SCOUT+ or BASIC+ tier |
| `/scouting-reports/:id` | GET | ✅ | - | - | ⚠️ Any auth user | SCOUT+ or BASIC+ tier |
| `/scouting-reports/:id` | PATCH | ✅ | - | - | ⚠️ Any auth user | Owner or ADMIN |
| `/scouting-reports/:id/submit` | POST | ✅ | - | - | ⚠️ Any auth user | Owner only |
| `/scouting-reports/:id/review` | POST | ✅ | - | - | ⚠️ Any auth user | ADMIN/SCOUT lead |

### 4.4 AI Features (High-Value/High-Cost)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/ai/summary` | POST | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/ai/index/:playerId` | GET | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/ai/matchmaking` | POST | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/ai/player-analysis/:playerId` | GET | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/ai/talent-prediction/:playerId` | GET | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |

### 4.5 AutoScout AI (AI Report Generation)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/auto-scout/generate` | POST | ✅ | SCOUT, ADMIN, DIRECTOR | - | ⚠️ Role only | SCOUT + GOLD+ tier |
| `/auto-scout/bulk-generate` | POST | ✅ | ADMIN, DIRECTOR | - | ⚠️ Role only | ADMIN + PRO+ tier |
| `/auto-scout/enhance/:reportId` | POST | ✅ | SCOUT, ADMIN, DIRECTOR | - | ⚠️ Role only | SCOUT + GOLD+ tier |
| `/auto-scout/templates` | GET | ✅ | SCOUT, ADMIN, DIRECTOR | - | ⚠️ Role only | SCOUT + GOLD+ tier |
| `/auto-scout/custom` | POST | ✅ | ADMIN, DIRECTOR | - | ⚠️ Role only | ADMIN + PRO+ tier |

**CRITICAL BUG**: "DIRECTOR" role doesn't exist in schema!

### 4.6 SmartScout AI (Intelligent Suggestions)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/smart-scout/suggestions` | POST | ✅ | SCOUT, ANALYST, ADMIN | - | ⚠️ Role only | SCOUT + GOLD+ tier |
| `/smart-scout/autocomplete` | POST | ✅ | SCOUT, ANALYST, ADMIN | - | ⚠️ Role only | SCOUT + GOLD+ tier |
| `/smart-scout/insights/:playerId` | GET | ✅ | SCOUT, ANALYST, ADMIN, AGENT, CLUB_CONTACT | - | ⚠️ Role only | Any + GOLD+ tier |
| `/smart-scout/index/:reportId` | POST | ✅ | ADMIN, SUPER_ADMIN | - | ✅ Good | ✅ OK |
| `/smart-scout/reindex-all` | POST | ✅ | ADMIN, SUPER_ADMIN | - | ✅ Good | ✅ OK |

### 4.7 Performance Predictor (ML Predictions)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/performance-predictor/predict/:playerId/:matchId` | POST | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/performance-predictor/batch-predict/:matchId` | POST | ✅ | - | - | ❌ **CRITICAL** | PRO+ tier required |
| `/performance-predictor/accuracy` | GET | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/performance-predictor/feature-importance` | GET | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |
| `/performance-predictor/retrain` | POST | ✅ | - | - | ❌ **CRITICAL** | ADMIN only |

### 4.8 Market Value AI

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| All market-value endpoints | * | ✅ | - | - | ❌ **CRITICAL** | GOLD+ tier required |

### 4.9 Marketplace (Scout Listings)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/marketplace/listings` | POST | ✅ | - | - | ⚠️ Any auth user | SCOUT role |
| `/marketplace/listings` | GET | ✅ | - | - | ⚠️ Any auth user | CLUB_CONTACT role |
| `/marketplace/offers` | POST | ✅ | - | - | ⚠️ Any auth user | CLUB_CONTACT role |
| `/marketplace/offers/received` | GET | ✅ | - | - | ⚠️ Any auth user | SCOUT role |

### 4.10 Player Validation (Admin Panel)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/admin/players/pending-validation` | GET | ✅ | SUPER_ADMIN, ADMIN, SCOUT | - | ✅ Good | ✅ OK |
| `/admin/players/:id/validate` | POST | ✅ | SUPER_ADMIN, ADMIN, SCOUT | - | ✅ Good | ✅ OK |
| `/admin/players/:id/reject` | POST | ✅ | SUPER_ADMIN, ADMIN, SCOUT | - | ✅ Good | ✅ OK |
| `/admin/players/:id/convert-to-agency` | POST | ✅ | SUPER_ADMIN, ADMIN | - | ✅ Good | ✅ OK |
| `/admin/players/bulk-import` | POST | ✅ | SUPER_ADMIN, ADMIN | - | ✅ Good | ✅ OK |

### 4.11 Camps & Events

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/camps` | GET | ❌ | - | - | ✅ Public read | ✅ OK |
| `/camps/:id` | GET | ❌ | - | - | ✅ Public read | ✅ OK |
| `/camps` | POST | ✅ | - | - | ⚠️ Any auth user | AGENT/ADMIN only |
| `/camps/:id/register` | POST | ✅ | - | - | ⚠️ Any auth user | Check tier requirement |
| `/camps/:id/participants` | GET | ✅ | - | - | ⚠️ Any auth user | AGENT/ADMIN only |

### 4.12 Gamification

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| All gamification endpoints | * | ✅ | - | - | ✅ User-specific | ✅ OK (user context) |

### 4.13 Data Sync (Admin Operations)

| Endpoint | Method | Auth | Roles | Tier | Current Status | Recommended |
|----------|--------|------|-------|------|----------------|-------------|
| `/data-sync/sync-competitions` | POST | ✅ | SUPER_ADMIN, ADMIN | - | ✅ Good | ✅ OK |
| `/data-sync/sync-matches/:competitionId` | POST | ✅ | SUPER_ADMIN, ADMIN | - | ✅ Good | ✅ OK |
| `/data-sync/sync-venues` | POST | ✅ | SUPER_ADMIN, ADMIN | - | ✅ Good | ✅ OK |
| `/data-sync/force-sync` | POST | ✅ | SUPER_ADMIN | - | ✅ Good | ✅ OK |

---

## 5. CRITICAL SECURITY ISSUES

### 5.1 HIGH SEVERITY Issues

#### ❌ CRITICAL #1: AI Features Completely Unprotected by Tier Guards
**Risk Level**: CRITICAL
**Financial Impact**: HIGH (OpenAI API costs)
**Security Impact**: HIGH (feature abuse)

**Problem**: All AI features (AI controller, AutoScout, SmartScout, Performance Predictor, Market Value) are accessible to **all authenticated users**, including FREE tier users. These features:
- Cost money per API call (OpenAI GPT-4, embeddings)
- Are marketed as premium GOLD+ features
- Have significant computational cost

**Affected Endpoints**:
```typescript
// No tier guards at all!
/ai/summary                    // OpenAI API calls
/ai/player-analysis            // OpenAI API calls
/ai/talent-prediction          // OpenAI API calls
/auto-scout/generate           // GPT-4 calls (~$0.03/report)
/smart-scout/suggestions       // Vector embeddings
/performance-predictor/*       // ML predictions
/market-value/*                // Valuation AI
```

**Current Revenue Loss**: If 100 FREE users generate 10 reports/day:
- Daily cost: 1000 reports × $0.03 = **$30/day**
- Monthly loss: **$900/month**
- Annual loss: **$10,800/year**

**Recommendation**:
```typescript
// Add to all AI controllers
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)
```

---

#### ❌ CRITICAL #2: "DIRECTOR" Role Used But Doesn't Exist
**Risk Level**: HIGH
**Impact**: Broken access control for AutoScout

**Problem**: AutoScout controller uses `@Roles('SCOUT', 'ADMIN', 'DIRECTOR')` but DIRECTOR is not in the UserRole enum.

**Affected Code**:
```typescript
// /backend/src/modules/auto-scout/auto-scout.controller.ts
@Roles('SCOUT', 'ADMIN', 'DIRECTOR')  // ❌ DIRECTOR doesn't exist!
async generateReport(...)
```

**Impact**: RolesGuard will reject all users trying to access these endpoints because no user can have role='DIRECTOR'.

**Recommendation**: Either:
1. Add DIRECTOR to UserRole enum, OR
2. Replace with existing role (likely ADMIN)

---

#### ❌ CRITICAL #3: Subscription Tier Guard Implemented But Never Used
**Risk Level**: HIGH
**Financial Impact**: HIGH (lost revenue)

**Problem**:
- `SubscriptionTierGuard` is fully implemented and working
- `@MinTier()` decorator exists and is documented
- **Zero usages in the entire codebase**

**Evidence**:
```bash
$ grep -r "@MinTier" backend/src/modules
# Result: No matches found
```

**Impact**: All premium features are accessible to FREE users.

**Affected Features** (should be GOLD+):
- AI Features (all)
- Kanban unlimited boards
- Unlimited scouting reports
- Performance Predictor
- Market Value AI
- Smart Scout AI
- Priority camp access

**Recommendation**: Add `@MinTier()` to all premium endpoints.

---

### 5.2 HIGH SEVERITY Issues

#### ⚠️ HIGH #4: Players CRUD Has No Role Restrictions
**Risk Level**: HIGH
**Impact**: Any authenticated user can create/modify/delete players

**Problem**:
```typescript
@Post()
@UseGuards(JwtAuthGuard)  // ❌ No role check
create(@Body() createPlayerDto: CreatePlayerDto)

@Put(':id')
@UseGuards(JwtAuthGuard)  // ❌ No ownership check
update(@Param('id') id: string, ...)

@Delete(':id')
@UseGuards(JwtAuthGuard)  // ❌ No ownership check
remove(@Param('id') id: string)
```

**Attack Scenario**: Malicious user can:
1. Create fake player profiles
2. Modify other users' players
3. Delete competitors' players

**Recommendation**:
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AGENT', 'CLUB_CONTACT', 'ADMIN')
create(...)

@Put(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'player')
update(...)

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
remove(...)
```

---

#### ⚠️ HIGH #5: Clubs CRUD Has No Role Restrictions
**Risk Level**: HIGH
**Impact**: Data integrity issues

**Problem**: Same as players - any authenticated user can create/modify/delete clubs.

**Recommendation**: Restrict to CLUB_CONTACT, ADMIN roles.

---

#### ⚠️ HIGH #6: Marketplace Role Confusion
**Risk Level**: MEDIUM
**Impact**: Business logic errors, UX confusion

**Problem**: Marketplace endpoints don't enforce proper role separation:
- Scouts should create listings, receive offers
- Clubs should browse listings, send offers
- Current: Any auth user can do anything

**Recommendation**: Add role checks:
```typescript
@Post('listings')
@Roles('SCOUT', 'AGENT')

@Post('offers')
@Roles('CLUB_CONTACT')
```

---

### 5.3 MEDIUM SEVERITY Issues

#### ⚠️ MEDIUM #7: Scouting Reports Lack Ownership Validation
**Problem**: Any authenticated user can modify any report.

**Recommendation**: Add OwnershipGuard for update/delete operations.

---

#### ⚠️ MEDIUM #8: Camps Admin Operations Not Protected
**Problem**: Camp creation/management should be restricted to agents/admins.

---

#### ⚠️ MEDIUM #9: Match/Event CRUD Not Protected
**Problem**: Any user can create/modify matches and events.

---

#### ⚠️ MEDIUM #10: Kanban Boards No Tier Enforcement
**Problem**: FREE users can create unlimited boards (should be 0), BASIC users can create unlimited (should be 1).

---

### 5.4 LOW SEVERITY Issues

#### ℹ️ LOW #11: OptionalJwtAuthGuard Rarely Used
**Impact**: Some endpoints that could be public-with-auth-bonus aren't utilizing this pattern.

---

#### ℹ️ LOW #12: OwnershipGuard Not Used Anywhere
**Impact**: Ownership validation is done manually in services instead of declaratively.

---

## 6. RBAC IMPLEMENTATION RECOMMENDATIONS

### 6.1 Immediate Actions (Critical - Do First)

#### Action 1: Fix DIRECTOR Role Bug
```typescript
// Option A: Add to schema
enum UserRole {
  SUPER_ADMIN
  ADMIN
  DIRECTOR  // ← Add this
  AGENT
  SCOUT
  ANALYST
  PLAYER
  CLUB_CONTACT
  PUBLIC
}

// Option B: Replace in AutoScout controller
@Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')  // Remove DIRECTOR
```

#### Action 2: Protect All AI Endpoints with Tier Guards
```typescript
// AI Controller
@Controller('ai')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)  // ← Add this
export class AiController { ... }

// AutoScout Controller
@Controller('auto-scout')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)  // ← Add this
export class AutoScoutController { ... }

// SmartScout Controller
@Controller('smart-scout')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)  // ← Add this
export class SmartScoutController { ... }

// Performance Predictor Controller
@Controller('performance-predictor')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)  // ← Add this
export class PerformancePredictorController { ... }

// Market Value Controller
@Controller('market-value')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)  // ← Add this
export class MarketValueController { ... }
```

#### Action 3: Protect Player CRUD Operations
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AGENT', 'CLUB_CONTACT', 'ADMIN', 'SUPER_ADMIN')
create(@Body() createPlayerDto: CreatePlayerDto) { ... }

@Put(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'player')
update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) { ... }

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
remove(@Param('id') id: string) { ... }
```

#### Action 4: Protect Club CRUD Operations
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLUB_CONTACT', 'ADMIN', 'SUPER_ADMIN')
create(@Body() createClubDto: CreateClubDto) { ... }

@Put(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'club')
update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto) { ... }

@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
remove(@Param('id') id: string) { ... }
```

---

### 6.2 Short-Term Actions (High Priority)

#### Action 5: Protect Scouting Reports
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@Roles('SCOUT', 'ANALYST', 'ADMIN')
@MinTier(SubscriptionTier.BASIC)
create(@Body() createDto: CreateScoutingReportDto) { ... }

@Patch(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'report')
update(@Param('id') id: string, @Body() updateDto: UpdateScoutingReportDto) { ... }
```

#### Action 6: Add Marketplace Role Separation
```typescript
// Scout-only endpoints
@Post('listings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCOUT', 'AGENT')

@Get('offers/received')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCOUT', 'AGENT')

// Club-only endpoints
@Post('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLUB_CONTACT')

@Get('offers/sent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLUB_CONTACT')
```

#### Action 7: Protect Camps Admin Operations
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AGENT', 'ADMIN', 'SUPER_ADMIN')
createCamp(@Body() dto: CreateCampDto) { ... }

@Get(':id/participants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AGENT', 'ADMIN', 'SUPER_ADMIN')
getCampParticipants(@Param('id') id: string) { ... }
```

#### Action 8: Add Tier Enforcement to Camp Registration
```typescript
@Post(':id/register')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
async registerForCamp(@Req() req, @Param('id') id: string, @Body() dto: RegisterCampDto) {
  // Service should check camp.requiredTier against user's subscription
  return this.campsService.registerForCamp(req.user.id, id, dto);
}
```

---

### 6.3 Medium-Term Actions (Medium Priority)

#### Action 9: Protect Match/Event CRUD
```typescript
// Matches Controller
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
create(@Body() createMatchDto: CreateMatchDto) { ... }

// Events Controller
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'SCOUT')
create(@Body() createEventDto: CreateEventDto) { ... }
```

#### Action 10: Add Kanban Tier Enforcement
```typescript
// Create new guard: KanbanTierGuard
@Injectable()
export class KanbanTierGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest().user;
    const subscription = await this.getSubscription(user.id);

    const boardCount = await this.prisma.kanban_boards.count({
      where: { ownerId: user.id }
    });

    const limits = {
      FREE: 0,
      BASIC: 1,
      GOLD: Infinity,
      PRO: Infinity,
      ENTERPRISE: Infinity,
    };

    if (boardCount >= limits[subscription.tier]) {
      throw new ForbiddenException('Upgrade to create more boards');
    }

    return true;
  }
}

// Apply to Kanban controller
@Post('boards')
@UseGuards(JwtAuthGuard, KanbanTierGuard)
createBoard(...) { ... }
```

#### Action 11: Enhance OwnershipGuard
```typescript
// Add support for more resource types
if (resourceType === 'report') {
  const report = await this.prisma.scouting_reports.findUnique({
    where: { id: resourceId },
    select: { scoutId: true },
  });

  if (!report || report.scoutId !== user.id) {
    throw new ForbiddenException('You do not have permission');
  }
}

if (resourceType === 'kanban_board') {
  const board = await this.prisma.kanban_boards.findUnique({
    where: { id: resourceId },
    select: { ownerId: true },
  });

  if (!board || board.ownerId !== user.id) {
    throw new ForbiddenException('You do not have permission');
  }
}
```

---

### 6.4 Long-Term Actions (Low Priority, Best Practices)

#### Action 12: Create Feature Access Service
```typescript
@Injectable()
export class FeatureAccessService {
  private readonly featureMap = {
    'ai-features': { minTier: SubscriptionTier.GOLD },
    'unlimited-reports': { minTier: SubscriptionTier.GOLD },
    'kanban-unlimited': { minTier: SubscriptionTier.GOLD },
    'video-analysis': { minTier: SubscriptionTier.GOLD },
    'auto-scout': { minTier: SubscriptionTier.GOLD },
    'smart-scout': { minTier: SubscriptionTier.GOLD },
    'performance-predictor': { minTier: SubscriptionTier.GOLD },
    'market-value-ai': { minTier: SubscriptionTier.GOLD },
    'api-access': { minTier: SubscriptionTier.GOLD },
    'team-collaboration': { minTier: SubscriptionTier.GOLD },
  };

  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { userId }
    });

    const requiredTier = this.featureMap[feature]?.minTier;
    if (!requiredTier) return true;

    return this.hasMinimumTier(subscription.tier, requiredTier);
  }
}
```

#### Action 13: Add Audit Logging for Admin Actions
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Log admin actions to audit_logs table
    if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      this.auditService.log({
        userId: user.id,
        action: `${request.method} ${request.url}`,
        entityType: context.getClass().name,
        entityId: request.params.id,
        changes: request.body,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }

    return next.handle();
  }
}
```

#### Action 14: Implement Permission Caching
```typescript
@Injectable()
export class PermissionCache {
  private cache = new Map<string, { permissions: any; expiresAt: Date }>();

  async getUserPermissions(userId: string) {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > new Date()) {
      return cached.permissions;
    }

    const permissions = await this.loadPermissions(userId);
    this.cache.set(userId, {
      permissions,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min cache
    });

    return permissions;
  }
}
```

---

## 7. COMPLETE RBAC MATRIX

### 7.1 Role × Feature Access Matrix

| Feature | PUBLIC | PLAYER | SCOUT | ANALYST | AGENT | CLUB_CONTACT | ADMIN | SUPER_ADMIN |
|---------|--------|--------|-------|---------|-------|--------------|-------|-------------|
| **View Players** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Players** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Players** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Edit Any Players** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Delete Players** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **View Clubs** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Clubs** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Edit Own Club** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Edit Any Club** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Create Scouting Reports** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **View Scouting Reports** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Edit Own Reports** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Review Reports** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **AI Features (Basic)** | ❌ | ❌ | Tier | Tier | Tier | Tier | ✅ | ✅ |
| **AutoScout AI** | ❌ | ❌ | Tier | Tier | ❌ | ❌ | ✅ | ✅ |
| **SmartScout AI** | ❌ | ❌ | Tier | Tier | Tier | Tier | ✅ | ✅ |
| **Performance Predictor** | ❌ | ❌ | Tier | Tier | Tier | Tier | ✅ | ✅ |
| **Market Value AI** | ❌ | ❌ | Tier | Tier | Tier | Tier | ✅ | ✅ |
| **Create Camp/Event** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Register for Camp** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Validate Players** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Bulk Import Players** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Data Sync Operations** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **System Configuration** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Marketplace (Scout)** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Marketplace (Club)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Kanban Boards** | ❌ | ❌ | Tier | Tier | Tier | Tier | ✅ | ✅ |
| **Gamification** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**:
- ✅ = Allowed
- ❌ = Denied
- "Tier" = Depends on subscription tier

---

### 7.2 Tier × Feature Access Matrix

| Feature | FREE | BASIC | GOLD | PRO | ENTERPRISE |
|---------|------|-------|------|-----|------------|
| **Player Search** | 10/day | ∞ | ∞ | ∞ | ∞ |
| **Scouting Reports (Create)** | ❌ | 10/month | ∞ | ∞ | ∞ |
| **Scouting Reports (View)** | ✅ Read-only | ✅ | ✅ | ✅ | ✅ |
| **Kanban Boards** | 0 | 1 | ∞ | ∞ | ∞ |
| **AI Summary** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **ArkaneIndex Score** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **AI Matchmaking** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Player Analysis AI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Talent Prediction** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **AutoScout (Generate Report)** | ❌ | ❌ | 10/month | ∞ | ∞ |
| **AutoScout (Bulk)** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **SmartScout AI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Performance Predictor** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Market Value AI** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Video Analysis** | ❌ | ❌ | Basic | Advanced | Advanced |
| **Team Collaboration** | ❌ | ❌ | 3 users | ∞ | ∞ |
| **API Access** | ❌ | ❌ | 10k/mo | 100k/mo | ∞ |
| **Priority Camp Access** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Export PDF** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Advanced Analytics** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ❌ | +€500/mo | ✅ |
| **SSO/SAML** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | Email 48h | Priority 24h | Priority 4h | 24/7 SLA |
| **Account Manager** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 8. RECOMMENDED PERMISSION POLICY

### 8.1 Permission Decision Tree

```
1. Is endpoint public data (read-only)?
   YES → No auth required
   NO → Continue to step 2

2. Is endpoint user-specific (own data)?
   YES → JwtAuthGuard only + ownership check
   NO → Continue to step 3

3. Is endpoint role-restricted?
   YES → JwtAuthGuard + RolesGuard + @Roles()
   NO → Continue to step 4

4. Is endpoint premium feature (AI, advanced)?
   YES → JwtAuthGuard + SubscriptionTierGuard + @MinTier()
   NO → Continue to step 5

5. Is endpoint high-cost operation?
   YES → Add AiThrottlerGuard or rate limiting
   NO → JwtAuthGuard only

6. Is endpoint admin operation?
   YES → JwtAuthGuard + RolesGuard + @Roles('ADMIN', 'SUPER_ADMIN')
```

### 8.2 Guard Combination Patterns

#### Pattern 1: Public Read, Auth Write
```typescript
@Get()
// No guards
findAll() { ... }

@Post()
@UseGuards(JwtAuthGuard)
create() { ... }
```

#### Pattern 2: Premium Feature
```typescript
@Post('ai-analysis')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard, AiThrottlerGuard)
@MinTier(SubscriptionTier.GOLD)
@Throttle({ default: { ttl: 60000, limit: 10 } })
generateAnalysis() { ... }
```

#### Pattern 3: Role-Restricted Operation
```typescript
@Post('validate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'SCOUT')
validatePlayer() { ... }
```

#### Pattern 4: Owner-Only Operation
```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'player')
updatePlayer() { ... }
```

#### Pattern 5: Admin-Only Operation
```typescript
@Post('bulk-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
bulkImport() { ... }
```

---

## 9. TESTING RECOMMENDATIONS

### 9.1 RBAC Test Scenarios

#### Test Suite 1: Role Access Tests
```typescript
describe('Role-Based Access Control', () => {
  it('PUBLIC users cannot create players', async () => {
    const response = await request(app)
      .post('/players')
      .set('Authorization', `Bearer ${publicUserToken}`)
      .send(playerData);

    expect(response.status).toBe(403);
  });

  it('SCOUT users can create reports', async () => {
    const response = await request(app)
      .post('/scouting-reports')
      .set('Authorization', `Bearer ${scoutToken}`)
      .send(reportData);

    expect(response.status).toBe(201);
  });

  it('ADMIN users can validate players', async () => {
    const response = await request(app)
      .post('/admin/players/123/validate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});
```

#### Test Suite 2: Tier Access Tests
```typescript
describe('Subscription Tier Access Control', () => {
  it('FREE users cannot access AI features', async () => {
    const response = await request(app)
      .post('/ai/summary')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send(summaryRequest);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('GOLD');
  });

  it('GOLD users can access AI features', async () => {
    const response = await request(app)
      .post('/ai/summary')
      .set('Authorization', `Bearer ${goldUserToken}`)
      .send(summaryRequest);

    expect(response.status).toBe(200);
  });

  it('BASIC users limited to 10 reports/month', async () => {
    // Create 10 reports successfully
    for (let i = 0; i < 10; i++) {
      await createReport(basicUserToken);
    }

    // 11th should fail
    const response = await createReport(basicUserToken);
    expect(response.status).toBe(403);
  });
});
```

#### Test Suite 3: Ownership Tests
```typescript
describe('Resource Ownership', () => {
  it('Users cannot edit other users players', async () => {
    const response = await request(app)
      .put('/players/' + otherUserPlayerId)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(response.status).toBe(403);
  });

  it('Users can edit own players', async () => {
    const response = await request(app)
      .put('/players/' + ownPlayerId)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
  });

  it('ADMIN can edit any player', async () => {
    const response = await request(app)
      .put('/players/' + anyPlayerId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
  });
});
```

### 9.2 Penetration Testing Checklist

- [ ] Try to access AI endpoints as FREE user
- [ ] Try to create unlimited reports as BASIC user
- [ ] Try to modify other users' players
- [ ] Try to access admin endpoints as regular user
- [ ] Try to bypass subscription tier by manipulating JWT
- [ ] Try to access DIRECTOR role endpoints (should fail)
- [ ] Try SQL injection in player search filters
- [ ] Try to create player without required role
- [ ] Try to register for premium camp without tier
- [ ] Try to access marketplace with wrong role

---

## 10. MIGRATION PLAN

### Phase 1: Critical Fixes (Week 1)
**Estimated Time**: 2-3 days
**Priority**: CRITICAL

- [ ] Fix DIRECTOR role bug in AutoScout
- [ ] Add `@MinTier(SubscriptionTier.GOLD)` to all AI controllers
- [ ] Add role guards to Players CRUD
- [ ] Add role guards to Clubs CRUD
- [ ] Deploy to production immediately (revenue impact)

**Expected Impact**:
- Stop revenue leakage from FREE users accessing premium features
- Prevent unauthorized player/club modifications

---

### Phase 2: High-Priority Security (Week 2)
**Estimated Time**: 3-4 days
**Priority**: HIGH

- [ ] Add ownership guards to scouting reports
- [ ] Add role separation to marketplace
- [ ] Protect camp admin operations
- [ ] Add tier enforcement to camp registration
- [ ] Protect match/event CRUD

**Expected Impact**:
- Improve data integrity
- Better business logic enforcement

---

### Phase 3: Medium-Priority Enhancements (Week 3-4)
**Estimated Time**: 5-7 days
**Priority**: MEDIUM

- [ ] Implement KanbanTierGuard for board limits
- [ ] Enhance OwnershipGuard with more resource types
- [ ] Add report creation limits for BASIC users
- [ ] Implement search limit for FREE users (10/day)
- [ ] Add audit logging for admin actions

**Expected Impact**:
- Full feature parity with pricing page
- Better monitoring and compliance

---

### Phase 4: Long-Term Improvements (Month 2)
**Estimated Time**: 10-15 days
**Priority**: LOW

- [ ] Create FeatureAccessService
- [ ] Implement permission caching
- [ ] Create comprehensive RBAC test suite
- [ ] Document permission policies
- [ ] Create admin UI for role management

**Expected Impact**:
- Better maintainability
- Performance improvements
- Easier debugging

---

## 11. MONITORING & COMPLIANCE

### 11.1 Metrics to Track

#### Security Metrics
- Failed authorization attempts per endpoint
- Tier upgrade requests triggered by 403 errors
- Unauthorized access attempts
- Role escalation attempts

#### Business Metrics
- Feature usage by tier (are GOLD features actually used?)
- Upgrade conversion rate (users hitting tier limits)
- AI feature usage cost per user
- Report creation by tier

#### Technical Metrics
- Guard execution time
- Permission check cache hit rate
- Database queries for permission checks

### 11.2 Alerting Rules

```typescript
// Alert if FREE users accessing AI endpoints (should be blocked)
if (endpoint.startsWith('/ai/') && user.tier === 'FREE') {
  alert('FREE user bypassed tier guard on AI endpoint');
}

// Alert if non-SCOUT creating reports
if (endpoint === 'POST /scouting-reports' && !['SCOUT', 'ANALYST', 'ADMIN'].includes(user.role)) {
  alert('Non-scout user created report');
}

// Alert if too many 403s (might indicate UX issue)
if (endpoint403Rate > 10%) {
  alert('High 403 rate on endpoint: ' + endpoint);
}
```

---

## 12. CONCLUSION

### Summary of Findings

✅ **Strengths:**
- Authentication system is solid (JWT, refresh tokens, proper hashing)
- Role-based guard infrastructure exists and works
- Subscription tier guard fully implemented
- Admin endpoints properly protected
- Good separation of concerns

❌ **Critical Issues:**
1. AI features unprotected (major revenue loss)
2. DIRECTOR role doesn't exist (broken AutoScout)
3. Subscription tier guard never used (zero enforcement)
4. Player/Club CRUD unprotected
5. Marketplace role confusion

⚠️ **Moderate Issues:**
- Ownership validation manual, not declarative
- Scouting reports lack ownership checks
- Kanban limits not enforced
- Camp registration doesn't check tier requirements

### Risk Assessment

**Current Risk Level**: HIGH
**Financial Risk**: HIGH (~€10K+ annual loss from AI abuse)
**Security Risk**: MEDIUM (data integrity issues)
**Compliance Risk**: LOW (RGPD compliance not affected)

### ROI of Fixes

**Estimated Development Time**: 4-6 weeks
**Estimated Cost**: €10,000-15,000 (at €100/hour)
**Expected Annual Revenue Increase**: €50,000-100,000
- From preventing free AI feature abuse
- From proper tier enforcement driving upgrades
- From marketplace commission on protected listings

**ROI**: 300-900% in first year

---

## 13. QUICK REFERENCE

### Permission Quick Lookup

**"Can I create a player?"**
- FREE/SCOUT/ANALYST: ❌
- AGENT/CLUB_CONTACT: ✅
- ADMIN/SUPER_ADMIN: ✅

**"Can I use AI features?"**
- FREE/BASIC: ❌
- GOLD+: ✅
- Any ADMIN: ✅

**"Can I create scouting reports?"**
- FREE/PUBLIC/PLAYER: ❌
- SCOUT+: ✅ (with tier limits)
- GOLD+: ✅ (unlimited)

**"Can I validate players?"**
- Only: SCOUT, ADMIN, SUPER_ADMIN

**"Can I access marketplace?"**
- As Scout/Listing: SCOUT, AGENT roles
- As Club/Buyer: CLUB_CONTACT role

### Guard Cheat Sheet

```typescript
// Public endpoint (no auth)
@Get()

// Auth required, any user
@Get()
@UseGuards(JwtAuthGuard)

// Role-restricted
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SCOUT')

// Tier-restricted (premium feature)
@Post()
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)

// Owner-only (resource ownership)
@Patch(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership('id', 'player')

// AI endpoint (rate-limited)
@Post()
@UseGuards(JwtAuthGuard, SubscriptionTierGuard, AiThrottlerGuard)
@MinTier(SubscriptionTier.GOLD)
@Throttle({ default: { ttl: 60000, limit: 10 } })

// Admin-only operation
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
```

---

**END OF REPORT**

*Generated by Claude AI on 2025-11-07*
*For questions or clarifications, refer to the codebase or contact the development team.*
