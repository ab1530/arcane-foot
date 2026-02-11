# Arcane Football - System Architecture

Visual overview of the complete system architecture.

## High-Level Architecture

> Phase 3 met en place un **Arkane AI Layer** dédié (FastAPI) consommé par NestJS. Toutes les requêtes critiques transitent par Supabase (RLS) et Stripe/Sentry sont intégrés via CI GitLab.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Native Mobile App (Expo)                │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │  Login   │  │   Home   │  │ Matches  │           │  │
│  │  │  Signup  │  │Dashboard │  │  List    │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐                          │  │
│  │  │ Players  │  │ Profile  │                          │  │
│  │  │  List    │  │ Settings │                          │  │
│  │  └──────────┘  └──────────┘                          │  │
│  │                                                        │  │
│  │  State: Zustand + AsyncStorage                        │  │
│  │  Navigation: React Navigation                         │  │
│  │  HTTP: Axios + JWT Interceptors                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ▲                                │
│                            │ HTTPS/REST                     │
│                            ▼                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           NestJS Backend API                          │  │
│  │        (Railway: arcane-foot-staging)                 │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │              Controllers                        │  │  │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │  │  │
│  │  │  │ Auth │ │Users │ │Player│ │ Club │          │  │  │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘          │  │  │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐                   │  │  │
│  │  │  │Match │ │Scout │ │Health│                   │  │  │
│  │  │  └──────┘ └──────┘ └──────┘                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                        ▼                              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │               Services                          │  │  │
│  │  │  • Business Logic                               │  │  │
│  │  │  • Data Validation                              │  │  │
│  │  │  • JWT Token Management                         │  │  │
│  │  │  • Password Hashing (bcrypt)                    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                        ▼                              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │            Prisma ORM                           │  │  │
│  │  │  • Type-safe DB queries                         │  │  │
│  │  │  • Migrations                                   │  │  │
│  │  │  • Schema management                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  Middleware: Helmet, CORS, Compression               │  │
│  │  Documentation: Swagger/OpenAPI                       │  │
│  │  Testing: Jest (89 unit tests)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ▲                                │
│                            │ SQL                            │
│                            ▼                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database (Railway)                 │  │
│  │                                                        │  │
│  │  Tables:                                              │  │
│  │  • User (auth + profiles)                            │  │
│  │  • Player (athlete data)                             │  │
│  │  • Club (teams)                                      │  │
│  │  • Match (games)                                     │  │
│  │  • ScoutingReport (evaluations)                      │  │
│  │  • Notification (alerts)                             │  │
│  │  • Media (files)                                     │  │
│  │  • Payment (transactions)                            │  │
│  │                                                        │  │
│  │  Relations: Foreign Keys + Indexes                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌──────────┐
│  User   │         │ Mobile  │         │   API   │         │ Database │
│         │         │   App   │         │ Backend │         │          │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬─────┘
     │                   │                   │                   │
     │  1. Enter email   │                   │                   │
     │   & password      │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │                   │ 2. POST /api/auth/login              │
     │                   │   { email, password }                │
     │                   ├──────────────────>│                   │
     │                   │                   │                   │
     │                   │                   │ 3. Query user     │
     │                   │                   ├──────────────────>│
     │                   │                   │                   │
     │                   │                   │ 4. User data      │
     │                   │                   │<──────────────────┤
     │                   │                   │                   │
     │                   │                   │ 5. Verify password│
     │                   │                   │   (bcrypt.compare)│
     │                   │                   │                   │
     │                   │                   │ 6. Generate JWT   │
     │                   │                   │   (sign token)    │
     │                   │                   │                   │
     │                   │ 7. Response       │                   │
     │                   │   { user, accessToken }              │
     │                   │<──────────────────┤                   │
     │                   │                   │                   │
     │                   │ 8. Store token    │                   │
     │                   │   in AsyncStorage │                   │
     │                   │                   │                   │
     │  9. Navigate to   │                   │                   │
     │     Home screen   │                   │                   │
     │<──────────────────┤                   │                   │
     │                   │                   │                   │
