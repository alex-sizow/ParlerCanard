import { scoreColor } from '@/utils/helpers'
import { comparePitchContours, scorePitchProsody, type PitchPoint } from '@/utils/pitchAnalysis'
import type { VoskWord } from '@/composables/useVoskEngine'

export interface WordResult {
  word: string
  expected: string
  score: number
  confidence: number
  color: 'success' | 'warning' | 'danger'
}

export interface PronunciationAnalysis {
  overallScore: number
  overallColor: 'success' | 'warning' | 'danger'
  wordResults: WordResult[]
  accuracyScore: number
  confidenceScore: number
  intonationScore: number
  fluencyScore: number
}

// ── String utilities ─────────────────────────────────────────────

function levenshtein (a: string, b: string): number {
  const [m, n] = [a.length, b.length]
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
  return dp[m]![n]!
}

/**
 * Normalize French text for comparison:
 * - Lowercase
 * - Replace apostrophes (', ') with space so l'école → "l école"
 * - Strip remaining punctuation
 * - Strip Unicode combining accents for fuzzy matching (é→e, ç→c…)
 * - Collapse multiple spaces
 */
function normalize (text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʼ]/g, ' ')                            // French apostrophes → space
    .replace(/[.,!?;:'"«»\-—–()\[\]]/g, '')            // Strip punctuation
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // Strip combining accents
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize for display purposes — keeps accents but handles apostrophes the same way.
 */
function normalizeKeepAccents (text: string): string {
  return text
    .toLowerCase()
    .replace(/[''ʼ]/g, ' ')
    .replace(/[.,!?;:'"«»\-—–()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity (a: string, b: string): number {
  if (a === b) return 100
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 100 : Math.round(((maxLen - levenshtein(a, b)) / maxLen) * 100)
}

// ── Token-level alignment (word-level Levenshtein) ───────────────

interface AlignedWord {
  expected: string        // original expected word (with accents for display)
  actual: string          // matched recognized word ('' if deleted)
  voskIndex: number | -1  // index into voskWords array, -1 if not matched
}

/**
 * Align expected and actual word arrays using word-level edit distance.
 * Returns an array of aligned pairs that correctly handles insertions,
 * deletions, and substitutions from the ASR output.
 */
function alignWords (
  expectedTokens: string[],
  actualTokens: string[],
  expectedDisplay: string[],
): AlignedWord[] {
  const m = expectedTokens.length
  const n = actualTokens.length

  // Build DP matrix for word-level Levenshtein
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      // Use character-level similarity to decide cost — similar words get lower cost
      const sim = similarity(expectedTokens[i - 1]!, actualTokens[j - 1]!)
      const substCost = sim >= 50 ? (sim >= 80 ? 0 : 0.5) : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,          // deletion (expected word not in actual)
        dp[i]![j - 1]! + 1,          // insertion (extra word in actual)
        dp[i - 1]![j - 1]! + substCost, // substitution / match
      )
    }
  }

  // Backtrack to build alignment
  const aligned: AlignedWord[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sim = similarity(expectedTokens[i - 1]!, actualTokens[j - 1]!)
      const substCost = sim >= 50 ? (sim >= 80 ? 0 : 0.5) : 1
      if (dp[i]![j] === dp[i - 1]![j - 1]! + substCost) {
        // Match or substitution
        aligned.unshift({
          expected: expectedDisplay[i - 1]!,
          actual: actualTokens[j - 1]!,
          voskIndex: j - 1,
        })
        i--; j--
        continue
      }
    }
    if (i > 0 && dp[i]![j] === dp[i - 1]![j]! + 1) {
      // Deletion — expected word not found in actual
      aligned.unshift({
        expected: expectedDisplay[i - 1]!,
        actual: '',
        voskIndex: -1,
      })
      i--
    } else {
      // Insertion — extra word in actual, skip
      j--
    }
  }

  return aligned
}

// ── Scoring weights ──────────────────────────────────────────────

const WEIGHT_ACCURACY = 0.40
const WEIGHT_CONFIDENCE = 0.30
const WEIGHT_INTONATION = 0.20
const WEIGHT_FLUENCY = 0.10

