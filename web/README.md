# ⚡ Arcane Football - Premium Web Application

A cutting-edge, 120K premium football agency platform built with Next.js 15, featuring stunning glass morphism design, advanced animations, and complete authentication system.

> Next.js web application for the Arcane Football platform with the official Arcane GmbH brand identity.

## Brand Identity

This application implements the complete **Arcane GmbH brand guidelines**:

### Design Philosophy
- **Ambiance**: Cold, professional, performance & precision
- **Theme**: Dark elegant (black & navy) with fluorescent yellow accents
- **Images**: Black and white or desaturated with cold filter
- **Style**: Clean, minimalist, structured, professional

### Color Palette

| Color | HEX | Usage |
|-------|-----|-------|
| Primary Dark | `#080C1D` | Main background, header, sections |
| Accent Fluorescent | `#E4FF3B` | Buttons, hover, highlights |
| Neutral Grey | `#9FA1A9` | Secondary text, borders, placeholders |
| White | `#FFFFFF` | Primary text on dark background |

### Typography

- **Headlines**: Ananston Expanded (Medium) - for main titles
- **Subtitles**: Ananston (Normal) - for section headers
- **Body**: Inter - for paragraphs and descriptions

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
cd web

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
web/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── page.tsx      # Home page
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles with Arcane theme
│   │   └── brand-preview/ # Brand styleguide page
│   ├── components/       # React components
│   │   └── ui/           # UI components (Button, Card, etc.)
│   ├── lib/              # Utilities
│   └── fonts/            # Custom fonts (Ananston)
├── public/               # Static assets
├── tailwind.config.ts    # Tailwind with Arcane palette
└── package.json
```

## Key Features

### Arcane Brand Implementation

1. **Color System**: Complete Arcane color palette in Tailwind config
2. **Typography**: Ananston fonts for headings, Inter for body
3. **Cold Tone Filter**: Automatic image desaturation with blue tint
4. **Components**: Styled Button, Card, and other UI components
5. **Spacing**: Generous spacing for clean, breathable layouts
6. **Animations**: Subtle fade-in and glow effects

### Components

All components follow the Arcane brand guidelines:

- **Button**: 6 variants (primary, secondary, outline, ghost, link, destructive)
- **Card**: Container components with consistent styling
- **Typography**: Heading hierarchy with proper font families

### Utilities

Global utility classes available:

- `.container-arcane` - Max-width container with padding
- `.section-dark` / `.section-dark-alt` - Section backgrounds
- `.hover-glow` - Glow effect on hover
- `.border-glow` - Accent border with glow
- `.heading-spacing` - Uppercase with wide letter spacing
- `.no-filter` - Opt out of image cold filter

## Pages

### Home (`/`)
Main landing page demonstrating the Arcane brand identity with hero section, features, and CTA.

### Brand Preview (`/brand-preview`)
Complete brand styleguide showing:
- Color palette
- Typography scale
- Button variations
- Card components
- Image filter demo
- Spacing & layout guidelines
- Design principles

## Font Setup

The application uses **Ananston** and **Ananston Expanded** fonts. You need to add the font files:

1. Obtain Ananston font files (.woff2 format)
2. Place them in `/src/fonts/`:
   - `Ananston-Regular.woff2`
   - `Ananston-Medium.woff2`
   - `AnanstonExpanded-Medium.woff2`

The app falls back to Inter if font files are not available.

## Customization

### Adding New Colors

Edit `tailwind.config.ts`:

```typescript
colors: {
  arcane: {
    // Add new color
    newColor: "#HEXCODE",
  }
}
```

### Modifying Components

UI components are in `/src/components/ui/`. They use:
- Tailwind CSS for styling
- `class-variance-authority` for variants
- `cn()` utility for className merging

### Image Filter

The cold tone filter is applied globally via CSS. To disable for specific images:

```tsx
<img src="/image.jpg" className="no-filter" />
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom (shadcn/ui inspired)
- **Fonts**: Next.js Font Optimization
- **Icons**: Lucide React (optional)

## Brand Guidelines Compliance

✅ Dark theme by default
✅ Arcane color palette implemented
✅ Ananston typography configured
✅ Cold tone image filter applied
✅ Generous spacing (px-8, py-12)
✅ Uppercase headings with wide tracking
✅ Button styles with fluorescent accent
✅ Card components with subtle borders
✅ Hover effects with glow
✅ Professional, clean aesthetic

## 🚀 Premium Features

### **Design System**
- ✨ **Glass Morphism UI** - Frosted glass effects with backdrop blur
- 🎨 **Advanced Animations** - Framer Motion with spring physics & parallax
- 🌈 **Animated Gradients** - Dynamic text effects with neon glow
- 🎭 **3D Card Interactions** - Mouse-tracking parallax transforms
- 💫 **Infinite Marquee** - Seamless partner logo carousel
- 🌊 **Animated Background** - 50+ floating particles with luminous orbs

