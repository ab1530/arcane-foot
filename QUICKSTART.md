# Quick Start Guide - Arcane Football

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- (Optional) Expo Go app on your phone

## 1. Backend Setup (3 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies (if not done)
npm install

# Start development server
npm run start:dev
```

Backend will start at: **http://localhost:3000**

Check it's working: Open http://localhost:3000/api/health

### View API Documentation
Open Swagger docs at: **http://localhost:3000/api/docs**

## 2. Mobile Setup (2 minutes)

```bash
# Navigate to mobile (in a new terminal)
cd mobile

# Install dependencies (if not done)
npm install

# Start Expo
npm start
```

### Option A: Run on Physical Device
1. Install **Expo Go** app from App Store or Play Store
2. Scan the QR code displayed in terminal
3. App will load on your device

### Option B: Run on Simulator
**iOS Simulator** (Mac only):
```bash
# Press 'i' in terminal
# or
npm run ios
```

**Android Emulator**:
```bash
# Press 'a' in terminal
# or
npm run android
```

## 3. Test the App

### Login with Test Account
Use any of these credentials:

**Admin Account:**
- Email: `admin@arcane.com`
- Password: `Admin123!`

**Scout Account:**
- Email: `scout1@arcane.com`
- Password: `Scout123!`

**Agent Account:**
- Email: `agent@arcane.com`
- Password: `Agent123!`

### Or Create New Account
1. Tap "Pas encore de compte ? Inscrivez-vous"
2. Fill in the registration form
3. Tap "S'inscrire"

## 4. Explore the App

Once logged in, you'll see 4 tabs at the bottom:

1. **🏠 Accueil** - Home dashboard with live/upcoming matches
2. **⚽ Matches** - Browse all matches with search & filters
3. **👤 Joueurs** - Player directory with position filters
4. **⚙️ Profil** - Your profile and settings

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in backend/.env
PORT=3001
```

**Database connection error:**
```bash
# Verify DATABASE_URL in backend/.env
# Run migrations
npm run prisma:migrate
```

### Mobile Issues

**Can't connect to backend:**
- Check backend is running at http://localhost:3000
- For Android emulator, update API_URL in `mobile/src/constants/config.ts`:
  ```typescript
  export const API_URL = 'http://10.0.2.2:3000/api';
  ```

**Metro bundler not loading:**
```bash
# Clear cache
npm start -- --reset-cache
```

**QR code not working:**
- Ensure phone and computer are on same WiFi
- Try running on simulator instead

### Common Expo Errors

**"Listening on..." never appears:**
```bash
# Kill any process on port 8081
lsof -ti:8081 | xargs kill -9

# Restart
npm start
```

**Module not found:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Using Production Backend

To connect mobile app to Railway production backend:

1. Edit `mobile/src/constants/config.ts`
2. Change `API_URL` to always use Railway:
   ```typescript
   export const API_URL = 'https://arcane-foot-staging.up.railway.app/api';
   ```
3. Restart Expo: `npm start`

Production backend: **https://arcane-foot-staging.up.railway.app**

## Next Steps

- Explore API documentation at http://localhost:3000/api/docs
- Read detailed README in `backend/README.md` and `mobile/README.md`
- Check `PROJECT_OVERVIEW.md` for architecture details

## Quick Commands Reference

### Backend
```bash
npm run start:dev          # Start development server
npm run build              # Build for production
npm run start:prod         # Run production build
npm test                   # Run tests
npm run prisma:studio      # Open Prisma Studio (DB GUI)
npm run prisma:seed        # Seed database
```

### Mobile
```bash
npm start                  # Start Expo
npm run ios                # Run on iOS simulator
npm run android            # Run on Android emulator
npx tsc --noEmit          # Check TypeScript errors
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Read the detailed README files
3. Check Railway logs for backend: https://railway.app
4. Review Expo logs in terminal

---

Happy coding! 🚀
