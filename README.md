# ⚽ ARCANE - Football Agency Platform

**Arcane** is a comprehensive football agency management platform built with modern tech stack, designed for agents, scouts, analysts, players, and clubs.

[![Backend CI](https://github.com/ab1530/arcane-foot/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ab1530/arcane-foot/actions/workflows/backend-ci.yml)
[![Mobile CI](https://github.com/ab1530/arcane-foot/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/ab1530/arcane-foot/actions/workflows/mobile-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🎯 Features

### Core Functionality
- **Multi-role Authentication** (Admin, Agent, Scout, Analyst, Player, Club Contact)
- **Player Management** (profiles, stats, media, kanban board)
- **Match Management** (scheduling, scout assignment, live tracking)
- **Scouting Reports** (structured notes, ratings, media attachments)
- **Club Requests** (transfer market, loan, trial negotiations)
- **Training Camps** (organization, registration, attendance)
- **Task Management** (assignments, priorities, comments)
- **Notifications** (Push via FCM, in-app)
- **Subscriptions** (Stripe integration: Free, Basic, Pro, Enterprise)
- **Media Storage** (Supabase Storage for images/videos)
- **Video Processing** (FFmpeg transcoding worker)

### Admin Dashboard
- User management
- Analytics & reports
- Subscription management
- Global supervision
- Data exports (CSV/Excel)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  iOS App     │ Android App  │   Web App    │ Admin Dashboard│
│ (React Native + Expo) │ (React Native + Expo) │   Next.js    │     Next.js    │
│                       │                       │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (NestJS)                      │
│  ┌────────────┬─────────────┬────────────┬────────────────┐ │
│  │   Auth     │   Players   │  Matches   │   Scouting     │ │
│  ├────────────┼─────────────┼────────────┼────────────────┤ │
│  │   Clubs    │   Camps     │   Tasks    │   Payments     │ │
│  └────────────┴─────────────┴────────────┴────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │   Supabase   │ │   Redis Cache    │
│   (Prisma ORM)   │ │   Storage    │ │   (Optional)     │
└──────────────────┘ └──────────────┘ └──────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  • Stripe (Payments)  • FCM (Push)  • FFmpeg (Video)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Authentication:** JWT + OAuth (Google, Apple)
- **Storage:** Supabase Storage (or S3-compatible)
- **Payments:** Stripe
- **Push Notifications:** Firebase Cloud Messaging

### Mobile App
- **Framework:** React Native + Expo (SDK 54)
- **Language:** TypeScript
- **Navigation:** React Navigation (stack + tabs)
- **State Management:** React Context + Zustand (feature stores)
- **Styling:** Arcane Design System (custom tokens, Glass components)
- **Networking:** Axios + typed services, AsyncStorage for persistence
- **Tooling:** Jest + Testing Library, Expo Dev Client, EAS builds

### Web App
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS with Arcane palette, shadcn/ui components
- **State/Data:** Server Components + React Query/Zustand per feature
- **Animations:** Framer Motion, custom gradients/glow system
- **Fonts:** Ananston + Inter (self-hosted)

### Admin Dashboard (Optional)
- **Framework:** Next.js 15 (separate workspace)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** Zustand or React Context

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Supabase Edge Functions + Supabase (DB/Storage), Vercel (Web)
- **Monitoring:** Sentry

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **Expo CLI / React Native tooling** (Expo SDK 54, Xcode/Android Studio for simulators)
- **PostgreSQL** >= 16.x (or Docker)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/ab1530/arcane-foot.git
cd arcane-foot
```

### 2. Setup Backend (NestJS)

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp ../.env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - JWT_SECRET
# - SUPABASE credentials
# - STRIPE keys
# - FCM server key

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 3. Setup Mobile (React Native + Expo)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npm start

# i = iOS simulator, a = Android emulator, r = reload
```

Set `EXPO_PUBLIC_API_URL` in `mobile/app.json` or use `.env` files (Expo loads `EXPO_PUBLIC_*` automatically). Default points to `http://localhost:3000/api`.

### 4. Setup Database with Docker (Alternative)

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f postgres
```

---

## 📁 Project Structure

```
arcane-platform/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── common/         # Guards, decorators, pipes
│   │   ├── config/         # Configuration files
│   │   └── prisma/         # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # SQL migrations
│   │   └── seed.ts         # Seed data
│   └── test/               # E2E tests
│
├── mobile/                  # React Native + Expo App
│   ├── App.tsx
│   ├── src/
│   │   ├── design/        # Arcane design system (tokens, components)
│   │   ├── navigation/    # Root + tab navigators
│   │   ├── screens/       # Feature modules (AI, coaching, marketplace, etc.)
│   │   ├── services/      # Axios clients
│   │   └── contexts/      # Auth + theme providers
│   └── jest.setup.js      # Mobile test config
│
├── design/                  # Shared JSON tokens (web & mobile)
│
├── admin-dashboard/         # Next.js Admin (Optional)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utilities
│   └── public/
│
├── infra/                   # Infrastructure
│   ├── docker/             # Dockerfiles
│   ├── scripts/            # Deployment scripts
│   └── k8s/                # Kubernetes manifests (future)
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│
├── docker-compose.yml
├── .env.example
└── README.md
```

### Mobile/Web Parity Roadmap

We track the end-to-end alignment between the React Native app and the Next.js web client in `docs/MOBILE_PARITY_PLAN.md`.  
High-level phases:

1. **Foundations** – Docs, design tokens, auth/state cleanup (in progress).  
2. **Navigation & Discoverability** – Expose every implemented RN screen (AI, marketplace, coaching, passport, gamification).  
3. **API Integration** – Wire missing service calls (coaching, gamification, passport, auto-scout, etc.) to the NestJS API.  
4. **UX Harmonisation** – Apply Arcane 2.0 components everywhere and retire legacy theme/constants.  
5. **QA & Demo Readiness** – Expand automated tests + demo scripts covering both clients.

Use the roadmap doc to see actionable tasks, owners, and status.  
Navigation details + points d’entrée mobile : `docs/NAVIGATION_MAP.md`.

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Mobile Tests

```bash
cd mobile

# Unit tests (Jest + Testing Library)
npm test

# Run a specific suite
npm test -- --runTestsByPath src/screens/auth/__tests__/LoginScreen.test.tsx
```

---

## 🔒 Security Checklist

- [x] Environment variables never committed
- [x] JWT secret 256+ bits
- [x] Bcrypt password hashing (10 rounds)
- [x] Input validation (class-validator)
- [x] Role-based access control (Guards)
- [x] Rate limiting enabled
- [x] CORS whitelist configured
- [x] Helmet.js security headers
- [x] SQL injection prevention (Prisma)
- [x] HTTPS enforced in production
- [x] Audit logs enabled
- [x] Automated backups (daily)

---

## 📜 GDPR Compliance

- [x] Cookie consent
- [x] Privacy Policy & Terms
- [x] Right to be forgotten (DELETE endpoint)
- [x] Data export (GET /users/:id/export)
- [x] Log anonymization (90 days)
- [x] Encrypted sensitive data
- [x] Breach notification protocol (<72h)

---

## 🚢 Deployment

### Backend / API (Supabase Edge Functions)

```bash
cd /Users/lakhdari/Desktop/AppFoot
# Deploy selected production functions
supabase functions deploy health --project-ref <project-ref>
supabase functions deploy passport --project-ref <project-ref>
supabase functions deploy shortlist --project-ref <project-ref>
```

### Web (Next.js on Vercel)

```bash
cd web
npm install
npm run build
npx vercel --prod
```

Set these Vercel env vars in production:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PUBLIC_SHARE_API_URL` (recommended for public passport/shortlist links)
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Mobile Apps

**iOS (TestFlight):**
```bash
cd mobile
# Manual release with Xcode:
# 1) Open ios/mobile.xcworkspace
# 2) Select client Apple Developer team
# 3) Product > Archive
# 4) Upload to TestFlight
```

Detailed production runbook:
- `docs/PRODUCTION_PHASE1_RUNBOOK.md`
- Edge deployment notes: `backend/DEPLOYMENT.md`

---

## 📊 Roadmap

### Phase 1: Foundations (Weeks 1-2) ✅
- [x] Project initialization
- [x] Database schema
- [x] Auth system (JWT + OAuth)
- [x] CI/CD pipelines

### Phase 2: Core Features (Weeks 3-5)
- [ ] Players CRUD
- [ ] Matches management
- [ ] Scout assignment
- [ ] Media upload

### Phase 3: Scouting (Weeks 6-7)
- [ ] Scouting reports
- [ ] Structured notes
- [ ] Workflow validation

### Phase 4: Market & Camps (Week 8)
- [ ] Club requests
- [ ] Training camps

### Phase 5: Payments & Push (Week 9)
- [ ] Stripe integration
- [ ] FCM notifications

### Phase 6: Admin Dashboard (Week 10)
- [ ] Analytics dashboard
- [ ] User management

### Phase 7: Polish & Security (Weeks 11-12)
- [ ] Rate limiting
- [ ] Audit logs
- [ ] GDPR compliance
- [ ] E2E tests

### Phase 8: MVP Launch (Week 13)
- [ ] Production deployment
- [ ] TestFlight/Internal Testing
- [ ] Monitoring setup

---

## ✅ QA Status & Tooling

- **Statut QA global :** plateforme stable (tests backend & lint web verts), couverture partielle en cours sur IA, Supabase et surfaces web/mobile.

### QA locale rapide

```bash
# 1. Lancer l’infra locale (Postgres, Redis, AI service, backend, web)
docker-compose up --build

# 2. Appliquer les migrations Prisma et les policies Supabase
cd backend
npx prisma migrate deploy
psql $DATABASE_URL -f ../supabase/policies.sql

# 3. Exécuter les tests backend
npm run test -- --runInBand

# 4. Frontend : lint + Playwright (Chromium)
cd ../web
npm run lint
npm run test:e2e

# 5. Générer le rapport QA complet
npm run test:ci
```

> ℹ️ Configure les secrets Stripe, Supabase et Sentry avant de lancer les tests. Voir [QA.md](QA.md) pour le détail des variables requises.

### Variables critiques à définir

```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
STRIPE_SECRET_KEY=...
SENTRY_DSN=...
SENTRY_ENVIRONMENT=staging
SENTRY_VALIDATE=true
OPENAI_API_KEY=
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 📞 Support

- **Documentation:** [Coming Soon]
- **Issues:** [GitHub Issues](https://github.com/ab1530/arcane-foot/issues)
- **Email:** abdallah.lakhdari@epitech.eu

---

## 🙏 Acknowledgments

- NestJS Team
- Expo & React Native Team
- Prisma Team
- All open-source contributors

---

**Built with ❤️ by the Arcane Team**