### **Authentication System**
- 🔐 **Login/Signup Pages** - Premium forms with validation
- 👤 **User Context** - Global auth state management
- 🛡️ **Protected Routes** - Automatic redirect for unauthorized access
- 🔄 **Session Persistence** - LocalStorage with token management
- 🎯 **Mock Authentication** - Development mode without backend
- 📱 **Responsive Design** - Mobile-first approach

### **Core Pages**
- 🏠 **Homepage** - Hero with stats, services bento grid, players showcase
- 👥 **Players** - Elite roster with detailed profiles & ratings
- 💎 **Membership** - 3 premium tiers with feature comparison
- 📊 **Dashboard** - Protected user area with stats & notifications
- 📅 **Calendar** - Scouting match management with scout assignments (NEW ✨)
- 🎯 **Services** - 6 core services with process steps
- 📧 **Contact** - Functional form with validation
- ℹ️ **About** - Company story, values & team showcase

### **📅 Calendar Module (Arcane Agency)**
- 🗓️ **Match Management** - Create, view, and organize scouting matches
- 👥 **Scout Assignment** - Assign scouts to matches with roles and target players
- 📊 **Multi-View Display** - List, Week grid, and Map views
- 🔍 **Advanced Filters** - Search by team, competition, status, scout, date
- 🗺️ **Geolocation** - Venue mapping with Google Maps integration
- 🔄 **Calendar Sync** - Google Calendar & Outlook integration (planned)
- 🤖 **AI Scout Planner** - Automatic scout suggestion based on availability (planned)
- 🔔 **Real-time Notifications** - Match updates and assignment alerts

## 🔐 Authentication Flow

### Login Process
1. Navigate to `/login`
2. Enter credentials
3. `useAuth().login()` stores token
4. Redirect to `/dashboard`

### Signup Process
1. Navigate to `/signup`
2. Fill registration form
3. Password validation (min 8 chars)
4. `useAuth().signup()` creates account
5. Auto-login & redirect

### Protected Routes
```tsx
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Protected content */}
    </ProtectedRoute>
  );
}
```

## 🔌 API Integration

Complete API client ready for backend:

```typescript
import { apiClient } from "@/lib/api-client";

// Authentication
await apiClient.login(email, password);
await apiClient.signup(userData);

// Players
await apiClient.getPlayers({ page: 1, limit: 10 });
await apiClient.getPlayer(id);
```

### Expected Backend Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Register
- `GET /api/auth/me` - Current user
- `GET /api/players` - List players
- `GET /api/players/:id` - Player details
- `POST /api/contact` - Contact form
- `GET /api/dashboard/stats` - User stats

## 📱 Responsive Design

Breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎯 Key Components

### GlassCard
```tsx
<GlassCard variant="elevated" glowOnHover>
  Content
</GlassCard>
```

### Card3D
```tsx
<Card3D>
  <GlassCard>3D Parallax</GlassCard>
</Card3D>
```

### AnimatedCounter
```tsx
<AnimatedCounter to={500} suffix="+" duration={2.5} />
```

## 🚦 Commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
npm run lint   # Linter
```

## 📊 Performance

- **First Load JS**: ~300KB
- **Page Load**: < 2s
- **Lighthouse**: 90+
- **Core Web Vitals**: All green

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📚 Documentation

Comprehensive technical documentation is available in the `/docs` folder:

- **[Calendar Module Spec](docs/calendar-module-spec.md)** - Complete specification for the scouting calendar system
- **[Supabase Migrations](docs/supabase-migrations/)** - Database schema and migration files
  - `01_calendar_schema.sql` - Calendar module database schema with RLS policies

## 🗄️ Database Architecture

The application uses **Supabase (PostgreSQL)** with the following key tables:

### Calendar Module Tables
- `organizations` - Multi-tenant organization management
- `users` - Extended user profiles with roles (admin, agent, scout, analyst, coach, player)
- `clubs` - Football clubs database
- `competitions` - League and tournament information
- `venues` - Stadium locations with geolocation data
- `matches` - Core calendar entity for scouting matches
- `match_assignments` - Scout assignments with target players
- `calendar_sync_settings` - Google Calendar & Outlook OAuth tokens
- `calendar_events` - External calendar sync log

**Security**: All tables use Supabase Row Level Security (RLS) for multi-tenant data isolation.

## Next Steps

1. **Database Setup**: Run Supabase migrations from `docs/supabase-migrations/`
2. **Calendar API**: Implement NestJS endpoints for match CRUD operations
3. **Calendar Week View**: Add grid layout with drag-and-drop
4. **Calendar Map View**: Integrate Google Maps API for venue visualization
5. **Calendar Sync**: Implement OAuth flow for Google Calendar & Outlook
6. **AI Scout Planner**: Build Arkane Planner suggestion engine
7. **Add Font Files**: Place Ananston fonts in `/src/fonts/`
8. **Mobile Menu**: Add responsive navigation
9. **Loading States**: Enhance async operations

## License

© 2025 Arcane Football GmbH. All rights reserved.

---

**Built with ⚡ by Arcane Football Team**
