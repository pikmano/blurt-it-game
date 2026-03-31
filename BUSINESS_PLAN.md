# AlphaBurst — Business Plan

---

## Vision

AlphaBurst is a fast-paced, family-friendly word game that combines vocabulary, geography, and general knowledge. It runs fully offline, supports multiple languages, and is designed for ages 7+. The goal is to become a go-to game for family game nights and classroom settings.

---

## Phase 1 — Internal / Family Use (Current)

**Objective:** Polish the game through real-world use with friends and family before a public launch.

**Checklist:**
- [x] Core gameplay loop (voice + text input, timer, scoring)
- [x] English & Hebrew support
- [x] 3 categories: Animals, Countries, Cities
- [x] Game history & analytics
- [ ] Gather feedback from 20–50 internal testers
- [ ] Fix edge cases (unusual letter combinations, Hebrew TTS quality)
- [ ] Add sound effects (correct chime, wrong buzz, countdown beep)
- [ ] Visual polish pass (icons, splash screen, app icon)
- [ ] TestFlight / Internal Google Play track distribution

**Timeline:** 4–6 weeks

---

## Phase 2 — Public Launch

**Objective:** Launch on the App Store and Google Play and reach 1,000 downloads in the first month.

### Pre-launch (Weeks 1–4)
- Create a product page on App Store Connect and Google Play
- Design professional screenshots (5 per platform, multiple locales)
- Record a 15–30 second app preview video
- Write keyword-optimised descriptions (see ASO section below)
- Set up analytics (Expo + Firebase or Mixpanel)
- Set up crash reporting (Sentry or Bugsnag)
- Beta test via TestFlight (iOS) and Google Play Internal / Open track (Android)

### Launch day
- Soft launch in Israel and the US simultaneously (matching the two supported languages)
- Post in relevant communities: Hebrew parenting Facebook groups, r/boardgames, Product Hunt
- Reach out to family/edu-tech bloggers for reviews

### Growth (Months 2–6)
- Add more categories based on user feedback (Sports, Food, Movies, etc.)
- Localise to Spanish, French, Arabic (high-value markets)
- Pursue app store featuring (submit to "New Apps We Love" editorial)
- Run small paid UA campaigns on Meta (targeting parents, 30–45 age group)

---

## Phase 3 — Monetisation

### Free tier (default)
- Unlimited gameplay
- All 3 Phase-1 categories
- Banner ads between games (AdMob)

### Premium (one-time purchase or subscription)
- Remove all ads
- Access to all category packs
- Priority customer support

**Suggested pricing:** $2.99 one-time or $0.99/month via RevenueCat

### In-App Purchases — Category Packs
Each pack adds 3–5 new categories with 100+ words each.

| Pack | Categories | Price |
|---|---|---|
| Science Pack | Elements, Space, Human Body | $1.99 |
| Pop Culture Pack | Movies, Music, TV Shows | $1.99 |
| Sports Pack | Sports, Athletes, Teams | $1.99 |
| Food Pack | Fruits, Vegetables, Dishes | $0.99 |
| Ultimate Bundle | All packs forever | $4.99 |

### Implementation Tools
- **Ads:** [Google AdMob](https://admob.google.com) — banner between games, optional interstitial after Results screen
- **Subscriptions / IAP:** [RevenueCat](https://www.revenuecat.com) — cross-platform subscription management with built-in paywalls
- **Analytics:** [Expo Analytics](https://docs.expo.dev) + [Mixpanel](https://mixpanel.com) or [PostHog](https://posthog.com)

---

## Monetisation Revenue Model

Assuming 1,000 monthly active users after 6 months:

| Source | Conversion | ARPU | Monthly Revenue |
|---|---|---|---|
| AdMob banner | 100% (free users) | $0.10/MAU | $80 |
| Premium one-time | 5% | $2.99 | $150 |
| Category pack IAP | 8% | $1.99 avg | $160 |
| **Total** | | | **~$390/mo** |

Revenue scales linearly with installs. Target: 10,000 MAU → ~$3,900/mo.

---

## App Store Optimisation (ASO)

### Title & Subtitle
- **Title:** AlphaBurst – Word Quiz Game
- **Subtitle:** Family Vocabulary Challenge

### Keywords (iOS — 100 characters)
```
word game,family quiz,vocabulary,animals,countries,cities,kids game,letter game,education
```

### Description Hook (first 2 lines are critical — shown before "More")
```
💥 AlphaBurst is the ultimate word blitz game for families, classrooms, and game nights.
Name an animal, country, or city starting with a random letter — before time runs out!
```

### Screenshots
1. Home screen (colourful, logo prominent)
2. Game screen (letter + category card + countdown ring)
3. Voice input in action (mic button glowing)
4. Results screen (winner trophy + stats table)
5. Multi-player setup (8 player avatars)

### Ratings Strategy
- Prompt for a rating after the 3rd game played (not after first launch)
- Use `expo-store-review` (`StoreReview.requestReviewAsync()`)
- Target: 4.5+ stars on both stores

### Localisation
- Localise store listing for HE (Hebrew) on launch
- Add ES (Spanish) listing in Phase 2

---

## Competitive Landscape

| App | Strength | Our advantage |
|---|---|---|
| Codenames | Deep strategy | Simpler, faster, offline, multi-language |
| Scrabble GO | Strong brand | No account needed, family-friendly |
| Stop! (Tutti Frutti) | Same mechanic | Voice input, Hebrew, better UX |
| Kahoot | Quiz format | Real-time word creativity, no internet needed |

---

## Cost Structure (Monthly, Post-Launch)

| Item | Cost |
|---|---|
| Apple Developer account | $8/mo (amortised) |
| Google Play Developer | $0 (one-time $25) |
| Expo EAS Build (Pro plan) | $29/mo |
| RevenueCat (up to 10k MAU) | Free |
| AdMob | Free (revenue share) |
| **Total** | **~$37/mo** |

Break-even at roughly **400 MAU** with average monetisation.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Low organic discovery | Invest in ASO + community seeding |
| TTS quality in Hebrew | Allow TTS toggle off; use text-only mode |
| Word list gaps | Crowdsource additions via GitHub / in-app feedback button |
| Competition from big studios | Focus on underserved Hebrew market; community-first |
| App store rejection | Ensure privacy policy, no COPPA issues for under-13 |

---

## 12-Month Milestones

| Month | Milestone |
|---|---|
| 1 | Internal TestFlight + Play beta with 50 testers |
| 2 | App Store + Google Play public launch |
| 3 | 500 downloads; first IAP category pack live |
| 4 | AdMob integration; first ad revenue |
| 5 | Localise to Spanish; reach 1,000 MAU |
| 6 | RevenueCat paywall live; premium tier available |
| 9 | 5,000 MAU; second language pack (Arabic) |
| 12 | 10,000 MAU; review profitability for continued investment |
