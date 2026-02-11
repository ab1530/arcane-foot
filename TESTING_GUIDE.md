# Testing Guide - Arcane Football Mobile App

Complete guide for testing the mobile application.

## Prerequisites

✅ Backend is deployed at: https://arcane-foot-staging.up.railway.app
✅ Mobile app code is complete in `/mobile` directory
✅ Expo development server is configured

## Quick Start

### 1. Start the Mobile App

```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npm start
```

Wait for the Metro bundler to start. You should see:
- QR code in the terminal
- Options to press 'i' (iOS), 'a' (Android), or 'w' (web)

### 2. Choose Your Testing Method

#### Option A: Physical Device (Recommended)

**iOS:**
1. Install "Expo Go" from App Store
2. Open Camera app
3. Scan the QR code displayed in terminal
4. App will open in Expo Go

**Android:**
1. Install "Expo Go" from Play Store
2. Open Expo Go app
3. Scan the QR code
4. App will load

#### Option B: iOS Simulator (Mac only)

```bash
# Press 'i' in the terminal
# OR run:
npm run ios
```

The iOS Simulator will launch automatically.

#### Option C: Android Emulator

```bash
# Ensure Android emulator is running
# Press 'a' in the terminal
# OR run:
npm run android
```

**Note**: If connecting to local backend, update config:
```typescript
// mobile/src/constants/config.ts
export const API_URL = 'http://10.0.2.2:3000/api';
```

## Test Plan

### Test 1: Authentication Flow

#### 1.1 Login with Existing Account
- [ ] Open app
- [ ] Should see Login screen
- [ ] Enter email: `admin@arcane.com`
- [ ] Enter password: `Admin123!`
- [ ] Tap "Se connecter"
- [ ] Should see loading indicator
- [ ] Should navigate to Home screen

**Expected Result**: Successful login and redirect to dashboard

#### 1.2 Invalid Login
- [ ] Enter email: `test@test.com`
- [ ] Enter password: `wrong`
- [ ] Tap "Se connecter"
- [ ] Should see error message

**Expected Result**: Error alert showing "Email ou mot de passe incorrect"

#### 1.3 Signup New Account
- [ ] From Login, tap "Pas encore de compte ? Inscrivez-vous"
- [ ] Fill in all required fields:
  - Prénom: Jean
  - Nom: Dupont
  - Email: jean.dupont@test.com
  - Téléphone: +33612345678 (optional)
  - Password: Test123!
  - Confirm Password: Test123!
- [ ] Tap "S'inscrire"
- [ ] Should see loading indicator
- [ ] Should auto-login and navigate to Home

**Expected Result**: Account created and auto-logged in

#### 1.4 Signup Validation
- [ ] Try signup with password mismatch
- [ ] Try signup with short password (<8 chars)
- [ ] Try signup with missing required fields

**Expected Result**: Validation errors shown

### Test 2: Home Dashboard

#### 2.1 Initial Load
- [ ] After login, should see Home screen
- [ ] Should show user greeting: "Bonjour, [FirstName] [LastName]"
- [ ] Should show user role badge
- [ ] Should display "Matches en direct" section (if any live matches)
- [ ] Should display "Prochains matches" section
- [ ] Should display "Statistiques" section

**Expected Result**: All sections load with data from backend

#### 2.2 Pull to Refresh
- [ ] Pull down on Home screen
- [ ] Should see refresh indicator
- [ ] Data should reload

**Expected Result**: Fresh data loaded from API

#### 2.3 Live Matches Display
- [ ] Check if live matches have red "LIVE" badge
- [ ] Should show team names
- [ ] Should show current scores
- [ ] Should show competition name
- [ ] Should show date/time

**Expected Result**: Live matches clearly distinguished with badges

#### 2.4 Match Cards
- [ ] Tap on a match card
- [ ] Currently should do nothing (detail view not implemented)

**Expected Result**: No action (future enhancement)

### Test 3: Matches Screen

#### 3.1 Navigation
- [ ] Tap "Matches" tab at bottom
- [ ] Should navigate to Matches screen
- [ ] Should show search bar at top
- [ ] Should show filter tabs below search

**Expected Result**: Screen loads with all matches

#### 3.2 Search Functionality
- [ ] Type "Real" in search bar
- [ ] Should filter to show only Real Madrid matches
- [ ] Type "PSG"
- [ ] Should filter to PSG matches
- [ ] Clear search
- [ ] Should show all matches again

