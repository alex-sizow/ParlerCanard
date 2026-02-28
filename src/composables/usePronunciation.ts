import { scoreColor } from '@/data/constants'
import { comparePitchContours, type PitchPoint } from './usePitchAnalysis'
import type { VoskWord } from './useVoskEngine'

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

const normalize = (text: string) =>
  text.toLowerCase().replace(/[.,!?;:'"«»\-—–()\[\]]/g, '').replace(/\s+/g, ' ').trim()

function similarity (a: string, b: string): number {
  if (a === b) return 100
  const maxLen = Math.max(a.length, b.length)
  return maxLen === 0 ? 100 : Math.round(((maxLen - levenshtein(a, b)) / maxLen) * 100)
}

const WEIGHT_ACCURACY = 0.40
const WEIGHT_CONFIDENCE = 0.30
const WEIGHT_INTONATION = 0.20
const WEIGHT_FLUENCY = 0.10

/**
 * Compute confidence score (0-100) from Vosk per-word confidence.
 * Higher confidence means the speech was clearer and more distinct.
 */
function computeConfidenceScore (words: VoskWord[]): number {
  if (words.length === 0) return 50
  const avg = words.reduce((sum, w) => sum + w.conf, 0) / words.length
  return Math.round(avg * 100)
}

/**
 * Compute fluency score (0-100) based on pause analysis from Vosk word timestamps.
 * Penalizes long pauses between words and very slow speech.
 */
function computeFluencyScore (words: VoskWord[]): number {
  if (words.length < 2) return 70 // Single word — default OK

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
  if (totalDuration <= 0) return 70

  // Pause ratio: how much of the speech is silence
  const pauseRatio = totalPauseTime / totalDuration

  // Penalize: >40% pauses = bad, <10% pauses = great
  const pauseScore = Math.max(0, Math.min(100, Math.round((1 - pauseRatio * 2) * 100)))

  // Penalize individual long pauses (>1s is very bad)
  const longPausePenalty = maxPause > 1.5 ? 20 : maxPause > 1.0 ? 10 : maxPause > 0.5 ? 5 : 0

  return Math.max(0, Math.min(100, pauseScore - longPausePenalty))
}

export function analyzePronunciation (
  expected: string,
  actual: string,
  voskWords?: VoskWord[],
  pitchContour?: PitchPoint[],
  referencePitch?: PitchPoint[],
): PronunciationAnalysis {
  const [normExpected, normActual] = [normalize(expected), normalize(actual)]
  const actualWords = normActual.split(' ')

  // Build word-level results with Vosk confidence when available
  const wordResults: WordResult[] = normExpected.split(' ').map((expWord, i) => {
    const s = similarity(expWord, actualWords[i] ?? '')
    const vw = voskWords?.[i]
    const conf = vw ? vw.conf : (s / 100)
    return { word: expWord, expected: expWord, score: s, confidence: conf, color: scoreColor(s) }
  })

  // Sub-scores
  const accuracyScore = similarity(normExpected, normActual)
  const confidenceScore = voskWords ? computeConfidenceScore(voskWords) : accuracyScore
  const intonationScore = (pitchContour && referencePitch)
    ? comparePitchContours(referencePitch, pitchContour)
    : 50 // Neutral when no reference available
  const fluencyScore = voskWords ? computeFluencyScore(voskWords) : 70

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
