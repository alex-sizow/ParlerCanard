export interface PitchPoint {
  time: number
  pitch: number
  clarity: number
}

const CLARITY_THRESHOLD = 0.8
const MIN_PITCH_HZ = 50
const MAX_PITCH_HZ = 600

/** Sampling interval in ms — uses setInterval instead of rAF to keep sampling when tab is backgrounded */
const SAMPLE_INTERVAL_MS = 16

let detector: ReturnType<typeof createDetector> | null = null

function createDetector (inputLength: number) {
  // Lazy dynamic import — pitchy is ESM-only
  let pitchDetector: import('pitchy').PitchDetector<Float32Array> | null = null
  const initPromise = import('pitchy').then(({ PitchDetector }) => {
    pitchDetector = PitchDetector.forFloat32Array(inputLength)
    pitchDetector.minVolumeDecibels = -30
  })

  return {
    initPromise,
    findPitch (input: Float32Array, sampleRate: number): [number, number] {
      if (!pitchDetector) return [0, 0]
      return pitchDetector.findPitch(input, sampleRate)
    },
    inputLength,
  }
}

export function startPitchTracking (
  analyserNode: AnalyserNode,
  sampleRate: number,
): { stop: () => PitchPoint[]; contour: PitchPoint[] } {
  const fftSize = analyserNode.fftSize

  if (!detector || detector.inputLength !== fftSize) {
    detector = createDetector(fftSize)
  }

  const contour: PitchPoint[] = []
  const input = new Float32Array(fftSize)
  const startedAt = performance.now()
  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function tick () {
    if (stopped) return

    analyserNode.getFloatTimeDomainData(input)
    const [pitch, clarity] = detector!.findPitch(input, sampleRate)

    if (clarity >= CLARITY_THRESHOLD && pitch >= MIN_PITCH_HZ && pitch <= MAX_PITCH_HZ) {
      contour.push({
        time: (performance.now() - startedAt) / 1000,
        pitch,
        clarity,
      })
    }
  }

  // Start after detector is initialized
  detector.initPromise.then(() => {
    if (!stopped) {
      tick() // Immediate first sample
      intervalId = setInterval(tick, SAMPLE_INTERVAL_MS)
    }
  })

  function stop (): PitchPoint[] {
    stopped = true
    if (intervalId !== null) clearInterval(intervalId)
    return contour
  }

  return { stop, contour }
}

// ── Contour comparison (with reference) ──────────────────────────

/**
 * Compare two pitch contours and return a similarity score 0-100.
 * Normalizes both contours to the same length, then computes
 * Pearson correlation between the pitch curves.
 *
 * Mapping: only positive correlations contribute to the score.
 * Flat/random speech (r≈0) scores ~0, inversely-correlated speech also ≈0.
 */
export function comparePitchContours (
  reference: PitchPoint[],
  actual: PitchPoint[],
): number {
  if (reference.length < 3 || actual.length < 3) return 50 // Not enough data — neutral score

  const refPitches = resampleContour(reference, 50)
  const actPitches = resampleContour(actual, 50)

  const correlation = pearsonCorrelation(refPitches, actPitches)

  // Map: r<=0 → 0-20, r=0.5 → 60, r=1.0 → 100
  // Only positive correlation counts; negative/zero → low score
  if (correlation <= 0) return Math.round(Math.max(0, (correlation + 1) * 20))
  return Math.round(20 + correlation * 80)
}

// ── Prosody-based scoring (without reference) ────────────────────

/**
 * Score pitch contour quality based on French prosody heuristics.
 * Used when no reference pitch contour is available.
 *
 * Evaluates:
 * 1. Pitch range — is it within typical French speech range (100–350 Hz)?
 * 2. Pitch variation — penalizes monotone (low stddev) and erratic (very high stddev)
 * 3. Final contour direction — questions should rise, declaratives should fall
 */