/**
 * Compute confidence score (0-100) from Vosk per-word confidence.
 * Higher confidence means the recognizer was more certain about the transcription.
 */
function computeConfidenceScore (words: VoskWord[]): number {
  if (words.length === 0) return 0
  const avg = words.reduce((sum, w) => sum + w.conf, 0) / words.length
  return Math.round(avg * 100)
}

/**
 * Compute fluency score (0-100) based on pause analysis from Vosk word timestamps.
 * Penalizes long pauses between words and very slow speech.
 */
function computeFluencyScore (words: VoskWord[]): number {
  if (words.length < 2) return 90 // Single word — fluency not meaningfully measurable

  let totalPauseTime = 0
  let maxPause = 0

  for (let i = 1; i < words.length; i++) {
    const pause = words[i]!.start - words[i - 1]!.end
    if (pause > 0) {
      totalPauseTime += pause
      if (pause > maxPause) maxPause = pause
    }
  }

  const totalDuration = words[words.length - 1]!.end - words[0]!.start
  if (totalDuration <= 0) return 80

  // Pause ratio: how much of the speech is silence
  const pauseRatio = totalPauseTime / totalDuration

  // Gentler curve: 33% pauses → 50, 0% → 100, 66%+ → 0
  const pauseScore = Math.max(0, Math.min(100, Math.round((1 - pauseRatio * 1.5) * 100)))

  // Gentler long pause penalties
  const longPausePenalty = maxPause > 1.5 ? 15 : maxPause > 1.0 ? 8 : maxPause > 0.5 ? 3 : 0

  return Math.max(0, Math.min(100, pauseScore - longPausePenalty))
}

// ── Main analysis function ───────────────────────────────────────

export function analyzePronunciation (
  expected: string,
  actual: string,
  voskWords?: VoskWord[],
  pitchContour?: PitchPoint[],
  referencePitch?: PitchPoint[],
): PronunciationAnalysis {
  const normExpected = normalize(expected)
  const normActual = normalize(actual)
  const displayExpected = normalizeKeepAccents(expected)

  const expectedTokens = normExpected.split(' ').filter(Boolean)
  const actualTokens = normActual.split(' ').filter(Boolean)
  const displayTokens = displayExpected.split(' ').filter(Boolean)

  const hasVoskWords = voskWords != null && voskWords.length > 0

  // Align expected words to actual words using token-level edit distance
  const aligned = alignWords(expectedTokens, actualTokens, displayTokens)

  // Build word-level results using aligned pairs
  const wordResults: WordResult[] = aligned.map((pair) => {
    const s = similarity(normalize(pair.expected), normalize(pair.actual))
    // Look up Vosk confidence for the matched actual word
    const vw = (hasVoskWords && pair.voskIndex >= 0) ? voskWords![pair.voskIndex] : undefined
    const conf = vw ? vw.conf : (s / 100)
    return {
      word: pair.expected,
      expected: pair.expected,
      score: s,
      confidence: conf,
      color: scoreColor(s),
    }
  })

  // Sub-scores
  const accuracyScore = similarity(normExpected, normActual)
  const confidenceScore = hasVoskWords ? computeConfidenceScore(voskWords!) : accuracyScore
  const fluencyScore = hasVoskWords ? computeFluencyScore(voskWords!) : 80

  // Intonation: use reference contour if available, otherwise score prosody heuristically
  let intonationScore: number
  if (pitchContour && referencePitch) {
    intonationScore = comparePitchContours(referencePitch, pitchContour)
  } else if (pitchContour && pitchContour.length >= 3) {
    intonationScore = scorePitchProsody(pitchContour, expected)
  } else {
    intonationScore = 60 // Minimal data — slightly below neutral
  }

  // Weighted overall
  const overallScore = Math.round(
    accuracyScore * WEIGHT_ACCURACY
    + confidenceScore * WEIGHT_CONFIDENCE
    + intonationScore * WEIGHT_INTONATION
    + fluencyScore * WEIGHT_FLUENCY,
  )

  return {
    overallScore,
    overallColor: scoreColor(overallScore),
    wordResults,
    accuracyScore,
    confidenceScore,
    intonationScore,
    fluencyScore,
  }
}