**Expected Result**: Search filters matches in real-time

#### 3.3 Filter Tabs
- [ ] Tap "Tous" - shows all matches
- [ ] Tap "Programmés" - shows only scheduled matches
- [ ] Tap "En direct" - shows only live matches
- [ ] Tap "Terminés" - shows only completed matches

**Expected Result**: Filters work correctly

#### 3.4 Match Card Information
- [ ] Each match should show:
  - [ ] Status badge (color-coded)
  - [ ] Competition name
  - [ ] Match date
  - [ ] Home team name
  - [ ] Away team name
  - [ ] Scores (if completed or live)
  - [ ] Match time
  - [ ] Venue (if available)

**Expected Result**: All match details displayed correctly

#### 3.5 Pull to Refresh
- [ ] Pull down on Matches screen
- [ ] Should reload matches from API

**Expected Result**: Data refreshes

#### 3.6 Empty State
- [ ] Search for "xyz123nonexistent"
- [ ] Should show "Aucun match trouvé pour cette recherche"

**Expected Result**: Empty state message shown

### Test 4: Players Screen

#### 4.1 Navigation
- [ ] Tap "Joueurs" tab at bottom
- [ ] Should navigate to Players screen
- [ ] Should show search bar
- [ ] Should show position filter tabs
- [ ] Should show results count

**Expected Result**: Screen loads with all players

#### 4.2 Search Functionality
- [ ] Type "Mbappé" in search
- [ ] Should show Kylian Mbappé
- [ ] Type "Real"
- [ ] Should show players from Real Madrid
- [ ] Clear search

**Expected Result**: Search works across player names, clubs, and nationality

#### 4.3 Position Filters
- [ ] Tap "Tous" - shows all players
- [ ] Tap "Gardiens" - shows only goalkeepers
- [ ] Tap "Défenseurs" - shows only defenders
- [ ] Tap "Milieux" - shows only midfielders
- [ ] Tap "Attaquants" - shows only forwards

**Expected Result**: Filters work with emojis and correct counts

#### 4.4 Player Card Display
- [ ] Each player card should show:
  - [ ] Avatar with initials
  - [ ] Full name
  - [ ] Position with emoji
  - [ ] Age (calculated from DOB)
  - [ ] Nationality
  - [ ] Club name
  - [ ] Jersey number (if available)
  - [ ] Market value
  - [ ] Stats (goals, assists, appearances)
  - [ ] Physical info (height, weight, preferred foot)
  - [ ] Status indicator dot

**Expected Result**: All player information displayed

#### 4.5 Status Indicators
- [ ] Active players: green dot
- [ ] Injured players: red dot + badge
- [ ] Suspended players: yellow/orange dot + badge
- [ ] Retired players: gray dot + badge

**Expected Result**: Status correctly shown

#### 4.6 Pull to Refresh
- [ ] Pull down on Players screen
- [ ] Should reload players from API

**Expected Result**: Data refreshes

### Test 5: Profile Screen

#### 5.1 Navigation
- [ ] Tap "Profil" tab at bottom
- [ ] Should navigate to Profile screen
- [ ] Should show user avatar
- [ ] Should show full name
- [ ] Should show email
- [ ] Should show role badge

**Expected Result**: User information displayed

#### 5.2 Account Information Section
- [ ] Should show:
  - [ ] Prénom
  - [ ] Nom
  - [ ] Email
  - [ ] Téléphone
  - [ ] Membre depuis (formatted date)

**Expected Result**: All account details shown

#### 5.3 Settings Menu
- [ ] Tap "Notifications"
- [ ] Should show "Fonctionnalité à venir" alert
- [ ] Tap "Langue"
- [ ] Should show alert with current language
- [ ] Tap "Thème"
- [ ] Should show alert
- [ ] Tap "Confidentialité"
- [ ] Should show alert

**Expected Result**: Placeholder alerts for future features

#### 5.4 Support Section
- [ ] Tap "Aide & FAQ" - shows alert
- [ ] Tap "Nous contacter" - shows alert
- [ ] Tap "Conditions d'utilisation" - shows alert
- [ ] Tap "À propos" - shows version info

**Expected Result**: All menu items respond

#### 5.5 Logout
- [ ] Tap "Se déconnecter" button
- [ ] Should show confirmation alert
- [ ] Tap "Annuler" - stays on screen
- [ ] Tap "Se déconnecter" again
- [ ] Tap "Déconnexion" in alert
- [ ] Should navigate back to Login screen
- [ ] Try to navigate back (should not be possible)