export function scorePitchProsody (contour: PitchPoint[], text: string): number {
  if (contour.length < 3) return 60

  const pitches = contour.map(p => p.pitch)
  const n = pitches.length

  // Mean pitch
  const mean = pitches.reduce((s, p) => s + p, 0) / n

  // Std deviation
  const variance = pitches.reduce((s, p) => s + (p - mean) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  // ── Sub-score 1: Pitch range (0-100) ──
  // French speech is typically 100-350 Hz. Reward being centered there.
  let rangeScore: number
  if (mean >= 100 && mean <= 350) {
    rangeScore = 100
  } else if (mean >= 50 && mean < 100) {
    rangeScore = 50 + (mean - 50)  // 50 Hz → 50, 100 Hz → 100
  } else if (mean > 350 && mean <= 500) {
    rangeScore = 100 - ((mean - 350) / 1.5)  // 350→100, 500→0
  } else {
    rangeScore = 20
  }

  // ── Sub-score 2: Pitch variation (0-100) ──
  // Natural French speech has moderate pitch variation.
  // stdDev ~15-40 Hz is good, <10 is monotone, >60 is erratic
  let variationScore: number
  if (stdDev >= 15 && stdDev <= 40) {
    variationScore = 90 + Math.min(10, (stdDev - 15) / 2.5) // 15→90, 40→100
  } else if (stdDev >= 10 && stdDev < 15) {
    variationScore = 60 + (stdDev - 10) * 6                  // 10→60, 15→90
  } else if (stdDev > 40 && stdDev <= 60) {
    variationScore = 90 - (stdDev - 40) * 2                  // 40→90, 60→50
  } else if (stdDev < 10) {
    variationScore = Math.max(20, stdDev * 6)                 // very monotone
  } else {
    variationScore = Math.max(10, 50 - (stdDev - 60))        // very erratic
  }

  // ── Sub-score 3: Final contour direction (0-100) ──
  // Questions (?) → expect rising; otherwise → slight fall is natural
  const lastQuarter = pitches.slice(Math.floor(n * 0.75))
  const firstQuarter = pitches.slice(0, Math.ceil(n * 0.25))
  const lastMean = lastQuarter.reduce((s, p) => s + p, 0) / lastQuarter.length
  const firstMean = firstQuarter.reduce((s, p) => s + p, 0) / firstQuarter.length
  const contourDelta = lastMean - firstMean

  const isQuestion = text.trim().endsWith('?')
  let contourScore: number
  if (isQuestion) {
    // Questions should have rising intonation
    contourScore = contourDelta > 10 ? 100 : contourDelta > 0 ? 70 : 40
  } else {
    // Declarative: slight fall or stable is natural in French
    contourScore = contourDelta < 5 ? 90 : contourDelta < 20 ? 70 : 50
  }

  // Weighted combination
  return Math.round(rangeScore * 0.25 + variationScore * 0.50 + contourScore * 0.25)
}

// ── Contour utilities ────────────────────────────────────────────

function resampleContour (contour: PitchPoint[], targetLength: number): number[] {
  const pitches = contour.map(p => p.pitch)
  if (pitches.length === targetLength) return pitches

  const result: number[] = []
  for (let i = 0; i < targetLength; i++) {
    const idx = (i / (targetLength - 1)) * (pitches.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(lo + 1, pitches.length - 1)
    const frac = idx - lo
    result.push(pitches[lo]! * (1 - frac) + pitches[hi]! * frac)
  }
  return result
}

function pearsonCorrelation (a: number[], b: number[]): number {
  const n = a.length
  if (n === 0) return 0

  let sumA = 0, sumB = 0
  for (let i = 0; i < n; i++) { sumA += a[i]!; sumB += b[i]! }
  const meanA = sumA / n, meanB = sumB / n

  let num = 0, denA = 0, denB = 0
  for (let i = 0; i < n; i++) {
    const dA = a[i]! - meanA, dB = b[i]! - meanB
    num += dA * dB
    denA += dA * dA
    denB += dB * dB
  }

  const den = Math.sqrt(denA * denB)
  return den === 0 ? 0 : num / den
}
