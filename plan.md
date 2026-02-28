# Planning Guide

A Telegram mini app for learning French pronunciation through interactive voice practice with phoneme-based feedback and pronunciation accuracy scoring.

**Experience Qualities**:
1. **Educational** - Clear visual feedback helps users understand French phonetics and improve pronunciation through repetition
2. **Interactive** - Voice recording and playback creates an engaging learning loop with immediate feedback
3. **Progressive** - Structured learning path from individual words to complete sentences builds confidence naturally

**Complexity Level**: Light Application (multiple features with basic state)
- This is a focused learning tool with word/sentence practice, voice recording, pronunciation analysis, and progress tracking - typical of an educational practice app

## Essential Features

### Word Practice Mode
- **Functionality**: Display French words with IPA phonetic transcription and allow users to listen and record pronunciation
- **Purpose**: Master individual word pronunciation before moving to sentences
- **Trigger**: User selects "Practice Words" from main menu
- **Progression**: View word card → Listen to native audio → Record own pronunciation → See phoneme-level feedback → Mark as learned or retry
- **Success criteria**: User can record audio, hear playback, and see visual feedback on pronunciation accuracy

### Sentence Practice Mode
- **Functionality**: Present complete French sentences with phrase-by-phrase breakdown and pronunciation guidance
- **Purpose**: Apply pronunciation skills in realistic conversational context
- **Trigger**: User selects "Practice Sentences" from main menu
- **Progression**: View sentence → Listen to full sentence → Break down by phrases → Record full sentence → Review accuracy score → Continue to next sentence
- **Success criteria**: User can practice complete sentences with clear feedback on fluency and accuracy

### Pronunciation Feedback System
- **Functionality**: Real-time speech recognition using Web Speech API analyzes user pronunciation and provides visual feedback with phoneme-level accuracy scores
- **Purpose**: Help users identify specific sounds they need to improve through accurate pronunciation analysis
- **Trigger**: Automatically after user records pronunciation using browser's native speech recognition
- **Progression**: Recording completes → Web Speech API transcribes speech → Levenshtein distance algorithm compares transcription to expected text → Display color-coded phoneme breakdown → Show overall accuracy percentage and recognized text → Provide encouraging feedback based on score
- **Success criteria**: Accurate speech-to-text transcription in French with confidence scores, visual phoneme indicators showing which sounds were pronounced correctly (green 85%+) vs. needs practice (yellow 70-84%) vs. incorrect (red <70%), display of user's spoken text for comparison

### Progress Tracking
- **Functionality**: Track learned words, practice sessions, and overall pronunciation improvement over time
- **Purpose**: Motivate continued practice through visible progress
- **Trigger**: Automatically updates after each practice session
- **Progression**: User completes practice → Statistics update → View progress dashboard → See learned words count and accuracy trends
- **Success criteria**: User can see their learning history and improvement metrics

### Achievements & Streak Tracking
- **Functionality**: Gamified achievement system with unlockable badges across 4 categories (milestone, streak, accuracy, mastery) and daily streak counter that tracks consecutive days of practice
- **Purpose**: Increase user engagement and motivation through clear goals, rewards, and habit formation
- **Trigger**: Automatically checked after each word/sentence completion; streak calculated on first daily practice
- **Progression**: Complete practice → System checks achievement conditions → Toast notification appears for new unlocks → View Achievements tab → See current streak (🔥) and best streak (🏆) cards → Browse unlocked and locked achievements organized by category
- **Success criteria**: Users receive instant feedback with achievement notifications, can view all 14 achievements with progress indicators, and see their current/longest streak prominently displayed

### Difficulty Filter
- **Functionality**: Filter words and sentences by difficulty level (All Levels, Beginner, Intermediate, Advanced) with real-time count display
- **Purpose**: Allow users to focus practice on their skill level and progressively challenge themselves
- **Trigger**: User selects difficulty level buttons in Words or Sentences tab
- **Progression**: View practice screen → See difficulty filter card → Select desired level → Content updates to show only matching items → See filtered count badge → Practice filtered content
- **Success criteria**: Filter updates content instantly, displays accurate count of available items at each level, maintains separate filter state for words vs sentences, shows helpful empty state when no content matches filter

### Phoneme Library
- **Functionality**: Reference guide showing all French phonemes with audio examples and mouth position diagrams
- **Purpose**: Educational resource for understanding French sound system
- **Trigger**: User selects "Phoneme Guide" from menu
- **Progression**: Browse phoneme list → Select specific phoneme → See IPA symbol → Listen to sound example → View articulation tips
- **Success criteria**: Comprehensive phoneme reference with clear audio examples

## Edge Case Handling

- **No Microphone Access**: Display clear warning icon with helpful message explaining browser requirements and microphone permissions with fallback to listen-only mode
- **Recording Failure**: Toast notification shows specific error message (no speech detected, permission denied, network error) with automatic retry capability
- **No Audio Playback**: Fallback to showing phonetic transcription and visual mouth position guides
- **Empty Practice Queue**: Suggest starting with beginner words or revisiting previous content
- **Low Accuracy Scores**: Provide encouraging messages and suggest specific phonemes to practice in isolation
- **Browser Compatibility**: Clear messaging when speech recognition is not supported, directing users to Chrome, Edge, or Safari
- **First-Time Users**: Comprehensive onboarding card explaining the 4-step workflow with visual indicators and microphone permission tips

## Design Direction

The design should evoke a sense of clarity, confidence, and cultural sophistication - like a personal French tutor that's patient and encouraging. Visual elements should feel modern and European, with clean typography that reflects French aesthetic sensibilities. The interface should be calm and focused to support concentration during pronunciation practice.