**Expected Result**: Successful logout and redirect to login

### Test 6: Navigation

#### 6.1 Bottom Tabs
- [ ] All 4 tabs should be visible at bottom:
  - [ ] 🏠 Accueil
  - [ ] ⚽ Matches
  - [ ] 👤 Joueurs
  - [ ] ⚙️ Profil
- [ ] Active tab should be highlighted (blue)
- [ ] Inactive tabs should be gray
- [ ] Tap each tab to navigate

**Expected Result**: Smooth navigation between screens

#### 6.2 Authentication Barrier
- [ ] While logged out, should not be able to access main tabs
- [ ] After login, should not see back button to auth screens
- [ ] Android back button should not go to auth screens when logged in

**Expected Result**: Auth flow properly secured

### Test 7: Error Handling

#### 7.1 Network Errors
- [ ] Turn off WiFi/data
- [ ] Try to refresh any screen
- [ ] Should show error in console
- [ ] Turn WiFi/data back on
- [ ] Pull to refresh
- [ ] Should load data

**Expected Result**: Graceful handling of network errors

#### 7.2 API Errors
- [ ] Try invalid login credentials
- [ ] Should show error alert
- [ ] Error message should be user-friendly

**Expected Result**: API errors properly displayed

#### 7.3 Loading States
- [ ] On first load of each screen, should show ActivityIndicator
- [ ] While refreshing, should show refresh indicator
- [ ] During login/signup, button should show ActivityIndicator

**Expected Result**: Clear loading feedback

### Test 8: Performance

#### 8.1 Screen Load Times
- [ ] Home screen loads in < 2 seconds
- [ ] Matches screen loads in < 2 seconds
- [ ] Players screen loads in < 2 seconds
- [ ] Profile screen loads instantly

**Expected Result**: Fast load times

#### 8.2 Search Performance
- [ ] Type in search bars
- [ ] Filtering should be instant
- [ ] No lag or stutter

**Expected Result**: Smooth search experience

#### 8.3 Scroll Performance
- [ ] Scroll through matches list
- [ ] Scroll through players list
- [ ] Should be smooth, no lag

**Expected Result**: 60fps scrolling

### Test 9: UI/UX

#### 9.1 Design Consistency
- [ ] Colors match throughout app (blue primary)
- [ ] Spacing is consistent
- [ ] Fonts are consistent
- [ ] Icons are clear

**Expected Result**: Professional, consistent design

#### 9.2 Accessibility
- [ ] Text is readable
- [ ] Touch targets are large enough
- [ ] Contrast is good

**Expected Result**: Accessible design

#### 9.3 Feedback
- [ ] Buttons show press feedback
- [ ] Pull to refresh shows indicator
- [ ] Errors are clearly displayed

**Expected Result**: Clear user feedback

## Test Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| admin@arcane.com | Admin123! | ADMIN | Full access |
| scout1@arcane.com | Scout123! | SCOUT | Scout features |
| scout2@arcane.com | Scout123! | SCOUT | Second scout |
| agent@arcane.com | Agent123! | AGENT | Agent features |

## Known Issues to Check

- [ ] Expo version warning (react-native-screens) - should be fixed
- [ ] Metro bundler slow start - wait patiently
- [ ] Android emulator needs 10.0.2.2 for localhost
- [ ] No offline mode - requires internet

## Bug Reporting Template

If you find a bug, report it with:

```
**Screen**: [Which screen]
**Steps to Reproduce**:
1.
2.
3.

**Expected Result**:
**Actual Result**:
**Screenshots**: [If applicable]
**Device**: [iOS/Android, Simulator/Real device]
```

## Success Criteria

✅ All authentication flows work
✅ All screens load data correctly
✅ Search and filters work
✅ Pull to refresh works on all screens
✅ Logout works correctly
✅ No crashes during normal use
✅ UI is responsive and smooth
✅ Loading states are clear
✅ Errors are handled gracefully

## Next Steps After Testing

1. Document all bugs found
2. Prioritize bug fixes
3. Plan Phase 2 features
4. Prepare for app store submission
5. Create user documentation

---

**Happy Testing!** 🎉

For issues, refer to:
- QUICKSTART.md for setup help
- mobile/README.md for troubleshooting
- COMPLETION_SUMMARY.md for project overview