```

### API Request Flow (with JWT)

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌──────────┐
│ Mobile  │         │  Axios  │         │   API   │         │ Database │
│   App   │         │ Client  │         │ Backend │         │          │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬─────┘
     │                   │                   │                   │
     │ 1. Call API       │                   │                   │
     │   getMatches()    │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │                   │                   │
     │                   │ 2. Request        │                   │
     │                   │   Interceptor:    │                   │
     │                   │   Add JWT token   │                   │
     │                   │   from storage    │                   │
     │                   │                   │                   │
     │                   │ 3. GET /api/matches                  │
     │                   │   Header: Bearer <token>             │
     │                   ├──────────────────>│                   │
     │                   │                   │                   │
     │                   │                   │ 4. Verify JWT     │
     │                   │                   │   (passport)      │
     │                   │                   │                   │
     │                   │                   │ 5. Query matches  │
     │                   │                   ├──────────────────>│
     │                   │                   │                   │
     │                   │                   │ 6. Match data     │
     │                   │                   │<──────────────────┤
     │                   │                   │                   │
     │                   │ 7. Response       │                   │
     │                   │   { matches[] }   │                   │
     │                   │<──────────────────┤                   │
     │                   │                   │                   │
     │ 8. Return data    │                   │                   │
     │<──────────────────┤                   │                   │
     │                   │                   │                   │
     │ 9. Update UI      │                   │                   │
     │                   │                   │                   │
```

## Mobile App Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                         App.tsx                                │
│                    (Root Component)                            │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    RootNavigator.tsx                           │
│                  (Auth Flow Handler)                           │
│                                                                │
│  if (!isAuthenticated)        if (isAuthenticated)            │
│         │                              │                       │
│         ▼                              ▼                       │
│  ┌─────────────┐              ┌─────────────────┐            │
│  │   Auth      │              │  MainTabNav     │            │
│  │   Stack     │              │  (Bottom Tabs)  │            │
│  └─────────────┘              └─────────────────┘            │
└───────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌───────────────────────────┐
│  LoginScreen    │          │      Tab Screens:         │
│  SignupScreen   │          │  • HomeScreen             │
└─────────────────┘          │  • MatchesScreen          │
                             │  • PlayersScreen          │
                             │  • ProfileScreen          │
                             └───────────────────────────┘
                                        │
                                        ▼
                             ┌───────────────────────────┐
                             │    State Management       │
                             │                           │
                             │  Zustand Stores:          │
                             │  • useAuthStore           │
                             │    - user                 │
                             │    - token                │
                             │    - login()              │
                             │    - logout()             │
                             │    - signup()             │
                             │                           │
                             │  AsyncStorage:            │
                             │  • AUTH_TOKEN             │
                             │  • USER_DATA              │
                             └───────────────────────────┘
                                        │
                                        ▼
                             ┌───────────────────────────┐
                             │      API Client           │
                             │                           │
                             │  Axios Instance:          │
                             │  • Request Interceptor    │
                             │    (add JWT token)        │
                             │  • Response Interceptor   │
                             │    (handle 401)           │
                             │                           │
                             │  Methods:                 │
                             │  • login()                │
                             │  • signup()               │
                             │  • getMatches()           │
                             │  • getPlayers()           │
                             │  • etc...                 │
                             └───────────────────────────┘
```

## Backend Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AppModule                             │
│                     (Root Module)                            │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ AuthModule  │     │PlayersModule│     │MatchesModule│
│             │     │             │     │             │
│ • Controller│     │ • Controller│     │ • Controller│
│ • Service   │     │ • Service   │     │ • Service   │
│ • DTOs      │     │ • DTOs      │     │ • DTOs      │
│ • Guards    │     └─────────────┘     └─────────────┘
│ • Strategy  │
└─────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                    ┌─────────────────┐
                    │  PrismaModule   │
                    │                 │
                    │ PrismaService:  │
                    │ • DB Connection │
                    │ • Queries       │
                    │ • Transactions  │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

## Database Schema Relationships

```
┌─────────────┐
│    User     │
│─────────────│
│ id          │◄───┐
│ email       │    │
│ password    │    │
│ firstName   │    │
│ lastName    │    │
│ role        │    │
└─────────────┘    │
                   │
                   │ 1:1
                   │
┌─────────────┐    │        ┌─────────────┐
│   Player    │────┘        │    Club     │
│─────────────│             │─────────────│
│ id          │             │ id          │
│ userId      │◄─────┐      │ name        │
│ clubId      ├─────►│      │ country     │
│ position    │      │      │ founded     │
│ statsJson   │      │      └─────────────┘
│ height      │      │             ▲
│ weight      │      │ M:1         │
└─────────────┘      │             │
      ▲              │             │
      │              │             │
      │ M:N          │             │ M:1
      │              │             │
