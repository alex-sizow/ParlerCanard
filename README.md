# ParlerCanard 🦆

A client-side French pronunciation learning app. Record your voice, get instant feedback with per-word accuracy, speech clarity, intonation analysis, and fluency scoring — all running offline in the browser via WebAssembly.

**Live demo:** [parlercanard.io](http://parlercanard.io/)

## Features

### Practice Modes
- **Word Practice** — 60+ French words across beginner/intermediate/advanced levels with IPA transcriptions
- **Sentence Practice** — 30+ sentences with per-phrase breakdown (text, IPA, translation), listen to each phrase individually
- **Phoneme Library** — Reference guide of 40+ French phonemes (vowels, consonants, nasals, semi-vowels) with articulation tips

### Pronunciation Analysis
Records your voice and runs a **3-stage analysis pipeline** entirely in the browser:

1. **Speech Recognition** — Offline French STT via [Vosk](https://alphacephei.com/vosk/) (Kaldi-based, WebAssembly). Returns per-word transcript with confidence scores and timestamps.
2. **Pitch Tracking** — Real-time fundamental frequency extraction via [pitchy](https://github.com/ianprime0509/pitchy) (McLeod Pitch Method). Produces a pitch contour for intonation comparison.
3. **Multi-factor Scoring** — Combines four sub-scores into an overall pronunciation score:

| Sub-score | Weight | Method |
|---|---|---|
| Accuracy | 40% | Levenshtein similarity between expected text and recognized transcript |
| Clarity | 30% | Average Vosk per-word confidence |
| Intonation | 20% | Pearson correlation of pitch contours (reference vs. actual) |
| Fluency | 10% | Pause analysis from word timestamps |

Results are displayed as an overall percentage with a color-coded per-word grid (green ≥85%, yellow ≥70%, red <70%) and a breakdown of each sub-score.

### Progress & Gamification
- Track learned words and completed sentences
- Attempt history with score trends
- 14 achievements across 4 categories (milestones, streaks, accuracy, mastery)
- Daily streak tracking

### Teacher Mode
- Pre-seeded teacher account with custom word management
- Review student recordings with playback and scores

### Offline-First
- Vosk model (~41 MB) is downloaded once and cached in the browser Cache API
- All data and progress stored in localStorage — no backend required
- Works fully offline after the initial model download

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3.5 (`<script setup>` SFC) |
| Language | TypeScript 5.9 (strict mode) |
| Build | Vite 8, esbuild |
| UI | Vant 4.9 (mobile-first component library) |
| Router | vue-router 5 (lazy-loaded pages) |
| Speech Recognition | vosk-browser (offline Kaldi ASR via WASM) |
| Pitch Analysis | pitchy (McLeod Pitch Method) |
| Fonts | Bricolage Grotesque, IBM Plex Mono |
| Deploy | GitHub Pages via GitHub Actions |

## Getting Started

### Prerequisites
- Node.js ≥ 18
- pnpm

### Install & Run

```bash
pnpm install
pnpm dev
```

The Vosk French model (`vosk-model-small-fr.tar.gz`, ~41 MB) must be in `public/`. It is downloaded and cached automatically by the app on first use.

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
parler/
├── public/
│   ├── 404.html                    # SPA fallback for GitHub Pages
│   └── vosk-model-small-fr.tar.gz  # Offline French ASR model (~41 MB)
├── src/
│   ├── main.ts                     # App bootstrap
│   ├── App.vue                     # Root component with tabbar navigation
│   ├── router/index.ts             # 8 routes with auth guards
│   ├── data/                       # Static datasets (words, sentences, phonemes, achievements)
│   ├── composables/                # Business logic (12 composables)
│   │   ├── useVoskEngine.ts        # Vosk model loading, caching, recognizer sessions
│   │   ├── usePitchAnalysis.ts     # Real-time pitch tracking & contour comparison
│   │   ├── usePronunciation.ts     # 4-factor weighted pronunciation scoring
│   │   ├── useRecording.ts         # Mic access, parallel recording streams
│   │   ├── usePracticeSession.ts   # Practice session orchestration
│   │   └── ...                     # Auth, progress, achievements, audio, persistence
│   ├── pages/                      # 8 page components (lazy-loaded)
│   └── components/                 # 13 reusable UI components
├── package.json
├── vite.config.ts                  # Base /ParlerCanard/, Vant auto-import
└── tsconfig.json
```

## Deployment

Automatically deployed to GitHub Pages on push to `master` via GitHub Actions. The workflow builds with pnpm + Node 20 and deploys the `dist/` directory.

## License

MIT
