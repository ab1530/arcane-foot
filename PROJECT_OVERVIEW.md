# Arcane Football - Project Overview

Full-stack football agency management platform with NestJS backend and React Native mobile app.

## Project Status: MVP Complete ✓

**Backend**: Deployed to Railway ✓
**Mobile App**: MVP Complete ✓
**Documentation**: Complete ✓
**Tests**: 89 unit tests passing ✓

## Architecture

```
AppFoot/
├── backend/          # NestJS API (TypeScript)
│   ├── Deployed: https://arcane-foot-staging.up.railway.app
│   ├── Swagger Docs: /api/docs
│   └── Database: PostgreSQL on Railway
│
└── mobile/           # React Native + Expo
    ├── iOS & Android support
    └── Connects to Railway backend
```

## Tech Stack

### Backend
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (89 unit tests)
- **Deployment**: Railway
- **Environment**: Node.js 20

### Mobile
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Tabs)
- **State**: Zustand
- **HTTP Client**: Axios
- **Storage**: AsyncStorage

## Features Implemented

### Backend API
✓ Authentication (signup, login, JWT)
✓ Users management (CRUD)
✓ Players management with stats
✓ Clubs management
✓ Matches management (scheduling, scores, status)
✓ Scouting reports
✓ Health checks
✓ CORS enabled for mobile
✓ Swagger documentation
✓ Role-based access control

### Mobile App
✓ Login & Signup screens
✓ JWT authentication with persistence
✓ Home dashboard with live/upcoming matches
✓ Matches browser with search & filters
✓ Players directory with position filters
✓ Profile screen with settings
✓ Pull-to-refresh on all lists
✓ Error handling & loading states
✓ Responsive UI with consistent design system

## Getting Started

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev
```

Backend runs on: `http://localhost:3000`
Swagger docs: `http://localhost:3000/api/docs`

### Mobile Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start

# Then scan QR code or press:
# 'i' for iOS Simulator
# 'a' for Android Emulator
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Players
- `POST /api/players` - Create player
- `GET /api/players` - List all players
- `GET /api/players/:id` - Get player by ID
- `PATCH /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Clubs
- `POST /api/clubs` - Create club
- `GET /api/clubs` - List all clubs
- `GET /api/clubs/:id` - Get club by ID
- `PATCH /api/clubs/:id` - Update club
- `DELETE /api/clubs/:id` - Delete club

### Matches
- `POST /api/matches` - Schedule match
- `GET /api/matches` - List all matches
- `GET /api/matches/upcoming?limit=5` - Get upcoming matches
- `GET /api/matches/live` - Get live matches
- `GET /api/matches/:id` - Get match by ID
- `PATCH /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### Scouting Reports
- `POST /api/scouting-reports` - Create report
- `GET /api/scouting-reports` - List all reports
- `GET /api/scouting-reports/:id` - Get report by ID
- `PATCH /api/scouting-reports/:id` - Update report
- `DELETE /api/scouting-reports/:id` - Delete report

## Database Schema

### Core Models
- **User**: Authentication and profile
- **Player**: Player profiles with stats
- **Club**: Football clubs
- **Match**: Match scheduling and results
- **ScoutingReport**: Player scouting reports
- **Notification**: User notifications
- **Media**: File management
- **Payment**: Financial transactions

### Key Relationships
- User → Player (1:1)
- Club → Players (1:N)
- Match → Clubs (M:N through home/away)
- ScoutingReport → Player + Scout (M:N)

## User Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Administrative tasks
- **SCOUT**: Create scouting reports
- **AGENT**: Manage player contracts
- **PLAYER**: View own data

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@arcane.com | Admin123! | ADMIN |
| scout1@arcane.com | Scout123! | SCOUT |
| scout2@arcane.com | Scout123! | SCOUT |
| agent@arcane.com | Agent123! | AGENT |

## Development Workflow

### Backend Development
1. Make changes in `backend/src/`
2. NestJS auto-reloads on save
3. Test with Swagger UI at `/api/docs`
4. Run tests: `npm test`
5. Commit changes

### Mobile Development
1. Make changes in `mobile/src/`
2. Expo auto-refreshes on save
3. Test on simulator/device
4. Check TypeScript: `npx tsc --noEmit`
5. Commit changes

## Deployment

### Backend (Railway)
- **URL**: https://arcane-foot-staging.up.railway.app
- **Auto-deploy**: Push to main branch
- **Environment**: Production
- **Database**: PostgreSQL (provisioned by Railway)

Railway deployment is automatic:
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
# Railway auto-deploys
```

### Mobile (Future)
- Use Expo EAS Build for production builds
- Submit to App Store (iOS) and Play Store (Android)

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm test auth.service       # Run specific test
npm test -- --coverage      # Generate coverage report
```

**Test Coverage**: 89 tests across 5 service files

### Mobile Tests (To be added)
```bash
cd mobile
npm test
```

## Documentation

- **Backend API**: http://localhost:3000/api/docs (Swagger)
- **Backend README**: `backend/README.md`
- **Mobile README**: `mobile/README.md`
- **This file**: Project overview and setup

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3000
```

### Mobile
- API URL configured in `mobile/src/constants/config.ts`
- Automatically switches between dev/prod

## Next Steps

### Phase 1: Additional Features
- [ ] Real-time match updates (WebSockets)
- [ ] Push notifications
- [ ] File upload (player photos, documents)
- [ ] Chat/messaging between scouts and agents
- [ ] Advanced search and filters

### Phase 2: Enhancements
- [ ] E2E tests for backend
- [ ] Unit tests for mobile
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Analytics and reporting
- [ ] Export data (PDF, Excel)

### Phase 3: Scale
- [ ] Admin web dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline mode for mobile
- [ ] Performance optimizations

## Common Issues & Solutions

### Backend won't start
```bash
# Check PostgreSQL connection
# Verify DATABASE_URL in .env
# Run migrations: npm run prisma:migrate
```

### Mobile connection failed
```bash
# Ensure backend is running
# Check API_URL in mobile/src/constants/config.ts
# For Android emulator, use http://10.0.2.2:3000
```

### Railway deployment failed
```bash
# Check Railway logs
# Verify environment variables are set
# Ensure start:prod script is correct
```

### Tests failing
```bash
# Clear cache: npm test -- --clearCache
# Reinstall: rm -rf node_modules && npm install
# Check mocks are properly configured
```

## Support & Contact

- **Repository**: (Add GitHub URL)
- **Issues**: (Add issue tracker URL)
- **Documentation**: See README files in each directory

## License

© 2024 Arcane Football. All rights reserved.

---

**Project started**: December 2024
**Current version**: 1.0.0 MVP
**Last updated**: December 2024
