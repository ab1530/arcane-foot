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
│  (Flutter)   │  (Flutter)   │  (Flutter)   │   (Next.js)    │
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

### Mobile & Web
- **Framework:** Flutter 3.24+ (Dart)
- **State Management:** Riverpod
- **Architecture:** Clean Architecture (feature-first)
- **Routing:** go_router
- **HTTP Client:** Dio
- **Local Storage:** flutter_secure_storage + shared_preferences
- **Code Generation:** freezed + json_serializable

### Admin Dashboard (Optional MVP)
- **Framework:** Next.js 14 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** Zustand or React Context

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Hosting:** Railway / Render (API), Vercel (Web), Supabase (DB/Storage)
- **Monitoring:** Sentry

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **Flutter** >= 3.24.x
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

### 3. Setup Mobile (Flutter)

```bash
cd mobile

# Get dependencies
flutter pub get

# Run code generation (freezed, json_serializable)
flutter pub run build_runner build --delete-conflicting-outputs

# Create .env file
cat > .env << EOF
API_BASE_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
EOF

# Run on iOS Simulator
flutter run -d ios

# Or Android Emulator
flutter run -d android

# Or Web
flutter run -d chrome --web-port 8080
```

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
├── mobile/                  # Flutter App
│   ├── lib/
│   │   ├── core/           # App-wide utilities
│   │   ├── features/       # Feature modules (Clean Architecture)
│   │   │   ├── auth/
│   │   │   ├── players/
│   │   │   ├── scouting/
│   │   │   └── ...
│   │   └── shared/         # Shared widgets
│   └── test/
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

# Unit & widget tests
flutter test

# Integration tests
flutter test integration_test/

# Generate coverage
flutter test --coverage
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

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Flutter Web (Vercel)

```bash
# Build web
cd mobile
flutter build web --release

# Deploy with Vercel CLI
cd build/web
vercel --prod
```

### Mobile Apps

**iOS (TestFlight):**
```bash
cd mobile
flutter build ios --release
# Use Xcode or fastlane to upload to App Store Connect
```

**Android (Google Play):**
```bash
cd mobile
flutter build appbundle --release
# Upload AAB to Google Play Console
```

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
- Flutter Team
- Prisma Team
- All open-source contributors

---

**Built with ❤️ by the Arcane Team**