## Color Selection

A sophisticated palette inspired by French design with educational clarity - using soft pastels with vibrant accent colors for feedback.

- **Primary Color**: Elegant French Blue (oklch(0.55 0.15 250)) - conveys professionalism and European sophistication, used for primary actions and headers
- **Secondary Colors**: 
  - Soft Cream (oklch(0.95 0.02 85)) - warm background that's easy on eyes during practice
  - Lavender Gray (oklch(0.75 0.05 280)) - subtle UI elements and cards
- **Accent Color**: Vibrant Rose (oklch(0.65 0.18 15)) - draws attention to record buttons and success states
- **Foreground/Background Pairings**: 
  - Primary Blue (oklch(0.55 0.15 250)): White text (oklch(0.99 0 0)) - Ratio 5.2:1 ✓
  - Soft Cream (oklch(0.95 0.02 85)): Charcoal text (oklch(0.25 0.01 260)) - Ratio 11.8:1 ✓
  - Accent Rose (oklch(0.65 0.18 15)): White text (oklch(0.99 0 0)) - Ratio 4.6:1 ✓
  - Success Green (oklch(0.70 0.15 145)): White text (oklch(0.99 0 0)) - Ratio 5.8:1 ✓
  - Error Red (oklch(0.60 0.20 25)): White text (oklch(0.99 0 0)) - Ratio 4.7:1 ✓

## Font Selection

Typefaces should balance French elegance with modern clarity for educational content.

- **Primary Font**: Bricolage Grotesque - Contemporary geometric sans with French design influence for interface text
- **Phonetic Font**: IBM Plex Mono - Highly legible monospace for IPA phonetic transcriptions

- **Typographic Hierarchy**:
  - H1 (Section Titles): Bricolage Grotesque Bold/32px/tight letter spacing/-0.02em
  - H2 (Word/Sentence Display): Bricolage Grotesque Semibold/28px/normal spacing
  - H3 (Card Headers): Bricolage Grotesque Medium/20px/normal spacing
  - Body Text: Bricolage Grotesque Regular/16px/1.5 line height
  - IPA Phonetics: IBM Plex Mono Medium/18px/1.3 line height/0.02em letter spacing
  - Labels/Captions: Bricolage Grotesque Regular/14px/subtle gray

## Animations

Animations should feel responsive and educational - reinforcing learning actions without distraction. Record button pulses subtly when active. Phoneme feedback animates in sequentially to help users follow along. Card transitions slide smoothly to maintain context. Success/error feedback uses gentle scale and color transitions. Progress indicators fill smoothly to celebrate achievements.

## Component Selection

- **Components**:
  - **Card** (shadcn): Primary container for word/sentence practice items with custom gradient backgrounds
  - **Button** (shadcn): Record, play, next actions with custom rounded styling and icon integration
  - **Progress** (shadcn): Visual indicator for pronunciation accuracy scores
  - **Bottom Navigation Bar** (custom): Sticky mobile-first navigation with animated icons and labels
  - **Badge** (shadcn): Display phoneme symbols and difficulty levels
  - **Dialog** (shadcn): Detailed phoneme explanations and pronunciation tips
  - **Scroll Area** (shadcn): Smooth scrolling for phoneme library and word lists
  - **Avatar** (shadcn): Display user progress level and achievement icons

- **Customizations**:
  - **Audio Visualizer**: Custom component showing waveform during recording/playback using canvas
  - **Phoneme Grid**: Custom layout showing color-coded phoneme accuracy (green=correct, yellow=close, red=incorrect)
  - **Recording Button**: Large circular button with pulsing animation and microphone icon
  - **Pronunciation Score Circle**: Circular progress indicator with percentage in center
  - **Bottom Navigation**: Fixed position navigation bar with framer-motion animations, backdrop blur glass effect, animated icon state changes, and smooth tab transitions

- **States**:
  - Buttons: Default (subtle shadow), Hover (lift with deeper shadow), Active (scale down slightly), Recording (pulsing red border), Disabled (reduced opacity)
  - Cards: Default (soft shadow), Hover (slight elevation increase), Active/Selected (blue border glow)
  - Input Recording: Idle (gray), Listening (pulsing red border with animation), Processing (blue with spinner)
  - Navigation Items: Default (muted colors), Active (primary color with scale animation and background highlight), Hover (accent background), Pressed (scale down)

- **Icon Selection**:
  - Chat (word practice - bottom nav)
  - Book (sentence practice - bottom nav)
  - ChartBar (phoneme library - bottom nav)
  - Trophy (achievements - bottom nav)
  - Microphone (recording action)
  - SpeakerHigh (play audio)
  - CheckCircle (correct pronunciation)
  - WarningCircle (needs improvement)
  - ArrowRight (next word/sentence)
  - ArrowLeft (previous item)

- **Spacing**:
  - Card padding: p-6 (24px)
  - Button padding: px-6 py-3 (24px horizontal, 12px vertical)
  - Section gaps: gap-8 (32px between major sections)
  - Item gaps: gap-4 (16px between related items)
  - Phoneme grid gaps: gap-2 (8px for tight phoneme tiles)
  - Bottom nav padding: py-2 (8px vertical), container padding for horizontal spacing

- **Mobile**:
  - Single column layout throughout
  - Large touch targets (min 48px) for record/play buttons and navigation items
  - Sticky bottom navigation bar with backdrop blur and glass morphism effect
  - Full-width cards with generous padding
  - Bottom padding on main content (pb-24) to prevent overlap with fixed navigation
  - Safe area inset support for iOS devices (notch/home indicator)
  - AnimatePresence for smooth content transitions between tabs
  - Collapsible sections for long phonetic explanations
