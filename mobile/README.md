# Arcane Football Mobile App

React Native mobile application for the Arcane Football management platform.

## Features

- **Authentication**: Login and signup with JWT token management
- **Home Dashboard**: View live matches, upcoming games, and statistics
- **Matches**: Browse, search, and filter all matches
- **Players**: Search and filter players by position with detailed stats
- **Profile**: User account management and settings

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing (Stack + Bottom Tabs)
- **Zustand** for state management
- **Axios** for API communication
- **AsyncStorage** for local data persistence

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for physical device testing)
- iOS Simulator or Android Emulator (optional)

## Installation

```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npm install
```

## Running the App

### Start Development Server

```bash
npm start
```

This will start the Expo development server and display a QR code.

### Run on Device or Simulator

**Physical Device:**
1. Install Expo Go app from App Store (iOS) or Play Store (Android)
2. Scan the QR code with your camera (iOS) or Expo Go app (Android)

**iOS Simulator:**
```bash
# Press 'i' in the terminal after running npm start
# Or run directly:
npm run ios
```

**Android Emulator:**
```bash
# Press 'a' in the terminal after running npm start
# Or run directly:
npm run android
```

## Project Structure

```
mobile/
├── App.tsx                      # Root component
├── src/
│   ├── design/                 # Arcane tokens & components
│   ├── contexts/              # Auth & Theme providers
│   ├── navigation/            # Root + tab navigators
│   ├── screens/               # Feature modules (AI, coaching, etc.)
│   ├── services/              # API client with interceptors
│   └── types/                 # Shared TypeScript interfaces
└── package.json
```

## API Configuration

The app connects to different backends based on environment:

- **Development**: `http://localhost:3000/api`
- **Production**: `https://arcane-foot-staging.up.railway.app/api`

To change the API URL, edit `src/constants/config.ts`:

```typescript
export const API_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-production-url.com/api';
```

## Test Accounts

Use these credentials (from backend seed data):

| Email | Password | Role |
|-------|----------|------|
| admin@arcane.com | Admin123! | Admin |
| scout1@arcane.com | Scout123! | Scout |
| agent@arcane.com | Agent123! | Agent |

## Environment Setup

### Backend Connection

**Local Backend:**
1. Ensure backend is running on `http://localhost:3000`
2. App will automatically connect in development mode

**Railway Backend:**
1. Backend is deployed at: `https://arcane-foot-staging.up.railway.app`
2. App uses this in production mode

### iOS Specific

If running on iOS Simulator and connecting to local backend, you may need to:
- Use `http://localhost:3000` (should work on simulator)

### Android Specific

If running on Android Emulator and connecting to local backend:
- Use `http://10.0.2.2:3000` instead of `localhost`
- Update `src/constants/config.ts` accordingly

## Key Screens

- **Home**: Dashboard, live KPIs, raccourcis vers les modules clés.
- **AI Hub**: Accès direct à ArkaneGPT, ArkaneMatch, SmartScout, Market Value.
- **Marketplace**: Découverte des scouts/freelances, filtres avancés, favoris.
- **Coaching**: Hub des coachs avec filtres, disponibilités et réservations.
- **Passport**: Passeport joueur numérique avec QR code partageable.
- **Profile**: Préférences utilisateur, thèmes, support et logout.
- **Command Center**: bouton flottant + menu dans l’en-tête pour rejoindre Joueurs, Analytique, Matches, Rapports, Voice-to-Report et Marketplace depuis n’importe quel onglet.

> Les onglets et raccourcis sont contrôlés par `src/constants/features.ts`.  
> Des presets (`demo`, `staging`, `production`) permettent d’activer/désactiver facilement les modules, et tu peux choisir le preset via `EXPO_PUBLIC_FEATURE_PRESET` avant `npm start` (ex. `EXPO_PUBLIC_FEATURE_PRESET=production npm start`).

### HomeScreen
- Displays user greeting with role
- Shows live matches with badges
- Lists upcoming matches
- Statistics cards

### MatchesScreen
- Search matches by team or competition
- Filter tabs: All, Scheduled, Live, Completed
- Detailed match cards with scores and venue

### PlayersScreen
- Search players by name, club, or nationality
- Filter by position (Goalkeeper, Defender, Midfielder, Forward)
- Player stats: goals, assists, appearances, market value
- Physical attributes and status indicators

### ProfileScreen
- User information display
- Settings menu (Notifications, Language, Theme)
- Support section (Help, Contact, Terms)
- Logout functionality

## State Management

### Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();

// After a successful API call
await login(apiResponse.user, apiResponse.accessToken);

await logout();
```

### Feature Stores (Zustand)

Feature-specific stores live inside each module (e.g. coaching, marketplace) so we can keep data co-located without bloating the global context.

## API Client

The API client automatically:
- Adds JWT token to all requests
- Handles 401 errors (auto-logout)
- Provides typed methods for all endpoints

```typescript
import api from '@/services/api';

// Login
const response = await api.login(email, password);

// Get matches
const matches = await api.getMatches();

// Get players
const players = await api.getPlayers();
```

## Styling

The app uses a centralized color and spacing system:

```typescript
import { colors, spacing, typography } from '@/design/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  title: {
    fontSize: typography.sizes.h4,
    color: colors.text.primary,
  },
});
```

## Common Issues

### Metro bundler not starting
```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Port 8081 already in use
```bash
# Kill the process
lsof -ti:8081 | xargs kill -9
npm start
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### iOS build issues
```bash
# Clear iOS build and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

## Development Workflow

1. **Start Backend**: Ensure backend is running (local or Railway)
2. **Start Expo**: Run `npm start` in mobile directory
3. **Connect Device/Simulator**: Scan QR or press i/a
4. **Hot Reload**: Changes auto-refresh in the app
5. **Debug**: Shake device or press 'm' to open dev menu

## Building for Production

### iOS (requires Mac + Xcode)
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### Using EAS Build (recommended)
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## Contributing

1. Create feature branch from `main`
2. Make changes and test thoroughly
3. Ensure no TypeScript errors: `npx tsc --noEmit`
4. Commit with descriptive message
5. Create pull request

## License

© 2024 Arcane Football. All rights reserved.
