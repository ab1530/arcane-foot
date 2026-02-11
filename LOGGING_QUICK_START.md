# 🧪 Arcane Logging - Quick Start Guide

## 🚀 How to Test Logging (3 Steps)

### Step 1: Open Settings
1. Launch the app
2. Navigate to **Profile Tab** (bottom navigation)
3. Tap **Settings** icon

### Step 2: Access Developer Tools (DEV Mode Only)
You'll see a new section: **"Developer Tools"** 🛠️

This section contains:
- **Logging Test** - Test all logging functionality
- **Log Console** - View and search app logs

### Step 3: Run Tests
Tap **"Logging Test"** → Tap **"🚀 RUN ALL TESTS"**

Watch your **Metro Bundler terminal** for colored logs! 🎨

---

## 📊 What You'll See

### In Metro Bundler Terminal:
```
21:13:59 ℹ️ INFO [SYSTEM] Expo Log Bridge initialized
21:14:00 🧭 NAVIGATION [NAVIGATION] App → Landing
21:14:01 ✅ API [API] GET /api/players - 200 (234ms)
21:14:02 ⚠️ WARN [SYSTEM] This is a warning message
21:14:03 ❌ API [API] POST /api/reports - 500 (456ms)
21:14:04 🤖 AI [AI] OpenAI completion - 1456 tokens (120ms)
21:14:05 👤 USER [USER_ACTION] button_click TestScreen
21:14:06 ⚡ PERFORMANCE data_fetch - 234ms
```

### Color Coding:
- 🟢 **INFO** - Green background
- 🟡 **WARN** - Yellow background
- 🔴 **ERROR** - Red background
- 🟣 **DEBUG** - Magenta background (dev only)

### API Status Codes:
- ✅ **200-299** - Green (Success)
- ⚠️ **300-399** - Yellow (Redirect)
- 🔵 **400-499** - Blue (Client Error)
- ❌ **500+** - Red (Server Error)

---

## 🔍 Log Console Features

Tap **"Log Console"** to:
- ✅ View all logs in-app
- ✅ Filter by Level (ERROR, WARN, INFO, DEBUG)
- ✅ Filter by Tag (API, NAVIGATION, UI, AI, etc.)
- ✅ Search logs
- ✅ Export logs
- ✅ Clear logs

---

## 🧪 Test Buttons Explained

### Individual Tests:
1. **Test Basic Logging** - log, info, warn, error, debug
2. **Test API Logging** - Success/error API calls
3. **Test Navigation Logging** - Screen transitions
4. **Test User Action Logging** - Button clicks, form submits
5. **Test AI Logging** - AI service calls with tokens
6. **Test Performance Logging** - Timing operations
7. **Test Error Logging** - Error with stack trace

### Run All Tests:
Executes all 7 tests sequentially with 500ms delays

---

## 💡 Tips

### Where to Look:
- **Metro Bundler Terminal** - Real-time colored logs
- **Log Console Screen** - In-app log viewer
- **Log Files** - Stored in app documents (expo-file-system)

### Best Practices:
- Check Metro terminal while testing
- Use filters in Log Console to find specific logs
- Export logs before clearing
- Developer Tools only show in DEV mode (__DEV__ = true)

### Troubleshooting:
If logs don't appear:
1. Make sure Metro Bundler is running
2. Check that __DEV__ is true
3. Restart app if needed
4. Check Log Console for in-app logs

---

## 📱 Navigation Path

```
App Launch
  ↓
Main Tabs
  ↓
Profile Tab
  ↓
Settings
  ↓
Developer Tools (DEV mode)
  ↓
┌─────────────────────┬──────────────────┐
│   Logging Test      │   Log Console    │
│  (Test all logs)    │  (View logs)     │
└─────────────────────┴──────────────────┘
```

---

## 🎯 Success Criteria

You'll know it's working when:
- ✅ You see colored logs in Metro Bundler
- ✅ Timestamps are current
- ✅ Tags are properly categorized
- ✅ Navigation changes are logged
- ✅ API calls show method + status + duration
- ✅ Errors show stack traces in dev mode

---

## 🔗 Related Documentation

- **MOBILE_LOGGING_ENGINE.md** - Full implementation details
- **MOBILE_LOGGING_COMPLETE.md** - Implementation summary
- **ARCANE_LOG_AUDIT.md** - Initial audit findings

---

**Ready to test?**
1. Open Settings
2. Tap "Logging Test"
3. Press "🚀 RUN ALL TESTS"
4. Watch your terminal! 🎨

---

**Last Updated**: 2025-01-18
