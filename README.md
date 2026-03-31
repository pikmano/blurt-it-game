# 💥 AlphaBurst

A cross-platform mobile vocabulary & general knowledge game built with **React Native + Expo (TypeScript)**.

Players take turns saying (via voice or typing) a word that starts with a randomly displayed letter and belongs to the selected category (Animals, Countries, Cities). Supports English and Hebrew.

---

## Features

- 🎤 **Voice input** via `expo-speech-recognition` with text fallback
- 🔊 **Text-to-Speech** player announcements via `expo-speech`
- ⏱️ **Animated countdown timer** (circular SVG progress ring)
- 🌍 **English & Hebrew** support with RTL layout
- 📴 **Fully offline** — all word lists bundled as JSON (no API needed)
- 📊 **Rich results screen** with per-player analytics
- 📜 **Game history** stored locally via AsyncStorage
- 🎨 **Dark mode** aware, haptic feedback, confetti on win

---

## Project Structure

```
src/
  components/     # CircularTimer, AnswerInput, FeedbackOverlay, ConfettiAnimation, PlayerCard
  screens/        # HomeScreen, SetupScreen, GameScreen, ResultsScreen, HistoryScreen
  context/        # AppSettingsContext, GameContext (useReducer)
  hooks/          # useTimer, useSpeech, useValidation
  data/           # animals_en.json, animals_he.json, countries_*.json, cities_*.json
  utils/          # validation.ts, randomPicker.ts, storage.ts, stats.ts
  i18n/           # en.ts, he.ts, index.ts
  navigation/     # index.tsx (RootNavigator)
  types/          # index.ts — all TypeScript types
```

---

## Setup

### Prerequisites

- **Node.js** 18+
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI** (for production builds): `npm install -g eas-cli`
- Xcode (iOS simulator, macOS only)
- Android Studio (Android emulator)

### Install & run

```bash
# Clone and install
git clone https://github.com/pikmano/blurt-it-game.git
cd blurt-it-game
npm install

# Start Expo dev server
npm start

# Or target specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Browser (speech recognition limited)
```

---

## Running on iOS Simulator

1. Install Xcode from the Mac App Store.
2. Open Xcode → Preferences → Platforms → install iOS runtime.
3. Run `npm run ios` — Expo will boot the simulator automatically.
4. To pick a specific simulator: press `i` in the Expo terminal, then choose.

**Note:** Speech recognition requires a real device on iOS.

---

## Running on Android Emulator

1. Install Android Studio and create a virtual device (AVD) with API 33+.
2. Start the emulator from Android Studio → Device Manager.
3. Run `npm run android`.

**Note:** Voice input uses the device's built-in speech engine.

---

## Production Builds (EAS Build)

```bash
# Log in to Expo account
eas login

# Configure project (first time)
eas build:configure

# Build for iOS (generates .ipa)
eas build --platform ios --profile production

# Build for Android (generates .aab)
eas build --platform android --profile production
```

### eas.json reference

```json
{
  "build": {
    "production": {
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## Submitting to App Store & Google Play

### App Store (iOS)

1. Enrol in [Apple Developer Program](https://developer.apple.com) ($99/year).
2. Create an App record in [App Store Connect](https://appstoreconnect.apple.com).
3. Build with EAS: `eas build --platform ios --profile production`
4. Submit: `eas submit --platform ios`
   - Or upload the `.ipa` manually via Transporter.
5. Fill in metadata (screenshots, description, rating) and submit for review.

### Google Play (Android)

1. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time).
2. Create a new app in Google Play Console.
3. Build: `eas build --platform android --profile production`
4. Submit: `eas submit --platform android`
   - Or upload the `.aab` manually.
5. Complete store listing and submit for review.

---

## Adding More Word Lists

Word lists live in `src/data/`. Each file is a flat JSON array of lowercase strings.

```json
["word1", "word2", "word3"]
```

To add a new **language**:
1. Add JSON files: `animals_xx.json`, `countries_xx.json`, `cities_xx.json`
2. Import them in `src/utils/validation.ts`
3. Add the new `Language` type and locale mapping
4. Add i18n strings in `src/i18n/`

To add a new **category**, follow the same pattern and update the `Category` type in `src/types/index.ts`.

---

## Key Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Word validation | Pre-built `Set` at module load | O(1) lookup, <1ms per check |
| Voice input | `expo-speech-recognition` | Managed Expo, no ejecting needed |
| State | `useReducer` + Context | Predictable, no extra deps |
| Animation | React Native `Animated` | No native module required |
| Confetti | Custom `Animated` burst | Avoids extra package, pure JS |
| Storage | `AsyncStorage` | Simple, offline, cross-platform |
| RTL | Manual `flexDirection` + `textAlign` | No app restart needed |
