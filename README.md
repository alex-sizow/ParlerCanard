# ParlerCanard 🦆

A fully client-side French pronunciation trainer. Record your voice, get instant multi-factor feedback — accuracy, clarity, intonation, fluency — all running offline in the browser via WebAssembly. No backend, no data leaves your device.

**Live demo:** [parlercanard.io](http://parlercanard.io/)

## Features

### Practice Modes
- **Words** — 60+ French words across 3 difficulty levels with IPA transcriptions
- **Sentences** — 30+ sentences with per-phrase breakdown (tap any phrase to hear it)
- **Phoneme Library** — 40+ French phonemes with articulation tips
- **Teacher Mode** — custom word management + student recording review

### Pronunciation Analysis Pipeline
All processing happens in the browser — nothing is sent to a server.

1. **Speech Recognition** — Offline French STT via [Vosk](https://alphacephei.com/vosk/) (Kaldi, WASM). Per-word transcript with confidence and timestamps.
2. **Pitch Tracking** — Real-time F0 extraction via [pitchy](https://github.com/ianprime0509/pitchy) (McLeod Pitch Method). Produces a pitch contour for intonation comparison.
3. **Weighted Scoring** — Four sub-scores combined into a single percentage:

| Sub-score | Weight | Method |
|---|---|---|
| Accuracy | 40% | Levenshtein similarity (expected vs. recognized) |
| Clarity | 30% | Average Vosk per-word confidence |
| Intonation | 20% | Pearson correlation of pitch contours |
| Fluency | 10% | Pause duration analysis from timestamps |

### Progress & Gamification
- Learned words / completed sentences tracking
- Attempt history with score trends
- 14 achievements (milestones, streaks, accuracy, mastery)
- Daily streak tracking

### Offline-First PWA
- Vosk model (~41 MB) downloaded once, cached via Cache API
- All progress in localStorage — no backend
- Installable as a PWA

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3.5 (`<script setup>`, provide/inject) |
| Language | TypeScript 5.9 (strict) |
| Build | Vite 8 |
| UI | Vant 4 (mobile-first) |
| Router | vue-router 5 (lazy routes, auth guards) |
| Speech | vosk-browser (offline Kaldi ASR via WASM) |
| Pitch | pitchy (McLeod Pitch Method) |
| Fonts | Bricolage Grotesque, IBM Plex Mono |
| Deploy | GitHub Pages + GitHub Actions |

## Getting Started

```bash
pnpm install
pnpm dev
```

The Vosk French model (`vosk-model-small-fr.tar.gz`, ~41 MB) must be in `public/`. The app downloads and caches it automatically on first use.

```bash
pnpm build     # type-check + production build
pnpm preview   # preview production build locally
```

Requires Node.js ≥ 18 and pnpm.

## Project Structure

```
src/
├── main.ts                 # Bootstrap
├── App.vue                 # Root component + tabbar navigation
├── style.css               # Design tokens, global utilities, transitions
├── router/index.ts         # 8 routes with auth guards
│
├── data/                   # Static datasets & type definitions
│   ├── types.ts            #   Difficulty, PracticeItem, etc.
│   ├── constants.ts        #   Difficulty color/label mappings, re-exports scoring utils
│   ├── words.ts            #   60+ French words (3 levels)
│   ├── sentences.ts        #   30+ sentences with phrase breakdowns
│   ├── phonemes.ts         #   40+ phonemes (vowels, consonants, nasals, semi-vowels)
│   └── achievements.ts     #   14 achievements with unlock conditions
│
├── utils/                  # Pure functions (zero Vue reactivity)
│   ├── helpers.ts          #   scoreColor, scoreCssColor, countByDifficulty, filterByDifficulty,
│   │                       #   blobToBase64, base64ToBlob, formatDate, delay
│   ├── pronunciation.ts    #   analyzePronunciation — 4-factor weighted scoring,
│   │                       #   levenshtein, normalize, similarity, fluency/confidence computation
│   └── pitchAnalysis.ts    #   startPitchTracking, comparePitchContours,
│                           #   pearsonCorrelation, resampleContour
│
├── services/               # Async infrastructure with side effects
│   └── voskModelLoader.ts  #   Model URL resolution, Cache API caching,
│                           #   streaming fetch with progress callback
│
├── composables/            # Vue composables (reactive state)
│   ├── useVoskEngine.ts    #   Model lifecycle + KaldiRecognizer sessions
│   ├── useRecording.ts     #   Mic access, MediaRecorder, Vosk + pitch orchestration
│   ├── useAudio.ts         #   Web Speech Synthesis (French TTS, Chrome workarounds)
│   ├── usePracticeSession  #   Session orchestrator — provide/inject context to PracticePopup
│   ├── useProgress.ts      #   Learned words, completed sentences, attempt history
│   ├── useAchievements.ts  #   Streak tracking, achievement unlock logic
│   ├── useAuth.ts          #   User management, student/teacher roles
│   ├── useDifficulty.ts    #   Difficulty filtering for words & sentences
│   ├── usePersistence.ts   #   Generic reactive-state ↔ localStorage sync
│   ├── useStudentRecordings#   Student recording persistence (base64 audio)
│   ├── useTeacherWords.ts  #   Teacher custom word CRUD
│   └── usePwa.ts           #   PWA install prompt handling
│
├── components/             # 13 reusable UI components
│   ├── PracticePopup.vue   #   Bottom sheet — injects PracticeContext (zero props)
│   ├── PracticeCard.vue    #   Word/sentence card with listen & record actions
│   ├── RecordButton.vue    #   Animated record button with pulse
│   ├── AudioVisualizer.vue #   Real-time waveform from AnalyserNode
│   ├── ScoreCircle.vue     #   Animated circular score gauge
│   ├── ScoreBreakdown.vue  #   4-bar breakdown (accuracy, clarity, intonation, fluency)
│   ├── PhonemeGrid.vue     #   Per-word result grid (color-coded)
│   ├── DifficultyFilter.vue#   Tab filter with counts
│   └── ...                 #   OnboardingCard, EmptyState, StatsGrid, etc.
│
└── pages/                  # 8 page components (code-split via lazy routes)
    ├── WordsPage.vue
    ├── SentencesPage.vue
    ├── PhonemesPage.vue
    ├── AchievementsPage.vue
    ├── AccountPage.vue
    ├── LoginPage.vue
    ├── TeacherWordsPage.vue
    └── TeacherRecordingsPage.vue
```

### Architecture Decisions

- **provide/inject for PracticePopup** — `usePracticeSession` provides a `PracticeContext` via Vue's dependency injection. `PracticePopup` injects it directly — no prop drilling (was 20+ props, now 0). Pages only destructure what they need.
- **utils/ vs composables/** — pure functions (scoring, math, encoding) live in `utils/`. Vue composables (reactive state, lifecycle) live in `composables/`. Async infra with side effects (network, Cache API) lives in `services/`.
- **Global CSS transitions** — shared `card-list-*` and `check-pop-*` transitions in `style.css` instead of duplicated scoped styles.
- **Backward-compatible re-exports** — `data/constants.ts` re-exports scoring functions from `utils/helpers.ts` so existing imports don't break.

## Deployment

Deployed to GitHub Pages on push to `master` via GitHub Actions. The workflow builds with pnpm + Node 20, deploys `dist/`.

## License

MIT