┌─────────────┐      │      ┌─────────────┐
│  Scouting   │      │      │   Match     │
│   Report    │      │      │─────────────│
│─────────────│      │      │ id          │
│ id          │      │      │ homeClubId  ├──┐
│ playerId    ├──────┘      │ awayClubId  ├──┤
│ scoutId     │             │ scheduledAt │  │
│ rating      │             │ status      │  │
│ notesJson   │             │ homeScore   │  │
└─────────────┘             │ awayScore   │  │
                            └─────────────┘  │
                                   ▲         │
                                   └─────────┘
                                     M:1
```

## Technology Stack Details

### Frontend (Mobile)
```
React Native (0.76+)
├── Expo (SDK 52)
├── TypeScript (5.x)
├── React Navigation
│   ├── @react-navigation/native
│   ├── @react-navigation/native-stack
│   └── @react-navigation/bottom-tabs
├── State Management
│   └── Zustand (4.x)
├── HTTP Client
│   └── Axios (1.x)
├── Storage
│   └── @react-native-async-storage/async-storage
└── UI Components
    └── React Native core components
```

### Backend (API)
```
NestJS (10.x)
├── TypeScript (5.x)
├── Prisma ORM (6.x)
├── Authentication
│   ├── @nestjs/passport
│   ├── @nestjs/jwt
│   └── bcrypt
├── Documentation
│   └── @nestjs/swagger
├── Validation
│   └── class-validator
├── Testing
│   └── Jest
└── Middleware
    ├── helmet (security)
    ├── compression
    └── cors
```

### Infrastructure
```
Railway (PaaS)
├── Backend Deployment
│   ├── Auto-deploy from git
│   ├── Environment variables
│   └── Build optimization
└── PostgreSQL Database
    ├── Automatic backups
    ├── Connection pooling
    └── SSL encryption
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Transport Layer                                          │
│     • HTTPS/TLS encryption (Railway SSL)                    │
│     • Certificate auto-renewal                              │
│                                                              │
│  2. API Layer                                               │
│     • Helmet.js (security headers)                          │
│     • CORS configuration                                    │
│     • Rate limiting (Throttler)                             │
│     • Input validation (class-validator)                    │
│                                                              │
│  3. Authentication Layer                                     │
│     • JWT tokens (signed with secret)                       │
│     • Password hashing (bcrypt, 10 rounds)                  │
│     • Token expiration (7 days)                             │
│     • Refresh on 401 errors                                 │
│                                                              │
│  4. Authorization Layer                                      │
│     • Role-based access control (RBAC)                      │
│     • Guard decorators                                      │
│     • Route protection                                      │
│                                                              │
│  5. Database Layer                                          │
│     • Prisma ORM (SQL injection protection)                │
│     • Prepared statements                                   │
│     • Connection encryption                                 │
│                                                              │
│  6. Mobile App Layer                                        │
│     • Secure storage (AsyncStorage)                         │
│     • Token in memory                                       │
│     • Auto-logout mechanisms                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Development Environment                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Developer Machine                                           │
│  ├── Backend: localhost:3000                                │
│  ├── Database: localhost:5432 (or Docker)                   │
│  └── Mobile: Expo Dev Server (localhost:8081)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ git push
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Production Environment                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Railway Platform                                            │
│  ├── Backend Service                                         │
│  │   ├── URL: arcane-foot-staging.up.railway.app           │
│  │   ├── Node.js 20 runtime                                │
│  │   ├── Auto-deploy on git push                           │
│  │   ├── Environment variables                             │
│  │   └── Health checks                                     │
│  │                                                           │
│  └── PostgreSQL Database                                     │
│      ├── Managed service                                    │
│      ├── Automatic backups                                  │
│      ├── SSL required                                       │
│      └── Connection pooling                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Users)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • iOS devices (Expo Go or standalone)                      │
│  • Android devices (Expo Go or standalone)                  │
│  • Connects to production API                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Future Architecture Enhancements

### Phase 2 (Planned)
```
• WebSocket server for real-time updates
• Redis cache for performance
• File storage (AWS S3 or Cloudinary)
• Push notification service (FCM)
• Background job queue (Bull)
```

### Phase 3 (Planned)
```
• Admin web dashboard (React)
• CDN for static assets
• Load balancer for horizontal scaling
• Microservices architecture
• Message queue (RabbitMQ/Kafka)
```

---

This architecture is designed for:
- **Scalability**: Easy to add new features and scale
- **Security**: Multiple layers of protection
- **Maintainability**: Clean separation of concerns
- **Performance**: Optimized queries and caching ready
- **Reliability**: Health checks and error handling

For more details, see:
- PROJECT_OVERVIEW.md
- backend/README.md
- mobile/README.md
